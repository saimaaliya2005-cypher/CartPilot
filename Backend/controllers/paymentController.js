const Product = require("../model/Product");
const Order = require("../model/Order");
const sendEmail = require("../utils/sendEmail");

const PAYPAL_API = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";
const CURRENCY = "USD";
const MAX_QTY_PER_LINE = 10;

const httpError = (status, message) => Object.assign(new Error(message), { status });

// ---------- PayPal helpers ----------
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || "Failed to get PayPal access token");
  }
  return data.access_token;
};

// ---------- Trusted cart pricing ----------
// The browser only tells us WHICH product, HOW MANY, and which size/color.
// Prices, stock and the allowed sizes/colors always come from the database.
const priceCart = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw httpError(400, "Your cart is empty");
  }
  if (rawItems.length > 50) throw httpError(400, "Too many items in cart");

  const lines = [];
  for (const it of rawItems) {
    const id = String(it?.productId || "");
    const qty = Number(it?.quantity);
    if (!/^[a-f\d]{24}$/i.test(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw httpError(400, "Invalid item in cart");
    }
    lines.push({
      id,
      qty,
      size: typeof it.size === "string" ? it.size.trim() : "",
      color: typeof it.color === "string" ? it.color.trim() : "",
    });
  }

  const ids = [...new Set(lines.map((l) => l.id))];
  const products = await Product.find({ _id: { $in: ids } });
  if (products.length !== ids.length) {
    throw httpError(400, "A product in your cart is no longer available");
  }
  const byId = new Map(products.map((p) => [String(p._id), p]));

  let totalCents = 0;
  const items = [];
  const emailLines = [];
  const qtyByProduct = new Map();

  for (const l of lines) {
    const p = byId.get(l.id);

    // size / color: required when the product has them, and must be one of them
    const sizes = p.sizes || [];
    const colors = p.colors || [];
    if (sizes.length) {
      if (!sizes.includes(l.size)) throw httpError(400, `Please choose a size for "${p.name}"`);
    } else {
      l.size = "";
    }
    if (colors.length) {
      if (!colors.includes(l.color)) throw httpError(400, `Please choose a color for "${p.name}"`);
    } else {
      l.color = "";
    }

    const unitCents = Math.round(Number(p.price) * 100);
    if (!Number.isFinite(unitCents) || unitCents <= 0) {
      throw httpError(400, `"${p.name}" cannot be purchased right now`);
    }
    totalCents += unitCents * l.qty;
    qtyByProduct.set(l.id, (qtyByProduct.get(l.id) || 0) + l.qty);
    items.push({ productId: p._id, quantity: l.qty, price: unitCents / 100, size: l.size, color: l.color });
    emailLines.push({ name: p.name, size: l.size, color: l.color, qty: l.qty });
  }

  // stock is shared by all sizes/colors of a product
  const stockChanges = [];
  for (const [id, qty] of qtyByProduct) {
    const p = byId.get(id);
    const stock = Number(p.stock);
    if (!(stock >= qty)) {
      throw httpError(400, stock > 0 ? `Only ${stock} of "${p.name}" left` : `"${p.name}" is sold out`);
    }
    stockChanges.push({ id: p._id, newStock: stock - qty });
  }

  return { items, totalCents, stockChanges, emailLines };
};

const money = (cents) => (cents / 100).toFixed(2);

const cleanAddress = (a) => {
  const fields = ["fullName", "street", "city", "postalCode", "country"];
  const out = {};
  for (const f of fields) {
    const v = typeof a?.[f] === "string" ? a[f].trim() : "";
    if (!v || v.length > 200) throw httpError(400, "Please complete your shipping address");
    out[f] = v;
  }
  return out;
};

const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: "Server error" });
};

// ---------- 1. Create the PayPal order (amount decided by the server) ----------
const createdOrder = async (req, res) => {
  try {
    const { totalCents } = await priceCart(req.body.items);
    const token = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          { amount: { currency_code: CURRENCY, value: money(totalCents) } },
        ],
      }),
    });

    const order = await response.json();
    if (!response.ok) return res.status(response.status).json(order);
    res.status(200).json(order);
  } catch (error) {
    sendError(res, error);
  }
};

// ---------- 2. Verify, capture, and save the order (all on the server) ----------
const verifyPayment = async (req, res) => {
  try {
    const { orderID, items, address } = req.body;
    if (typeof orderID !== "string" || !orderID) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Same payment submitted twice (refresh, double click, replay): return the existing order
    const existing = await Order.findOne({ paymentId: orderID });
    if (existing) {
      if (String(existing.user) !== String(req.user._id)) {
        return res.status(403).json({ message: "This payment belongs to another account" });
      }
      return res.status(200).json({ message: "Payment verified successfully", order: existing });
    }

    const shipTo = cleanAddress(address);
    const { items: trustedItems, totalCents, stockChanges, emailLines } = await priceCart(items);
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Make sure the PayPal order is approved and is for exactly what this cart costs
    const checkRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}`, { headers });
    const paypalOrder = await checkRes.json();
    if (!checkRes.ok) {
      return res.status(400).json({ message: "Could not verify this payment" });
    }
    const unit = paypalOrder.purchase_units?.[0];
    if (
      !unit ||
      unit.amount?.currency_code !== CURRENCY ||
      unit.amount?.value !== money(totalCents)
    ) {
      return res.status(400).json({ message: "Payment amount does not match your cart" });
    }
    if (paypalOrder.status !== "APPROVED") {
      return res.status(400).json({ message: `Payment is not approved (${paypalOrder.status})` });
    }

    // Take the money
    const capRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: "POST",
      headers,
    });
    const captured = await capRes.json();
    if (!capRes.ok || captured.status !== "COMPLETED") {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Save the order. If this fails the customer HAS paid, so say so clearly.
    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        items: trustedItems,
        totalAmount: totalCents / 100,
        address: shipTo,
        paymentId: orderID,
      });
    } catch (saveErr) {
      console.error("PAID BUT ORDER NOT SAVED. PayPal order:", orderID, saveErr);
      return res.status(500).json({
        message: `Your payment went through but we could not save the order. Please contact us with payment ID ${orderID}.`,
      });
    }

    // Reduce stock (does not block the order if it fails)
    try {
      await Promise.all(
        stockChanges.map((c) => Product.updateOne({ _id: c.id }, { $set: { stock: c.newStock } }))
      );
    } catch (stockErr) {
      console.error("Order saved but stock update failed for order", order._id, stockErr);
    }

    // Confirmation email (never blocks the order)
    try {
      const a = shipTo;
      const itemLines = emailLines
        .map((l) => `- ${l.name}${l.size ? ` / ${l.size}` : ""}${l.color ? ` / ${l.color}` : ""} x ${l.qty}`)
        .join("\n");
      await sendEmail(
        req.user.email,
        "Order created",
        `Dear ${req.user.name},\n\nThank you for your order!\n\nOrder ID: ${order._id}\n\n${itemLines}\n\nTotal: $${money(totalCents)}\nShipping to: ${a.fullName}, ${a.street}, ${a.city}, ${a.postalCode}, ${a.country}\n\nWe will let you know once it ships.\n\nCartPilot Team`
      );
    } catch (mailErr) {
      console.error("Order email failed:", mailErr);
    }

    res.status(201).json({ message: "Payment verified successfully", order });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { createdOrder, verifyPayment };
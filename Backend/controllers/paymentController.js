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
// The browser only tells us WHICH products and HOW MANY.
// Prices and stock always come from the database.
const priceCart = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw httpError(400, "Your cart is empty");
  }

  const wanted = new Map(); // productId -> quantity
  for (const it of rawItems) {
    const id = String(it?.productId || "");
    const qty = Number(it?.quantity);
    if (!/^[a-f\d]{24}$/i.test(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw httpError(400, "Invalid item in cart");
    }
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const ids = [...wanted.keys()];
  const products = await Product.find({ _id: { $in: ids } });
  if (products.length !== ids.length) {
    throw httpError(400, "A product in your cart is no longer available");
  }

  let totalCents = 0;
  const items = [];
  const stockChanges = [];

  for (const p of products) {
    const qty = wanted.get(String(p._id));
    const stock = Number(p.stock);
    if (!(stock >= qty)) {
      throw httpError(400, stock > 0 ? `Only ${stock} of "${p.name}" left` : `"${p.name}" is sold out`);
    }
    const unitCents = Math.round(Number(p.price) * 100);
    if (!Number.isFinite(unitCents) || unitCents <= 0) {
      throw httpError(400, `"${p.name}" cannot be purchased right now`);
    }
    totalCents += unitCents * qty;
    items.push({ productId: p._id, quantity: qty, price: unitCents / 100 });
    stockChanges.push({ id: p._id, newStock: stock - qty });
  }

  return { items, totalCents, stockChanges };
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
    const { items: trustedItems, totalCents, stockChanges } = await priceCart(items);
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
      await sendEmail(
        req.user.email,
        "Order created",
        `Dear ${req.user.name},\n\nThank you for your order!\n\nOrder ID: ${order._id}\nTotal: $${money(totalCents)}\nShipping to: ${a.fullName}, ${a.street}, ${a.city}, ${a.postalCode}, ${a.country}\n\nWe will let you know once it ships.\n\nCartPilot Team`
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

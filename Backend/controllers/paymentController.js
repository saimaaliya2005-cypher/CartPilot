const PAYPAL_API = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";

// Helper: Get PayPal Access Token
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

// 1. Create Order (like your createdOrder)
const createdOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

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
          {
            amount: {
              currency_code: "USD", // change to INR if needed
              value: Number(amount).toFixed(2),
            },
          },
        ],
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(order);
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Capture / Verify Payment (like your verifyPayment)
const verifyPayment = async (req, res) => {
  try {
    const { orderID } = req.body; // frontend will send the PayPal order ID

    if (!orderID) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const token = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.status === "COMPLETED") {
      res.status(200).json({
        message: "Payment verified successfully",
        data,
      });
    } else {
      res.status(400).json({
        message: "Payment verification failed",
        data,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createdOrder, verifyPayment };
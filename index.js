const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");
const Order = require("./models/orderModel"); // Import the Order model

require("dotenv").config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // For development
  "https://localhost:5173", // HTTPS for local development, if needed
  "http://www.lemanda.in", // HTTP production
  "https://www.lemanda.in", // HTTPS production
  "http://chocolate-house-backend-main.vercel.app", // HTTP version
  "https://chocolate-house-backend-main.vercel.app",
  "http://localhost:8000",
  "https://localhost:8000",
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow server-to-server requests with no origin
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // If using credentials (cookies, etc.)
  })
);

app.use(express.urlencoded({ extended: true }));

// Enable preflight across all routes
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin); // Use the origin from the request headers
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.send();
});

const productsRouter = require("./routers/products");
const usersRouter = require("./routers/users");
const ordersRouter = require("./routers/orderRoutes");
const paymentRouter = require("./routers/paymentRoutes");

const api = process.env.API_URL;
// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/payment`, paymentRouter);

let merchantId = process.env.MERCHANT_ID;
let salt_key = process.env.SALT_KEY;

app.post("/neworder", async (req, res) => {
  const { user, items, shippingInfo, totalPrice, MUID, transactionId } =
    req.body;

  // Create the order object
  const orderData = {
    merchantId: merchantId,
    user: user,
    items: items, // Use items directly from request body
    shippingInfo,
    amount: totalPrice * 100,
    redirectUrl: `${process.env.FRONTEND_URL}/${transactionId}`,
    callbackUrl: `http://localhost:5173`,
    redirectMode: "REDIRECT",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
    MUID,
    merchantTransactionId: transactionId,
    status: "unpaid", // Default status is unpaid, set to paid in frontend
    createdAt: new Date(),
  };

  try {
    // Save order to the database
    const newOrder = new Order(orderData);
    
    await newOrder.save();

    // Prepare payload for the payment request
    const keyIndex = 1;
    const payload = JSON.stringify(orderData);
    const payloadMain = Buffer.from(payload).toString("base64");

    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = process.env.PHONEPAY_API;

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };


    // Send payment request
    await axios(options)
      .then((response) => {

        res.json(response.data); // Send payment response to the frontend
      })
      .catch((error) => {
        console.log(error);

        res.status(500).send("Payment request failed");
      });
  } catch (error) {
    console.log("Error saving order:", error);
    res.status(500).send("Failed to create order");
  }
});


app.get('/neworder/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Find the order by the transaction ID
    const order = await Order.findOne({ merchantTransactionId: transactionId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Return the found order
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get("/status", async (req, res) => {
  const { id: merchantTransactionId } = req.query; // Extract transaction ID from query
  const keyIndex = 1;

  try {
    // Construct the string for generating checksum
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // Call the PhonePe status API
    const options = {
      method: 'GET',
      url: process.env.STATUS_API + `/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
    };

    const response = await axios(options);

    if (response.data.success) {
      // Payment is successful, update the order status in the database
      await Order.findOneAndUpdate(
        { merchantTransactionId },
        { status: 'paid' },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment successful',
        amount: response.data.data.amount, // Adjust based on actual response structure
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Payment failed',
        reason: response.data.data.message, // Adjust based on actual response structure
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

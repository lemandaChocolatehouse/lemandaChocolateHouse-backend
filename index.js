const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",     // For development
  "https://localhost:5173",    // HTTPS for local development, if needed
  "http://www.lemanda.in",     // HTTP production
  "https://www.lemanda.in",    // HTTPS production
  "http://chocolate-house-backend-main.vercel.app",  // HTTP version
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
        const msg = "The CORS policy for this site does not allow access from the specified origin.";
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
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
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

app.post('/neworder', async(req, res) => {
    
    const { userId, items, shippingInfo, totalPrice, MUID, transactionId } = req.body;
    console.log(req.body);

    // Create the order
    let merchantId = process.env.MERCHANT_ID
    let salt_key = process.env.SALT_KEY
    const data = {
      merchantId: merchantId,
      userId: userId,
      items: items, // Use items directly from request body
      shippingInfo,
      amount : totalPrice * 100,
      redirectUrl : `http://localhost:5173/status/${transactionId}`,
      callbackUrl: "https://localhost:5173",
      redirectMode : 'POST',
      paymentInstrument : {
          type: 'PAY_PAGE'
          },
      MUID,
      merchantTransactionId : transactionId,
      status: 'unpaid', // Default status is unpaid, set to paid in frontend
      createdAt: new Date(),
    }
  
  const keyIndex =1;
  const payload = JSON.stringify(data);
  const payloadMain = Buffer.from(payload).toString('base64');

    const string = payloadMain + '/pg/v1/pay' + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

    const options = {
      method: 'POST',
      url: prod_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: payloadMain
      }
    };
     
      await axios(options).then((response) => {
          res.json(response.data);
      }).catch((error) => {
          console.log(error);
      });
})




// Server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

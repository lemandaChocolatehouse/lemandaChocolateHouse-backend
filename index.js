const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

require("dotenv").config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // for development
  "https://www.lemanda.in", // for production
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.options("*", cors());



const productsRouter = require("./routers/products");
const usersRouter = require("./routers/users");
const ordersRouter = require("./routers/orderRoutes");

const api = process.env.API_URL;
// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

// Database




// Server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

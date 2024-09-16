const express = require("express");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.options("*", cors());


const productsRouter = require('./routers/products');

const api = process.env.API_URL;

// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(`${api}/products`, productsRouter);



// Database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

// Server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

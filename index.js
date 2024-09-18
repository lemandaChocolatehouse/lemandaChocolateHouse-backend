const express = require("express");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const Grid = require('gridfs-stream');
const { MongoClient } = require('mongodb');
require("dotenv").config();
const app = express();
app.use(cors());
app.options("*", cors());


const productsRouter = require('./routers/products');
const usersRouter = require('./routers/users');
const ordersRouter = require('./routers/orderRoutes');

const api = process.env.API_URL;
// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);



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

  let gfs;

  const conn = mongoose.connection;

conn.on('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

module.exports = { conn, gfs };

// Server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

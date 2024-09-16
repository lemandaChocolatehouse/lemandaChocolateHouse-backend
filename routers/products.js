const express = require("express");
const router = express.Router();
const {Product}  = require("../models/product");

router.get(`/`, async (req, res) => {
  try {
    const productList = await Product.find();
    res.status(200).json(productList); // Send empty array if no products are found
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


router.get(`/:id`, async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }

  try {
    const product = await Product.findById(id);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post(`/`, async (req, res) => {
  const {
    name,
    product_id,
    Image,
    images,
    desc,
    price,
    category,
    quantity,
    countInStock
  } = req.body;

  // Validate required fields
  if (!name || !product_id || !price || !category) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const product = new Product({
      name,
      product_id,
      Image,
      images,
      desc,
      price,
      category,
      quantity,
      countInStock
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


module.exports = router;

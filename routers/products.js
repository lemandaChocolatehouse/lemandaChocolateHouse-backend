const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { gfs } = require("../index");
const GridFSStream = require("gridfs-stream");
const { Product } = require("../models/product");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

router.post(
  "/",
  upload.fields([
    { name: "Image", maxCount: 1 },
    { name: "images", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        product_id,
        desc,
        price,
        category,
        quantity,
        countInStock,
      } = req.body;
      // Create new product
      console.log(req.body);
      const newProduct = new Product({
        name,
        product_id,
        desc,
        price,
        category,
        quantity,
        countInStock,
        Image: req.files["Image"] ? req.files["Image"][0].buffer : null, // Main image
        images: req.files["images"]
          ? req.files["images"].map((file) => file.buffer)
          : [], // Array of additional images
      });

      // Save product to database
      const response = await newProduct.save();
      console.log(response);
      if (response) {
        res.status(201).json({ success: true, product: newProduct });
      } else {
        res
          .status(400)
          .json({ success: false, message: "Error creating product" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.delete(`/:id`, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }

  try {
    const product = await Product.findByIdAndDelete(id);
    if (product) {
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
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

// Upload an image
router.post("/upload", upload.single("image"), (req, res) => {
  const { buffer, mimetype } = req.file;

  if (!buffer || !mimetype) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const writestream = gfs.createWriteStream({
    filename: req.file.originalname,
    mode: "w",
    content_type: mimetype,
  });

  writestream.write(buffer);
  writestream.end();

  writestream.on("close", (file) => {
    res.status(200).json({ success: true, file: file });
  });
});

// Retrieve an image
router.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ success: false, message: "No file found" });
    }

    const readstream = gfs.createReadStream({ filename: file.filename });
    readstream.pipe(res);
  });
});

module.exports = router;

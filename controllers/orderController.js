const Order = require('../models/orderModel');
const crypto = require('crypto');
const axios = require('axios');

// Create a new order
const createOrder = async (req, res) => {
    try {
      const { userId, items, shippingInfo, totalPrice, MUID, transactionId } = req.body;
      console.log(req.body);
  
      // Create the order
      let merchantId = 'M228ZHDICZB1N'
       let salt_key = '10d76a45-7ed2-490c-8c8f-c91e97e1c08a'
      const newOrder = new Order({
        merchantId: merchantId,
        userId: userId,
        items: items, // Use items directly from request body
        shippingInfo,
        amount : totalPrice * 100,
        redirectUrl : `http://localhost:5173/api/v1/status/${transactionId}`,
        redirectMode : 'POST',
        paymentInstrument : {
            type: 'PAY_PAGE'
            },
        MUID,
        merchantTransactionId : transactionId,
        status: 'unpaid', // Default status is unpaid, set to paid in frontend
        createdAt: new Date(),
      }
    );
    const keyIndex =1;
    const payload = JSON.stringify(newOrder);
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

  
      // Save the order to the database
      const savedOrder = await newOrder.save();
  
      // Return the order ID in the response
      res.status(201).json({ savedOrder }); // Ensure you're returning the order ID
    } catch (error) {
      console.error("Error creating order:", error.message);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
  


// Get order history for a specific user
const getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.find();  // You can also filter based on user, e.g., Order.find({ user: req.user._id });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// Get order details by orderId
const getOrderById = async (req, res) => {
    try {
      const orderId = req.params.id; // Assuming your route uses :id for the order ID
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
  

module.exports = { createOrder, getOrderHistory, getOrderById };

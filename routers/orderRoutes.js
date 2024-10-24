const express = require('express');
const { createOrder, getOrderHistory, getOrderById } = require('../controllers/orderController');
const router = express.Router();

// POST: Create new order
router.post('/', createOrder);

// GET: Get order history for a user
router.get('/', getOrderHistory);

// router.get("/:id", getOrderById);

router.get('/order/:transactionId', async (req, res) => {
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

module.exports = router;

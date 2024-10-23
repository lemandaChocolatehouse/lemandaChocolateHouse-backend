const express = require('express');
const { newPayment, checkStatus } = require('../controllers/paymentcontroller');
const router = express.Router();

router.post('/', newPayment);
router.post('/status/:txnId', checkStatus);

module.exports = router;
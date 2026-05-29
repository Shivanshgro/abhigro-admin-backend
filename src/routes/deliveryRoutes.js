const express = require('express');
const router = express.Router();

const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, deliveryController.createDelivery);
router.get('/', authMiddleware, deliveryController.getDeliveries);
router.put('/:id', authMiddleware, deliveryController.updateDeliveryStatus);

module.exports = router;
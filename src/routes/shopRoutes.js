const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, shopController.createShop);
router.get('/', shopController.getShops);
router.put('/:id', authMiddleware, shopController.updateShop);
router.patch('/:id/disable', authMiddleware, shopController.disableShop);  // FIX: was DELETE
router.patch('/:id/enable', authMiddleware, shopController.enableShop);    // bonus: re-enable

module.exports = router;

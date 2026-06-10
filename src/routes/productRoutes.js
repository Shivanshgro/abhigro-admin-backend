const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', productController.getProducts);
router.post('/sync', authMiddleware, productController.syncProducts);
router.post('/stock-check', authMiddleware, productController.runStockCheck);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.patch('/:id/enable', authMiddleware, productController.enableProduct);

module.exports = router;

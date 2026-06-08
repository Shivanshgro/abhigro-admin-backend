const express = require('express');
const router  = express.Router();

const productController = require('../controllers/productController');
const authMiddleware    = require('../middleware/authMiddleware');

// Public
router.get('/',                       productController.getProducts);

// Authenticated
router.post('/',                      authMiddleware, productController.createProduct);
router.put('/:id',                    authMiddleware, productController.updateProduct);
router.delete('/:id',                 authMiddleware, productController.deleteProduct);
router.patch('/:id/enable',           authMiddleware, productController.enableProduct);

// Automated catalog sync (Zepto-style)
router.post('/sync',                  authMiddleware, productController.syncProducts);
router.post('/stock-check',           authMiddleware, productController.runStockCheck);

module.exports = router;

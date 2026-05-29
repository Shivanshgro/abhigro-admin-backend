const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminController.getUsers);
router.put('/users/:id/role', authMiddleware, adminController.updateUserRole);

module.exports = router;

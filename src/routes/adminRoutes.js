const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const med = require('../controllers/medicineAdminController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminController.getUsers);
router.put('/users/:id/role', authMiddleware, adminController.updateUserRole);

router.get('/medicine/orders', authMiddleware, med.getMedicineOrders);
router.get('/medicine/orders/:id', authMiddleware, med.getMedicineOrder);
router.get('/medicine/reports', authMiddleware, med.getMedicineReports);
router.get('/pharmacies', authMiddleware, med.getPharmacies);
router.post('/pharmacies', authMiddleware, med.createPharmacy);
router.put('/pharmacies/:id/approve', authMiddleware, med.approvePharmacy);
router.put('/pharmacies/:id/disable', authMiddleware, med.disablePharmacy);

module.exports = router;
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const med = require('../controllers/medicineAdminController');
const partner = require('../controllers/partnerAdminController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminController.getUsers);
router.put('/users/:id/role', authMiddleware, adminController.updateUserRole);

// ── Medicine module ──
router.get('/medicine/orders', authMiddleware, med.getMedicineOrders);
router.get('/medicine/orders/:id', authMiddleware, med.getMedicineOrder);
router.get('/medicine/reports', authMiddleware, med.getMedicineReports);
router.get('/pharmacies', authMiddleware, med.getPharmacies);
router.post('/pharmacies', authMiddleware, med.createPharmacy);
router.put('/pharmacies/:id/approve', authMiddleware, med.approvePharmacy);
router.put('/pharmacies/:id/disable', authMiddleware, med.disablePharmacy);


// ── Vendor Applications ──
router.get('/vendors', authMiddleware, partner.getVendors);
router.put('/vendors/:id/approve', authMiddleware, partner.approveVendor);
router.put('/vendors/:id/disable', authMiddleware, partner.disableVendor);

// ── Delivery Partners ──
router.get('/delivery-partners', authMiddleware, partner.getDeliveryPartners);
router.put('/delivery-partners/:id/approve', authMiddleware, partner.approveDeliveryPartner);
router.put('/delivery-partners/:id/disable', authMiddleware, partner.disableDeliveryPartner);

// ── Restaurants (Food) ──
router.get('/restaurants', authMiddleware, partner.getRestaurants);
router.put('/restaurants/:id/approve', authMiddleware, partner.approveRestaurant);
router.put('/restaurants/:id/reject', authMiddleware, partner.rejectRestaurant);
router.put('/restaurants/:id/commission', authMiddleware, partner.setRestaurantCommission);

module.exports = router;
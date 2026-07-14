const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id - Edit user details
router.put('/users/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, companyName, ruc, address, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.name = name || user.name;
    user.companyName = companyName || user.companyName;
    user.ruc = ruc || user.ruc;
    user.address = address || user.address;
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id/customers - Get customers of a specific user
const Customer = require('../models/Customer');
router.get('/users/:id/customers', protect, adminOnly, async (req, res, next) => {
  try {
    const customers = await Customer.find({ facturador: req.params.id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id/quotes - Get quotes of a specific user
const Quote = require('../models/Quote');
router.get('/users/:id/quotes', protect, adminOnly, async (req, res, next) => {
  try {
    const quotes = await Quote.find({ facturador: req.params.id }).populate('customer').sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

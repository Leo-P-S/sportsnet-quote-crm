const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

// POST /api/crm - Create new customer
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, ruc, address, contactInfo, installationDetails, installationDate, aliases } = req.body;
    const newCustomer = new Customer({
      name,
      ruc,
      address,
      contactInfo,
      installationDetails,
      installationDate,
      aliases,
      facturador: req.user._id
    });

    const saved = await newCustomer.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// GET /api/crm - Get all customers for logged in user
router.get('/', protect, async (req, res, next) => {
  try {
    const customers = await Customer.find({ facturador: req.user._id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// GET /api/crm/search - Search for a customer (autocomplete)
router.get('/search', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const customers = await Customer.find({
      facturador: req.user._id,
      $or: [
        { name: { $regex: regex } },
        { ruc: { $regex: regex } },
        { aliases: { $regex: regex } }
      ]
    }).limit(10);
    
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// PUT /api/crm/:id - Update an existing customer
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { name, ruc, address, contactInfo, installationDetails, installationDate, aliases } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, facturador: req.user._id });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    customer.name = name || customer.name;
    customer.ruc = ruc !== undefined ? ruc : customer.ruc;
    customer.address = address !== undefined ? address : customer.address;
    customer.contactInfo = contactInfo !== undefined ? contactInfo : customer.contactInfo;
    customer.installationDetails = installationDetails !== undefined ? installationDetails : customer.installationDetails;
    customer.installationDate = installationDate !== undefined ? installationDate : customer.installationDate;
    
    if (aliases !== undefined) {
      customer.aliases = aliases;
    }

    const saved = await customer.save();
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

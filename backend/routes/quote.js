const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

// POST /api/quote - Create new quote
router.post('/', protect, async (req, res, next) => {
  try {
    const { customer, customerNameTemp, customerRucTemp, customerAddressTemp, items, subtotal, igv, total, observation } = req.body;
    
    const newQuote = new Quote({
      facturador: req.user._id,
      customer,
      customerNameTemp,
      customerRucTemp,
      customerAddressTemp,
      items,
      subtotal,
      igv,
      total,
      observation
    });

    const savedQuote = await newQuote.save();
    res.status(201).json(savedQuote);
  } catch (err) {
    next(err);
  }
});

// GET /api/quote - List quotes for logged in user
router.get('/', protect, async (req, res, next) => {
  try {
    const quotes = await Quote.find({ facturador: req.user._id }).sort({ createdAt: -1 }).populate('customer');
    res.json(quotes);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/quote/:id - Delete a quote
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, facturador: req.user._id });
    if (!quote) return res.status(404).json({ error: 'Proforma no encontrada' });
    res.json({ message: 'Proforma eliminada correctamente' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const CatalogProduct = require('../models/CatalogProduct');
const { protect } = require('../middleware/auth');

// GET /api/catalog - Get all products for logged in user
router.get('/', protect, async (req, res, next) => {
  try {
    const products = await CatalogProduct.find({ facturador: req.user._id }).sort({ name: 1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/search - Search for a product (autocomplete)
router.get('/search', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');
    
    const products = await CatalogProduct.find({
      facturador: req.user._id,
      $or: [
        { name: { $regex: regex } },
        { category: { $regex: regex } }
      ]
    }).limit(10);
    
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST /api/catalog - Create a new product
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, category, subcategory, calcMode, basePrice } = req.body;
    
    const productExists = await CatalogProduct.findOne({ facturador: req.user._id, name });
    if (productExists) {
      return res.status(400).json({ error: 'Ya existe un producto con este nombre.' });
    }

    const newProduct = new CatalogProduct({
      name,
      category,
      subcategory,
      calcMode,
      basePrice,
      facturador: req.user._id
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// PUT /api/catalog/:id - Update a product
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { name, category, subcategory, calcMode, basePrice } = req.body;
    const product = await CatalogProduct.findOne({ _id: req.params.id, facturador: req.user._id });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    product.name = name || product.name;
    product.category = category || product.category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (calcMode) product.calcMode = calcMode;
    if (basePrice !== undefined) product.basePrice = basePrice;

    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/catalog/:id - Delete a product
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const product = await CatalogProduct.findOneAndDelete({ _id: req.params.id, facturador: req.user._id });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado del catálogo' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

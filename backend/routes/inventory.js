const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const CatalogProduct = require('../models/CatalogProduct');
const { protect } = require('../middleware/auth');

// GET /api/inventory (For Facturador and Almacenador to see inventory)
router.get('/', protect, async (req, res, next) => {
  try {
    const facturadorId = req.user.role === 'facturador' ? req.user._id : req.user.facturadorId;
    
    if (!facturadorId) {
      return res.status(403).json({ error: 'No estás vinculado a ningún facturador' });
    }

    const inventory = await Inventory.find({ facturador: facturadorId })
      .populate('product')
      .populate('almacenador', 'name username');
      
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory (Almacenador registers a new product location/stock)
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'almacenador') {
      return res.status(403).json({ error: 'Solo almacenadores pueden registrar inventario' });
    }
    if (!req.user.facturadorId) {
      return res.status(403).json({ error: 'Debes ser vinculado a un facturador primero' });
    }

    const { productId, codigo, ubicacion, stockLevel } = req.body;
    
    const product = await CatalogProduct.findOne({ _id: productId, facturador: req.user.facturadorId });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado en el catálogo del facturador' });
    }

    const inventory = await Inventory.create({
      product: product._id,
      almacenador: req.user._id,
      facturador: req.user.facturadorId,
      codigo,
      ubicacion,
      stockLevel
    });

    res.status(201).json(inventory);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Ya existe un registro con ese código en este almacén' });
    } else {
      next(err);
    }
  }
});

// PUT /api/inventory/:id (Almacenador updates stock level or location)
router.put('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'almacenador' && req.user.role !== 'facturador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const facturadorId = req.user.role === 'facturador' ? req.user._id : req.user.facturadorId;

    const inventory = await Inventory.findOne({ _id: req.params.id, facturador: facturadorId });
    if (!inventory) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    }

    const { codigo, ubicacion, stockLevel } = req.body;
    
    if (codigo) inventory.codigo = codigo;
    if (ubicacion !== undefined) inventory.ubicacion = ubicacion;
    if (stockLevel) inventory.stockLevel = stockLevel;
    inventory.lastUpdated = Date.now();

    await inventory.save();
    res.json(inventory);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Ya existe un registro con ese código en este almacén' });
    } else {
      next(err);
    }
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const facturadorId = req.user.role === 'facturador' ? req.user._id : req.user.facturadorId;
    const inventory = await Inventory.findOneAndDelete({ _id: req.params.id, facturador: facturadorId });
    if (!inventory) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Registro eliminado' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

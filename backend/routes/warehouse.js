const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Shelf = require('../models/Shelf');

// Get all shelves
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'almacenador') {
      query = { almacenador: req.user._id };
    } else if (req.user.role === 'facturador') {
      query = { facturador: req.user._id };
    } else {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const shelves = await Shelf.find(query)
      .populate({
        path: 'slots.inventoryIds',
        populate: { path: 'product', select: 'name category variants basePrice' }
      })
      .sort('name');

    res.json(shelves);
  } catch (error) {
    next(error);
  }
});

// Create a shelf
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'almacenador') {
      return res.status(403).json({ error: 'Solo los almacenadores pueden crear estantes.' });
    }

    const { name, color, gridRows, gridCols, slots } = req.body;

    const shelf = await Shelf.create({
      almacenador: req.user._id,
      facturador: req.user.facturadorId,
      name,
      color,
      gridRows,
      gridCols,
      slots: slots || []
    });

    res.status(201).json(shelf);
  } catch (error) {
    next(error);
  }
});

// Update a shelf (e.g., assign products to slots or resize)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const shelf = await Shelf.findById(req.params.id);
    if (!shelf) {
      return res.status(404).json({ error: 'Estante no encontrado' });
    }

    // Check ownership
    if (shelf.almacenador.toString() !== req.user._id.toString() && shelf.facturador.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { name, color, gridRows, gridCols, slots } = req.body;
    
    if (name) shelf.name = name;
    if (color) shelf.color = color;
    if (gridRows !== undefined) shelf.gridRows = gridRows;
    if (gridCols !== undefined) shelf.gridCols = gridCols;
    if (slots) shelf.slots = slots;

    await shelf.save();
    
    // Return populated version
    const updated = await Shelf.findById(shelf._id).populate({
      path: 'slots.inventoryIds',
      populate: { path: 'product', select: 'name category variants basePrice' }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete a shelf
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const shelf = await Shelf.findById(req.params.id);
    if (!shelf) {
      return res.status(404).json({ error: 'Estante no encontrado' });
    }

    if (shelf.almacenador.toString() !== req.user._id.toString() && shelf.facturador.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await shelf.deleteOne();
    res.json({ message: 'Estante eliminado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

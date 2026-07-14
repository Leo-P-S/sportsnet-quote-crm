const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, name, companyName, ruc, address, logoBase64 } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'El usuario ya existe' });

    const user = await User.create({
      username, password, name, companyName, ruc, address, logoBase64,
      role: 'user', status: 'pending'
    });

    res.status(201).json({ message: 'Usuario registrado. Esperando aprobación del administrador.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación o ha sido bloqueada.' });
      }

      res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        companyName: user.companyName,
        ruc: user.ruc,
        address: user.address,
        role: user.role,
        logoBase64: user.logoBase64,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (Get current user info)
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/me (Update current user profile)
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, companyName, ruc, address, logoBase64 } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.name = name || user.name;
    user.companyName = companyName || user.companyName;
    user.ruc = ruc || user.ruc;
    user.address = address || user.address;
    
    if (logoBase64 !== undefined) {
      user.logoBase64 = logoBase64;
    }

    await user.save();
    
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

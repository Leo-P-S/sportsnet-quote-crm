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
    const { username, password, name, companyName, ruc, address, logoBase64, role } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'El usuario ya existe' });

    const newRole = (role === 'almacenador') ? 'almacenador' : 'facturador';
    
    // Almacenadores are active immediately, they just need to be linked
    const status = newRole === 'almacenador' ? 'active' : 'pending';
    const linkCode = newRole === 'almacenador' ? 'ALM-' + Math.random().toString(36).substring(2, 8).toUpperCase() : undefined;

    const user = await User.create({
      username, password, name, companyName, ruc, address, logoBase64,
      role: newRole, status: status, linkCode
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

      // Auto-migrate legacy 'user' to 'facturador'
      if (user.role === 'user') {
        user.role = 'facturador';
        await user.save();
      }

      res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        companyName: user.companyName,
        ruc: user.ruc,
        address: user.address,
        role: user.role,
        facturadorId: user.facturadorId,
        linkCode: user.linkCode,
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
    if (user.role === 'user') {
      user.role = 'facturador';
      await user.save();
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/team (Get linked almacenadores)
router.get('/team', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'facturador' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    const team = await User.find({ role: 'almacenador', facturadorId: req.user._id }).select('-password');
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/team/link (Link an almacenador by linkCode)
router.post('/team/link', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'facturador' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    const { linkCode } = req.body;
    if (!linkCode) return res.status(400).json({ error: 'El código de vinculación es requerido' });

    const targetUser = await User.findOne({ linkCode });
    
    if (!targetUser) return res.status(404).json({ error: 'Código inválido o usuario no encontrado' });
    if (targetUser.role !== 'almacenador') return res.status(400).json({ error: 'El usuario no es un almacenador' });
    if (targetUser.facturadorId) return res.status(400).json({ error: 'Este almacenador ya está vinculado a otro equipo' });

    targetUser.facturadorId = req.user._id;
    await targetUser.save();
    
    res.json({ message: 'Almacenador vinculado exitosamente', user: targetUser });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/team/unlink/:id (Unlink an almacenador)
router.delete('/team/unlink/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'facturador' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    // Validate they belong to this facturador
    if (targetUser.facturadorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para desvincular a este usuario' });
    }

    targetUser.facturadorId = null;
    await targetUser.save();
    
    res.json({ message: 'Almacenador desvinculado' });
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

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shelf = require('../models/Shelf');
const connectDB = require('../config/db');

const run = async () => {
  await connectDB();
  console.log('DB connected');

  try {
    // 1. Create or find Facturador (Admin base)
    let facturador = await User.findOne({ role: 'facturador' });
    if (!facturador) {
      console.log('Creando Facturador base...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      facturador = await User.create({
        username: 'facturador_base',
        password: hashedPassword,
        name: 'Facturador Base',
        role: 'facturador',
        status: 'active'
      });
    }

    // 2. Find or create Almacenero-VES
    console.log('Buscando o creando Almacenero-VES...');
    let almacenador = await User.findOne({ username: 'Almacenero-VES' });
    if (!almacenador) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('almacenpradoarones', salt);
      almacenador = await User.create({
        username: 'Almacenero-VES',
        password: hashedPassword,
        name: 'Almacenero VES',
        role: 'almacenador',
        facturadorId: facturador._id,
        status: 'active'
      });
    }

    // 4. Clear their existing shelves
    await Shelf.deleteMany({ almacenador: almacenador._id });

    // 5. Build shelves
    console.log('Construyendo estantes...');

    // Estante A (Rojo)
    const shelfA = {
      almacenador: almacenador._id,
      facturador: facturador._id,
      name: 'Estante A (Rojo)',
      color: '#ef4444',
      gridRows: 3,
      gridCols: 8,
      slots: []
    };
    shelfA.slots.push({ rowId: 0, colId: 0, colSpan: 8 });
    for (let i = 0; i < 8; i++) shelfA.slots.push({ rowId: 1, colId: i, colSpan: 1 });
    for (let i = 0; i < 4; i++) shelfA.slots.push({ rowId: 2, colId: i * 2, colSpan: 2 });
    await Shelf.create(shelfA);

    // Estante B (Azul)
    const shelfB = {
      almacenador: almacenador._id,
      facturador: facturador._id,
      name: 'Estante B (Azul)',
      color: '#06b6d4', // Cyan/Blue
      gridRows: 3,
      gridCols: 10,
      slots: []
    };
    for (let i = 0; i < 5; i++) shelfB.slots.push({ rowId: 0, colId: i * 2, colSpan: 2 });
    for (let i = 0; i < 5; i++) shelfB.slots.push({ rowId: 1, colId: i * 2, colSpan: 2 });
    shelfB.slots.push({ rowId: 2, colId: 0, colSpan: 5 });
    shelfB.slots.push({ rowId: 2, colId: 5, colSpan: 5 });
    await Shelf.create(shelfB);

    // Estante C (Verde)
    const shelfC = {
      almacenador: almacenador._id,
      facturador: facturador._id,
      name: 'Estante C (Verde)',
      color: '#84cc16', // Lime green
      gridRows: 3,
      gridCols: 4,
      slots: []
    };
    shelfC.slots.push({ rowId: 0, colId: 0, colSpan: 4 });
    for (let i = 0; i < 4; i++) shelfC.slots.push({ rowId: 1, colId: i, colSpan: 1 });
    shelfC.slots.push({ rowId: 2, colId: 0, colSpan: 2 });
    shelfC.slots.push({ rowId: 2, colId: 2, colSpan: 2 });
    await Shelf.create(shelfC);

    // Estante D (Naranja)
    const shelfD = {
      almacenador: almacenador._id,
      facturador: facturador._id,
      name: 'Estante D (Naranja)',
      color: '#f97316', // Orange
      gridRows: 4,
      gridCols: 11,
      slots: []
    };
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 11; c++) {
        shelfD.slots.push({ rowId: r, colId: c, colSpan: 1 });
      }
    }
    await Shelf.create(shelfD);

    // Estante E (Rosa)
    const shelfE = {
      almacenador: almacenador._id,
      facturador: facturador._id,
      name: 'Estante E (Rosa)',
      color: '#ec4899', // Pink
      gridRows: 5,
      gridCols: 6,
      slots: []
    };
    // Fila 0
    shelfE.slots.push({ rowId: 0, colId: 0, colSpan: 4 });
    shelfE.slots.push({ rowId: 0, colId: 4, colSpan: 2 });
    // Fila 1
    shelfE.slots.push({ rowId: 1, colId: 0, colSpan: 2 });
    shelfE.slots.push({ rowId: 1, colId: 2, colSpan: 2 });
    shelfE.slots.push({ rowId: 1, colId: 4, colSpan: 2 });
    // Fila 2
    shelfE.slots.push({ rowId: 2, colId: 0, colSpan: 4 });
    shelfE.slots.push({ rowId: 2, colId: 4, colSpan: 2 });
    // Fila 3
    shelfE.slots.push({ rowId: 3, colId: 0, colSpan: 1 });
    // Gap at col 1
    shelfE.slots.push({ rowId: 3, colId: 2, colSpan: 2 });
    shelfE.slots.push({ rowId: 3, colId: 4, colSpan: 2 });
    // Fila 4
    shelfE.slots.push({ rowId: 4, colId: 0, colSpan: 6 });
    
    await Shelf.create(shelfE);

    console.log('¡Semilla plantada con éxito! Usuario y estantes creados.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();

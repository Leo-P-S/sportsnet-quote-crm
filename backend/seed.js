require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado para seed');

    const adminExists = await User.findOne({ username: 'leonel' });
    if (!adminExists) {
      const admin = await User.create({
        username: 'leonel',
        password: 'Tresgatos@2026',
        name: 'Leonel Aldair Prado Serrato',
        companyName: 'PRADO ARONES WILFREDO',
        ruc: '10403098928',
        address: 'SEC. 3 GRUPO 3 MZA. N LOTE. T7 VILLA EL SALVADOR - LIMA - LIMA',
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Usuario admin creado:', admin.username);
    } else {
      await User.updateOne({ username: 'leonel' }, { role: 'admin', status: 'active' });
      console.log('ℹ️ El usuario admin ya existe (actualizado a admin/active)');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

seedAdmin();

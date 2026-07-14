const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Forzar DNS de Google para resolver registros SRV de MongoDB Atlas
// (el DNS del router local no soporta SRV)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

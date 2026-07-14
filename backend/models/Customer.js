const { Schema, model } = require('mongoose');

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  aliases: [{ type: String }], // Para guardar nombres alternativos de la misma persona
  ruc: { type: String }, // Opcional, DNI o RUC
  address: { type: String },
  contactInfo: { type: String },
  installationDetails: { type: String },
  installationDate: { type: Date },
  facturador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model('Customer', CustomerSchema);

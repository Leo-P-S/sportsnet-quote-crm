const { Schema, model } = require('mongoose');

const CatalogProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'malla', 'colchoneta'
  subcategory: { type: String }, // e.g., 'N 36'
  calcMode: { type: String, enum: ['area', 'unit'], default: 'unit', required: true },
  basePrice: { type: Number, required: true }, // Price per unit or per m2
  facturador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Avoid duplicate products for the same facturador by name
CatalogProductSchema.index({ facturador: 1, name: 1 }, { unique: true });

module.exports = model('CatalogProduct', CatalogProductSchema);

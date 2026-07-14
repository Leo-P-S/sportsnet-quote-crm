const { Schema, model } = require('mongoose');

const InventorySchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'CatalogProduct', required: true },
  almacenador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  facturador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  codigo: { type: String, required: true },
  ubicacion: { type: String },
  stockLevel: { 
    type: String, 
    enum: ['none', 'low', 'medium', 'high', 'full'], 
    default: 'none' 
  },
  lastUpdated: { type: Date, default: Date.now }
});

InventorySchema.index({ facturador: 1, codigo: 1 }, { unique: true });

module.exports = model('Inventory', InventorySchema);

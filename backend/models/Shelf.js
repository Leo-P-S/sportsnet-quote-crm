const { Schema, model } = require('mongoose');

const SlotSchema = new Schema({
  rowId: { type: Number, required: true },
  colId: { type: Number, required: true },
  rowSpan: { type: Number, default: 1 },
  colSpan: { type: Number, default: 1 },
  // Un recuadro puede tener hasta 3 productos
  inventoryIds: [{ type: Schema.Types.ObjectId, ref: 'Inventory' }]
});

const ShelfSchema = new Schema({
  almacenador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  facturador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, required: true }, // Hex or name
  gridRows: { type: Number, required: true },
  gridCols: { type: Number, required: true },
  slots: [SlotSchema]
}, { timestamps: true });

// Pre-save validation para asegurar que no se solapan los slots ni se salen de los gridRows/gridCols
// y que el máximo es 3 productos.
ShelfSchema.pre('save', function () {
  for (const slot of this.slots) {
    if (slot.inventoryIds && slot.inventoryIds.length > 3) {
      throw new Error('Un recuadro no puede tener más de 3 productos asignados.');
    }
  }
});

module.exports = model('Shelf', ShelfSchema);

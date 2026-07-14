const { Schema, model } = require('mongoose');

const QuoteItemSchema = new Schema({
  quantity: { type: Number, required: true },
  unit: { type: String, required: true, default: 'UNIDAD' },
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const QuoteSchema = new Schema({
  code: { type: String, required: true, default: 'E001-0001' }, 
  facturador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' }, // Opcional, puede estar en blanco
  customerNameTemp: { type: String }, // Si no se guarda en BD, solo texto
  customerRucTemp: { type: String },
  customerAddressTemp: { type: String },
  items: [QuoteItemSchema],
  subtotal: { type: Number, required: true },
  igv: { type: Number, required: true },
  total: { type: Number, required: true },
  observation: { type: String },
  currency: { type: String, default: 'SOLES' },
  createdAt: { type: Date, default: Date.now },
});

QuoteSchema.pre('save', async function() {
  if (!this.isNew) return;
  
  const lastQuote = await this.constructor.findOne({ facturador: this.facturador }, 'code')
                                          .sort({ createdAt: -1 });

  if (lastQuote && lastQuote.code) {
    const parts = lastQuote.code.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10) + 1;
      this.code = `${parts[0]}-${num.toString().padStart(4, '0')}`;
    } else {
      this.code = 'E001-0001';
    }
  } else {
    this.code = 'E001-0001';
  }
});

module.exports = model('Quote', QuoteSchema);

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  companyName: { type: String },
  ruc: { type: String },
  address: { type: String },
  role: { type: String, enum: ['user', 'facturador', 'almacenador', 'admin'], default: 'facturador' },
  facturadorId: { type: Schema.Types.ObjectId, ref: 'User' },
  linkCode: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  logoBase64: { type: String }, // Imagen en base64
  createdAt: { type: Date, default: Date.now }
});

// Encriptar password antes de guardar
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para verificar password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = model('User', UserSchema);

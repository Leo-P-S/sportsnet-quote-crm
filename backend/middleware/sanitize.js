/**
 * Sanitizador custom compatible con Express 5.
 * express-mongo-sanitize intenta sobreescribir req.query,
 * que en Express 5 es una propiedad de solo lectura.
 * Este middleware sanitiza req.body y req.params en profundidad.
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Reemplaza operadores de inyección NoSQL ($, .) al inicio del string
    return value.replace(/^\$/, '_').replace(/\./g, '_');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const result = {};
  for (const key of Object.keys(obj)) {
    const safeKey = key.replace(/^\$/, '_').replace(/\./g, '_');
    result[safeKey] = sanitizeValue(obj[key]);
  }
  return result;
};

module.exports = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

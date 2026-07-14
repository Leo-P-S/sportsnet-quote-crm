/**
 * Calcula área y precio final.
 * @param {number} length - Largo en metros
 * @param {number} width - Ancho en metros
 * @param {number} thickness - Grosor del hilo en mm
 * @param {number} netSize - Tamaño de la cocada en cm
 * @returns {{area: number, price: number}}
 */
const calculateQuote = (length, width, thickness, netSize) => {
  const area = length * width; // m²
  const basePricePerM2 = 120; // PEN, costo base
  const thicknessFactor = thickness / 10; // 0.1 PEN por mm extra
  const netSizeFactor = netSize / 100; // 0.01 PEN por cm extra
  const price = area * (basePricePerM2 + thicknessFactor + netSizeFactor);
  return { area, price: Number(price.toFixed(2)) };
};

module.exports = { calculateQuote };

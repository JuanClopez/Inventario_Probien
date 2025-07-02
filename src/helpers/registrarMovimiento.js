// ✅ Ruta: src/helpers/registrarMovimiento.js
// 📌 Propósito: Función para registrar un movimiento (entrada/salida) individual desde cualquier origen
// 🧩 Versión: 1.0 – Creado el 1 julio 2025

const { supabase } = require('../services/supabaseClient');

const registrarMovimiento = async ({
  user_id,
  product_id,
  type = 'salida', // por defecto salida
  quantity_boxes = 0,
  quantity_units = 0,
  description = ''
}) => {
  const { error } = await supabase
    .from('movements')
    .insert([{
      user_id,
      product_id,
      type,
      quantity_boxes,
      quantity_units,
      description
    }]);

  if (error) {
    console.error(`🛑 Error al registrar movimiento (${type}) para producto ${product_id}:`, error.message);
    throw new Error('Error al registrar movimiento');
  }
};

module.exports = { registrarMovimiento };

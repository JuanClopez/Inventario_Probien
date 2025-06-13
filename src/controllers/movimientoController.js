// ✅ src/controllers/movimientoController.js
const supabase = require('../services/supabaseClient');

// POST /api/movimientos
const registrarMovimiento = async (req, res) => {
  const { user_id, product_id, type, quantity_boxes, quantity_units, description } = req.body;

  if (!user_id || !product_id || !type || quantity_boxes == null || quantity_units == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  // 1. Obtener inventario actual del usuario y producto
  const { data: inventarioExistente, error: errorInventario } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .single();

  if (errorInventario && errorInventario.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error consultando inventario', error: errorInventario.message });
  }

  // 2. Determinar nuevas cantidades
  let nuevasCajas = quantity_boxes;
  let nuevasUnidades = quantity_units;

  if (inventarioExistente) {
    nuevasCajas = type === 'entrada'
      ? inventarioExistente.quantity_boxes + quantity_boxes
      : inventarioExistente.quantity_boxes - quantity_boxes;

    nuevasUnidades = type === 'entrada'
      ? inventarioExistente.quantity_units + quantity_units
      : inventarioExistente.quantity_units - quantity_units;

    if (nuevasCajas < 0 || nuevasUnidades < 0) {
      return res.status(400).json({ mensaje: 'Cantidad insuficiente para salida' });
    }
  }

  // 3. Insertar movimiento
  const { error: errorMovimiento } = await supabase
    .from('movements')
    .insert([{
      user_id,
      product_id,
      type,
      quantity_boxes,
      quantity_units,
      description
    }]);

  if (errorMovimiento) {
    return res.status(500).json({ mensaje: 'Error registrando movimiento', error: errorMovimiento.message });
  }

  // 4. Crear o actualizar inventario
  if (inventarioExistente) {
    await supabase
      .from('inventories')
      .update({
        quantity_boxes: nuevasCajas,
        quantity_units: nuevasUnidades
      })
      .eq('id', inventarioExistente.id);
  } else {
    await supabase
      .from('inventories')
      .insert([{
        user_id,
        product_id,
        quantity_boxes: nuevasCajas,
        quantity_units: nuevasUnidades
      }]);
  }

  res.json({ mensaje: 'Movimiento registrado y stock actualizado' });
};

module.exports = { registrarMovimiento };
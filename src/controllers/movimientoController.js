// ✅ src/controllers/movimientoController.js
const supabase = require('../services/supabaseClient');

// POST /api/movimientos
const registrarMovimiento = async (req, res) => {
  const { user_id, product_id, type, quantity_boxes, quantity_units, description } = req.body;

  // Validación de campos
  if (!user_id || !product_id || !type || quantity_boxes == null || quantity_units == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }
  if (!['entrada', 'salida'].includes(type)) {
    return res.status(400).json({ mensaje: 'El tipo debe ser "entrada" o "salida"' });
  }

  // 1. Inventario existente
  const { data: inventarioExistente, error: errorInv } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .single();

  if (errorInv && errorInv.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error consultando inventario', error: errorInv.message });
  }

  // 2. Calcular nuevas cantidades
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
  const { data: movimientoCreado, error: errorMov } = await supabase
    .from('movements')
    .insert([{ user_id, product_id, type, quantity_boxes, quantity_units, description }])
    .select();

  if (errorMov) {
    return res.status(500).json({ mensaje: 'Error registrando movimiento', error: errorMov.message });
  }

  // 4. Crear o actualizar inventario
  if (inventarioExistente) {
    await supabase
      .from('inventories')
      .update({ quantity_boxes: nuevasCajas, quantity_units: nuevasUnidades })
      .eq('id', inventarioExistente.id);
  } else {
    await supabase
      .from('inventories')
      .insert([{ user_id, product_id, quantity_boxes: nuevasCajas, quantity_units: nuevasUnidades }]);
  }

  return res.status(201).json({
    mensaje: 'Movimiento registrado y stock actualizado',
    movimiento: movimientoCreado[0]
  });
};

// GET /api/movimientos?user_id=UUID
const obtenerMovimientos = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });

  const { data, error } = await supabase
    .from('movements')
    .select(`
      id,
      type,
      quantity_boxes,
      quantity_units,
      description,
      created_at,
      products (
        name,
        families (name)
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });

  const movimientosFormateados = data.map(m => ({
    id: m.id,
    tipo: m.type,
    producto: m.products?.name || 'Sin nombre',
    familia: m.products?.families?.name || 'Sin familia',
    cajas: m.quantity_boxes,
    unidades: m.quantity_units,
    descripcion: m.description,
    fecha: m.created_at
  }));

  res.json(movimientosFormateados);
};

module.exports = { registrarMovimiento, obtenerMovimientos };

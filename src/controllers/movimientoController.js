// ✅ src/controllers/movimientoController.js
// Controlador para movimientos: entrada/salida de stock con filtros avanzados

const supabase = require('../services/supabaseClient');

// ---------------------------------------------------------------------------
// POST /api/movimientos - Registra un nuevo movimiento
// ---------------------------------------------------------------------------
const registrarMovimiento = async (req, res) => {
  const {
    user_id,
    product_id,
    type,
    quantity_boxes,
    quantity_units,
    description
  } = req.body;

  // Validación básica
  if (!user_id || !product_id || !type || quantity_boxes == null || quantity_units == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  if (!['entrada', 'salida'].includes(type)) {
    return res.status(400).json({ mensaje: 'El tipo debe ser "entrada" o "salida"' });
  }

  // Consultar inventario actual
  const { data: inventarioExistente, error: errorInv } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .single();

  if (errorInv && errorInv.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error consultando inventario', error: errorInv.message });
  }

  // Calcular stock actualizado
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

  // Registrar movimiento
  const { data: movimientoCreado, error: errorMov } = await supabase
    .from('movements')
    .insert([{ user_id, product_id, type, quantity_boxes, quantity_units, description }])
    .select();

  if (errorMov) {
    return res.status(500).json({ mensaje: 'Error registrando movimiento', error: errorMov.message });
  }

  // Actualizar o crear inventario
  const inventarioData = {
    user_id,
    product_id,
    quantity_boxes: nuevasCajas,
    quantity_units: nuevasUnidades
  };

  if (inventarioExistente) {
    await supabase
      .from('inventories')
      .update(inventarioData)
      .eq('id', inventarioExistente.id);
  } else {
    await supabase
      .from('inventories')
      .insert([inventarioData]);
  }

  return res.status(201).json({
    mensaje: 'Movimiento registrado y stock actualizado',
    movimiento: movimientoCreado[0]
  });
};

// ---------------------------------------------------------------------------
// GET /api/movimientos?user_id=&fecha_inicio=&fecha_fin=&product_id=&type=
// Lista los movimientos del usuario con filtros avanzados
// ---------------------------------------------------------------------------
const obtenerMovimientos = async (req, res) => {
  const { user_id, fecha_inicio, fecha_fin, product_id, type } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  let query = supabase
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

  // Filtros dinámicos
  if (fecha_inicio) query = query.gte('created_at', fecha_inicio);
  if (fecha_fin) query = query.lte('created_at', fecha_fin);
  if (product_id) query = query.eq('product_id', product_id);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
  }

  // Formatear respuesta
  const movimientosFormateados = data.map(({ id, type, quantity_boxes, quantity_units, description, created_at, products }) => ({
    id,
    tipo: type,
    producto: products?.name || 'Sin nombre',
    familia: products?.families?.name || 'Sin familia',
    cajas: quantity_boxes,
    unidades: quantity_units,
    descripcion: description,
    fecha: created_at
  }));

  return res.json(movimientosFormateados);
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos
};

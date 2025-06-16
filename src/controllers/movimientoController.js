// ✅ src/controllers/movimientoController.js
//	Desestructuración completada
const supabase = require('../services/supabaseClient');

// POST /api/movimientos - Registra un nuevo movimiento (entrada o salida)
const registrarMovimiento = async (req, res) => {
  const {
    user_id,
    product_id,
    type,
    quantity_boxes,
    quantity_units,
    description
  } = req.body;

  // ✅ Validación básica de campos requeridos
  if (!user_id || !product_id || !type || quantity_boxes == null || quantity_units == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  if (!['entrada', 'salida'].includes(type)) {
    return res.status(400).json({ mensaje: 'El tipo debe ser "entrada" o "salida"' });
  }

  // ✅ Consultar inventario actual del producto para este usuario
  const { data: inventarioExistente, error: errorInv } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .single();

  if (errorInv && errorInv.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error consultando inventario', error: errorInv.message });
  }

  // ✅ Calcular stock actualizado según tipo de movimiento
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

  // ✅ Registrar movimiento en tabla 'movements'
  const { data: movimientoCreado, error: errorMov } = await supabase
    .from('movements')
    .insert([{ user_id, product_id, type, quantity_boxes, quantity_units, description }])
    .select();

  if (errorMov) {
    return res.status(500).json({ mensaje: 'Error registrando movimiento', error: errorMov.message });
  }

  // ✅ Actualizar o crear inventario
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

// GET /api/movimientos?user_id=UUID - Lista los movimientos del usuario
const obtenerMovimientos = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

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

  if (error) {
    return res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
  }

  // ✅ Formatear respuesta
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

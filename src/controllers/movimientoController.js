// ✅ src/controllers/movimientoController.js
// Controlador de Movimientos – Registra entradas/salidas y permite búsquedas con filtros

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* POST /api/movimientos – Registrar un nuevo movimiento                       */
/* -------------------------------------------------------------------------- */
const registrarMovimiento = async (req, res) => {
  const {
    user_id,
    product_id,
    type,                // "entrada" | "salida"
    quantity_boxes,
    quantity_units,
    description = ''
  } = req.body;

  /* ---------- 1. Validaciones básicas ---------- */
  if (
    !user_id ||
    !product_id ||
    !type ||
    quantity_boxes == null ||
    quantity_units == null
  ) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  if (!['entrada', 'salida'].includes(type)) {
    return res.status(400).json({ mensaje: 'El tipo debe ser "entrada" o "salida"' });
  }

  /* ---------- 2. Inventario actual ---------- */
  const { data: inventario, error: invErr } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .single();

  if (invErr && invErr.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error consultando inventario', error: invErr.message });
  }

  /* ---------- 3. Calcular nuevo stock ---------- */
  let nuevasCajas     = quantity_boxes;
  let nuevasUnidades  = quantity_units;

  if (inventario) {
    nuevasCajas = type === 'entrada'
      ? inventario.quantity_boxes + quantity_boxes
      : inventario.quantity_boxes - quantity_boxes;

    nuevasUnidades = type === 'entrada'
      ? inventario.quantity_units + quantity_units
      : inventario.quantity_units - quantity_units;

    if (nuevasCajas < 0 || nuevasUnidades < 0) {
      return res.status(400).json({ mensaje: 'Cantidad insuficiente para salida' });
    }
  }

  /* ---------- 4. Insertar movimiento ---------- */
  const { data: movCreado, error: movErr } = await supabase
    .from('movements')
    .insert([{ user_id, product_id, type, quantity_boxes, quantity_units, description }])
    .select()
    .single();

  if (movErr) {
    return res.status(500).json({ mensaje: 'Error registrando movimiento', error: movErr.message });
  }

  /* ---------- 5. Crear o actualizar inventario ---------- */
  const datosInventario = {
    user_id,
    product_id,
    quantity_boxes: nuevasCajas,
    quantity_units: nuevasUnidades
  };

  if (inventario) {
    await supabase
      .from('inventories')
      .update(datosInventario)
      .eq('id', inventario.id);
  } else {
    await supabase.from('inventories').insert([datosInventario]);
  }

  return res.status(201).json({
    mensaje: 'Movimiento registrado y stock actualizado',
    movimiento: movCreado
  });
};

/* -------------------------------------------------------------------------- */
/* GET /api/movimientos – Listado con filtros                                  */
/* Query params: user_id (req) | tipo | producto | desde | hasta              */
/* -------------------------------------------------------------------------- */
const obtenerMovimientos = async (req, res) => {
  const { user_id, tipo, producto, desde, hasta } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  /* ---------- 1. Construir consulta dinámicamente ---------- */
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
        id,
        name,
        families ( name )
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  /* Filtro tipo */
  if (tipo && ['entrada', 'salida'].includes(tipo)) {
    query = query.eq('type', tipo);
  }

  /* Filtro nombre de producto (LIKE) */
  if (producto) {
    query = query.ilike('products.name', `%${producto}%`);
  }

  /* Filtro de fechas */
  if (desde) query = query.gte('created_at', desde);
  if (hasta) query = query.lte('created_at', hasta);

  /* ---------- 2. Ejecutar ---------- */
  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
  }

  /* ---------- 3. Formatear respuesta ---------- */
  const movimientos = data.map(m => ({
    id:       m.id,
    tipo:     m.type,
    producto: m.products?.name            || 'Sin nombre',
    familia:  m.products?.families?.name  || 'Sin familia',
    cajas:    m.quantity_boxes,
    unidades: m.quantity_units,
    descripcion: m.description,
    fecha:    m.created_at
  }));

  return res.json(movimientos);
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos
};

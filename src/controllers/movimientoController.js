// ✅ src/controllers/movimientoController.js – Versión 1.5 (27 jun 2025)
// 🔄 Actualización: Ajuste de filtros por fechas a zona horaria Colombia (UTC-5), validación de salidas sin stock, mejoras en control de errores.

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* 🔧 Utilidad: Ajusta fechas tipo Date a formato ISO en hora de Colombia     */
/* -------------------------------------------------------------------------- */
const toColombiaTimeISO = (fechaStr, esFinDeDia = false) => {
  const fecha = new Date(fechaStr);
  const offsetUTC = fecha.getTimezoneOffset(); // minutos
  fecha.setMinutes(fecha.getMinutes() - offsetUTC - 300); // UTC-5 (Colombia)

  // Ajusta la hora al inicio o fin del día según sea necesario
  if (esFinDeDia) fecha.setHours(23, 59, 59, 999);
  else fecha.setHours(0, 0, 0, 0);

  return fecha.toISOString();
};

/* -------------------------------------------------------------------------- */
/* POST /api/movimientos – Registrar entrada o salida                         */
/* -------------------------------------------------------------------------- */
const registrarMovimiento = async (req, res) => {
  const {
    product_id,
    type, // "entrada" | "salida"
    quantity_boxes,
    quantity_units,
    description = ''
  } = req.body;

  const user_id = req.user?.id;

  // 🔒 Validación de campos requeridos
  if (
    !user_id || !product_id || !type ||
    quantity_boxes == null || quantity_units == null
  ) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  if (!['entrada', 'salida'].includes(type)) {
    return res.status(400).json({ mensaje: 'Tipo inválido' });
  }

  try {
    // 🔍 Consultar inventario actual
    const { data: inventario, error: invErr } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single();

    if (invErr && invErr.code !== 'PGRST116') {
      return res.status(500).json({ mensaje: 'Error consultando inventario', error: invErr.message });
    }

    // ➕➖ Cálculo de nuevo stock según tipo
    let nuevasCajas = quantity_boxes;
    let nuevasUnidades = quantity_units;

    if (inventario) {
      nuevasCajas = type === 'entrada'
        ? inventario.quantity_boxes + quantity_boxes
        : inventario.quantity_boxes - quantity_boxes;

      nuevasUnidades = type === 'entrada'
        ? inventario.quantity_units + quantity_units
        : inventario.quantity_units - quantity_units;

      // ⚠️ Validación de stock negativo
      if (nuevasCajas < 0 || nuevasUnidades < 0) {
        return res.status(400).json({ mensaje: 'Cantidad insuficiente para salida' });
      }
    }

    // 📝 Registrar movimiento en tabla
    const { data: movCreado, error: movErr } = await supabase
      .from('movements')
      .insert([{ user_id, product_id, type, quantity_boxes, quantity_units, description }])
      .select()
      .single();

    if (movErr) {
      return res.status(500).json({ mensaje: 'Error registrando movimiento', error: movErr.message });
    }

    // 📦 Crear o actualizar inventario
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
      mensaje: 'Movimiento registrado correctamente',
      movimiento: movCreado
    });

  } catch (error) {
    console.error('🛑 registrarMovimiento:', error.message);
    return res.status(500).json({ mensaje: 'Error inesperado al registrar' });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/movimientos – Consulta con filtros                                */
/* Query: tipo | producto | desde | hasta                                     */
/* -------------------------------------------------------------------------- */
const obtenerMovimientos = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }

  const { tipo, producto, desde, hasta } = req.query;

  try {
    // 🔍 Consulta con joins
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

    // 🧪 Filtros aplicados si existen
    if (tipo && ['entrada', 'salida'].includes(tipo)) {
      query = query.eq('type', tipo);
    }

    if (producto) {
      query = query.ilike('products.name', `%${producto}%`);
    }

    if (desde) {
      const desdeISO = toColombiaTimeISO(desde);
      query = query.gte('created_at', desdeISO);
    }

    if (hasta) {
      const hastaISO = toColombiaTimeISO(hasta, true);
      query = query.lte('created_at', hastaISO);
    }

    // 📥 Resultado
    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
    }

    // 🧾 Formateo para frontend
    const movimientos = data.map(m => ({
      id: m.id,
      tipo: m.type,
      producto: m.products?.name || 'Sin nombre',
      familia: m.products?.families?.name || 'Sin familia',
      cajas: m.quantity_boxes,
      unidades: m.quantity_units,
      descripcion: m.description,
      fecha: m.created_at
    }));

    return res.json(movimientos);

  } catch (error) {
    console.error('🛑 obtenerMovimientos:', error.message);
    return res.status(500).json({ mensaje: 'Error inesperado al filtrar movimientos' });
  }
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos
};

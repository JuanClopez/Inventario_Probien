// ✅ Ruta: src/controllers/ventaController.js
// 📌 Propósito: Controlador de Ventas – Registra ventas y permite consultarlas con filtros
// 🧩 Versión: 1.3 – Última modificación: 27 jun 2025, 12:32 p. m.
// 📌 Cambios aplicados:
// - ✅ Estandarización de estructura por bloques
// - ✅ Comentarios explicativos para cada proceso
// - ✅ Validación clara de inputs
// - ✅ Manejo de stock vía función RPC `descontar_inventario`
// - ✅ Filtro avanzado por producto y fechas
// - 🔄 Compatible con frontend de historial de ventas y reportes

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* POST /api/ventas – Registrar una venta                                     */
/* -------------------------------------------------------------------------- */
const registrarVenta = async (req, res) => {
  try {
    const { user_id, items = [] } = req.body;

    // 🚫 Validaciones mínimas
    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios o items inválidos' });
    }

    // 🧮 Inicializar totales de la venta
    let total_boxes = 0;
    let total_units = 0;
    let total_price = 0;

    // 🔄 Verificación de stock antes de registrar venta
    for (const item of items) {
      const {
        product_id,
        quantity_boxes = 0,
        quantity_units = 0,
        unit_price = 0
      } = item;

      const { data: inventario, error: invError } = await supabase
        .from('inventories')
        .select('quantity_boxes, quantity_units')
        .eq('user_id', user_id)
        .eq('product_id', product_id)
        .single();

      if (invError || !inventario) {
        return res.status(400).json({ mensaje: `Inventario inexistente para el producto ${product_id}` });
      }

      if (
        inventario.quantity_boxes < quantity_boxes ||
        inventario.quantity_units < quantity_units
      ) {
        return res.status(400).json({ mensaje: `Stock insuficiente para el producto ${product_id}` });
      }

      total_boxes += quantity_boxes;
      total_units += quantity_units;
      total_price += unit_price * quantity_units;
    }

    // ✅ Registrar la venta principal
    const { data: venta, error: ventaError } = await supabase
      .from('sales')
      .insert([{ user_id, total_boxes, total_units, total_price }])
      .select()
      .single();

    if (ventaError) throw ventaError;

    const saleItems = [];

    // 💾 Insertar ítems y descontar inventario por cada producto
    for (const item of items) {
      const { product_id, quantity_boxes, quantity_units, unit_price } = item;

      const { data: itemCreado } = await supabase
        .from('sale_items')
        .insert([{
          sale_id: venta.id,
          product_id,
          quantity_boxes,
          quantity_units,
          unit_price
        }])
        .select()
        .single();

      saleItems.push(itemCreado);

      // 🔧 Descontar stock con función RPC
      await supabase.rpc('descontar_inventario', {
        p_user_id: user_id,
        p_product_id: product_id,
        p_quantity_boxes: quantity_boxes,
        p_quantity_units: quantity_units
      });
    }

    return res.status(201).json({
      mensaje: 'Venta registrada con éxito',
      venta,
      sale_items: saleItems
    });

  } catch (error) {
    console.error('🛑 Error al registrar venta:', error.message);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas – Lista ventas con filtros por fechas y productos         */
/* -------------------------------------------------------------------------- */
const obtenerVentas = async (req, res) => {
  try {
    const { user_id, fecha_inicio, fecha_fin, producto_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
    }

    // 🔍 Armar consulta base
    let query = supabase
      .from('sales')
      .select(`
        id,
        total_boxes,
        total_units,
        total_price,
        created_at,
        sale_items (
          product_id,
          quantity_boxes,
          quantity_units,
          unit_price,
          products (
            id,
            name,
            families ( name )
          )
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (fecha_inicio) query = query.gte('created_at', fecha_inicio);
    if (fecha_fin) query = query.lte('created_at', fecha_fin);

    const { data: ventas, error } = await query;

    if (error) throw error;

    if (!ventas || ventas.length === 0) {
      return res.status(200).json({
        mensaje: 'No hay ventas registradas para este usuario',
        ventas: []
      });
    }

    // 🔎 Filtro por producto (si se solicitó)
    const ventasFiltradas = producto_id
      ? ventas
          .map(venta => {
            const itemsFiltrados = venta.sale_items.filter(
              i => i.product_id === producto_id || i.products?.id === producto_id
            );
            return itemsFiltrados.length > 0
              ? { ...venta, sale_items: itemsFiltrados }
              : null;
          })
          .filter(v => v !== null)
      : ventas;

    return res.status(200).json({ ventas: ventasFiltradas });

  } catch (error) {
    console.error('🛑 Error al obtener ventas:', error.message);
    return res.status(500).json({ mensaje: 'Error al obtener las ventas' });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación desestructurada                                                */
/* -------------------------------------------------------------------------- */
module.exports = {
  registrarVenta,
  obtenerVentas
};

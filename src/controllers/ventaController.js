// ✅ Ruta: src/controllers/ventaController.js
// 📌 Propósito: Controlador de Ventas – Registra ventas agrupadas y permite su consulta
// 🧩 Versión: 2.1 – Última modificación: 01 jul 2025
// 📌 Cambios:
// - ✅ Registro agrupado de productos por cajas (sin unidades)
// - ✅ Se agregó campo "descripcion" para destino o nombre del cliente
// - ✅ Cálculo automático de total_neto basado en cajas
// - ✅ Verificación de stock por cajas
// - ✅ Validación robusta y estructura optimizada

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* POST /api/ventas – Registrar una venta agrupada                            */
/* -------------------------------------------------------------------------- */
const registrarVenta = async (req, res) => {
  try {
    const { user_id, items = [], descripcion = "" } = req.body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "Faltan datos obligatorios o items inválidos" });
    }

    // Inicializar acumuladores
    let total_boxes = 0;
    let total_units = 0; // siempre será 0
    let total_price = 0;
    let total_discount = 0;
    let total_iva = 0;
    let total_neto = 0;
    const saleItems = [];

    for (const item of items) {
      const { product_id, quantity_boxes = 0, discount = 0 } = item;

      // Validar existencia del precio del producto
      const { data: precio, error: precioError } = await supabase
        .from("product_prices")
        .select("base_price, iva_applicable")
        .eq("product_id", product_id)
        .single();

      if (precioError || !precio) {
        return res
          .status(400)
          .json({
            mensaje: `Precio no configurado para el producto ${product_id}`,
          });
      }

      const unit_price = parseFloat(precio.base_price);
      const aplicaIva = precio.iva_applicable;

      // Validar existencia de stock
      const { data: inventario, error: invError } = await supabase
        .from("inventories")
        .select("quantity_boxes")
        .eq("user_id", user_id)
        .eq("product_id", product_id)
        .single();

      if (invError || !inventario) {
        return res
          .status(400)
          .json({
            mensaje: `Inventario inexistente para el producto ${product_id}`,
          });
      }

      if (inventario.quantity_boxes < quantity_boxes) {
        return res
          .status(400)
          .json({
            mensaje: `Stock insuficiente para el producto ${product_id}`,
          });
      }

      // Calcular totales por ítem
      const subtotal = unit_price * quantity_boxes;
      const iva = aplicaIva ? subtotal * 0.19 : 0;
      const totalItem = subtotal + iva - discount;

      total_boxes += quantity_boxes;
      total_price += subtotal;
      total_discount += discount;
      total_iva += iva;
      total_neto += totalItem;

      saleItems.push({
        product_id,
        quantity_boxes,
        quantity_units: 0, // fijo en 0
        unit_price,
        discount,
        iva,
        total_item: totalItem,
      });
    }

    // Insertar venta principal
    const { data: venta, error: ventaError } = await supabase
      .from("sales")
      .insert([
        {
          user_id,
          descripcion,
          total_boxes,
          total_units: 0,
          total_price,
          total_discount,
          total_iva,
          total_neto,
        },
      ])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Insertar ítems y descontar inventario
    for (const item of saleItems) {
      const {
        product_id,
        quantity_boxes,
        unit_price,
        discount,
        iva,
        total_item,
      } = item;

      await supabase.from("sale_items").insert([
        {
          sale_id: venta.id,
          product_id,
          quantity_boxes,
          quantity_units: 0,
          unit_price,
          discount,
          iva,
          total_item,
        },
      ]);

      await supabase.rpc("descontar_inventario", {
        p_user_id: user_id,
        p_product_id: product_id,
        p_quantity_boxes: quantity_boxes,
        p_quantity_units: 0,
      });
    }

    return res.status(201).json({
      mensaje: "Venta registrada con éxito",
      venta,
      sale_items: saleItems,
    });
  } catch (error) {
    console.error("🛑 Error al registrar venta:", error.message);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas – Lista de ventas con filtros                              */
/* -------------------------------------------------------------------------- */
const obtenerVentas = async (req, res) => {
  try {
    const { user_id, fecha_inicio, fecha_fin, producto_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ mensaje: "Falta el parámetro user_id" });
    }

    let query = supabase
      .from("sales")
      .select(
        `
        id,
        descripcion,
        total_boxes,
        total_units,
        total_price,
        total_discount,
        total_iva,
        total_neto,
        created_at,
        sale_items (
          product_id,
          quantity_boxes,
          quantity_units,
          unit_price,
          discount,
          iva,
          total_item,
          products (
            id,
            name,
            families ( name )
          )
        )
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (fecha_inicio) query = query.gte("created_at", fecha_inicio);
    if (fecha_fin) query = query.lte("created_at", fecha_fin);

    const { data: ventas, error } = await query;

    if (error) throw error;

    const ventasFiltradas = producto_id
      ? ventas
          .map((venta) => {
            const itemsFiltrados = venta.sale_items.filter(
              (i) =>
                i.product_id === producto_id || i.products?.id === producto_id
            );
            return itemsFiltrados.length > 0
              ? { ...venta, sale_items: itemsFiltrados }
              : null;
          })
          .filter((v) => v !== null)
      : ventas;

    return res.status(200).json({ ventas: ventasFiltradas });
  } catch (error) {
    console.error("🛑 Error al obtener ventas:", error.message);
    return res.status(500).json({ mensaje: "Error al obtener las ventas" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/resumen – Consulta resumen mensual por usuario             */
/* -------------------------------------------------------------------------- */
const obtenerResumenVentas = async (req, res) => {
  try {
    const { user_id, month } = req.query;

    if (!user_id || !month) {
      return res
        .status(400)
        .json({ mensaje: "Faltan parámetros obligatorios: user_id y month" });
    }

    // 🔍 Buscar resumen del mes
    const { data: resumen, error } = await supabase
      .from("sales_summary")
      .select("net_total, discounts, iva_total, ventas_count")
      .eq("user_id", user_id)
      .eq("month", month)
      .single();

    if (error) throw error;

    // 🔍 Buscar meta mensual
    const { data: meta, error: metaError } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", month)
      .single();

    if (metaError && metaError.code !== "PGRST116") throw metaError;

    const goal = meta?.goal_amount || 0;
    const avance = goal > 0 ? (resumen.net_total / goal) * 100 : null;

    return res.status(200).json({
      resumen,
      goal_amount: goal,
      porcentaje_avance: avance ? avance.toFixed(2) + "%" : "No definido",
    });
  } catch (error) {
    console.error("🛑 Error al obtener resumen:", error.message);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener resumen de ventas" });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación                                                                */
/* -------------------------------------------------------------------------- */
module.exports = {
  registrarVenta,
  obtenerVentas,
  obtenerResumenVentas,
};

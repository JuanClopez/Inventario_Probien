// ✅ src/controllers/ventaController.js – Versión 2.5 (08 jul 2025)

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* POST /api/ventas – Registrar una venta agrupada                            */
/* -------------------------------------------------------------------------- */
const registrarVenta = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { items = [], description = "" } = req.body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "Faltan datos o items inválidos" });
    }

    let total_boxes = 0;
    let total_units = 0;
    let subtotal = 0;
    let total_discount = 0;
    let total_iva = 0;
    let net_total = 0;

    const saleItems = [];

    for (const item of items) {
      const {
        presentation_id,
        quantity_boxes = 0,
        quantity_units = 0,
        discount = 0,
      } = item;

      const { data: precio, error: precioError } = await supabase
        .from("product_prices")
        .select("price, iva_rate")
        .eq("presentation_id", presentation_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (precioError || !precio) {
        return res
          .status(400)
          .json({
            mensaje: `❌ Precio no configurado para la presentación ${presentation_id}`,
          });
      }

      const unit_price = parseFloat(precio.price);
      const iva_rate = parseFloat(precio.iva_rate || 0);
      const iva_amount = unit_price * quantity_boxes * (iva_rate / 100);
      const total_item = unit_price * quantity_boxes + iva_amount - discount;

      const { data: inventario, error: invError } = await supabase
        .from("inventories")
        .select("quantity_boxes")
        .eq("user_id", user_id)
        .eq("presentation_id", presentation_id)
        .single();

      if (
        invError ||
        !inventario ||
        inventario.quantity_boxes < quantity_boxes
      ) {
        return res
          .status(400)
          .json({
            mensaje: `❌ Stock insuficiente para presentación ${presentation_id}`,
          });
      }

      subtotal += unit_price * quantity_boxes;
      total_boxes += quantity_boxes;
      total_units += quantity_units;
      total_discount += discount;
      total_iva += iva_amount;
      net_total += total_item;

      saleItems.push({
        presentation_id,
        quantity_boxes,
        quantity_units,
        unit_price,
        discount,
        iva_rate,
        iva_amount,
        total_price: total_item,
      });
    }

    const { data: venta, error: ventaError } = await supabase
      .from("sales")
      .insert([
        {
          user_id,
          description,
          total_boxes,
          total_units,
          subtotal,
          discount_total: total_discount,
          iva_total: total_iva,
          net_total,
          total_price: subtotal + total_iva - total_discount,
        },
      ])
      .select()
      .single();

    if (ventaError) throw ventaError;

    for (const item of saleItems) {
      await supabase
        .from("sale_items")
        .insert([{ ...item, sale_id: venta.id }]);

      await supabase.from("movements").insert([
        {
          user_id,
          type: "salida",
          quantity_boxes: item.quantity_boxes,
          quantity_units: item.quantity_units,
          presentation_id: item.presentation_id,
          description,
        },
      ]);

      await supabase.rpc("descontar_inventario", {
        p_user_id: user_id,
        p_presentation_id: item.presentation_id,
        p_quantity_boxes: item.quantity_boxes,
        p_quantity_units: item.quantity_units,
      });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: resumenExistente } = await supabase
      .from("sales_summary")
      .select("*")
      .eq("user_id", user_id)
      .eq("year", year)
      .eq("month", month)
      .single();

    if (resumenExistente) {
      await supabase
        .from("sales_summary")
        .update({
          total_neto: resumenExistente.total_neto + net_total,
          total_discount: resumenExistente.total_discount + total_discount,
          total_iva: resumenExistente.total_iva + total_iva,
        })
        .eq("id", resumenExistente.id);
    } else {
      await supabase.from("sales_summary").insert([
        {
          user_id,
          year,
          month,
          total_neto: net_total,
          total_discount,
          total_iva,
        },
      ]);
    }

    return res.status(201).json({
      mensaje: "✅ Venta registrada con éxito",
      venta,
      sale_items: saleItems,
    });
  } catch (error) {
    console.error("🛑 Error en registrarVenta:", error.message);
    return res.status(500).json({ mensaje: "Error al registrar la venta" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas – Listado de ventas del usuario                            */
/* -------------------------------------------------------------------------- */
const obtenerVentas = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { fecha_inicio, fecha_fin } = req.query;

    let query = supabase
      .from("sales")
      .select(
        `
        id, description, total_boxes, total_units, subtotal,
        discount_total, iva_total, net_total, total_price, created_at,
        sale_items (
          quantity_boxes, quantity_units, unit_price,
          discount, iva_amount, total_price,
          product_presentations (
            id, presentation_name,
            products ( id, name, families ( name ) )
          )
        )
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (fecha_inicio) query = query.gte("created_at", fecha_inicio);
    if (fecha_fin) query = query.lte("created_at", fecha_fin);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ ventas: data });
  } catch (error) {
    console.error("🛑 Error en obtenerVentas:", error.message);
    return res.status(500).json({ mensaje: "Error al obtener ventas" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/resumen – Resumen mensual por usuario                      */
/* -------------------------------------------------------------------------- */
const obtenerResumenVentas = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { month } = req.query;

    if (!user_id || !month) {
      return res
        .status(400)
        .json({ mensaje: "Faltan parámetros obligatorios" });
    }

    const [year, mes] = month.split("-").map(Number);

    const { data: resumen, error } = await supabase
      .from("sales_summary")
      .select("total_neto, total_discount, total_iva")
      .eq("user_id", user_id)
      .eq("year", year)
      .eq("month", mes)
      .single();

    if (error) throw error;

    const { data: meta, error: metaError } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", `${year}-${String(mes).padStart(2, "0")}-01`)
      .single();

    const goal_amount = meta?.goal_amount || 0;
    const porcentaje_avance =
      goal_amount > 0
        ? `${((resumen.total_neto / goal_amount) * 100).toFixed(1)}%`
        : "—";

    return res.status(200).json({
      resumen,
      goal_amount,
      porcentaje_avance,
    });
  } catch (error) {
    console.error("🛑 Error al obtener resumen:", error.message);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener resumen de ventas" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/top-productos – Top productos vendidos                     */
/* -------------------------------------------------------------------------- */
const obtenerTopProductos = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { fecha_inicio, fecha_fin } = req.query;

    const { data, error } = await supabase
      .from("sale_items")
      .select(
        `
        quantity_boxes,
        presentation_id,
        product_presentations (
          id,
          products ( id, name )
        ),
        sales!inner(user_id, created_at)
      `
      )
      .eq("sales.user_id", user_id)
      .gte("sales.created_at", fecha_inicio)
      .lte("sales.created_at", fecha_fin);

    if (error) throw error;

    const acumulador = {};

    for (const item of data) {
      const producto = item.product_presentations?.products;
      if (!producto) continue;
      const id = producto.id;
      const nombre = producto.name;

      if (!acumulador[id]) {
        acumulador[id] = { producto: nombre, total_cajas: 0 };
      }

      acumulador[id].total_cajas += item.quantity_boxes || 0;
    }

    const top_productos = Object.values(acumulador)
      .sort((a, b) => b.total_cajas - a.total_cajas)
      .slice(0, 10);

    return res.status(200).json({ top_productos });
  } catch (error) {
    console.error("🛑 Error en obtenerTopProductos:", error.message);
    return res.status(500).json({ mensaje: "Error al obtener productos top" });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportaciones                                                              */
/* -------------------------------------------------------------------------- */
module.exports = {
  registrarVenta,
  obtenerVentas,
  obtenerResumenVentas,
  obtenerTopProductos,
};

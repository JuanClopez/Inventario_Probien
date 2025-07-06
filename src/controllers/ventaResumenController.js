// ✅ src/controllers/ventaResumenController.js – Versión 1.1 (06 jul 2025)
// 📊 Controlador de Resumen de Ventas – Consulta de resultados mensuales por usuario
// 🧩 Comparativo con metas, totales y cumplimiento
// 🔄 Agregado conteo de ventas y flag de existencia de meta

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/resumen?user_id=...&month=YYYY-MM                          */
/* -------------------------------------------------------------------------- */
const obtenerResumenVentas = async (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res.status(400).json({
      mensaje: "Faltan parámetros obligatorios: user_id y month (YYYY-MM)",
    });
  }

  try {
    const [year, mes] = month.split("-").map(Number);
    const fechaInicio = `${year}-${String(mes).padStart(2, "0")}-01`;
    const fechaFin = new Date(year, mes, 1).toISOString(); // primer día del mes siguiente

    const { data: ventas, error: errorVentas } = await supabase
      .from("sales")
      .select("subtotal, discount_total, iva_total, net_total")
      .eq("user_id", user_id)
      .gte("created_at", fechaInicio)
      .lt("created_at", fechaFin);

    if (errorVentas) throw errorVentas;

    const totales = {
      subtotal: 0,
      descuento: 0,
      iva: 0,
      neto: 0,
    };

    ventas.forEach((v) => {
      totales.subtotal += Number(v.subtotal || 0);
      totales.descuento += Number(v.discount_total || 0);
      totales.iva += Number(v.iva_total || 0);
      totales.neto += Number(v.net_total || 0);
    });

    // Meta mensual (opcional)
    const { data: meta, error: errorMeta } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", `${fechaInicio}`)
      .single();

    let porcentaje_cumplimiento = null;
    if (meta?.goal_amount) {
      porcentaje_cumplimiento = ((totales.neto / meta.goal_amount) * 100).toFixed(1);
    }

    return res.status(200).json({
      month,
      ventas_count: ventas.length,
      ...totales,
      meta: meta?.goal_amount || null,
      has_meta: !!meta?.goal_amount,
      porcentaje_cumplimiento,
    });
  } catch (err) {
    console.error("🛑 Error al obtener resumen de ventas:", err.message);
    return res.status(500).json({
      mensaje: "Error al generar resumen de ventas",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación del módulo                                                     */
/* -------------------------------------------------------------------------- */
module.exports = { obtenerResumenVentas };

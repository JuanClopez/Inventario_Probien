// ✅ src/controllers/ventaResumenController.js – Versión 1.0 (01 jul 2025)
// 📌 Controlador de Resumen de Ventas – Resumen mensual de ventas vs metas
// 🧩 Incluye: totales brutos, netos, IVA, descuentos y meta mensual

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/resumen?user_id=...&month=2025-07                          */
/* -------------------------------------------------------------------------- */
const obtenerResumenVentas = async (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res
      .status(400)
      .json({
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

    const totalSubtotal = ventas.reduce(
      (acc, v) => acc + Number(v.subtotal || 0),
      0
    );
    const totalDescuento = ventas.reduce(
      (acc, v) => acc + Number(v.discount_total || 0),
      0
    );
    const totalIVA = ventas.reduce(
      (acc, v) => acc + Number(v.iva_total || 0),
      0
    );
    const totalNeto = ventas.reduce(
      (acc, v) => acc + Number(v.net_total || 0),
      0
    );

    // Consultar la meta mensual (opcional)
    const { data: meta, error: errorMeta } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", `${fechaInicio}`)
      .single();

    let porcentaje_cumplimiento = null;
    if (meta && meta.goal_amount) {
      porcentaje_cumplimiento = ((totalNeto / meta.goal_amount) * 100).toFixed(
        1
      );
    }

    return res.status(200).json({
      month,
      subtotal: totalSubtotal,
      descuento: totalDescuento,
      iva: totalIVA,
      neto: totalNeto,
      meta: meta?.goal_amount || null,
      porcentaje_cumplimiento,
    });
  } catch (err) {
    console.error("Error al obtener resumen de ventas:", err.message);
    return res
      .status(500)
      .json({ mensaje: "Error al generar resumen de ventas" });
  }
};

module.exports = { obtenerResumenVentas };

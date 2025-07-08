// ✅ src/controllers/ventaResumenController.js – Versión 1.3 (08 jul 2025)
// 📊 Controlador de Resumen de Ventas – Actualizado con `presentation_id` y estructura moderna
// 🔐 Usa req.user.id del token JWT y refleja net_total, descuentos, IVA mensual
// 📆 Compara contra meta mensual registrada en `sales_goals`

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/ventas/resumen?month=YYYY-MM                                     */
/* 🔐 Requiere token – Obtiene user_id desde req.user                        */
/* -------------------------------------------------------------------------- */
const obtenerResumenVentas = async (req, res) => {
  const user_id = req.user?.id;
  const { month } = req.query;

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

    const resumen = {
      subtotal: 0,
      discounts: 0,
      iva_total: 0,
      net_total: 0,
      ventas_count: ventas.length,
    };

    for (const v of ventas) {
      resumen.subtotal += Number(v.subtotal) || 0;
      resumen.discounts += Number(v.discount_total) || 0;
      resumen.iva_total += Number(v.iva_total) || 0;
      resumen.net_total += Number(v.net_total) || 0;
    }

    const { data: meta, error: errorMeta } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", fechaInicio)
      .single();

    if (errorMeta && errorMeta.code !== "PGRST116") throw errorMeta;

    const goal_amount = meta?.goal_amount || 0;
    const porcentaje_avance =
      goal_amount > 0
        ? `${((resumen.net_total / goal_amount) * 100).toFixed(1)}%`
        : "No definido";

    return res.status(200).json({
      resumen,
      goal_amount,
      porcentaje_avance,
    });
  } catch (err) {
    console.error("🛑 Error al obtener resumen de ventas:", err.message);
    return res.status(500).json({
      mensaje: "Error al generar resumen de ventas",
      error: err.message,
    });
  }
};

module.exports = { obtenerResumenVentas };

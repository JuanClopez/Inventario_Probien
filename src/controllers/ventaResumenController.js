// ✅ Ruta: src/controllers/ventaResumenController.js
// 📌 Controlador de resumen mensual de ventas (avance vs meta)
// 🧩 Versión: 2.9.1 (12 jul 2025)
// 📦 Cambios aplicados:
// - ✅ Se tolera entrada "month" como string (YYYY-MM) o Date()
// - 🔐 Validación robusta y normalización garantizada
// - 📅 Compatibilidad total con frontend flexible (DatePicker, string, etc.)
// - ✅ Conserva lógica original de metas y resumen
// - 🛠️ Corrige error por uso incorrecto de split() en tipos no string

const { supabase } = require("../services/supabaseClient");

/**
 * Convierte un Date o string en formato YYYY-MM a objeto con:
 * { year, month, fechaInicioMes (YYYY-MM-01) }
 */
function normalizarFecha(monthInput) {
  if (!monthInput) throw new Error("Falta el parámetro month.");

  let year, month;
  if (typeof monthInput === "string") {
    const [y, m] = monthInput.split("-");
    if (!y || !m) throw new Error("El parámetro month debe tener formato YYYY-MM.");
    year = parseInt(y);
    month = parseInt(m);
  } else if (monthInput instanceof Date) {
    year = monthInput.getFullYear();
    month = monthInput.getMonth() + 1;
  } else {
    throw new Error("El parámetro month debe ser un string en formato YYYY-MM o un objeto Date.");
  }

  if (!year || !month) throw new Error("Fecha inválida para consulta mensual.");
  const fechaInicioMes = `${year}-${month.toString().padStart(2, "0")}-01`;

  return { year, month, fechaInicioMes };
}

const obtenerResumenMensualPorUsuario = async (user_id, monthText) => {
  try {
    // -------------------------------------------------------------------------
    // 🧠 1. Validación inicial y normalización segura de fecha
    // -------------------------------------------------------------------------
    if (!user_id || !monthText) {
      throw new Error("Faltan parámetros requeridos para resumen mensual.");
    }

    const { year, month, fechaInicioMes } = normalizarFecha(monthText);

    // -------------------------------------------------------------------------
    // 🎯 2. Buscar la meta desde sales_goals
    // -------------------------------------------------------------------------
    const { data: metas, error: errorMetas } = await supabase
      .from("sales_goals")
      .select("goal_amount")
      .eq("user_id", user_id)
      .eq("month", fechaInicioMes)
      .limit(1)
      .maybeSingle();

    if (errorMetas) throw errorMetas;

    const meta = metas?.goal_amount ?? null;

    // -------------------------------------------------------------------------
    // 📊 3. Buscar los totales desde sales_summary
    // -------------------------------------------------------------------------
    const { data: resumen, error: errorResumen } = await supabase
      .from("sales_summary")
      .select("total_neto, total_iva, total_discount")
      .eq("user_id", user_id)
      .eq("year", year)
      .eq("month", month)
      .limit(1)
      .maybeSingle();

    if (errorResumen) throw errorResumen;

    const neto = resumen?.total_neto ?? 0;
    const iva = resumen?.total_iva ?? 0;
    const descuento = resumen?.total_discount ?? 0;

    // -------------------------------------------------------------------------
    // 📈 4. Cálculo de avance porcentual si existe meta
    // -------------------------------------------------------------------------
    const avance = meta ? Math.min(((neto / meta) * 100).toFixed(2), 100) : null;

    // -------------------------------------------------------------------------
    // 📦 5. Retornar resumen consolidado
    // -------------------------------------------------------------------------
    return {
      meta,
      neto,
      iva,
      descuento,
      avance,
    };
  } catch (error) {
    console.error("🛑 Error en obtenerResumenMensualPorUsuario:", error.message);
    return {
      error: true,
      mensaje: error.message,
    };
  }
};

module.exports = {
  obtenerResumenMensualPorUsuario,
};

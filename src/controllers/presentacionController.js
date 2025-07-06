// ✅ src/controllers/presentacionController.js – Versión 1.0 (05 jul 2025)
// 📌 Controlador para consultar presentaciones activas por producto
// 🧩 Alineado con la arquitectura del proyecto y supabaseClient centralizado

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/presentaciones/:product_id – Listar presentaciones activas        */
/* -------------------------------------------------------------------------- */
const obtenerPresentacionesPorProducto = async (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res
      .status(400)
      .json({ mensaje: "Falta el parámetro obligatorio: product_id" });
  }

  try {
    const { data: presentaciones, error } = await supabase
      .from("product_presentations")
      .select("id, presentation_name, is_active")
      .eq("product_id", product_id)
      .eq("is_active", true)
      .order("presentation_name", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ presentaciones });
  } catch (err) {
    console.error("🛑 Error al obtener presentaciones:", err.message);
    return res.status(500).json({
      mensaje: "Error interno al obtener presentaciones del producto",
    });
  }
};

module.exports = {
  obtenerPresentacionesPorProducto,
};

// ✅ src/controllers/productoController.js
// Controlador de Productos – Maneja operaciones sobre la tabla `products` en Supabase
//	Desestructuración completada

const { supabase } = require("../services/supabaseClient");

/* ------------------------------------------------------------------ */
/* GET /api/productos – Obtener todos los productos                   */
/* ------------------------------------------------------------------ */
const obtenerProductos = async (req, res) => {
  try {
    const { data: productos, error } = await supabase.from("products").select(`
        id,
        name,
        family_id,
        families (
          name
        )
      `);

    if (error) throw error;

    const resultado = productos.map(({ id, name, family_id, families }) => ({
      id,
      name,
      family_id,
      familia: families?.name || "Sin familia",
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/productos – Crear un nuevo producto                      */
/* ------------------------------------------------------------------ */
const crearProducto = async (req, res) => {
  const { family_id, name } = req.body;

  // Validación de campos requeridos
  if (!family_id || !name) {
    return res
      .status(400)
      .json({ mensaje: "Faltan campos requeridos: family_id y name" });
  }

  // Verificar si ya existe el producto en la misma familia
  const { data: existente, error: errorExistente } = await supabase
    .from("products")
    .select("*")
    .eq("family_id", family_id)
    .eq("name", name)
    .single();

  if (errorExistente && errorExistente.code !== "PGRST116") {
    return res.status(500).json({
      mensaje: "Error al verificar producto existente",
      error: errorExistente.message,
    });
  }

  if (existente) {
    return res
      .status(409)
      .json({ mensaje: "El producto ya existe para esta familia" });
  }

  // Crear nuevo producto
  const { data: productoCreado, error } = await supabase
    .from("products")
    .insert([{ family_id, name }])
    .select();

  if (error) {
    return res
      .status(500)
      .json({ mensaje: "Error al crear el producto", error: error.message });
  }

  return res.status(201).json({
    mensaje: "Producto creado correctamente",
    producto: productoCreado[0],
  });
};

/* ------------------------------------------------------------------ */
/* Exportar el controlador                                            */
/* ------------------------------------------------------------------ */
module.exports = {
  obtenerProductos,
  crearProducto,
};

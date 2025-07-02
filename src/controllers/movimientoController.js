// ✅ src/controllers/movimientoController.js – Versión 1.7 (01 jul 2025)
// 🔄 Controlador robusto de movimientos de inventario (entradas/salidas)
// 🔐 Totalmente alineado con autenticación por token (req.user.id)

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* 🔧 Utilidad: Ajusta fechas tipo Date a formato ISO con zona horaria COL     */
/* -------------------------------------------------------------------------- */
const toColombiaTimeISO = (fechaStr, esFinDeDia = false) => {
  const fecha = new Date(fechaStr);
  const offsetUTC = fecha.getTimezoneOffset(); // En minutos
  fecha.setMinutes(fecha.getMinutes() - offsetUTC - 300); // UTC-5 (COL)
  fecha.setHours(esFinDeDia ? 23 : 0, esFinDeDia ? 59 : 0, esFinDeDia ? 59 : 0, esFinDeDia ? 999 : 0);
  return fecha.toISOString();
};

/* -------------------------------------------------------------------------- */
/* POST /api/movimientos – Registrar entrada o salida                         */
/* -------------------------------------------------------------------------- */
const registrarMovimiento = async (req, res) => {
  const { product_id, type, quantity_boxes, quantity_units, description = "" } = req.body;
  const user_id = req.user?.id;

  // 🔒 Validaciones básicas
  if (!user_id || !product_id || !type || quantity_boxes == null || quantity_units == null) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  if (!["entrada", "salida"].includes(type)) {
    return res.status(400).json({ mensaje: "Tipo de movimiento inválido" });
  }

  try {
    // 🔍 Buscar inventario actual
    const { data: inventario, error: invErr } = await supabase
      .from("inventories")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .single();

    if (invErr && invErr.code !== "PGRST116") {
      return res.status(500).json({ mensaje: "Error consultando inventario", error: invErr.message });
    }

    // 🧮 Calcular nuevo stock según tipo
    let nuevasCajas = quantity_boxes;
    let nuevasUnidades = quantity_units;

    if (inventario) {
      nuevasCajas = type === "entrada"
        ? inventario.quantity_boxes + quantity_boxes
        : inventario.quantity_boxes - quantity_boxes;

      nuevasUnidades = type === "entrada"
        ? inventario.quantity_units + quantity_units
        : inventario.quantity_units - quantity_units;

      if (nuevasCajas < 0 || nuevasUnidades < 0) {
        return res.status(400).json({ mensaje: "Stock insuficiente para registrar salida" });
      }
    }

    // 📝 Registrar movimiento
    const { data: movCreado, error: movErr } = await supabase
      .from("movements")
      .insert([
        { user_id, product_id, type, quantity_boxes, quantity_units, description }
      ])
      .select()
      .single();

    if (movErr) {
      return res.status(500).json({ mensaje: "Error al guardar el movimiento", error: movErr.message });
    }

    // 📦 Insertar o actualizar inventario
    const payload = {
      user_id,
      product_id,
      quantity_boxes: nuevasCajas,
      quantity_units: nuevasUnidades,
    };

    if (inventario) {
      await supabase.from("inventories").update(payload).eq("id", inventario.id);
    } else {
      await supabase.from("inventories").insert([payload]);
    }

    return res.status(201).json({
      mensaje: "Movimiento registrado correctamente",
      movimiento: movCreado,
    });
  } catch (error) {
    console.error("🛑 registrarMovimiento:", error.message);
    return res.status(500).json({ mensaje: "Error inesperado al registrar movimiento" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/movimientos – Consultar movimientos con filtros opcionales        */
/* -------------------------------------------------------------------------- */
const obtenerMovimientos = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ mensaje: "Token inválido" });

  const { tipo, producto, desde, hasta } = req.query;

  try {
    let query = supabase
      .from("movements")
      .select(
        `
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
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (tipo && ["entrada", "salida"].includes(tipo)) {
      query = query.eq("type", tipo);
    }

    if (producto) {
      query = query.ilike("products.name", `%${producto}%`);
    }

    if (desde) {
      query = query.gte("created_at", toColombiaTimeISO(desde));
    }

    if (hasta) {
      query = query.lte("created_at", toColombiaTimeISO(hasta, true));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ mensaje: "Error al obtener movimientos", error: error.message });
    }

    const movimientos = data.map((m) => ({
      id: m.id,
      tipo: m.type,
      producto: m.products?.name || "Sin nombre",
      familia: m.products?.families?.name || "Sin familia",
      cajas: m.quantity_boxes,
      unidades: m.quantity_units,
      descripcion: m.description,
      fecha: m.created_at,
    }));

    return res.json(movimientos);
  } catch (error) {
    console.error("🛑 obtenerMovimientos:", error.message);
    return res.status(500).json({ mensaje: "Error inesperado al filtrar movimientos" });
  }
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos,
};

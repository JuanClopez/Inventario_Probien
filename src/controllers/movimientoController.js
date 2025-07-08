// ✅ Ruta: src/controllers/movimientoController.js – Versión 2.1 (Actualizado 08 jul 2025)
// 🎯 Usa presentation_id y relaciones actualizadas con product_presentations
// 🧠 Compatible con filtros por presentación, producto, familia
// 🔐 Protegido por token

const { supabase } = require("../services/supabaseClient");

// 🔧 Convierte fecha a ISO con zona horaria de Colombia (UTC-5)
const toColombiaTimeISO = (fechaStr, esFinDeDia = false) => {
  const fecha = new Date(fechaStr);
  const offsetUTC = fecha.getTimezoneOffset();
  fecha.setMinutes(fecha.getMinutes() - offsetUTC - 300); // UTC-5
  fecha.setHours(
    esFinDeDia ? 23 : 0,
    esFinDeDia ? 59 : 0,
    esFinDeDia ? 59 : 0,
    esFinDeDia ? 999 : 0
  );
  return fecha.toISOString();
};

// 📥 POST /api/movimientos
const registrarMovimiento = async (req, res) => {
  const {
    presentation_id,
    type,
    quantity_boxes,
    quantity_units,
    description = "",
  } = req.body;
  const user_id = req.user?.id;

  if (
    !user_id ||
    !presentation_id ||
    !type ||
    quantity_boxes == null ||
    quantity_units == null
  ) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  if (!["entrada", "salida"].includes(type)) {
    return res.status(400).json({ mensaje: "Tipo de movimiento inválido" });
  }

  try {
    const { data: inventario, error: invErr } = await supabase
      .from("inventories")
      .select("*")
      .eq("user_id", user_id)
      .eq("presentation_id", presentation_id)
      .single();

    if (invErr && invErr.code !== "PGRST116") {
      return res.status(500).json({
        mensaje: "Error consultando inventario",
        error: invErr.message,
      });
    }

    let nuevasCajas = quantity_boxes;
    let nuevasUnidades = quantity_units;

    if (inventario) {
      nuevasCajas =
        type === "entrada"
          ? inventario.quantity_boxes + quantity_boxes
          : inventario.quantity_boxes - quantity_boxes;

      nuevasUnidades =
        type === "entrada"
          ? inventario.quantity_units + quantity_units
          : inventario.quantity_units - quantity_units;

      if (nuevasCajas < 0 || nuevasUnidades < 0) {
        return res
          .status(400)
          .json({ mensaje: "Stock insuficiente para registrar salida" });
      }
    }

    const { data: movCreado, error: movErr } = await supabase
      .from("movements")
      .insert([
        {
          user_id,
          presentation_id,
          type,
          quantity_boxes,
          quantity_units,
          description,
        },
      ])
      .select()
      .single();

    if (movErr) {
      return res.status(500).json({
        mensaje: "Error al guardar el movimiento",
        error: movErr.message,
      });
    }

    const payload = {
      user_id,
      presentation_id,
      quantity_boxes: nuevasCajas,
      quantity_units: nuevasUnidades,
    };

    if (inventario) {
      await supabase
        .from("inventories")
        .update(payload)
        .eq("id", inventario.id);
    } else {
      await supabase.from("inventories").insert([payload]);
    }

    return res.status(201).json({
      mensaje: "Movimiento registrado correctamente",
      movimiento: movCreado,
    });
  } catch (error) {
    console.error("🛑 registrarMovimiento:", error.message);
    return res
      .status(500)
      .json({ mensaje: "Error inesperado al registrar movimiento" });
  }
};

// 📤 GET /api/movimientos
const obtenerMovimientos = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ mensaje: "Token inválido" });

  const { tipo, producto, presentacion, desde, hasta } = req.query;

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
        product_presentations (
          presentation_name,
          products (
            name,
            families ( name )
          )
        )
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (tipo) query = query.eq("type", tipo);
    if (presentacion)
      query = query.ilike(
        "product_presentations.presentation_name",
        `%${presentacion}%`
      );
    if (producto)
      query = query.ilike(
        "product_presentations.products.name",
        `%${producto}%`
      );
    if (desde) query = query.gte("created_at", toColombiaTimeISO(desde));
    if (hasta) query = query.lte("created_at", toColombiaTimeISO(hasta, true));

    const { data, error } = await query;

    if (error)
      return res.status(500).json({
        mensaje: "Error al obtener movimientos",
        error: error.message,
      });

    const movimientos = data.map((m) => ({
      id: m.id,
      tipo: m.type,
      producto: m.product_presentations?.products?.name ?? "Sin producto",
      familia:
        m.product_presentations?.products?.families?.name ?? "Sin familia",
      presentacion:
        m.product_presentations?.presentation_name ?? "Sin presentación",
      cajas: m.quantity_boxes,
      unidades: m.quantity_units,
      descripcion: m.description,
      fecha: m.created_at,
    }));

    return res.json(movimientos);
  } catch (error) {
    console.error("🛑 obtenerMovimientos:", error.message);
    return res
      .status(500)
      .json({ mensaje: "Error inesperado al filtrar movimientos" });
  }
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos,
};

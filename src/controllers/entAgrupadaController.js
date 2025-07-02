// ✅ src/controllers/entAgrupadaController.js – Versión 2.1 (01 jul 2025)
// 📌 Controlador de Entradas Agrupadas – Registro múltiple con duplicación en movements
// 🛡️ Seguro: usa req.user.id para identificación
// 🧩 Cambios en 2.1:
// - 🔐 Eliminado req.body.user_id – se usa req.user.id desde middleware
// - 🧼 Limpieza y estructura mejorada
// - 📝 Preparado para trazabilidad y auditoría futura

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* POST /api/entradas-agrupadas – Registrar múltiples entradas agrupadas      */
/* -------------------------------------------------------------------------- */
const registrarEntradasAgrupadas = async (req, res) => {
  try {
    const { items = [], description = '' } = req.body;
    const user_id = req.user?.id; // 🔐 Viene del token, validado por authMiddleware

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ mensaje: 'Faltan datos obligatorios o items inválidos' });
    }

    for (const item of items) {
      const {
        product_id,
        quantity_boxes = 0,
        quantity_units = 0,
      } = item;

      // 🛑 Validación mínima por ítem
      if (!product_id || (quantity_boxes === 0 && quantity_units === 0)) {
        continue; // Ignorar ítems vacíos o incompletos
      }

      // 🔍 Buscar inventario existente
      const { data: inventario, error: invErr } = await supabase
        .from('inventories')
        .select('*')
        .eq('user_id', user_id)
        .eq('product_id', product_id)
        .single();

      let nuevasCajas = quantity_boxes;
      let nuevasUnidades = quantity_units;

      if (invErr && invErr.code !== 'PGRST116') {
        return res.status(500).json({
          mensaje: 'Error consultando inventario',
          error: invErr.message,
        });
      }

      if (inventario) {
        nuevasCajas += inventario.quantity_boxes;
        nuevasUnidades += inventario.quantity_units;

        const { error: updateError } = await supabase
          .from('inventories')
          .update({
            quantity_boxes: nuevasCajas,
            quantity_units: nuevasUnidades,
          })
          .eq('id', inventario.id);

        if (updateError) {
          console.error('❌ Error actualizando inventario:', updateError.message);
          return res.status(500).json({ mensaje: 'Error actualizando inventario' });
        }
      } else {
        const { error: insertError } = await supabase.from('inventories').insert([
          {
            user_id,
            product_id,
            quantity_boxes: nuevasCajas,
            quantity_units: nuevasUnidades,
          },
        ]);

        if (insertError) {
          console.error('❌ Error insertando inventario:', insertError.message);
          return res.status(500).json({ mensaje: 'Error insertando inventario' });
        }
      }

      // 📝 Registrar movimiento individual
      const { error: movimientoError } = await supabase.from('movements').insert([
        {
          user_id,
          product_id,
          type: 'entrada',
          quantity_boxes,
          quantity_units,
          description,
        },
      ]);

      if (movimientoError) {
        console.error('❌ Error registrando movimiento:', movimientoError.message);
        return res.status(500).json({ mensaje: 'Error registrando movimiento' });
      }
    }

    return res
      .status(201)
      .json({ mensaje: '✅ Entradas agrupadas registradas correctamente' });

  } catch (error) {
    console.error('🛑 Error en registrarEntradasAgrupadas:', error.message);
    return res
      .status(500)
      .json({ mensaje: 'Error interno al registrar entradas' });
  }
};

module.exports = {
  registrarEntradasAgrupadas,
};

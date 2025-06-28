// ✅ Ruta: src/controllers/exportController.js
// 📁 Controlador de Exportaciones – Exporta el inventario de un usuario en formato CSV
// 📦 Versión: 1.3 – Última modificación: 27 jun 2025, 1:20 p. m.
// 📌 Cambios aplicados:
// - ✅ Estandarización de comentarios y estructura
// - ✅ Validación clara del usuario
// - ✅ Encabezado con fecha y correo
// - ✅ Guardado físico del CSV + descarga directa
// - ✅ Uso de carpeta local `exports/`
// - 🔐 Protección mínima por query `user_id` (se asume token previo en rutas protegidas)

const { supabase } = require('../services/supabaseClient');
const { createObjectCsvStringifier } = require('csv-writer');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');

/* -------------------------------------------------------------------------- */
/* GET /api/exportar/inventario?user_id=UUID                                  */
/* -------------------------------------------------------------------------- */
const exportarInventario = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  try {
    // 🧑 Obtener email del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();
    if (errorUsuario) throw errorUsuario;

    // 📦 Obtener inventario con productos y familias
    const { data: inventario, error: errorInv } = await supabase
      .from('inventories')
      .select(`
        quantity_boxes,
        quantity_units,
        products (
          name,
          families ( name )
        )
      `)
      .eq('user_id', user_id);
    if (errorInv) throw errorInv;

    // 📄 Definir columnas del CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'producto', title: 'Producto' },
        { id: 'familia', title: 'Familia' },
        { id: 'cajas', title: 'Cajas' },
        { id: 'unidades', title: 'Unidades sueltas' }
      ]
    });

    const fecha = dayjs().format('YYYY-MM-DD');
    const encabezado = `Reporte generado para: ${usuario.email} | Fecha de reporte: ${fecha}\n\n`;

    // 🧾 Formato de datos
    const registros = inventario.map(item => ({
      producto: item.products?.name || 'Sin nombre',
      familia: item.products?.families?.name || 'Sin familia',
      cajas: item.quantity_boxes,
      unidades: item.quantity_units
    }));

    const contenidoCSV =
      encabezado +
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(registros);

    // 📂 Crear carpeta local /exports si no existe
    const exportsDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);

    // 💾 Guardar archivo en disco
    const fileName = `inventario_${fecha}.csv`;
    const filePath = path.join(exportsDir, fileName);
    fs.writeFileSync(filePath, contenidoCSV);

    // 📤 Enviar como descarga directa
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.status(200).send(contenidoCSV);

  } catch (error) {
    console.error('🛑 Error exportando CSV:', error.message);
    return res.status(500).json({ mensaje: 'Error al generar el CSV', error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación del controlador                                                */
/* -------------------------------------------------------------------------- */
module.exports = {
  exportarInventario
};

// ✅ Cliente Supabase - src/services/supabaseClient.js
// Este archivo crea y exporta una instancia del cliente de Supabase usando variables de entorno

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Carga las variables del archivo .env (SUPABASE_URL y SUPABASE_ANON_KEY)

// Inicializa el cliente de Supabase con URL y clave pública del proyecto
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Exportación desestructurada para importaciones más limpias y escalables
module.exports = { supabase };

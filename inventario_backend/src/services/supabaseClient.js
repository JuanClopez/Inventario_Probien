// ✅ Cliente Supabase - services/supabaseClient.js
// Este archivo crea una instancia del cliente de Supabase usando variables de entorno

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Carga las variables de entorno desde .env

const supabase = createClient(
  process.env.SUPABASE_URL,      // URL del proyecto Supabase
  process.env.SUPABASE_ANON_KEY  // Llave pública del proyecto Supabase
);

module.exports = supabase;
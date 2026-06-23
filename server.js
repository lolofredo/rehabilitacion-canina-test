'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const PORT = 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Faltan variables de entorno de Supabase. Revisa tu archivo .env');
  process.exit(1);
}

async function startServer() {
  const {
    buildIntakeRecord,
    createCaseId,
    validateIntake
  } = await import('./netlify/functions/intake-core.mjs');

  const app = express();
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  app.use(cors({
    origin: [
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:8888',
      'http://127.0.0.1:8888',
      'http://localhost:3000'
    ]
  }));

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', function (_req, res) {
    res.json({
      ok: true,
      service: 'rehabilitacion-canina-api',
      status: 'running'
    });
  });

  app.post('/api/intakes', async function (req, res) {
    const payload = req.body || {};
    const missing = validateIntake(payload);

    if (missing.length) {
      return res.status(400).json({
        ok: false,
        error: 'missing_required_fields',
        missing
      });
    }

    const receivedAt = new Date().toISOString();
    const caseId = createCaseId(new Date(receivedAt));
    const intakeToInsert = buildIntakeRecord(payload, caseId, receivedAt);

    const { data, error } = await supabase
      .from('intakes')
      .insert(intakeToInsert)
      .select('id, case_id')
      .single();

    if (error) {
      console.error('Error guardando intake en Supabase:', error);

      return res.status(500).json({
        ok: false,
        error: 'database_insert_failed'
      });
    }

    console.log('Nuevo intake guardado en Supabase:', {
      id: data.id,
      caseId,
      status: 'pendiente_revision',
      triageStatus: intakeToInsert.triage_status,
      alertaVeterinaria: intakeToInsert.alerta_veterinaria,
      receivedAt
    });

    return res.status(201).json({
      ok: true,
      caseId,
      status: 'pendiente_revision',
      triageStatus: intakeToInsert.triage_status,
      alertaVeterinaria: intakeToInsert.alerta_veterinaria,
      receivedAt
    });
  });

  app.listen(PORT, function () {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

startServer().catch(function (error) {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});

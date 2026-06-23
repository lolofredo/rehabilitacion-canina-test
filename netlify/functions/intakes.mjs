import { createClient } from '@supabase/supabase-js';
import {
  buildIntakeRecord,
  createCaseId,
  validateIntake
} from './intake-core.mjs';

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('missing_supabase_environment_variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createIntakeHandler(options = {}) {
  const createClientForRequest = options.getSupabaseClient || getSupabaseClient;
  const now = options.now || (() => new Date());
  const random = options.random || Math.random;

  return async function intakeHandler(request) {
    if (request.method !== 'POST') {
      return jsonResponse({
        ok: false,
        error: 'method_not_allowed'
      }, 405);
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse({
        ok: false,
        error: 'invalid_json'
      }, 400);
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return jsonResponse({
        ok: false,
        error: 'invalid_payload'
      }, 400);
    }

    const missing = validateIntake(payload);

    if (missing.length) {
      return jsonResponse({
        ok: false,
        error: 'missing_required_fields',
        missing
      }, 400);
    }

    const currentTime = now();
    const caseId = createCaseId(currentTime, random);
    const receivedAt = currentTime.toISOString();
    const intakeToInsert = buildIntakeRecord(payload, caseId, receivedAt);

    let supabase;

    try {
      supabase = createClientForRequest();
    } catch (error) {
      console.error('Error configurando Supabase:', error);

      return jsonResponse({
        ok: false,
        error: 'service_configuration_error'
      }, 500);
    }

    const { data, error } = await supabase
      .from('intakes')
      .insert(intakeToInsert)
      .select('id, case_id')
      .single();

    if (error) {
      console.error('Error guardando intake en Supabase:', error);

      return jsonResponse({
        ok: false,
        error: 'database_insert_failed'
      }, 500);
    }

    console.log('Nuevo intake guardado en Supabase:', {
      id: data.id,
      caseId,
      status: 'pendiente_revision',
      triageStatus: intakeToInsert.triage_status,
      alertaVeterinaria: intakeToInsert.alerta_veterinaria,
      receivedAt
    });

    return jsonResponse({
      ok: true,
      caseId,
      status: 'pendiente_revision',
      triageStatus: intakeToInsert.triage_status,
      alertaVeterinaria: intakeToInsert.alerta_veterinaria,
      receivedAt
    }, 201);
  };
}

export default createIntakeHandler();

export const config = {
  path: '/api/intakes'
};

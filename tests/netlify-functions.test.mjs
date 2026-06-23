import test from 'node:test';
import assert from 'node:assert/strict';

import healthHandler from '../netlify/functions/health.mjs';
import { createIntakeHandler } from '../netlify/functions/intakes.mjs';

const validPayload = {
  tutorNombre: 'Tutor de prueba',
  whatsapp: '+56911111111',
  email: 'prueba@example.com',
  region: 'Metropolitana de Santiago',
  comuna: 'Santiago',
  ciudad: 'Santiago',
  disponibilidadSemanal: 'Todos los días',
  responsableEjercicios: 'Yo principalmente',
  perroNombre: 'Lucas',
  edad: '9 años',
  raza: 'Mestizo',
  peso: '18 kg',
  sexoPerro: 'Macho',
  esterilizado: 'Sí',
  problemaPrincipal: 'Le cuesta levantarse',
  problema: 'Dificultad para levantarse',
  desdeCuando: 'Hace dos meses',
  tipoEvolucion: 'Se mantiene estable',
  preocupacionPrincipal: 'Que pierda más movilidad',
  diagnosticoPrevio: 'Sí',
  diagnosticoDetalle: 'Artrosis',
  enControlVeterinario: 'Sí',
  medicamentosActuales: 'Ninguno',
  cirugiaReciente: 'No',
  examenesRealizados: ['Radiografía'],
  antecedentes: 'Artrosis',
  nivelMovilidad: 'Camina solo, pero con dificultad',
  funcion: ['Caminar dentro de casa'],
  dificultades: ['Levantarse'],
  frecuenciaCaidas: 'Ocasionalmente',
  ayudasAsistencia: ['Arnés'],
  dolorPercibido: 'A veces parece incómodo',
  momentosDificultad: ['Al levantarse'],
  energiaActual: 'Un poco más bajo',
  fatiga: 'Sí, un poco más que antes',
  tipoVivienda: 'Casa',
  tipoPiso: ['Cerámica/baldosa'],
  escaleras: 'Sí, pocas',
  rutinaPaseos: 'Sale 10 a 20 minutos',
  adaptacionesCasa: ['Alfombras o antideslizantes'],
  viveConAnimales: 'Sí, con otro perro',
  estadoAnimo: 'Igual que siempre',
  sociabilidadPerros: 'Se relaciona bien',
  sociabilidadPersonas: 'Se relaciona bien',
  miedosReactividad: ['Ninguna'],
  motivadores: ['Comida/premios'],
  redFlag: ['Ninguna de las anteriores'],
  consultaVetRedFlags: '',
  videos: 'https://example.com/video',
  videosProvided: true,
  videosAccesibles: true,
  objetivoPrincipal: 'Que se levante con más facilidad',
  objetivo: 'Que se levante con más facilidad',
  comentarioAdicional: '',
  consentAccepted: true,
  consentVersion: '2026-06-23',
  origen: 'landing_web'
};

function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

test('health responde con el contrato actual', async () => {
  const response = await healthHandler(new Request('http://localhost/api/health'));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, {
    ok: true,
    service: 'rehabilitacion-canina-api',
    status: 'running'
  });
});

test('intakes rechaza métodos distintos de POST', async () => {
  const handler = createIntakeHandler();
  const response = await handler(new Request('http://localhost/api/intakes'));

  assert.equal(response.status, 405);
  assert.equal((await response.json()).error, 'method_not_allowed');
});

test('intakes conserva la validación de campos obligatorios', async () => {
  const handler = createIntakeHandler();
  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    { tutorNombre: 'Tutor' }
  ));
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.error, 'missing_required_fields');
  assert.ok(result.missing.includes('whatsapp'));
});

test('intakes guarda el mismo esquema y devuelve caseId', async () => {
  let insertedRecord;

  const supabaseMock = {
    from(table) {
      assert.equal(table, 'intakes');

      return {
        insert(record) {
          insertedRecord = record;

          return {
            select() {
              return {
                async single() {
                  return {
                    data: {
                      id: 123,
                      case_id: record.case_id
                    },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const handler = createIntakeHandler({
    getSupabaseClient: () => supabaseMock,
    now: () => new Date('2026-06-23T10:00:00.000Z'),
    random: () => 0.123456789
  });

  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    validPayload
  ));
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.ok, true);
  assert.match(result.caseId, /^RC-20260623-[A-Z0-9]{4}$/);
  assert.equal(result.status, 'pendiente_revision');
  assert.equal(insertedRecord.tutor_nombre, validPayload.tutorNombre);
  assert.equal(insertedRecord.region, validPayload.region);
  assert.equal(insertedRecord.comuna, validPayload.comuna);
  assert.equal(insertedRecord.triage_status, 'pendiente_revision');
  assert.equal(insertedRecord.has_red_flags, false);
  assert.deepEqual(insertedRecord.dificultades, ['Levantarse']);
  assert.equal(insertedRecord.videos_provided, true);
  assert.equal(insertedRecord.red_flag[0], 'Ninguna de las anteriores');
  assert.equal(insertedRecord.consent_accepted, true);
  assert.equal(insertedRecord.consent_version, '2026-06-23');
  assert.equal(insertedRecord.consent_accepted_at, '2026-06-23T10:00:00.000Z');
  assert.equal(insertedRecord.alerta_veterinaria, false);
  assert.equal(insertedRecord.urgent_notice_shown_at, null);
  assert.deepEqual(insertedRecord.raw_payload, validPayload);
});

test('intakes marca y prioriza los casos con alerta veterinaria', async () => {
  let insertedRecord;

  const supabaseMock = {
    from() {
      return {
        insert(record) {
          insertedRecord = record;
          return {
            select() {
              return {
                async single() {
                  return {
                    data: { id: 456, case_id: record.case_id },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const handler = createIntakeHandler({
    getSupabaseClient: () => supabaseMock,
    now: () => new Date('2026-06-23T12:00:00.000Z'),
    random: () => 0.54321
  });

  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    {
      ...validPayload,
      redFlag: ['Dolor intenso o llanto persistente'],
      consultaVetRedFlags: 'No'
    }
  ));
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.alertaVeterinaria, true);
  assert.equal(result.triageStatus, 'requiere_veterinario_primero');
  assert.equal(insertedRecord.alerta_veterinaria, true);
  assert.equal(insertedRecord.has_red_flags, true);
  assert.equal(insertedRecord.triage_status, 'requiere_veterinario_primero');
  assert.equal(insertedRecord.urgent_notice_shown_at, '2026-06-23T12:00:00.000Z');
});

test('intakes exige respuesta veterinaria cuando hay red flags', async () => {
  const handler = createIntakeHandler();
  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    {
      ...validPayload,
      redFlag: ['Empeoramiento rápido'],
      consultaVetRedFlags: ''
    }
  ));
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.ok(result.missing.includes('consultaVetRedFlags'));
});

test('intakes clasifica la falta de diagnóstico sin bloquear el caso', async () => {
  let insertedRecord;
  const supabaseMock = {
    from() {
      return {
        insert(record) {
          insertedRecord = record;
          return {
            select() {
              return {
                async single() {
                  return { data: { id: 789, case_id: record.case_id }, error: null };
                }
              };
            }
          };
        }
      };
    }
  };
  const handler = createIntakeHandler({ getSupabaseClient: () => supabaseMock });
  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    { ...validPayload, diagnosticoPrevio: 'No' }
  ));

  assert.equal(response.status, 201);
  assert.equal(insertedRecord.triage_status, 'pendiente_por_falta_diagnostico');
});

test('intakes no devuelve éxito cuando Supabase falla', async () => {
  const supabaseMock = {
    from() {
      return {
        insert() {
          return {
            select() {
              return {
                async single() {
                  return {
                    data: null,
                    error: {
                      message: 'database unavailable'
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const handler = createIntakeHandler({
    getSupabaseClient: () => supabaseMock
  });

  const response = await handler(jsonRequest(
    'http://localhost/api/intakes',
    'POST',
    validPayload
  ));

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, 'database_insert_failed');
});

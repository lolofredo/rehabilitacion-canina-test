export const REQUIRED_FIELDS = [
  'tutorNombre',
  'whatsapp',
  'email',
  'region',
  'comuna',
  'disponibilidadSemanal',
  'responsableEjercicios',
  'perroNombre',
  'edad',
  'raza',
  'peso',
  'sexoPerro',
  'esterilizado',
  'problemaPrincipal',
  'desdeCuando',
  'tipoEvolucion',
  'preocupacionPrincipal',
  'diagnosticoPrevio',
  'enControlVeterinario',
  'cirugiaReciente',
  'nivelMovilidad',
  'frecuenciaCaidas',
  'dolorPercibido',
  'energiaActual',
  'fatiga',
  'tipoVivienda',
  'escaleras',
  'rutinaPaseos',
  'estadoAnimo',
  'videos',
  'objetivoPrincipal',
  'consentVersion'
];

export const REQUIRED_ARRAY_FIELDS = [
  'redFlag',
  'funcion',
  'dificultades',
  'tipoPiso',
  'motivadores'
];

export function createCaseId(now = new Date(), random = Math.random) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = random().toString(36).slice(2, 6).toUpperCase();
  return `RC-${date}-${suffix}`;
}

export function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  return [String(value)];
}

export function hasRealRedFlags(redFlags) {
  return normalizeArray(redFlags).some((value) => {
    return value !== 'Ninguna de las anteriores';
  });
}

export function calculateTriageStatus(payload) {
  if (hasRealRedFlags(payload.redFlag)) return 'requiere_veterinario_primero';
  if (payload.diagnosticoPrevio === 'Sí' || payload.diagnosticoPrevio === 'Está en estudio') {
    return payload.videos ? 'pendiente_revision' : 'pendiente_por_falta_de_videos';
  }
  return 'pendiente_por_falta_diagnostico';
}

export function validateIntake(payload) {
  const missing = REQUIRED_FIELDS.filter((field) => {
    return !payload[field] || String(payload[field]).trim() === '';
  });

  REQUIRED_ARRAY_FIELDS.forEach((field) => {
    if (!normalizeArray(payload[field]).length) missing.push(field);
  });

  if (payload.videosAccesibles !== true) missing.push('videosAccesibles');
  if (payload.consentAccepted !== true) missing.push('consentAccepted');
  if (hasRealRedFlags(payload.redFlag) && !String(payload.consultaVetRedFlags || '').trim()) {
    missing.push('consultaVetRedFlags');
  }

  return [...new Set(missing)];
}

function buildLegacyAntecedentes(payload) {
  return [
    payload.diagnosticoDetalle ? `Diagnóstico: ${payload.diagnosticoDetalle}` : '',
    payload.medicamentosActuales ? `Medicamentos: ${payload.medicamentosActuales}` : '',
    payload.cirugiaReciente ? `Cirugía reciente: ${payload.cirugiaReciente}` : ''
  ].filter(Boolean).join('\n') || null;
}

export function buildIntakeRecord(payload, caseId, receivedAt) {
  const redFlags = normalizeArray(payload.redFlag);
  const hasVeterinaryAlert = hasRealRedFlags(redFlags);
  const triageStatus = calculateTriageStatus(payload);

  return {
    case_id: caseId,
    status: 'pendiente_revision',
    triage_status: triageStatus,
    has_red_flags: hasVeterinaryAlert,
    received_at: receivedAt,
    origin: payload.origen || 'landing_web',

    tutor_nombre: payload.tutorNombre,
    whatsapp: payload.whatsapp,
    email: payload.email,
    region: payload.region,
    comuna: payload.comuna,
    ciudad: payload.comuna,
    disponibilidad_semanal: payload.disponibilidadSemanal,
    responsable_ejercicios: payload.responsableEjercicios,

    perro_nombre: payload.perroNombre,
    edad: payload.edad,
    raza: payload.raza,
    peso: payload.peso,
    sexo_perro: payload.sexoPerro,
    esterilizado: payload.esterilizado,

    problema: payload.problemaPrincipal,
    problema_principal: payload.problemaPrincipal,
    desde_cuando: payload.desdeCuando,
    tipo_evolucion: payload.tipoEvolucion,
    preocupacion_principal: payload.preocupacionPrincipal,

    red_flag: redFlags,
    consulta_vet_red_flags: payload.consultaVetRedFlags || null,

    diagnostico_previo: payload.diagnosticoPrevio,
    diagnostico_detalle: payload.diagnosticoDetalle || null,
    en_control_veterinario: payload.enControlVeterinario,
    medicamentos_actuales: payload.medicamentosActuales || null,
    cirugia_reciente: payload.cirugiaReciente,
    examenes_realizados: normalizeArray(payload.examenesRealizados),
    antecedentes: buildLegacyAntecedentes(payload),

    nivel_movilidad: payload.nivelMovilidad,
    funcion: normalizeArray(payload.funcion),
    dificultades: normalizeArray(payload.dificultades),
    frecuencia_caidas: payload.frecuenciaCaidas,
    ayudas_asistencia: normalizeArray(payload.ayudasAsistencia),

    dolor_percibido: payload.dolorPercibido,
    momentos_dificultad: normalizeArray(payload.momentosDificultad),
    energia_actual: payload.energiaActual,
    fatiga: payload.fatiga,

    tipo_vivienda: payload.tipoVivienda,
    tipo_piso: normalizeArray(payload.tipoPiso),
    escaleras: payload.escaleras,
    rutina_paseos: payload.rutinaPaseos,
    adaptaciones_casa: normalizeArray(payload.adaptacionesCasa),
    vive_con_animales: payload.viveConAnimales || null,

    estado_animo: payload.estadoAnimo,
    sociabilidad_perros: payload.sociabilidadPerros || null,
    sociabilidad_personas: payload.sociabilidadPersonas || null,
    miedos_reactividad: normalizeArray(payload.miedosReactividad),
    motivadores: normalizeArray(payload.motivadores),

    videos: payload.videos,
    videos_provided: Boolean(String(payload.videos || '').trim()),
    videos_accesibles: payload.videosAccesibles === true,
    objetivo: payload.objetivoPrincipal,
    objetivo_principal: payload.objetivoPrincipal,
    comentario_adicional: payload.comentarioAdicional || null,

    consent_accepted: true,
    consent_version: payload.consentVersion,
    consent_accepted_at: receivedAt,
    alerta_veterinaria: hasVeterinaryAlert,
    urgent_notice_shown_at: hasVeterinaryAlert ? receivedAt : null,
    raw_payload: payload
  };
}

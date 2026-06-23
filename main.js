'use strict';

const WHATSAPP_NUMBER = '56983297826';
const GA_MEASUREMENT_ID = 'G-WVXYL2S3V5';
const CLARITY_PROJECT_ID = 'w3bqqlimqs';
const ANALYTICS_CONSENT_KEY = 'rc_analytics_consent';
const INTAKE_CONSENT_VERSION = '2026-06-23';
const INTAKE_API_URL = window.location.port === '4173'
  ? 'http://localhost:3000/api/intakes'
  : '/api/intakes';

let analyticsReady = false;

const GA_ALLOWED_EVENT_NAMES = new Set([
  'cta_click',
  'cookie_analytics_accepted',
  'cookie_analytics_rejected',
  'faq_opened',
  'form_step_view',
  'intake_started',
  'intake_progress',
  'intake_validation_error',
  'red_flag_detected',
  'intake_saved',
  'intake_api_error',
  'intake_completed',
  'whatsapp_opened',
  'intake_abandoned',
  'scroll_depth',
  'web_vital'
]);

const GA_ALLOWED_PARAM_KEYS = new Set([
  'event_category',
  'form_step',
  'has_red_flags',
  'triage_status',
  'error_type',
  'invalid_fields',
  'percent_complete',
  'percent_scrolled',
  'metric_name',
  'metric_value',
  'metric_unit',
  'element_type',
  'faq_id',
  'cta_id',
  'form_completed',
  'highest_progress_percent'
]);

function getAnalyticsConsent() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    return null;
  }
}

function setAnalyticsConsent(value) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // El consentimiento sigue funcionando durante la visita aunque el navegador bloquee localStorage.
  }
}

function loadScript(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function enableAnalytics() {
  if (analyticsReady) return;
  analyticsReady = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
  window.gtag('js', new Date());
  const safePageLocation = window.location.origin + window.location.pathname;
  let safePageReferrer = '';
  if (document.referrer) {
    try {
      safePageReferrer = new URL(document.referrer).origin;
    } catch {
      safePageReferrer = '';
    }
  }
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    transport_type: 'beacon',
    page_location: safePageLocation,
    page_referrer: safePageReferrer
  });
  loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID, 'google-analytics-script');

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  window.clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted'
  });
  loadScript('https://www.clarity.ms/tag/' + CLARITY_PROJECT_ID, 'microsoft-clarity-script');

  track('cookie_analytics_accepted', {
    event_category: 'cookie_consent'
  });
}

function track(eventName, details) {
  if (!analyticsReady || typeof window.gtag !== 'function') return;
  if (!GA_ALLOWED_EVENT_NAMES.has(eventName)) return;

  const safeDetails = {};
  Object.entries(details || {}).forEach(function ([key, value]) {
    if (!GA_ALLOWED_PARAM_KEYS.has(key)) return;

    if (typeof value === 'boolean') {
      safeDetails[key] = value;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      safeDetails[key] = value;
    } else if (typeof value === 'string') {
      safeDetails[key] = value.slice(0, 80);
    }
  });

  window.gtag('event', eventName, safeDetails);
}

function initCookieConsent() {
  const banner = document.getElementById('cookie-banner');
  const acceptButton = document.getElementById('cookie-accept');
  const rejectButton = document.getElementById('cookie-reject');
  const settingsButton = document.getElementById('cookie-settings');
  if (!banner || !acceptButton || !rejectButton) return;

  function showBanner() {
    banner.hidden = false;
  }

  function hideBanner() {
    banner.hidden = true;
  }

  acceptButton.addEventListener('click', function () {
    setAnalyticsConsent('granted');
    enableAnalytics();
    hideBanner();
  });

  rejectButton.addEventListener('click', function () {
    if (analyticsReady) {
      track('cookie_analytics_rejected', {
        event_category: 'cookie_consent'
      });
    }
    setAnalyticsConsent('denied');
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    }
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', {
        ad_Storage: 'denied',
        analytics_Storage: 'denied'
      });
      window.clarity('consent', false);
    }
    analyticsReady = false;
    hideBanner();
  });

  if (settingsButton) {
    settingsButton.addEventListener('click', showBanner);
  }

  const consent = getAnalyticsConsent();
  if (consent === 'granted') {
    enableAnalytics();
  } else if (consent !== 'denied') {
    showBanner();
  }
}

function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!toggle || !nav || !overlay) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    nav.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('nav-open');
  }

  toggle.addEventListener('click', function () {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', opening);
    overlay.classList.toggle('is-visible', opening);
    document.body.classList.toggle('nav-open', opening);
  });

  overlay.addEventListener('click', closeMenu);
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const targetId = link.getAttribute('href');
      const target = targetId && targetId.startsWith('#') ? document.querySelector(targetId) : null;
      closeMenu();

      if (target) {
        event.preventDefault();
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState(null, '', targetId);
        });
      }
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) closeMenu();
  });
}

function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(function (element) { element.classList.add('is-visible'); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -35px' });
  elements.forEach(function (element) { observer.observe(element); });
}

function initFaq() {
  const questions = document.querySelectorAll('.faq-question');
  questions.forEach(function (question) {
    question.addEventListener('click', function () {
      const wasOpen = question.getAttribute('aria-expanded') === 'true';
      questions.forEach(function (item) {
        item.setAttribute('aria-expanded', 'false');
        const answer = document.getElementById(item.getAttribute('aria-controls'));
        if (answer) answer.hidden = true;
      });
      if (!wasOpen) {
        question.setAttribute('aria-expanded', 'true');
        const answer = document.getElementById(question.getAttribute('aria-controls'));
        if (answer) answer.hidden = false;
        track('faq_opened', {
          event_category: 'faq',
          faq_id: question.getAttribute('aria-controls') || ''
        });
      }
    });
  });
}

function initTracking() {
  document.querySelectorAll('[data-track]').forEach(function (element) {
    element.addEventListener('click', function () {
      track('cta_click', {
        event_category: 'cta',
        cta_id: element.dataset.track,
        element_type: element.tagName.toLowerCase()
      });
    });
  });
}

function initScrollTracking() {
  const milestones = [25, 50, 75, 90];
  const reached = new Set();

  function measure() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.round((window.scrollY / scrollable) * 100);

    milestones.forEach(function (milestone) {
      if (percent >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        track('scroll_depth', { percent_scrolled: milestone });
      }
    });
  }

  window.addEventListener('scroll', measure, { passive: true });
}

function initWebVitalsTracking() {
  if (!('PerformanceObserver' in window)) return;

  function report(name, value) {
    track('web_vital', {
      metric_name: name,
      metric_value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_unit: name === 'CLS' ? 'score_x1000' : 'milliseconds'
    });
  }

  try {
    let lcpValue = 0;
    const lcpObserver = new PerformanceObserver(function (list) {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) lcpValue = lastEntry.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    window.addEventListener('pagehide', function () {
      if (lcpValue) report('LCP', lcpValue);
      lcpObserver.disconnect();
    }, { once: true });
  } catch {
    // Algunos navegadores no implementan esta métrica.
  }

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    window.addEventListener('pagehide', function () {
      report('CLS', clsValue);
      clsObserver.disconnect();
    }, { once: true });
  } catch {
    // Algunos navegadores no implementan esta métrica.
  }

  try {
    let inpValue = 0;
    const inpObserver = new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) {
        inpValue = Math.max(inpValue, entry.duration || 0);
      });
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
    window.addEventListener('pagehide', function () {
      if (inpValue) report('INP', inpValue);
      inpObserver.disconnect();
    }, { once: true });
  } catch {
    // Algunos navegadores no implementan esta métrica.
  }
}

function selectedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(function (input) {
    return input.value;
  });
}

function hasRealRedFlags(redFlags) {
  return redFlags.some(function (value) {
    return value !== 'Ninguna de las anteriores';
  });
}

function calculateTriageStatus(payload) {
  if (payload.hasRedFlags) return 'requiere_veterinario_primero';
  if (payload.diagnosticoPrevio === 'Sí' || payload.diagnosticoPrevio === 'Está en estudio') {
    return payload.videosProvided ? 'pendiente_revision' : 'pendiente_por_falta_de_videos';
  }
  return 'pendiente_por_falta_diagnostico';
}

function triageLabel(status) {
  const labels = {
    requiere_veterinario_primero: 'Requiere atención veterinaria primero',
    pendiente_por_falta_diagnostico: 'Pendiente por falta de diagnóstico',
    pendiente_por_falta_de_videos: 'Pendiente por falta de videos',
    pendiente_revision: 'Pendiente de revisión'
  };
  return labels[status] || 'Pendiente de revisión';
}

function setMessage(element, text, isSuccess, isWarning) {
  element.textContent = text;
  element.hidden = false;
  element.classList.toggle('is-success', Boolean(isSuccess));
  element.classList.toggle('is-warning', Boolean(isWarning));
}

function buildIntakePayload(form) {
  const data = new FormData(form);

  function value(name) {
    const raw = data.get(name);
    return raw && String(raw).trim() ? String(raw).trim() : '';
  }

  const redFlag = selectedValues(form, 'redFlag');
  const videos = value('videos');
  const payload = {
    tutorNombre: value('tutorNombre'),
    whatsapp: value('whatsapp'),
    email: value('email'),
    region: value('region'),
    comuna: value('comuna'),
    ciudad: value('comuna'),
    disponibilidadSemanal: value('disponibilidadSemanal'),
    responsableEjercicios: value('responsableEjercicios'),
    perroNombre: value('perroNombre'),
    edad: value('edad'),
    raza: value('raza'),
    peso: value('peso'),
    sexoPerro: value('sexoPerro'),
    esterilizado: value('esterilizado'),
    problemaPrincipal: value('problemaPrincipal'),
    problema: value('problemaPrincipal'),
    desdeCuando: value('desdeCuando'),
    tipoEvolucion: value('tipoEvolucion'),
    preocupacionPrincipal: value('preocupacionPrincipal'),
    redFlag,
    consultaVetRedFlags: value('consultaVetRedFlags'),
    diagnosticoPrevio: value('diagnosticoPrevio'),
    diagnosticoDetalle: value('diagnosticoDetalle'),
    enControlVeterinario: value('enControlVeterinario'),
    medicamentosActuales: value('medicamentosActuales'),
    cirugiaReciente: value('cirugiaReciente'),
    examenesRealizados: selectedValues(form, 'examenesRealizados'),
    antecedentes: value('diagnosticoDetalle'),
    nivelMovilidad: value('nivelMovilidad'),
    funcion: selectedValues(form, 'funcion'),
    dificultades: selectedValues(form, 'dificultades'),
    frecuenciaCaidas: value('frecuenciaCaidas'),
    ayudasAsistencia: selectedValues(form, 'ayudasAsistencia'),
    dolorPercibido: value('dolorPercibido'),
    momentosDificultad: selectedValues(form, 'momentosDificultad'),
    energiaActual: value('energiaActual'),
    fatiga: value('fatiga'),
    tipoVivienda: value('tipoVivienda'),
    tipoPiso: selectedValues(form, 'tipoPiso'),
    escaleras: value('escaleras'),
    rutinaPaseos: value('rutinaPaseos'),
    adaptacionesCasa: selectedValues(form, 'adaptacionesCasa'),
    viveConAnimales: value('viveConAnimales'),
    estadoAnimo: value('estadoAnimo'),
    sociabilidadPerros: value('sociabilidadPerros'),
    sociabilidadPersonas: value('sociabilidadPersonas'),
    miedosReactividad: selectedValues(form, 'miedosReactividad'),
    motivadores: selectedValues(form, 'motivadores'),
    videos,
    videosProvided: Boolean(videos),
    videosAccesibles: form.elements.videosAccesibles.checked,
    objetivoPrincipal: value('objetivoPrincipal'),
    objetivo: value('objetivoPrincipal'),
    comentarioAdicional: value('comentarioAdicional'),
    consentAccepted: form.elements.consentimiento.checked,
    consentVersion: INTAKE_CONSENT_VERSION,
    origen: 'landing_web'
  };

  payload.hasRedFlags = hasRealRedFlags(redFlag);
  payload.triageStatus = calculateTriageStatus(payload);
  return payload;
}

async function submitIntake(payload) {
  const response = await fetch(INTAKE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('La API respondió con estado ' + response.status);
  }

  const result = await response.json();
  if (!result || result.ok !== true || !result.caseId) {
    throw new Error('La respuesta de la API no contiene un identificador de caso válido');
  }

  return result;
}

function buildWhatsAppMessage(form, intakeResult) {
  const payload = buildIntakePayload(form);
  const submittedAt = new Date().toLocaleString('es-CL');

  function show(value, fallback = 'No informado') {
    if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
    return value && String(value).trim() ? String(value).trim() : fallback;
  }

  return [
    '*Solicitud de valoración inicial*',
    '*Rehabilitación Canina Chile*',
    ...(intakeResult && intakeResult.caseId ? ['*Caso:* ' + intakeResult.caseId] : []),
    ...(payload.hasRedFlags ? [
      '',
      '*ATENCIÓN: ALERTA VETERINARIA*',
      'Recibimos tu solicitud y evaluaremos los antecedentes enviados. Como marcaste una o más señales de alerta, te recomendamos contactar a un médico veterinario lo antes posible. Si los síntomas son intensos, repentinos o empeoran, acude a un servicio de urgencias. No esperes nuestra respuesta para consultar.'
    ] : []),
    '',
    '*Fecha:* ' + submittedAt,
    '*Origen:* Landing web',
    '',
    '--------------------------------',
    '*1. Tutor y disponibilidad*',
    '*Nombre:* ' + show(payload.tutorNombre),
    '*WhatsApp:* ' + show(payload.whatsapp),
    '*Email:* ' + show(payload.email),
    '*Ubicación:* ' + show(payload.comuna) + ', ' + show(payload.region),
    '*Disponibilidad:* ' + show(payload.disponibilidadSemanal),
    '*Responsable de ejercicios:* ' + show(payload.responsableEjercicios),
    '',
    '--------------------------------',
    '*2. Datos del perro*',
    '*Nombre:* ' + show(payload.perroNombre),
    '*Edad:* ' + show(payload.edad),
    '*Raza:* ' + show(payload.raza),
    '*Peso:* ' + show(payload.peso),
    '*Sexo / esterilizado:* ' + show(payload.sexoPerro) + ' / ' + show(payload.esterilizado),
    '',
    '--------------------------------',
    '*3. Motivo de consulta*',
    '*Problema:* ' + show(payload.problemaPrincipal),
    '*Desde cuándo:* ' + show(payload.desdeCuando),
    '*Evolución:* ' + show(payload.tipoEvolucion),
    '*Principal preocupación:* ' + show(payload.preocupacionPrincipal),
    '',
    '--------------------------------',
    '*4. Triage y antecedentes veterinarios*',
    '*Estado de triage:* ' + triageLabel((intakeResult && intakeResult.triageStatus) || payload.triageStatus),
    '*Señales de alerta:* ' + show(payload.redFlag),
    ...(payload.hasRedFlags ? ['*Consulta veterinaria por alertas:* ' + show(payload.consultaVetRedFlags)] : []),
    '*Diagnóstico previo:* ' + show(payload.diagnosticoPrevio),
    '*Diagnóstico informado:* ' + show(payload.diagnosticoDetalle),
    '*Control veterinario:* ' + show(payload.enControlVeterinario),
    '*Cirugía reciente:* ' + show(payload.cirugiaReciente),
    '*Medicamentos:* ' + show(payload.medicamentosActuales),
    '*Exámenes:* ' + show(payload.examenesRealizados),
    '',
    '--------------------------------',
    '*5. Movilidad, dolor y tolerancia*',
    '*Nivel de movilidad:* ' + show(payload.nivelMovilidad),
    '*Puede hacer:* ' + show(payload.funcion),
    '*Le cuesta:* ' + show(payload.dificultades),
    '*Caídas/tropiezos:* ' + show(payload.frecuenciaCaidas),
    '*Ayudas:* ' + show(payload.ayudasAsistencia),
    '*Dolor percibido:* ' + show(payload.dolorPercibido),
    '*Energía / fatiga:* ' + show(payload.energiaActual) + ' / ' + show(payload.fatiga),
    '',
    '--------------------------------',
    '*6. Entorno, ánimo y motivadores*',
    '*Vivienda / pisos:* ' + show(payload.tipoVivienda) + ' / ' + show(payload.tipoPiso),
    '*Escaleras:* ' + show(payload.escaleras),
    '*Paseos:* ' + show(payload.rutinaPaseos),
    '*Adaptaciones:* ' + show(payload.adaptacionesCasa),
    '*Ánimo:* ' + show(payload.estadoAnimo),
    '*Miedos/reactividad:* ' + show(payload.miedosReactividad),
    '*Motivadores:* ' + show(payload.motivadores),
    '',
    '--------------------------------',
    '*7. Videos y objetivo*',
    '*Videos:* ' + show(payload.videos),
    '*Enlaces confirmados como accesibles:* Sí',
    '*Objetivo principal:* ' + show(payload.objetivoPrincipal),
    '*Comentario adicional:* ' + show(payload.comentarioAdicional),
    '',
    '--------------------------------',
    '*8. Confirmación y estado inicial*',
    'El tutor confirma que la información es correcta, autoriza su tratamiento para revisar el caso y contactarlo, y entiende que esta orientación online no reemplaza una consulta, diagnóstico ni tratamiento médico-veterinario.',
    '*Versión del consentimiento:* ' + INTAKE_CONSENT_VERSION,
    '*Estado:* ' + triageLabel((intakeResult && intakeResult.triageStatus) || payload.triageStatus),
    ...(payload.hasRedFlags ? ['*Alerta veterinaria:* Sí'] : []),
    '*Siguiente acción:* Revisar antecedentes y videos',
    '*Plazo de valoración inicial:* Hasta 5 días hábiles',
    '*Costo de esta valoración:* Gratuito'
  ].join('\n');
}

function initIntakeForm() {
  const form = document.getElementById('intake-form');
  const message = document.getElementById('form-message');
  const progress = document.getElementById('form-progress-bar');
  if (!form || !message) return;

  let started = false;
  let completed = false;
  let abandonmentTracked = false;
  let highestProgressMilestone = 0;
  const submitButton = form.querySelector('button[type="submit"]');
  const diagnosisSelect = form.elements.diagnosticoPrevio;
  const diagnosisNotice = document.getElementById('diagnostico-previo-aviso');
  const diagnosisDetailWrapper = document.getElementById('diagnostico-detalle-wrapper');
  const redFlagVetFollowup = document.getElementById('red-flag-vet-followup');
  const regionSelect = form.elements.region;
  const communeSelect = form.elements.comuna;
  const requiredGroups = Array.from(form.querySelectorAll('[data-required-group]'));
  const requiredControls = Array.from(form.querySelectorAll('[required]')).filter(function (control) {
    return control.type !== 'checkbox';
  });
  const formStepFieldsets = Array.from(form.querySelectorAll('fieldset'));
  const formStepNames = [
    'tutor',
    'perro',
    'motivo_consulta',
    'senales_alerta',
    'antecedentes_veterinarios',
    'movilidad_actual',
    'dolor_energia',
    'entorno_rutina',
    'animo_conducta',
    'videos',
    'objetivo_consentimiento'
  ];

  function initFormStepTracking() {
    if (!('IntersectionObserver' in window) || !formStepFieldsets.length) return;
    const viewedSteps = new Set();
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const index = formStepFieldsets.indexOf(entry.target);
        const formStep = formStepNames[index] || 'paso_' + String(index + 1);
        if (viewedSteps.has(formStep)) return;
        viewedSteps.add(formStep);
        track('form_step_view', {
          event_category: 'form',
          form_step: formStep
        });
      });
    }, { threshold: 0.45, rootMargin: '0px 0px -10% 0px' });

    formStepFieldsets.forEach(function (fieldset) {
      observer.observe(fieldset);
    });
  }

  function initLocations() {
    const locations = window.CHILE_REGIONS_AND_COMMUNES || {};
    if (!regionSelect || !communeSelect) return;

    Object.keys(locations).forEach(function (region) {
      regionSelect.add(new Option(region, region));
    });

    function updateCommunes() {
      const communes = locations[regionSelect.value] || [];
      communeSelect.innerHTML = '';
      communeSelect.add(new Option(
        communes.length ? 'Selecciona tu comuna' : 'Primero selecciona una región',
        ''
      ));
      communes.forEach(function (commune) {
        communeSelect.add(new Option(commune, commune));
      });
      communeSelect.disabled = !communes.length;
    }

    regionSelect.addEventListener('change', updateCommunes);
    updateCommunes();
  }

  function updateDiagnosisNotice() {
    if (!diagnosisSelect || !diagnosisNotice) return;
    const lacksConfirmedDiagnosis = ['No', 'Está en estudio', 'No sé'].includes(diagnosisSelect.value);
    diagnosisNotice.hidden = !lacksConfirmedDiagnosis;
    if (diagnosisDetailWrapper) {
      diagnosisDetailWrapper.hidden = diagnosisSelect.value !== 'Sí';
    }
  }

  function updateRedFlagFollowup() {
    const hasAlerts = hasRealRedFlags(selectedValues(form, 'redFlag'));
    if (!redFlagVetFollowup) return;
    redFlagVetFollowup.hidden = !hasAlerts;
    form.elements.consultaVetRedFlags.required = hasAlerts;
    if (!hasAlerts) form.elements.consultaVetRedFlags.value = '';
  }

  function groupIsAnswered(group) {
    return group.querySelectorAll('input[type="checkbox"]:checked').length > 0;
  }

  function findInvalidRequiredGroup() {
    return requiredGroups.find(function (group) {
      return !groupIsAnswered(group);
    });
  }

  function updateProgress() {
    const completedControls = requiredControls.filter(function (control) {
      return control.value && control.value.trim();
    }).length;
    const completedGroups = requiredGroups.filter(groupIsAnswered).length;
    const requiredChecks = [form.elements.videosAccesibles, form.elements.consentimiento];
    const completedChecks = requiredChecks.filter(function (control) { return control.checked; }).length;
    const total = requiredControls.length + requiredGroups.length + requiredChecks.length;
    const percent = Math.min(100, Math.round(((completedControls + completedGroups + completedChecks) / total) * 100));
    if (progress) progress.style.width = percent + '%';

    [25, 50, 75].forEach(function (milestone) {
      if (percent >= milestone && highestProgressMilestone < milestone) {
        highestProgressMilestone = milestone;
        track('intake_progress', { percent_complete: milestone });
      }
    });
  }

  form.addEventListener('input', function (event) {
    if (!started) {
      started = true;
      track('intake_started');
    }
    if (event.target.matches('[aria-invalid="true"]')) event.target.removeAttribute('aria-invalid');
    const group = event.target.closest('[data-required-group]');
    if (group) group.removeAttribute('aria-invalid');
    message.hidden = true;
    updateProgress();
  });

  if (diagnosisSelect) {
    diagnosisSelect.addEventListener('change', updateDiagnosisNotice);
    updateDiagnosisNotice();
  }

  const noneOption = form.querySelector('[data-none-option]');
  const redFlagInputs = Array.from(form.querySelectorAll('input[name="redFlag"]'));
  redFlagInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      if (input === noneOption && input.checked) {
        redFlagInputs.forEach(function (other) {
          if (other !== noneOption) other.checked = false;
        });
      } else if (input !== noneOption && input.checked && noneOption) {
        noneOption.checked = false;
      }
      updateRedFlagFollowup();
      updateProgress();
    });
  });

  initLocations();
  initFormStepTracking();
  updateRedFlagFollowup();
  updateProgress();

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    message.hidden = true;
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });

    requiredGroups.forEach(function (group) { group.removeAttribute('aria-invalid'); });
    const invalidFields = Array.from(form.querySelectorAll(':invalid'));
    const invalidGroup = findInvalidRequiredGroup();
    if (invalidFields.length || invalidGroup) {
      invalidFields.forEach(function (field) { field.setAttribute('aria-invalid', 'true'); });
      if (invalidGroup) invalidGroup.setAttribute('aria-invalid', 'true');
      setMessage(message, 'Revisa los campos obligatorios marcados antes de continuar.', false);
      const firstInvalid = invalidFields[0] || invalidGroup.querySelector('input');
      firstInvalid.focus();
      track('intake_validation_error', {
        invalid_fields: invalidFields.length + (invalidGroup ? 1 : 0)
      });
      return;
    }

    const redFlags = selectedValues(form, 'redFlag').filter(function (value) {
      return value !== 'Ninguna de las anteriores';
    });

    if (redFlags.length) {
      track('red_flag_detected', { has_red_flags: true });
    }

    const payload = buildIntakePayload(form);
    let intakeResult;

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando solicitud…';
      }
      intakeResult = await submitIntake(payload);
      track('intake_saved', {
        has_red_flags: payload.hasRedFlags,
        triage_status: payload.triageStatus
      });
    } catch (error) {
      if (redFlags.length) {
        setMessage(
          message,
          'No pudimos registrar la solicitud. Aun así, marcaste una o más señales de alerta: contacta a un médico veterinario lo antes posible y no esperes nuestra respuesta. Si los signos son intensos, repentinos o empeoran, acude a urgencias.',
          false,
          true
        );
      } else {
        setMessage(message, 'No pudimos registrar la solicitud. Revisa que el servicio esté disponible e inténtalo nuevamente.', false);
      }
      track('intake_api_error', {
        error_type: 'api_request_failed',
        has_red_flags: payload.hasRedFlags,
        triage_status: payload.triageStatus
      });
      return;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar solicitud por WhatsApp';
      }
    }

    const whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWhatsAppMessage(form, intakeResult));
    if (redFlags.length) {
      setMessage(
        message,
        'Recibimos tu solicitud y evaluaremos los antecedentes enviados. Como marcaste una o más señales de alerta, te recomendamos contactar a un médico veterinario lo antes posible. Si los síntomas son intensos, repentinos o empeoran, acude a un servicio de urgencias. No esperes nuestra respuesta para consultar.',
        false,
        true
      );
    } else {
      setMessage(message, 'Tu solicitud gratuita fue registrada. Se abrirá WhatsApp para que revises y envíes el resumen.', true);
    }
    completed = true;
    track('intake_completed', {
      form_completed: true,
      has_red_flags: payload.hasRedFlags,
      triage_status: payload.triageStatus
    });
    track('whatsapp_opened', {
      event_category: 'conversion',
      has_red_flags: payload.hasRedFlags,
      triage_status: payload.triageStatus
    });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  window.addEventListener('pagehide', function () {
    if (started && !completed && !abandonmentTracked) {
      abandonmentTracked = true;
      track('intake_abandoned', {
        highest_progress_percent: highestProgressMilestone
      });
    }
  });
}

function init() {
  initCookieConsent();
  initMobileMenu();
  initHeader();
  initFadeIn();
  initFaq();
  initTracking();
  initScrollTracking();
  initWebVitalsTracking();
  initIntakeForm();
  const year = document.getElementById('footer-year');
  if (year) year.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

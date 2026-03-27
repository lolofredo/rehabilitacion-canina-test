/**
 * ================================================================
 * REHABILITACIÓN CANINA CHILE — main.js
 * ================================================================
 * Módulos:
 *  1. initMobileMenu   — Menú hamburguesa + overlay + accesibilidad
 *  2. initSmoothScroll — Scroll suave a anclas internas
 *  3. initHeaderScroll — Comportamiento sticky mejorado al hacer scroll
 *  4. initFadeIn       — Animaciones de entrada con IntersectionObserver
 *  5. initFooterYear   — Año dinámico en el footer
 *  6. init             — Punto de entrada principal
 *
 * Filosofía:
 *  - Vanilla JS, sin dependencias
 *  - Cada función es independiente y comentada
 *  - Fácil de extender o reemplazar módulos sin romper otros
 *  - Compatible con todos los navegadores modernos
 * ================================================================
 */

'use strict';

/* ================================================================
   1. MENÚ HAMBURGUESA
   Gestiona apertura/cierre del nav mobile con:
   - Animación CSS (controlada por clases)
   - aria-expanded para accesibilidad
   - Cierre al hacer clic en overlay
   - Cierre al hacer clic en un link nav
   - Cierre con tecla Escape
   - Lock del scroll del body cuando está abierto
   ================================================================ */

function initMobileMenu() {
  const toggle  = document.getElementById('nav-toggle');
  const nav     = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');

  // Si algún elemento no existe, salir sin errores (útil en multi-page)
  if (!toggle || !nav || !overlay) return;

  const OPEN_CLASS    = 'is-open';
  const VISIBLE_CLASS = 'is-visible';

  /**
   * Abre el menú mobile
   */
  function openMenu() {
    nav.classList.add(OPEN_CLASS);
    overlay.classList.add(VISIBLE_CLASS);
    overlay.removeAttribute('aria-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // evita scroll de fondo
  }

  /**
   * Cierra el menú mobile
   */
  function closeMenu() {
    nav.classList.remove(OPEN_CLASS);
    overlay.classList.remove(VISIBLE_CLASS);
    overlay.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /**
   * Toggle del menú
   */
  function toggleMenu() {
    const isOpen = nav.classList.contains(OPEN_CLASS);
    isOpen ? closeMenu() : openMenu();
  }

  // Evento: botón hamburguesa
  toggle.addEventListener('click', toggleMenu);

  // Evento: clic en overlay cierra el menú
  overlay.addEventListener('click', closeMenu);

  // Evento: tecla Escape cierra el menú
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains(OPEN_CLASS)) {
      closeMenu();
      toggle.focus(); // devolver foco al botón
    }
  });

  // Evento: clic en cualquier link del nav cierra el menú
  const navLinks = nav.querySelectorAll('.nav__link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (nav.classList.contains(OPEN_CLASS)) {
        closeMenu();
      }
    });
  });

  // En resize a desktop, forzar cierre limpio si quedó abierto
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  mediaQuery.addEventListener('change', function (e) {
    if (e.matches && nav.classList.contains(OPEN_CLASS)) {
      closeMenu();
    }
  });
}


/* ================================================================
   2. SCROLL SUAVE
   Maneja clicks en links tipo href="#seccion" para hacer scroll
   suave con compensación del header sticky.
   Nativo en CSS (scroll-behavior: smooth + scroll-padding-top),
   pero este JS permite control adicional y fallback.
   ================================================================ */

function initSmoothScroll() {
  // La mayoría del scroll suave lo maneja CSS (scroll-behavior: smooth)
  // Este módulo solo garantiza que el header no tape el destino en browsers
  // que no respetan scroll-padding-top correctamente.

  document.addEventListener('click', function (e) {
    // Buscar el link más cercano con href interno
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    // El scroll-padding-top en CSS ya debería manejarlo,
    // pero aquí aseguramos un fallback manual si fuera necesario.
    // Actualmente este evento no previene el default, deja que CSS actúe.
    // Si se necesitara control manual, descomentar lo siguiente:
    /*
    e.preventDefault();
    const headerHeight = document.getElementById('site-header')?.offsetHeight || 0;
    const announcementHeight = document.querySelector('.announcement-bar')?.offsetHeight || 0;
    const offset = headerHeight + announcementHeight;
    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
    */
  });
}


/* ================================================================
   3. COMPORTAMIENTO DEL HEADER AL SCROLL
   Agrega una clase CSS al header cuando el usuario hace scroll,
   permitiendo cambiar sombra, tamaño o apariencia desde CSS.
   ================================================================ */

function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLLED_CLASS = 'is-scrolled';
  let ticking = false; // Optimización: evita llamar muchas veces por frame

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        // Considerar el announcement bar
        const threshold = 10;
        if (window.scrollY > threshold) {
          header.classList.add(SCROLLED_CLASS);
        } else {
          header.classList.remove(SCROLLED_CLASS);
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Aplicar estado inicial por si la página cargó con scroll
  onScroll();
}


/* ================================================================
   4. ANIMACIONES FADE-IN CON INTERSECTIONOBSERVER
   Observa elementos con clase .fade-in y les agrega .is-visible
   cuando entran en el viewport.
   Si el navegador no soporta IntersectionObserver, los muestra directamente.
   ================================================================ */

function initFadeIn() {
  // Si el usuario prefiere reducir movimiento, salir
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Seleccionar todos los elementos animables
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  // Si no soporta IntersectionObserver o prefiere no animación, mostrar todo
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // dejar de observar una vez visible
        }
      });
    },
    {
      threshold: 0.1,    // 10% del elemento visible
      rootMargin: '0px 0px -40px 0px', // trigger un poco antes del borde inferior
    }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
}


/* ================================================================
   5. AÑO DINÁMICO EN EL FOOTER
   Actualiza automáticamente el año de copyright.
   ================================================================ */

function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}



/* ================================================================
   6. FAQ — ACORDEÓN ACCESIBLE
   ================================================================ */

function initFaq() {
  const faqList = document.getElementById('faq-list');
  if (!faqList) return;

  const questions = faqList.querySelectorAll('.faq-question');
  if (!questions.length) return;

  function closeAll() {
    questions.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      const answerId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);
      const item = btn.closest('.faq-item');
      if (answer) answer.hidden = true;
      if (item) item.classList.remove('is-active');
    });
  }

  questions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);
      const item = btn.closest('.faq-item');

      closeAll();

      if (!isOpen && answer) {
        btn.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
        if (item) item.classList.add('is-active');
      }
    });
  });
}

/* ================================================================
   7. INIT — PUNTO DE ENTRADA
   Se ejecuta cuando el DOM está listo.
   ================================================================ */

function init() {
  initMobileMenu();
  initSmoothScroll();
  initHeaderScroll();
  initFadeIn();
  initFooterYear();
  initFaq();
}

// Ejecutar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Si el script se carga con defer o el DOM ya está listo
  init();
}


/* ================================================================
   EXTENSIÓN FUTURA — CÓMO AGREGAR NUEVOS MÓDULOS
   ================================================================
   Para agregar tracking, agenda u otros comportamientos:

   1. Crea una función nueva: function initNombre() { ... }
   2. Llámala dentro de init()
   3. Si es muy grande, considera moverla a modules/nombre.js
      y cargarla como <script src="modules/nombre.js" defer>

   Ejemplo futuro — Tracking GTM de eventos:
   function initTracking() {
     document.querySelectorAll('[data-track]').forEach(function(el) {
       el.addEventListener('click', function() {
         const event = el.getAttribute('data-track');
         if (window.dataLayer) {
           window.dataLayer.push({ event: event });
         }
       });
     });
   }

   Ejemplo futuro — Calendly:
   function initCalendly() {
     // Cargar script de Calendly solo cuando el usuario llega a #agenda
     const agendaSection = document.getElementById('agenda');
     if (!agendaSection) return;
     const observer = new IntersectionObserver(function(entries) {
       if (entries[0].isIntersecting) {
         const script = document.createElement('script');
         script.src = 'https://assets.calendly.com/assets/external/widget.js';
         document.head.appendChild(script);
         observer.disconnect();
       }
     });
     observer.observe(agendaSection);
   }
   ================================================================ */

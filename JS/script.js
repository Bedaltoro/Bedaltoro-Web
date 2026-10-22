(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  const photo = (seed, w, h) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

  const hash = str => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

  const fallback = (seed, w, h) => {
    const hue = hash(seed) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue} 45% 32%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 50% 14%)"/>
      </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  document.addEventListener('error', e => {
    const el = e.target;
    if (!(el instanceof HTMLImageElement) || el.dataset.fb) return;
    el.dataset.fb = '1';
    el.src = fallback(el.currentSrc || el.alt || 'x', +el.dataset.w || 600, +el.dataset.h || 1300);
  }, true);

  const appIcon = (name, accent) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#15151a"/></linearGradient></defs>
      <rect width="120" height="120" fill="url(#g)"/>
      <text x="60" y="78" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${name[0]}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  const loader = $('#loader');
  const minDelay = new Promise(r => setTimeout(r, 2400));
  const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const cap = new Promise(r => setTimeout(r, 6000));

  Promise.race([Promise.all([minDelay, loaded]), cap]).then(() => {
    loader.classList.add('done');
    root.classList.add('ready');
    setTimeout(() => loader.remove(), 900);
  });

  const nav = $('#nav');
  const burger = $('#burger');
  const sheet = $('#sheet');

  const onScroll = () => nav.classList.toggle('nav-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = open => {
    nav.classList.toggle('nav-open', open);
    sheet.classList.toggle('open', open);
    document.body.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  $$('a', sheet).forEach(a => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width: 921px)').addEventListener('change', e => e.matches && setMenu(false));

  const track = $('#track');
  const viewport = $('#viewport');


  const isNative = () => matchMedia('(hover:none),(pointer:coarse),(max-width:640px)').matches;
  const gap = 22;
  let x = 0, minX = 0;

  const measure = () => { minX = Math.min(0, viewport.clientWidth - track.scrollWidth + gap); };
  const setX = (v, animate) => {
    x = Math.max(minX, Math.min(0, v));
    track.style.transition = animate ? 'transform .6s var(--ease)' : 'none';
    track.style.transform = `translateX(${x}px)`;
  };

  let dragging = false, moved = false, startX = 0, originX = 0;

  track.addEventListener('pointerdown', e => {
    if (isNative() || e.button !== 0) return;
    dragging = true; moved = false; startX = e.clientX; originX = x; measure();
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;
    if (moved) setX(originX + dx, false);
  });
  addEventListener('pointerup', () => { dragging = false; setTimeout(() => { moved = false; }, 0); });
  addEventListener('pointercancel', () => { dragging = false; });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  const cardStep = () => ($('.work-card', track).offsetWidth || 400) + gap;
  const slide = dir => {
    if (isNative()) viewport.scrollBy({ left: dir * cardStep(), behavior: 'smooth' });
    else { measure(); setX(x - dir * cardStep(), true); }
  };
  $('#prev').addEventListener('click', () => slide(-1));
  $('#next').addEventListener('click', () => slide(1));

  addEventListener('resize', () => { measure(); if (!isNative()) setX(x, false); else track.style.transform = ''; });

  const modal = $('#modal');
  const strip = $('#strip');
  let lastFocus = null;

  const openModal = i => {
    const card = $$('.work-card', track)[i];
    if (!card) return;
    const detail = $('.work-card-detail', card);
    const name = $('h3', card).textContent;
    lastFocus = document.activeElement;
    const icon = $('#modal-icon');
    icon.removeAttribute('data-fb');
    icon.dataset.w = icon.dataset.h = '120';
    icon.src = $('.work-card-icon', card).getAttribute('src');
    icon.alt = name;
    $('#modal-title').textContent = name;
    $('#modal-tag').textContent = $('.work-card-tag', card).textContent;
    $('#modal-desc').textContent = $('.work-card-desc', card).textContent;
    $('#modal-role').textContent = detail?.dataset.role || '';
    const store = $('#modal-store');
    const url = detail?.dataset.store || '';
    store.hidden = !url;                 // hidden until a store link is set
    if (url) store.href = url;
    strip.innerHTML = '';
    detail?.content.querySelectorAll('img').forEach(img => strip.appendChild(img.cloneNode(true)));
    strip.scrollLeft = 0;
    modal.hidden = false;
    document.body.classList.add('lock');
    $('#modal-close').focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('lock');
    if (lastFocus) lastFocus.focus();
  };

  track.addEventListener('click', e => {
    const btn = e.target.closest('.work-card-btn');
    if (!btn) return;
    openModal($$('.work-card', track).indexOf(btn.closest('.work-card')));
  });
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('a[href], button', modal).filter(el => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const stripStep = () => Math.max(240, strip.clientWidth * 0.6);
  $('#strip-prev').addEventListener('click', () => strip.scrollBy({ left: -stripStep(), behavior: 'smooth' }));
  $('#strip-next').addEventListener('click', () => strip.scrollBy({ left: stripStep(), behavior: 'smooth' }));

  let sDown = false, sStart = 0, sLeft = 0;
  strip.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    sDown = true; sStart = e.clientX; sLeft = strip.scrollLeft;
  });
  addEventListener('pointermove', e => { if (sDown) strip.scrollLeft = sLeft - (e.clientX - sStart); });
  addEventListener('pointerup', () => { sDown = false; });

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  const dict = {
    en: {
      nav_work: 'Work', nav_services: 'Services', nav_about: 'About', nav_contact: 'Contact', nav_cta: "Contact us",
      hero_eyebrow: 'Bedaltoro Studio | Mobile development',
      hero_title: 'Apps and designs <br><span class="hero-title-dim">people love to use.</span>',
      hero_sub: 'We design and build mobile apps — from first sketch to launch.',
      hero_cta1: 'Check out out work', hero_cta2: 'Get in touch',
      stat1: 'Apps shipped', stat2: 'Years of experience', stat3: 'Happy clients',
      work_eyebrow: 'Selected work', work_title: 'Mobile apps',
      work_intro: "A few of the apps We've designed and built. Open any card for more screenshots and details.",
      hint_drag: 'Drag to explore', hint_swipe: 'Swipe to explore',
      modal_role: 'Our role', modal_store: 'View in store ↗',
      svc_eyebrow: 'Services', svc_title: 'What We can do for you',
      svc_intro: 'Three people from idea to launch — fewer handoffs, faster decisions, and a product that feels consistent.',
      about_eyebrow: 'About', about_title: "Hi, We are Bedaltoro,",
      about_p1: "developers, who cares about how things feel in your hand. We started out building small utilities for friends and ended up shipping apps used by tens of thousands of people.",
      about_p2: 'We work with startups and small teams, usually as the peaople who turns a rough idea into something people can download and use.',
      about_cv: 'Download CV',
      contact_eyebrow: 'Contact', contact_title: "Let's build something great.",
      contact_intro: "Tell us a little about your project and We'll reply within two working days.",
      f_name: 'Name', f_email: 'Email', f_msg: 'Tell me about your project', f_legend: "I'm interested in",
      c1: 'Mobile app', c2: 'Website', c3: 'Design', c4: 'Something else',
      send: 'Send message', sending: 'Opening your email app…',
      err: 'Please add your name, a valid email and a message of at least 10 characters.',
      footer_tagline: 'Mobile apps, crafted with care.', footer_loc: 'Working worldwide'
    },
    sk: {
      nav_work: 'Práca', nav_services: 'Služby', nav_about: 'O nás', nav_contact: 'Kontakt', nav_cta: 'Kontaktujte nás',
      hero_eyebrow: 'Bedaltoro Studio | Vývoj mobilných aplikácií',
      hero_title: 'Aplikácie a dizajny,<br><span class="hero-title-dim">ktoré ľudia milujú.</span>',
      hero_sub: 'Navrhujeme a programujeme mobilné aplikácie — od prvého náčrtu až po spustenie.',
      hero_cta1: 'Pozrite si našu prácu', hero_cta2: 'Napíšte nám',
      stat1: 'Spustených aplikácií', stat2: 'Rokov skúseností', stat3: 'Spokojných klientov',
      work_eyebrow: 'Vybraná práca', work_title: 'Mobilné aplikácie',
      work_intro: 'Niekoľko aplikácií, ktoré sme navrhli a vytvorili. Otvorte ľubovoľnú kartu pre snímky obrazovky a detaily.',
      hint_drag: 'Potiahnite pre prehliadanie', hint_swipe: 'Potiahnite prstom',
      modal_role: 'Naša úloha', modal_store: 'Zobraziť v obchode ↗',
      svc_eyebrow: 'Služby', svc_title: 'Čo pre vás môžeme urobiť',
      svc_intro: 'Jeden človek od nápadu po spustenie — menej odovzdávania, rýchlejšie rozhodnutia a konzistentný produkt.',
      about_eyebrow: 'O nás', about_title: 'Ahoj, sme Bedaltoro',
      about_p1: 'Sme vývojári, ktorým záleží na tom, aký pocit z produktu máte v ruke. Začínali sme malými nástrojmi pre kamarátov a skončili pri aplikáciách, ktoré používajú desaťtisíce ľudí.',
      about_p2: 'Pracujeme so startupmi a malými tímami, väčšinou ako ľudia, ktorí z hrubého nápadu urobia niečo, čo si ľudia môžu stiahnuť a používať.',
      contact_eyebrow: 'Kontakt', contact_title: 'Poďme vytvoriť niečo skvelé.',
      contact_intro: 'Povedzte nám niečo o svojom projekte a odpovieme do dvoch pracovných dní.',
      f_name: 'Meno', f_email: 'E-mail', f_msg: 'Povedzte nám o svojom projekte', f_legend: 'Mám záujem o',
      c1: 'Mobilnú aplikáciu', c3: 'Dizajn', c4: 'Niečo iné',
      send: 'Odoslať správu', sending: 'Otváram e-mailovú aplikáciu…',
      err: 'Zadajte meno, platný e-mail a správu s aspoň 10 znakmi.',
      footer_tagline: 'Mobilné aplikácie vytvorené s láskou k detailu.', footer_loc: 'Pracujeme celosvetovo'
    }
  };

  const hint = $('#hint');
  let lang = 'en';
  try { lang = localStorage.getItem('lang') || 'en'; } catch (_) {}
  if (!dict[lang]) lang = 'en';

  const t = key => dict[lang][key] ?? dict.en[key] ?? '';

  const applyLang = l => {
    lang = l;
    root.lang = l;
    hint.dataset.i18n = isNative() ? 'hint_swipe' : 'hint_drag';
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('.nav-lang button').forEach(b => {
      const on = b.dataset.lang === l;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem('lang', l); } catch (_) {}
  };

  $$('.nav-lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  applyLang(lang);
  measure();

  const form = $('#form');
  const chips = $('#chips');
  const errorEl = $('#error');
  const sendBtn = $('#send');
  let topic = 'Mobile app';

  chips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', chips).forEach(c => {
      c.classList.remove('chip-on');
      c.setAttribute('aria-pressed', 'false');
      $('.chip-bg', c)?.remove();
    });
    chip.classList.add('chip-on');
    chip.setAttribute('aria-pressed', 'true');
    chip.insertAdjacentHTML('afterbegin', '<span class="chip-bg"></span>');
    topic = chip.dataset.value;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorEl.textContent = '';
    const data = new FormData(form);
    if (data.get('company')) return; 

    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const valid = name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.length >= 10;
    if (!valid) { errorEl.textContent = t('err'); return; }
    const subject = `New project enquiry: ${topic}`;
    const body = `${message}\n\n— ${name} (${email})`;
    sendBtn.disabled = true;
    sendBtn.textContent = t('sending');
    location.href = `mailto:bedaltoro@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => { sendBtn.disabled = false; sendBtn.textContent = t('send'); }, 3000);
  });
})();
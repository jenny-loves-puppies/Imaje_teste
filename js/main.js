/* ==========================================================================
   IMAJE — main.js
   Componentes globais: header, menu, toasts, reveal, newsletter, cards.
   ========================================================================== */

/* --------------------------- Toast --------------------------- */
function toast(message, type = 'ok') {
  let zone = document.getElementById('toast-zone');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'toast-zone';
    document.body.appendChild(zone);
  }
  const icons = { ok: '✅', warn: '⚠️', err: '❌', info: '💡' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.setAttribute('role', 'status');
  const ic = document.createElement('span');
  ic.textContent = icons[type] || '💬';
  const tx = document.createElement('span');
  tx.textContent = message;
  el.append(ic, tx);
  zone.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(110%)';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* --------------------------- Menu mobile --------------------------- */
function initMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }));
}

/* --------------------------- Reveal on scroll --------------------------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(e => obs.observe(e));
}

/* --------------------------- Card de produto --------------------------- */
function buildProductCard(p) {
  const card = document.createElement('article');
  card.className = 'product-card reveal visible';

  /* Mídia */
  const media = document.createElement('a');
  media.href = 'produto.html?id=' + encodeURIComponent(p.id);
  media.className = 'product-media ' + (p.image ? '' : slugPlaceholder(p));
  media.setAttribute('aria-label', 'Ver detalhes de ' + p.name);

  if (p.image) {
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.name;
    img.loading = 'lazy';
    media.appendChild(img);
  } else {
    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.textContent = p.emoji || '🎁';
    media.appendChild(ph);
  }

  if (p.badge) {
    const b = document.createElement('span');
    const tone = /promo|oferta/i.test(p.badge) ? '' :
                 /3d|kit/i.test(p.badge) ? ' b-cyan' :
                 /novo/i.test(p.badge) ? ' b-yellow' : ' b-dark';
    b.className = 'badge' + tone;
    b.textContent = p.badge;
    media.appendChild(b);
  }

  const techs = Array.isArray(p.techniques) ? p.techniques : [];
  if (techs.length) {
    const tt = document.createElement('div');
    tt.className = 'tech-tags';
    techs.slice(0, 2).forEach(t => {
      const s = document.createElement('span');
      s.className = 'tech-tag';
      s.textContent = t;
      tt.appendChild(s);
    });
    media.appendChild(tt);
  }

  /* Corpo */
  const body = document.createElement('div');
  body.className = 'product-body';

  const cat = document.createElement('span');
  cat.className = 'product-cat';
  cat.textContent = p.category || '';

  const h3 = document.createElement('h3');
  const link = document.createElement('a');
  link.href = 'produto.html?id=' + encodeURIComponent(p.id);
  link.textContent = p.name;
  h3.appendChild(link);

  const desc = document.createElement('p');
  desc.className = 'product-desc';
  desc.textContent = p.short_desc || '';

  const foot = document.createElement('div');
  foot.className = 'product-foot';

  const priceWrap = document.createElement('div');
  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = Number(p.price) > 0 ? money(p.price) : 'Sob orçamento';
  if (p.old_price && Number(p.old_price) > Number(p.price)) {
    const old = document.createElement('small');
    old.textContent = money(p.old_price);
    price.prepend(old);
  }
  const stock = document.createElement('div');
  const st = Number(p.stock);
  stock.className = 'stock-info' + (st <= 0 ? ' out' : st <= 10 ? ' low' : '');
  stock.textContent = st <= 0 ? 'Esgotado' : st <= 10 ? 'Últimas ' + st + ' un.' : st + ' em estoque';
  priceWrap.append(price, stock);

  const btn = document.createElement('button');
  btn.className = 'btn btn-pink btn-sm';
  btn.type = 'button';
  if (st <= 0) {
    btn.disabled = true;
    btn.textContent = 'Esgotado';
  } else if (Number(p.price) <= 0) {
    btn.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Orçar';
    btn.addEventListener('click', () => {
      window.open('https://wa.me/' + IMAJE.whatsapp + '?text=' +
        encodeURIComponent('Olá! Quero um orçamento para: ' + p.name), '_blank');
    });
  } else {
    btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i>';
    btn.title = 'Adicionar ao carrinho';
    btn.setAttribute('aria-label', 'Adicionar ' + p.name + ' ao carrinho');
    btn.addEventListener('click', () => {
      Cart.add(p, 1, {});
      toast(p.name + ' foi para o carrinho!', 'ok');
    });
  }

  foot.append(priceWrap, btn);
  body.append(cat, h3, desc, foot);
  card.append(media, body);
  return card;
}

function renderProducts(container, products) {
  container.innerHTML = '';
  if (!products.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="e-ic">🔍</div><h3>Nenhum produto encontrado</h3>' +
      '<p>Tente outro termo de busca ou remova alguns filtros.</p>';
    container.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  products.forEach(p => frag.appendChild(buildProductCard(p)));
  container.appendChild(frag);
}

/* --------------------------- Newsletter --------------------------- */
function initNewsletter() {
  document.querySelectorAll('[data-newsletter]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type=email]');
      const msg = form.parentElement.querySelector('.news-msg');
      const email = (input.value || '').trim();
      if (!email) { if (msg) msg.textContent = 'Digite um e-mail para continuar 😉'; return; }
      try {
        await fetch('tables/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: location.pathname }),
        });
      } catch (err) { console.warn('[Imaje] newsletter offline', err); }
      if (msg) msg.textContent = '🎉 Pronto! Você vai receber nossas novidades.';
      input.value = '';
      toast('Inscrição confirmada!', 'ok');
    });
  });
}

/* --------------------------- FAQ --------------------------- */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* --------------------------- Ano no rodapé + contatos --------------------------- */
function initFooterDynamics() {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-wa-link]').forEach(a => {
    a.href = 'https://wa.me/' + IMAJE.whatsapp;
  });
}

/* --------------------------- Boot --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Cart.refreshBadge();
  initMenu();
  initReveal();
  initNewsletter();
  initFaq();
  initFooterDynamics();
});

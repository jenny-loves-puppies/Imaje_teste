/* ==========================================================================
   IMAJE — product.js  (detalhe do produto)
   ========================================================================== */

/** Converte "Tamanho:P,M,G|Nome:" em [{label, values:[...]}, ...] */
function parseOptions(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split('|').map(part => {
    const [label, vals] = part.split(':');
    if (!label) return null;
    const values = (vals || '').split(',').map(v => v.trim()).filter(Boolean);
    return { label: label.trim(), values };
  }).filter(Boolean);
}

function buildDetail(p) {
  const root = document.getElementById('pd-root');
  root.innerHTML = '';

  document.title = p.name + ' — Imaje';

  /* Breadcrumb */
  const bc = document.getElementById('pd-breadcrumb');
  bc.innerHTML = '';
  const a1 = document.createElement('a'); a1.href = 'index.html'; a1.textContent = 'Início';
  const s1 = document.createElement('span'); s1.textContent = '/';
  const a2 = document.createElement('a'); a2.href = 'produtos.html'; a2.textContent = 'Catálogo';
  const s2 = document.createElement('span'); s2.textContent = '/';
  const a3 = document.createElement('a');
  a3.href = 'produtos.html?cat=' + encodeURIComponent(p.category); a3.textContent = p.category;
  const s3 = document.createElement('span'); s3.textContent = '/';
  const cur = document.createElement('span'); cur.textContent = p.name;
  bc.append(a1, s1, a2, s2, a3, s3, cur);

  /* Layout */
  const layout = document.createElement('div');
  layout.className = 'pd-layout';

  /* --- Mídia --- */
  const media = document.createElement('figure');
  media.className = 'pd-media ' + (p.image ? '' : slugPlaceholder(p));
  if (p.image) {
    const img = document.createElement('img');
    img.src = p.image; img.alt = p.name;
    media.appendChild(img);
  } else {
    const ph = document.createElement('span');
    ph.className = 'ph'; ph.textContent = p.emoji || '🎁';
    media.appendChild(ph);
  }
  if (p.badge) {
    const b = document.createElement('span');
    b.className = 'badge'; b.textContent = p.badge;
    media.appendChild(b);
  }

  /* --- Info --- */
  const info = document.createElement('div');
  info.className = 'pd-info';

  const cat = document.createElement('span');
  cat.className = 'product-cat';
  cat.textContent = p.category;

  const h1 = document.createElement('h1');
  h1.textContent = p.name;

  const meta = document.createElement('div');
  meta.className = 'pd-meta';
  (Array.isArray(p.techniques) ? p.techniques : []).forEach(t => {
    const s = document.createElement('span');
    s.className = 'tech-tag';
    s.style.padding = '.35rem .8rem';
    s.textContent = t;
    meta.appendChild(s);
  });
  const stockTag = document.createElement('span');
  const st = Number(p.stock);
  stockTag.className = 'tech-tag';
  stockTag.style.padding = '.35rem .8rem';
  stockTag.textContent = st <= 0 ? '❌ Esgotado' : st <= 10 ? '⚠️ Últimas ' + st + ' unidades' : '✅ ' + st + ' em estoque';
  meta.appendChild(stockTag);

  const price = document.createElement('div');
  price.className = 'pd-price';
  price.textContent = Number(p.price) > 0 ? money(p.price) : 'Sob orçamento';
  if (p.old_price && Number(p.old_price) > Number(p.price)) {
    const old = document.createElement('small');
    old.textContent = money(p.old_price);
    price.appendChild(old);
  }

  const desc = document.createElement('p');
  desc.className = 'pd-desc';
  desc.textContent = p.description || p.short_desc || '';

  info.append(cat, h1, meta, price, desc);

  /* --- Opções de personalização --- */
  const optDefs = parseOptions(p.options);
  const optInputs = [];
  if (optDefs.length) {
    const optTitle = document.createElement('h3');
    optTitle.style.fontSize = '1.05rem';
    optTitle.style.marginBottom = '.9rem';
    optTitle.textContent = '✨ Personalize do seu jeito';
    info.appendChild(optTitle);

    optDefs.forEach((o, idx) => {
      const field = document.createElement('div');
      field.className = 'opt-field';
      const lbl = document.createElement('label');
      const inputId = 'opt-' + idx;
      lbl.setAttribute('for', inputId);
      lbl.textContent = o.label;
      let input;
      if (o.values.length) {
        input = document.createElement('select');
        o.values.forEach(v => {
          const op = document.createElement('option');
          op.value = v; op.textContent = v;
          input.appendChild(op);
        });
      } else {
        input = document.createElement('textarea');
        input.placeholder = 'Escreva aqui o que você imaginou…';
      }
      input.id = inputId;
      field.append(lbl, input);
      info.appendChild(field);
      optInputs.push({ label: o.label, el: input });
    });
  }

  /* --- Quantidade + ação --- */
  const isQuote = Number(p.price) <= 0;
  const outOfStock = st <= 0;

  const qtyRow = document.createElement('div');
  qtyRow.className = 'qty-row';

  const qtyCtrl = document.createElement('div');
  qtyCtrl.className = 'qty-control';
  const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−';
  minus.setAttribute('aria-label', 'Diminuir quantidade');
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number'; qtyInput.value = '1'; qtyInput.min = '1';
  qtyInput.setAttribute('aria-label', 'Quantidade');
  const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+';
  plus.setAttribute('aria-label', 'Aumentar quantidade');
  minus.addEventListener('click', () => { qtyInput.value = Math.max(1, Number(qtyInput.value) - 1); });
  plus.addEventListener('click', () => { qtyInput.value = Number(qtyInput.value) + 1; });
  qtyCtrl.append(minus, qtyInput, plus);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-pink btn-lg';
  addBtn.style.flex = '1';
  addBtn.style.minWidth = '210px';

  const collectOptions = () => {
    const chosen = {};
    optInputs.forEach(o => {
      const v = (o.el.value || '').trim();
      if (v) chosen[o.label] = v;
    });
    return chosen;
  };

  if (outOfStock) {
    addBtn.disabled = true;
    addBtn.textContent = 'Produto esgotado';
    qtyRow.append(addBtn);
  } else if (isQuote) {
    addBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Pedir orçamento';
    addBtn.addEventListener('click', () => {
      const opts = collectOptions();
      const detail = Object.entries(opts).map(([k, v]) => k + ' ' + v).join(' | ');
      const msg = 'Olá! Quero um orçamento para: ' + p.name + (detail ? '\n' + detail : '');
      window.open('https://wa.me/' + IMAJE.whatsapp + '?text=' + encodeURIComponent(msg), '_blank');
    });
    qtyRow.append(addBtn);
  } else {
    addBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho';
    addBtn.addEventListener('click', () => {
      Cart.add(p, Math.max(1, Number(qtyInput.value) || 1), collectOptions());
      toast('Adicionado ao carrinho! 🎉', 'ok');
    });
    qtyRow.append(qtyCtrl, addBtn);
  }
  info.appendChild(qtyRow);

  /* Ações secundárias */
  const secondary = document.createElement('div');
  secondary.style.display = 'flex';
  secondary.style.gap = '.7rem';
  secondary.style.flexWrap = 'wrap';
  const cartLink = document.createElement('a');
  cartLink.href = 'carrinho.html';
  cartLink.className = 'btn btn-outline';
  cartLink.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Ver carrinho';
  const waLink = document.createElement('a');
  waLink.href = 'https://wa.me/' + IMAJE.whatsapp + '?text=' +
    encodeURIComponent('Olá! Tenho uma dúvida sobre: ' + p.name);
  waLink.target = '_blank'; waLink.rel = 'noopener';
  waLink.className = 'btn btn-outline';
  waLink.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Tirar dúvida';
  secondary.append(cartLink, waLink);
  info.appendChild(secondary);

  /* Aviso de produção */
  const notice = document.createElement('aside');
  notice.className = 'notice info';
  notice.style.marginTop = '1.5rem';
  const nic = document.createElement('span'); nic.className = 'n-ic'; nic.textContent = '💡';
  const ntx = document.createElement('span');
  ntx.textContent = 'Produção sob demanda: enviamos a prévia da arte no WhatsApp antes de produzir. Prazo médio de 3 a 7 dias úteis + frete.';
  notice.append(nic, ntx);
  info.appendChild(notice);

  layout.append(media, info);
  root.appendChild(layout);
}

async function initProductPage() {
  const id = qs('id');
  const root = document.getElementById('pd-root');

  if (!id) {
    root.innerHTML = '<div class="empty-state"><div class="e-ic">🤔</div><h3>Produto não informado</h3>' +
      '<p>Volte ao catálogo para escolher uma peça.</p></div>';
    const back = document.createElement('div');
    back.className = 'text-center';
    back.innerHTML = '<a href="produtos.html" class="btn btn-pink">Ir para o catálogo</a>';
    root.appendChild(back);
    return;
  }

  const p = await ProductStore.byId(id);
  if (!p) {
    root.innerHTML = '<div class="empty-state"><div class="e-ic">😕</div><h3>Produto não encontrado</h3>' +
      '<p>Talvez ele tenha saído do catálogo. Veja outras opções!</p>' +
      '<p style="margin-top:1rem"><a href="produtos.html" class="btn btn-pink">Ver catálogo</a></p></div>';
    return;
  }

  buildDetail(p);

  const related = await ProductStore.related(p, 4);
  if (related.length) {
    document.getElementById('related-section').hidden = false;
    renderProducts(document.getElementById('related-grid'), related);
  }
}

document.addEventListener('DOMContentLoaded', initProductPage);

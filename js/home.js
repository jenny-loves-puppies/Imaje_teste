/* ==========================================================================
   IMAJE — home.js  (página inicial)
   ========================================================================== */

async function renderCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  const counts = await ProductStore.countsByCategory();
  const frag = document.createDocumentFragment();
  CATEGORIES.forEach(c => {
    const a = document.createElement('a');
    a.className = 'cat-card';
    a.href = 'produtos.html?cat=' + encodeURIComponent(c.name);
    const ic = document.createElement('span');
    ic.className = 'cat-ic';
    ic.textContent = c.icon;
    const st = document.createElement('strong');
    st.textContent = c.name;
    const sp = document.createElement('span');
    const n = counts[c.name] || 0;
    sp.textContent = n ? n + (n === 1 ? ' produto' : ' produtos') : c.desc;
    a.append(ic, st, sp);
    frag.appendChild(a);
  });
  grid.innerHTML = '';
  grid.appendChild(frag);
}

async function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const items = await ProductStore.featured(8);
  renderProducts(grid, items);
}

async function renderReviews() {
  const grid = document.getElementById('review-grid');
  if (!grid) return;
  let reviews = [];
  try {
    const res = await fetch('tables/reviews?limit=20');
    if (res.ok) {
      const json = await res.json();
      reviews = (json.data || []).filter(r => r && !r.deleted && r.approved !== false);
    }
  } catch (e) { console.warn('[Imaje] reviews offline', e); }

  if (!reviews.length) {
    reviews = [
      { customer_name: 'Juliana M.', city: 'Belo Horizonte/MG', rating: 5, comment: 'Encomendei camisetas de casal e chegou antes do prazo! A estampa ficou idêntica à arte que enviei.' },
      { customer_name: 'Rafael S.', city: 'Curitiba/PR', rating: 5, comment: 'Os bottons personalizados ficaram lindos, fizemos para o grupo todo. Qualidade excelente.' },
      { customer_name: 'Mariana P.', city: 'São Paulo/SP', rating: 5, comment: 'O decorativo 3D da profissão foi o presente de formatura mais elogiado da festa!' },
    ];
  }

  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  reviews.slice(0, 4).forEach(r => {
    const card = document.createElement('article');
    card.className = 'review-card';

    const stars = document.createElement('div');
    stars.className = 'stars';
    const n = Math.round(Number(r.rating) || 5);
    stars.textContent = '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
    stars.setAttribute('aria-label', n + ' de 5 estrelas');

    const p = document.createElement('p');
    p.textContent = '“' + (r.comment || '') + '”';

    const who = document.createElement('div');
    who.className = 'reviewer';
    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = (r.customer_name || '?').trim().charAt(0).toUpperCase();
    const info = document.createElement('div');
    const nm = document.createElement('strong');
    nm.textContent = r.customer_name || 'Cliente Imaje';
    const ct = document.createElement('span');
    ct.textContent = r.city || '';
    info.append(nm, ct);
    who.append(av, info);

    card.append(stars, p, who);
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderFeatured();
  renderReviews();
});

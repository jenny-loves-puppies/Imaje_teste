/* ==========================================================================
   IMAJE — shop.js  (catálogo: busca, filtros e ordenação)
   ========================================================================== */

const Shop = {
  all: [],
  state: { cats: new Set(), techs: new Set(), maxPrice: 200, search: '', sort: 'relevance', onlyStock: false },

  async init() {
    this.all = await ProductStore.all();

    // Preço máximo real do catálogo
    const top = Math.max(200, ...this.all.map(p => Number(p.price) || 0));
    const range = document.getElementById('price-range');
    range.max = Math.ceil(top / 10) * 10;
    range.value = range.max;
    this.state.maxPrice = Number(range.max);
    this.updatePriceLabel();

    // Categoria vinda da URL
    const urlCat = qs('cat');
    if (urlCat) {
      this.state.cats.add(urlCat);
      document.getElementById('shop-title').textContent = urlCat;
      document.getElementById('crumb-current').textContent = urlCat;
      const sub = { 'Camisetas': 'Frases, memes e kits de casal em algodão confortável.',
        'Bottons': 'Disponíveis em 25 mm (R$ 5), 32 mm (R$ 7) e 58 mm (R$ 10).',
        'Adesivos': 'Vinil recortado resistente à água e ao sol.',
        'Chaveiros': 'Acrílico gravado ou impressão 3D com relevo real.',
        'Canecas': 'Cerâmica 325 ml com sublimação de alta definição.',
        'Decorativos 3D': 'Peças modeladas e impressas sob medida.',
        'Personalizados': 'Conte sua ideia: criamos do zero para você.',
        'Promoções': 'Ofertas por tempo limitado. Aproveite!' }[urlCat];
      if (sub) document.getElementById('shop-subtitle').textContent = sub;
    }

    const q = qs('q');
    if (q) { this.state.search = q; document.getElementById('search-input').value = q; }

    this.buildChips();
    this.buildCatFilters();
    this.bind();
    this.render();
  },

  buildChips() {
    const row = document.getElementById('chip-row');
    row.innerHTML = '';
    const mk = (label, cat) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + ((cat === null && !this.state.cats.size) || (cat && this.state.cats.has(cat) && this.state.cats.size === 1) ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        this.state.cats.clear();
        if (cat) this.state.cats.add(cat);
        this.syncCatCheckboxes();
        this.buildChips();
        this.render();
      });
      return b;
    };
    row.appendChild(mk('Todos', null));
    CATEGORIES.forEach(c => row.appendChild(mk(c.icon + ' ' + c.name, c.name)));
  },

  buildCatFilters() {
    const box = document.getElementById('cat-filters');
    box.innerHTML = '';
    CATEGORIES.forEach(c => {
      const label = document.createElement('label');
      label.className = 'filter-opt';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = c.name;
      cb.dataset.cat = '1';
      cb.checked = this.state.cats.has(c.name);
      cb.addEventListener('change', () => {
        cb.checked ? this.state.cats.add(c.name) : this.state.cats.delete(c.name);
        this.buildChips();
        this.render();
      });
      label.append(cb, document.createTextNode(' ' + c.name));
      box.appendChild(label);
    });
  },

  syncCatCheckboxes() {
    document.querySelectorAll('[data-cat]').forEach(cb => { cb.checked = this.state.cats.has(cb.value); });
  },

  updatePriceLabel() {
    document.getElementById('price-val').textContent = 'até ' + money(this.state.maxPrice);
  },

  bind() {
    const search = document.getElementById('search-input');
    let t;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { this.state.search = search.value.trim(); this.render(); }, 220);
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.state.sort = e.target.value; this.render();
    });

    const range = document.getElementById('price-range');
    range.addEventListener('input', () => {
      this.state.maxPrice = Number(range.value);
      this.updatePriceLabel();
      this.render();
    });

    document.querySelectorAll('[data-tech]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.checked ? this.state.techs.add(cb.value) : this.state.techs.delete(cb.value);
        this.render();
      });
    });

    document.getElementById('only-stock').addEventListener('change', (e) => {
      this.state.onlyStock = e.target.checked; this.render();
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
      this.state.cats.clear(); this.state.techs.clear();
      this.state.search = ''; this.state.onlyStock = false;
      this.state.maxPrice = Number(range.max);
      range.value = range.max;
      search.value = '';
      document.getElementById('only-stock').checked = false;
      document.querySelectorAll('[data-tech]').forEach(cb => { cb.checked = false; });
      this.syncCatCheckboxes();
      this.updatePriceLabel();
      this.buildChips();
      this.render();
      toast('Filtros limpos', 'info');
    });
  },

  filtered() {
    const s = this.state;
    const term = s.search.toLowerCase();
    let list = this.all.filter(p => {
      if (s.cats.size && !s.cats.has(p.category)) return false;
      const price = Number(p.price) || 0;
      if (price > s.maxPrice && price > 0) return false;
      if (s.onlyStock && Number(p.stock) <= 0) return false;
      if (s.techs.size) {
        const techs = Array.isArray(p.techniques) ? p.techniques : [];
        if (!techs.some(t => s.techs.has(t))) return false;
      }
      if (term) {
        const hay = (p.name + ' ' + (p.short_desc || '') + ' ' + (p.description || '') + ' ' + p.category).toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    switch (s.sort) {
      case 'price-asc':  list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-desc': list.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); break;
      case 'stock':      list.sort((a, b) => (b.stock || 0) - (a.stock || 0)); break;
      default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  },

  render() {
    const list = this.filtered();
    renderProducts(document.getElementById('shop-grid'), list);
    document.getElementById('result-count').textContent =
      list.length + (list.length === 1 ? ' produto' : ' produtos');
  },
};

document.addEventListener('DOMContentLoaded', () => Shop.init());

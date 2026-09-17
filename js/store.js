/* ==========================================================================
   IMAJE — store.js
   Camada de dados: produtos (API de tabelas + fallback JSON) e carrinho.
   ========================================================================== */

const IMAJE = {
  whatsapp: '5531999999999',          // <-- troque pelo seu número (DDI+DDD+número)
  email: 'contato@imaje.com.br',
  phoneLabel: '(31) 99999-9999',
  instagram: 'https://instagram.com/imaje',
  freeShippingFrom: 199,
};

const CATEGORIES = [
  { name: 'Camisetas',      icon: '👕', desc: 'Frases, memes e casal' },
  { name: 'Bottons',        icon: '🎖️', desc: '25, 32 e 58 mm' },
  { name: 'Adesivos',       icon: '🏷️', desc: 'Kits resistentes' },
  { name: 'Chaveiros',      icon: '🔑', desc: 'Nome e 3D' },
  { name: 'Canecas',        icon: '☕', desc: 'Sublimação HD' },
  { name: 'Decorativos 3D', icon: '🏆', desc: 'Peças exclusivas' },
  { name: 'Personalizados', icon: '💡', desc: 'Sua ideia do zero' },
  { name: 'Promoções',      icon: '🔥', desc: 'Ofertas da semana' },
];

/* --------------------------- Utilitários --------------------------- */
const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function slugPlaceholder(product) {
  const map = { Camisetas: 'ph-pink', Bottons: 'ph-cyan', Adesivos: 'ph-yellow',
    Chaveiros: 'ph-cyan', Canecas: 'ph-pink', 'Decorativos 3D': 'ph-yellow',
    Personalizados: 'ph-cyan', 'Promoções': 'ph-pink' };
  return map[product.category] || 'ph-pink';
}

/* --------------------------- Produtos --------------------------- */
const ProductStore = {
  _cache: null,

  async all() {
    if (this._cache) return this._cache;
    let items = [];
    try {
      const res = await fetch('tables/products?limit=500');
      if (res.ok) {
        const json = await res.json();
        items = Array.isArray(json.data) ? json.data : [];
      }
    } catch (e) {
      console.warn('[Imaje] API de tabelas indisponível, usando catálogo local.', e);
    }
    if (!items.length) {
      try {
        const res = await fetch('data/products.json');
        if (res.ok) items = await res.json();
      } catch (e) { console.warn('[Imaje] Catálogo local indisponível.', e); }
    }
    items = items.filter(p => p && !p.deleted && p.active !== false);
    this._cache = items;
    return items;
  },

  async byId(id) {
    const list = await this.all();
    return list.find(p => String(p.id) === String(id)) || null;
  },

  async featured(limit = 4) {
    const list = await this.all();
    const f = list.filter(p => p.featured);
    return (f.length ? f : list).slice(0, limit);
  },

  async related(product, limit = 4) {
    const list = await this.all();
    return list
      .filter(p => p.id !== product.id && p.category === product.category)
      .concat(list.filter(p => p.id !== product.id && p.category !== product.category))
      .slice(0, limit);
  },

  async countsByCategory() {
    const list = await this.all();
    const counts = {};
    list.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  },

  clearCache() { this._cache = null; },
};

/* --------------------------- Carrinho --------------------------- */
const Cart = {
  KEY: 'imaje_cart_v1',

  read() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch (e) { return []; }
  },

  write(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.refreshBadge();
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: items }));
  },

  /** Chave única: mesmo produto com opções diferentes = linhas diferentes */
  lineKey(id, options) {
    return id + '::' + JSON.stringify(options || {});
  },

  add(product, qty = 1, options = {}) {
    const items = this.read();
    const key = this.lineKey(product.id, options);
    const found = items.find(i => i.key === key);
    if (found) {
      found.qty += qty;
    } else {
      items.push({
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || '',
        emoji: product.emoji || '🎁',
        category: product.category || '',
        qty,
        options,
      });
    }
    this.write(items);
    return items;
  },

  setQty(key, qty) {
    const items = this.read();
    const it = items.find(i => i.key === key);
    if (!it) return;
    it.qty = Math.max(1, Number(qty) || 1);
    this.write(items);
  },

  remove(key) {
    this.write(this.read().filter(i => i.key !== key));
  },

  clear() { this.write([]); },

  count() { return this.read().reduce((s, i) => s + i.qty, 0); },

  subtotal() { return this.read().reduce((s, i) => s + i.price * i.qty, 0); },

  refreshBadge() {
    const n = this.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = n;
      el.style.display = n > 0 ? 'grid' : 'none';
    });
  },
};

/* --------------------------- Último pedido --------------------------- */
const LastOrder = {
  KEY: 'imaje_last_order',
  save(order) { localStorage.setItem(this.KEY, JSON.stringify(order)); },
  read() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); }
    catch (e) { return null; }
  },
};

/* ==========================================================================
   IMAJE — admin.js  (painel do lojista)
   ATENÇÃO: site estático não oferece proteção real. Ver aviso na página.
   ========================================================================== */

const Admin = {
  products: [],
  orders: [],
  news: [],

  async init() {
    this.bindTabs();
    this.bindModal();
    await this.loadAll();
  },

  /* ------------------------- Abas ------------------------- */
  bindTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; });
        document.getElementById('tab-' + tab.dataset.tab).hidden = false;
      });
    });
    document.getElementById('reload-btn').addEventListener('click', () => {
      ProductStore.clearCache();
      this.loadAll();
      toast('Dados recarregados', 'ok');
    });
  },

  /* ------------------------- Carregamento ------------------------- */
  async fetchTable(name) {
    try {
      const res = await fetch('tables/' + name + '?limit=500');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data || []).filter(r => r && !r.deleted);
    } catch (e) {
      console.warn('[Imaje admin] tabela indisponível: ' + name, e);
      return [];
    }
  },

  async loadAll() {
    const [prods, orders, news] = await Promise.all([
      this.fetchTable('products'),
      this.fetchTable('orders'),
      this.fetchTable('newsletter'),
    ]);
    this.products = prods;
    this.orders = orders;
    this.news = news;
    this.renderStats();
    this.renderProducts();
    this.renderOrders();
    this.renderNews();
  },

  /* ------------------------- Estatísticas ------------------------- */
  renderStats() {
    const box = document.getElementById('admin-stats');
    box.innerHTML = '';
    const revenue = this.orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const active = this.products.filter(p => p.active !== false).length;
    const lowStock = this.products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
    const stats = [
      ['Produtos ativos', String(active)],
      ['Pedidos recebidos', String(this.orders.length)],
      ['Receita registrada', money(revenue)],
      ['Estoque baixo', String(lowStock)],
      ['Inscritos newsletter', String(this.news.length)],
    ];
    stats.forEach(([l, v]) => {
      const c = document.createElement('div');
      c.className = 'stat-card';
      const lb = document.createElement('div'); lb.className = 's-lbl'; lb.textContent = l;
      const vl = document.createElement('div'); vl.className = 's-val'; vl.textContent = v;
      c.append(lb, vl);
      box.appendChild(c);
    });
  },

  /* ------------------------- Tabela de produtos ------------------------- */
  renderProducts() {
    const body = document.getElementById('admin-products-body');
    body.innerHTML = '';
    document.getElementById('admin-prod-count').textContent =
      this.products.length + ' produto(s) cadastrado(s)';

    if (!this.products.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.innerHTML = '<div class="empty-state"><div class="e-ic">📦</div><h3>Nenhum produto cadastrado</h3>' +
        '<p>Clique em “Novo produto” para começar seu catálogo.</p></div>';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    this.products.forEach(p => {
      const tr = document.createElement('tr');

      /* imagem */
      const tdImg = document.createElement('td');
      const th = document.createElement('div');
      th.className = 'admin-thumb';
      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image; img.alt = ''; img.loading = 'lazy';
        th.appendChild(img);
      } else {
        th.textContent = p.emoji || '🎁';
      }
      tdImg.appendChild(th);

      const tdName = document.createElement('td');
      const strong = document.createElement('strong');
      strong.textContent = p.name || '(sem nome)';
      const small = document.createElement('div');
      small.style.fontSize = '.76rem';
      small.style.color = 'var(--gray-400)';
      small.textContent = p.short_desc || '';
      tdName.append(strong, small);

      const tdCat = document.createElement('td');
      const pill = document.createElement('span');
      pill.className = 'pill pill-cat';
      pill.textContent = p.category || '—';
      tdCat.appendChild(pill);

      const tdPrice = document.createElement('td');
      tdPrice.textContent = Number(p.price) > 0 ? money(p.price) : 'Orçamento';

      const tdStock = document.createElement('td');
      tdStock.textContent = Number(p.stock) || 0;
      if (Number(p.stock) <= 10) { tdStock.style.color = 'var(--yellow-dark)'; tdStock.style.fontWeight = '700'; }

      const tdFeat = document.createElement('td');
      tdFeat.textContent = p.featured ? '⭐' : '—';

      const tdStatus = document.createElement('td');
      const sp = document.createElement('span');
      sp.className = 'pill ' + (p.active !== false ? 'pill-on' : 'pill-off');
      sp.textContent = p.active !== false ? 'Ativo' : 'Inativo';
      tdStatus.appendChild(sp);

      const tdAct = document.createElement('td');
      tdAct.style.whiteSpace = 'nowrap';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-outline btn-sm';
      edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
      edit.title = 'Editar';
      edit.setAttribute('aria-label', 'Editar ' + p.name);
      edit.addEventListener('click', () => this.openModal(p));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-outline btn-sm';
      del.style.marginLeft = '.35rem';
      del.innerHTML = '<i class="fa-solid fa-trash"></i>';
      del.title = 'Excluir';
      del.setAttribute('aria-label', 'Excluir ' + p.name);
      del.addEventListener('click', () => this.deleteProduct(p));

      tdAct.append(edit, del);
      tr.append(tdImg, tdName, tdCat, tdPrice, tdStock, tdFeat, tdStatus, tdAct);
      body.appendChild(tr);
    });
  },

  /* ------------------------- Pedidos ------------------------- */
  renderOrders() {
    const body = document.getElementById('admin-orders-body');
    body.innerHTML = '';
    if (!this.orders.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.innerHTML = '<div class="empty-state"><div class="e-ic">🧾</div><h3>Nenhum pedido ainda</h3>' +
        '<p>Os pedidos feitos no checkout aparecem aqui.</p></div>';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    this.orders.slice().reverse().forEach(o => {
      const tr = document.createElement('tr');

      const tdNum = document.createElement('td');
      const st = document.createElement('strong');
      st.textContent = o.order_number || o.id;
      tdNum.appendChild(st);

      const tdCli = document.createElement('td');
      tdCli.textContent = o.customer_name || '—';

      const tdCon = document.createElement('td');
      tdCon.style.fontSize = '.8rem';
      tdCon.textContent = [o.phone, o.email].filter(Boolean).join(' • ') || '—';

      const tdShip = document.createElement('td');
      tdShip.style.fontSize = '.8rem';
      tdShip.textContent = o.shipping_method || '—';

      const tdTot = document.createElement('td');
      tdTot.innerHTML = '<strong>' + money(o.total) + '</strong>';

      const tdStat = document.createElement('td');
      const sel = document.createElement('select');
      sel.className = 'select-styled';
      sel.style.padding = '.3rem .7rem';
      sel.style.fontSize = '.78rem';
      ['Aguardando pagamento', 'Em produção', 'Enviado', 'Entregue', 'Cancelado'].forEach(s => {
        const op = document.createElement('option');
        op.value = s; op.textContent = s;
        if (o.status === s) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', async () => {
        try {
          await fetch('tables/orders/' + o.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: sel.value }),
          });
          toast('Status atualizado', 'ok');
        } catch (e) { toast('Não foi possível salvar', 'err'); }
      });
      tdStat.appendChild(sel);

      const tdAct = document.createElement('td');
      const view = document.createElement('button');
      view.type = 'button';
      view.className = 'btn btn-outline btn-sm';
      view.innerHTML = '<i class="fa-solid fa-eye"></i>';
      view.title = 'Ver itens';
      view.addEventListener('click', () => this.showOrderItems(o));
      tdAct.appendChild(view);

      tr.append(tdNum, tdCli, tdCon, tdShip, tdTot, tdStat, tdAct);
      body.appendChild(tr);
    });
  },

  showOrderItems(o) {
    let items = [];
    try { items = JSON.parse(o.items || '[]'); } catch (e) { items = []; }
    const lines = items.map(i => {
      const opts = i.options && Object.keys(i.options).length
        ? ' (' + Object.entries(i.options).map(([k, v]) => k + ': ' + v).join(', ') + ')'
        : '';
      return i.qty + 'x ' + i.name + opts;
    });
    const msg = 'Pedido ' + (o.order_number || o.id) + '\n\n' + (lines.join('\n') || 'sem itens') +
      '\n\nEndereço: ' + (o.address || '—') + ' ' + (o.complement || '') +
      '\nObservações: ' + (o.notes || '—');
    alert(msg);
  },

  /* ------------------------- Newsletter ------------------------- */
  renderNews() {
    const body = document.getElementById('admin-news-body');
    body.innerHTML = '';
    if (!this.news.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.innerHTML = '<div class="empty-state"><div class="e-ic">✉️</div><h3>Nenhum inscrito ainda</h3></div>';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    this.news.forEach(n => {
      const tr = document.createElement('tr');
      const a = document.createElement('td'); a.textContent = n.email || '—';
      const b = document.createElement('td'); b.style.fontSize = '.8rem'; b.textContent = n.source || '—';
      const c = document.createElement('td');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-outline btn-sm';
      del.innerHTML = '<i class="fa-solid fa-trash"></i>';
      del.addEventListener('click', async () => {
        if (!confirm('Remover ' + n.email + ' da lista?')) return;
        try {
          await fetch('tables/newsletter/' + n.id, { method: 'DELETE' });
          toast('Removido', 'ok');
          this.loadAll();
        } catch (e) { toast('Erro ao remover', 'err'); }
      });
      c.appendChild(del);
      tr.append(a, b, c);
      body.appendChild(tr);
    });
  },

  /* ------------------------- Modal de produto ------------------------- */
  bindModal() {
    const modal = document.getElementById('product-modal');
    const close = () => modal.classList.remove('open');
    document.getElementById('new-product-btn').addEventListener('click', () => this.openModal(null));
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-cancel').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    /* Upload → data URL */
    document.getElementById('f-image-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 900 * 1024) {
        toast('Imagem muito grande (máx. ~900 KB). Use um caminho em images/.', 'warn');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('f-image').value = reader.result;
        toast('Imagem carregada no formulário', 'ok');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('product-form').addEventListener('submit', (e) => this.saveProduct(e));
  },

  openModal(p) {
    const g = (id) => document.getElementById(id);
    g('modal-title').textContent = p ? 'Editar produto' : 'Novo produto';
    g('f-record-id').value = p ? p.id : '';
    g('f-name').value = p ? (p.name || '') : '';
    g('f-category').value = p ? (p.category || 'Camisetas') : 'Camisetas';
    g('f-price').value = p ? (p.price != null ? p.price : '') : '';
    g('f-old-price').value = p ? (p.old_price || '') : '';
    g('f-stock').value = p ? (p.stock != null ? p.stock : '') : '';
    g('f-emoji').value = p ? (p.emoji || '') : '';
    g('f-badge').value = p ? (p.badge || '') : '';
    g('f-image').value = p ? (p.image || '') : '';
    g('f-short').value = p ? (p.short_desc || '') : '';
    g('f-desc').value = p ? (p.description || '') : '';
    g('f-options').value = p ? (p.options || '') : '';
    g('f-featured').checked = p ? !!p.featured : false;
    g('f-active').checked = p ? p.active !== false : true;
    const techs = p && Array.isArray(p.techniques) ? p.techniques : [];
    document.querySelectorAll('[data-f-tech]').forEach(cb => { cb.checked = techs.includes(cb.value); });
    g('f-image-file').value = '';
    document.getElementById('product-modal').classList.add('open');
  },

  async saveProduct(e) {
    e.preventDefault();
    const g = (id) => document.getElementById(id);
    const recordId = g('f-record-id').value;
    const techs = Array.from(document.querySelectorAll('[data-f-tech]'))
      .filter(cb => cb.checked).map(cb => cb.value);

    const payload = {
      name: g('f-name').value.trim() || 'Produto sem nome',
      category: g('f-category').value,
      price: Number(g('f-price').value) || 0,
      old_price: Number(g('f-old-price').value) || 0,
      stock: g('f-stock').value === '' ? 0 : Number(g('f-stock').value),
      emoji: g('f-emoji').value.trim() || '🎁',
      badge: g('f-badge').value.trim(),
      image: g('f-image').value.trim(),
      short_desc: g('f-short').value.trim(),
      description: g('f-desc').value.trim(),
      options: g('f-options').value.trim(),
      techniques: techs,
      featured: g('f-featured').checked,
      active: g('f-active').checked,
    };

    try {
      if (recordId) {
        await fetch('tables/products/' + recordId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Produto atualizado! ✨', 'ok');
      } else {
        payload.id = 'prod-' + Date.now();
        await fetch('tables/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Produto criado! 🎉', 'ok');
      }
      document.getElementById('product-modal').classList.remove('open');
      ProductStore.clearCache();
      await this.loadAll();
    } catch (err) {
      console.error(err);
      toast('Não foi possível salvar o produto', 'err');
    }
  },

  async deleteProduct(p) {
    if (!confirm('Excluir "' + p.name + '"? Esta ação não pode ser desfeita.')) return;
    try {
      await fetch('tables/products/' + p.id, { method: 'DELETE' });
      toast('Produto excluído', 'warn');
      ProductStore.clearCache();
      await this.loadAll();
    } catch (e) {
      toast('Erro ao excluir', 'err');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Admin.init());

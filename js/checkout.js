/* ==========================================================================
   IMAJE — checkout.js
   Formulário sem validação rigorosa, frete dinâmico e registro do pedido.
   ========================================================================== */

const SHIPPING = [
  { id: 'correios-pac', label: 'Correios PAC', desc: '6 a 12 dias úteis', cost: 21.90 },
  { id: 'correios-sedex', label: 'Correios SEDEX', desc: '2 a 5 dias úteis', cost: 34.90 },
  { id: 'melhor-envio', label: 'Melhor Envio', desc: '4 a 9 dias úteis — melhor custo', cost: 18.50 },
  { id: 'loggi', label: 'Loggi', desc: '1 a 3 dias úteis (capitais)', cost: 27.00 },
  { id: 'retirada', label: 'Retirada combinada', desc: 'Combinamos o ponto pelo WhatsApp', cost: 0 },
];

const PAYMENTS = [
  { id: 'pix', label: 'PIX (Mercado Pago)', desc: 'Aprovação imediata — 5% de desconto', icon: '⚡' },
  { id: 'cartao', label: 'Cartão de crédito (Mercado Pago)', desc: 'Parcele em até 12x', icon: '💳' },
  { id: 'boleto', label: 'Boleto bancário', desc: 'Compensação em até 3 dias úteis', icon: '🧾' },
];

const Checkout = {
  shipping: SHIPPING[2],
  payment: PAYMENTS[0],

  init() {
    const items = Cart.read();
    if (!items.length) {
      document.getElementById('checkout-empty').hidden = false;
      document.getElementById('checkout-form').hidden = true;
      return;
    }
    this.buildShipping();
    this.buildPayments();
    this.buildSummary();
    this.bindCep();
    document.getElementById('checkout-form').addEventListener('submit', (e) => this.submit(e));
  },

  buildShipping() {
    const box = document.getElementById('shipping-options');
    box.innerHTML = '';
    const subtotal = Cart.subtotal();
    const free = subtotal >= IMAJE.freeShippingFrom;

    SHIPPING.forEach((s, i) => {
      const cost = free && s.id !== 'retirada' ? 0 : s.cost;
      const label = document.createElement('label');
      label.className = 'option-card' + (i === 2 ? ' selected' : '');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'shipping'; radio.value = s.id;
      radio.checked = i === 2;
      const body = document.createElement('div');
      body.className = 'oc-body';
      const st = document.createElement('strong'); st.textContent = s.label;
      const sp = document.createElement('span'); sp.textContent = s.desc;
      body.append(st, sp);
      const pr = document.createElement('span');
      pr.className = 'oc-price';
      pr.textContent = cost === 0 ? 'Grátis' : money(cost);
      label.append(radio, body, pr);

      radio.addEventListener('change', () => {
        document.querySelectorAll('#shipping-options .option-card').forEach(c => c.classList.remove('selected'));
        label.classList.add('selected');
        this.shipping = Object.assign({}, s, { cost });
        this.buildSummary();
      });

      box.appendChild(label);
    });
    this.shipping = Object.assign({}, SHIPPING[2], { cost: free ? 0 : SHIPPING[2].cost });
  },

  buildPayments() {
    const box = document.getElementById('payment-options');
    box.innerHTML = '';
    PAYMENTS.forEach((p, i) => {
      const label = document.createElement('label');
      label.className = 'option-card' + (i === 0 ? ' selected' : '');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'payment'; radio.value = p.id;
      radio.checked = i === 0;
      const body = document.createElement('div');
      body.className = 'oc-body';
      const st = document.createElement('strong');
      st.textContent = p.icon + ' ' + p.label;
      const sp = document.createElement('span'); sp.textContent = p.desc;
      body.append(st, sp);
      label.append(radio, body);
      radio.addEventListener('change', () => {
        document.querySelectorAll('#payment-options .option-card').forEach(c => c.classList.remove('selected'));
        label.classList.add('selected');
        this.payment = p;
        this.buildSummary();
      });
      box.appendChild(label);
    });
  },

  totals() {
    const subtotal = Cart.subtotal();
    const frete = this.shipping ? this.shipping.cost : 0;
    const desconto = this.payment && this.payment.id === 'pix' ? subtotal * 0.05 : 0;
    return { subtotal, frete, desconto, total: subtotal + frete - desconto };
  },

  buildSummary() {
    const box = document.getElementById('checkout-summary');
    const items = Cart.read();
    const t = this.totals();
    box.innerHTML = '';

    const h3 = document.createElement('h3');
    h3.textContent = 'Resumo do pedido';
    box.appendChild(h3);

    items.forEach(it => {
      const r = document.createElement('div');
      r.className = 'sum-row';
      const a = document.createElement('span');
      a.textContent = it.qty + '× ' + it.name;
      a.style.paddingRight = '.5rem';
      const b = document.createElement('span');
      b.textContent = money(it.price * it.qty);
      b.style.whiteSpace = 'nowrap';
      r.append(a, b);
      box.appendChild(r);
    });

    const div = document.createElement('hr');
    div.style.border = 'none';
    div.style.borderTop = '2px solid var(--gray-200)';
    div.style.margin = '.7rem 0';
    box.appendChild(div);

    const rows = [['Subtotal', money(t.subtotal)], ['Frete', t.frete === 0 ? 'Grátis' : money(t.frete)]];
    if (t.desconto > 0) rows.push(['Desconto PIX (5%)', '− ' + money(t.desconto)]);
    rows.forEach(([l, v]) => {
      const r = document.createElement('div');
      r.className = 'sum-row';
      const a = document.createElement('span'); a.textContent = l;
      const b = document.createElement('span'); b.textContent = v;
      r.append(a, b);
      box.appendChild(r);
    });

    const total = document.createElement('div');
    total.className = 'sum-row total';
    const tl = document.createElement('span'); tl.textContent = 'Total';
    const tv = document.createElement('span'); tv.textContent = money(t.total);
    total.append(tl, tv);
    box.appendChild(total);

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.id = 'finish-btn';
    btn.className = 'btn btn-pink btn-block btn-lg';
    btn.style.marginTop = '1.2rem';
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Finalizar Compra';
    box.appendChild(btn);

    const back = document.createElement('a');
    back.href = 'carrinho.html';
    back.className = 'btn btn-outline btn-block';
    back.style.marginTop = '.7rem';
    back.textContent = 'Voltar ao carrinho';
    box.appendChild(back);
  },

  /** Busca endereço pelo CEP (ViaCEP é público e com CORS) */
  bindCep() {
    const cep = document.getElementById('ck-cep');
    cep.addEventListener('blur', async () => {
      const digits = (cep.value || '').replace(/\D/g, '');
      if (digits.length !== 8) return;
      try {
        const res = await fetch('https://viacep.com.br/ws/' + digits + '/json/');
        const d = await res.json();
        if (d.erro) return;
        const addr = document.getElementById('ck-address');
        if (!addr.value.trim()) {
          addr.value = [d.logradouro, d.bairro, d.localidade + '/' + d.uf].filter(Boolean).join(', ');
          toast('Endereço preenchido pelo CEP 📍', 'ok');
        }
      } catch (e) { console.warn('[Imaje] ViaCEP indisponível', e); }
    });
  },

  genOrderNumber() {
    const d = new Date();
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const rnd = Math.floor(1000 + Math.random() * 9000);
    return 'IMJ-' + y + m + '-' + rnd;
  },

  async submit(e) {
    e.preventDefault();
    const btn = document.getElementById('finish-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando pedido…';

    const val = (id) => (document.getElementById(id).value || '').trim();
    const items = Cart.read();
    const t = this.totals();

    const order = {
      id: 'ord-' + Date.now(),
      order_number: this.genOrderNumber(),
      customer_name: val('ck-name') || 'Cliente Imaje',
      email: val('ck-email'),
      phone: val('ck-phone'),
      cep: val('ck-cep'),
      address: val('ck-address'),
      complement: val('ck-complement'),
      notes: val('ck-notes'),
      shipping_method: this.shipping.label,
      shipping_cost: t.frete,
      payment_method: this.payment.label,
      items: JSON.stringify(items),
      subtotal: t.subtotal,
      total: t.total,
      status: 'Aguardando pagamento',
    };

    try {
      await fetch('tables/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.warn('[Imaje] Pedido salvo apenas localmente.', err);
    }

    LastOrder.save(Object.assign({}, order, { itemsArray: items, desconto: t.desconto }));
    Cart.clear();
    window.location.href = 'confirmacao.html';
  },
};

document.addEventListener('DOMContentLoaded', () => Checkout.init());

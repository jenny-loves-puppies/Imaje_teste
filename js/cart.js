/* ==========================================================================
   IMAJE — cart.js  (página do carrinho)
   ========================================================================== */

function optionsLine(options) {
  if (!options) return '';
  const entries = Object.entries(options);
  if (!entries.length) return '';
  return entries.map(([k, v]) => k + ': ' + v).join(' • ');
}

function renderCartItems() {
  const box = document.getElementById('cart-items');
  const items = Cart.read();
  box.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="e-ic">🛒</div><h3>Seu carrinho está vazio</h3>' +
      '<p>Que tal dar uma olhada nos nossos presentes personalizados?</p>' +
      '<p style="margin-top:1.4rem"><a href="produtos.html" class="btn btn-pink btn-lg">Explorar catálogo</a></p>';
    box.appendChild(empty);
    return;
  }

  const head = document.createElement('div');
  head.style.display = 'flex';
  head.style.justifyContent = 'space-between';
  head.style.alignItems = 'center';
  head.style.marginBottom = '.5rem';
  const hTitle = document.createElement('h2');
  hTitle.style.fontSize = '1.15rem';
  hTitle.textContent = items.length + (items.length === 1 ? ' item' : ' itens');
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'remove-btn';
  clearBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Esvaziar carrinho';
  clearBtn.addEventListener('click', () => {
    Cart.clear();
    toast('Carrinho esvaziado', 'warn');
  });
  head.append(hTitle, clearBtn);
  box.appendChild(head);

  items.forEach(it => {
    const row = document.createElement('article');
    row.className = 'cart-item';

    const thumb = document.createElement('div');
    thumb.className = 'cart-thumb';
    if (it.image) {
      const img = document.createElement('img');
      img.src = it.image; img.alt = it.name; img.loading = 'lazy';
      thumb.appendChild(img);
    } else {
      thumb.textContent = it.emoji || '🎁';
    }

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const h3 = document.createElement('h3');
    const link = document.createElement('a');
    link.href = 'produto.html?id=' + encodeURIComponent(it.id);
    link.textContent = it.name;
    h3.appendChild(link);

    const opts = document.createElement('p');
    opts.className = 'cart-opts';
    opts.textContent = optionsLine(it.options) || it.category;

    const foot = document.createElement('div');
    foot.className = 'cart-item-foot';

    const ctrl = document.createElement('div');
    ctrl.className = 'qty-control';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−';
    minus.setAttribute('aria-label', 'Diminuir quantidade de ' + it.name);
    const qty = document.createElement('input');
    qty.type = 'number'; qty.min = '1'; qty.value = it.qty;
    qty.setAttribute('aria-label', 'Quantidade de ' + it.name);
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+';
    plus.setAttribute('aria-label', 'Aumentar quantidade de ' + it.name);
    minus.addEventListener('click', () => Cart.setQty(it.key, it.qty - 1));
    plus.addEventListener('click', () => Cart.setQty(it.key, it.qty + 1));
    qty.addEventListener('change', () => Cart.setQty(it.key, qty.value));
    ctrl.append(minus, qty, plus);

    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'remove-btn';
    rm.innerHTML = '<i class="fa-solid fa-xmark"></i> Remover';
    rm.addEventListener('click', () => {
      Cart.remove(it.key);
      toast('Item removido', 'warn');
    });

    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = money(it.price * it.qty);
    price.title = money(it.price) + ' cada';

    foot.append(ctrl, rm, price);
    info.append(h3, opts, foot);
    row.append(thumb, info);
    box.appendChild(row);
  });

  const back = document.createElement('div');
  back.style.marginTop = '1.6rem';
  back.innerHTML = '<a href="produtos.html" class="btn btn-outline"><i class="fa-solid fa-arrow-left"></i> Continuar Comprando</a>';
  box.appendChild(back);
}

function renderSummary() {
  const box = document.getElementById('cart-summary');
  const items = Cart.read();
  box.innerHTML = '';
  if (!items.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';

  const h3 = document.createElement('h3');
  h3.textContent = 'Resumo do pedido';
  box.appendChild(h3);

  const subtotal = Cart.subtotal();
  const count = Cart.count();

  const rowsData = [
    ['Itens', String(count)],
    ['Subtotal', money(subtotal)],
    ['Frete', 'calculado no checkout'],
  ];
  rowsData.forEach(([l, v]) => {
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
  const tv = document.createElement('span'); tv.textContent = money(subtotal);
  total.append(tl, tv);
  box.appendChild(total);

  /* Frete grátis */
  const falta = IMAJE.freeShippingFrom - subtotal;
  const hint = document.createElement('p');
  hint.style.fontSize = '.83rem';
  hint.style.margin = '.8rem 0 1.2rem';
  hint.style.color = falta > 0 ? 'var(--gray-600)' : 'var(--cyan-dark)';
  hint.style.fontWeight = '600';
  hint.textContent = falta > 0
    ? '🚚 Faltam ' + money(falta) + ' para frete grátis!'
    : '🎉 Você garantiu frete grátis neste pedido!';
  box.appendChild(hint);

  const go = document.createElement('a');
  go.href = 'checkout.html';
  go.className = 'btn btn-pink btn-block btn-lg';
  go.innerHTML = 'Ir para Checkout <i class="fa-solid fa-arrow-right"></i>';
  box.appendChild(go);

  const cont = document.createElement('a');
  cont.href = 'produtos.html';
  cont.className = 'btn btn-outline btn-block';
  cont.style.marginTop = '.7rem';
  cont.textContent = 'Continuar Comprando';
  box.appendChild(cont);

  const safe = document.createElement('p');
  safe.style.fontSize = '.78rem';
  safe.style.color = 'var(--gray-400)';
  safe.style.textAlign = 'center';
  safe.style.marginTop = '1rem';
  safe.textContent = '🔒 Pagamento via Mercado Pago (PIX ou cartão)';
  box.appendChild(safe);
}

function renderCartPage() {
  renderCartItems();
  renderSummary();
}

document.addEventListener('DOMContentLoaded', renderCartPage);
document.addEventListener('cart:changed', renderCartPage);

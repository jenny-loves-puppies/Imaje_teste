/* ==========================================================================
   IMAJE — confirm.js  (página de confirmação do pedido)
   ========================================================================== */

function buildWhatsMessage(o) {
  const items = (o.itemsArray || []).map(i => {
    const opts = i.options && Object.keys(i.options).length
      ? ' (' + Object.entries(i.options).map(([k, v]) => k + ': ' + v).join(', ') + ')'
      : '';
    return '• ' + i.qty + 'x ' + i.name + opts + ' — ' + money(i.price * i.qty);
  }).join('\n');

  return 'Olá, Imaje! Acabei de fazer o pedido ' + o.order_number + ' 🎉\n\n' +
    items + '\n\n' +
    'Entrega: ' + o.shipping_method + '\n' +
    'Pagamento: ' + o.payment_method + '\n' +
    'Total: ' + money(o.total) + '\n\n' +
    'Nome: ' + o.customer_name + '\n' +
    (o.notes ? 'Observações: ' + o.notes + '\n' : '') +
    '\nPode me enviar o link de pagamento e a prévia da arte?';
}

function renderConfirmation() {
  const root = document.getElementById('confirm-root');
  const o = LastOrder.read();
  root.innerHTML = '';

  if (!o) {
    root.innerHTML = '<div class="empty-state"><div class="e-ic">🔎</div>' +
      '<h3>Nenhum pedido recente encontrado</h3>' +
      '<p>Se você acabou de comprar, verifique seu e-mail. Caso contrário, explore nosso catálogo.</p>' +
      '<p style="margin-top:1.4rem"><a href="produtos.html" class="btn btn-pink btn-lg">Ver catálogo</a></p></div>';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'success-wrap';

  const ic = document.createElement('div');
  ic.className = 'success-ic';
  ic.textContent = '✓';
  ic.setAttribute('aria-hidden', 'true');

  const h1 = document.createElement('h1');
  h1.style.fontSize = 'clamp(1.7rem, 5vw, 2.6rem)';
  h1.textContent = 'Pedido registrado com sucesso!';

  const lead = document.createElement('p');
  lead.style.color = 'var(--gray-600)';
  lead.style.marginTop = '.7rem';
  lead.textContent = 'Obrigado, ' + (o.customer_name || 'cliente') +
    '! Já recebemos seu pedido e vamos entrar em contato para confirmar a arte e enviar o link de pagamento.';

  const num = document.createElement('div');
  num.className = 'order-num';
  num.textContent = o.order_number;

  wrap.append(ic, h1, lead, num);

  /* Detalhes */
  const box = document.createElement('section');
  box.className = 'order-detail-box';
  const bh = document.createElement('h3');
  bh.style.fontSize = '1.05rem';
  bh.style.marginBottom = '1rem';
  bh.textContent = '📦 Detalhes do pedido';
  box.appendChild(bh);

  (o.itemsArray || []).forEach(i => {
    const r = document.createElement('div');
    r.className = 'od-row';
    const a = document.createElement('span');
    const opts = i.options && Object.keys(i.options).length
      ? ' — ' + Object.entries(i.options).map(([k, v]) => k + ': ' + v).join(', ')
      : '';
    a.textContent = i.qty + '× ' + i.name + opts;
    const b = document.createElement('strong');
    b.textContent = money(i.price * i.qty);
    r.append(a, b);
    box.appendChild(r);
  });

  const rows = [
    ['Entrega', o.shipping_method + (o.shipping_cost ? ' — ' + money(o.shipping_cost) : ' — Grátis')],
    ['Pagamento', o.payment_method],
    ['E-mail de confirmação', o.email || 'não informado'],
    ['Telefone', o.phone || 'não informado'],
    ['Endereço', [o.address, o.complement].filter(Boolean).join(' — ') || 'não informado'],
    ['Total', money(o.total)],
  ];
  rows.forEach(([l, v]) => {
    const r = document.createElement('div');
    r.className = 'od-row';
    const a = document.createElement('span'); a.textContent = l;
    const b = document.createElement('strong'); b.textContent = v;
    r.append(a, b);
    box.appendChild(r);
  });
  wrap.appendChild(box);

  /* Próximos passos */
  const steps = document.createElement('aside');
  steps.className = 'notice info';
  steps.style.textAlign = 'left';
  const sic = document.createElement('span'); sic.className = 'n-ic'; sic.textContent = '📮';
  const stx = document.createElement('span');
  stx.innerHTML = '<strong>Próximos passos:</strong> 1) Enviamos a confirmação para <em>' +
    (o.email ? o.email.replace(/[<>]/g, '') : 'seu e-mail') +
    '</em>. 2) Você recebe a prévia da arte no WhatsApp. 3) Após o pagamento, produzimos em 3 a 7 dias úteis. ' +
    '4) O código de rastreamento chega por e-mail assim que postarmos.';
  steps.append(sic, stx);
  wrap.appendChild(steps);

  /* Pagamento */
  const payNotice = document.createElement('aside');
  payNotice.className = 'notice';
  payNotice.style.textAlign = 'left';
  const pic = document.createElement('span'); pic.className = 'n-ic'; pic.textContent = '💳';
  const ptx = document.createElement('span');
  ptx.innerHTML = '<strong>Para pagar:</strong> clique no botão abaixo e envie seu pedido pelo WhatsApp. ' +
    'Respondemos com o link oficial do Mercado Pago (PIX, cartão ou boleto). ' +
    'Nunca pedimos dados de cartão por mensagem.';
  payNotice.append(pic, ptx);
  wrap.appendChild(payNotice);

  /* Ações */
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '.8rem';
  actions.style.flexWrap = 'wrap';
  actions.style.justifyContent = 'center';

  const wa = document.createElement('a');
  wa.className = 'btn btn-pink btn-lg';
  wa.href = 'https://wa.me/' + IMAJE.whatsapp + '?text=' + encodeURIComponent(buildWhatsMessage(o));
  wa.target = '_blank'; wa.rel = 'noopener';
  wa.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Enviar pedido e pagar';

  const shop = document.createElement('a');
  shop.className = 'btn btn-outline btn-lg';
  shop.href = 'produtos.html';
  shop.textContent = 'Continuar comprando';

  const print = document.createElement('button');
  print.type = 'button';
  print.className = 'btn btn-outline btn-lg';
  print.innerHTML = '<i class="fa-solid fa-print"></i> Imprimir';
  print.addEventListener('click', () => window.print());

  actions.append(wa, shop, print);
  wrap.appendChild(actions);

  root.appendChild(wrap);
}

document.addEventListener('DOMContentLoaded', renderConfirmation);

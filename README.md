# Imaje — Imagine diferente 🎨

E-commerce estático para a loja **Imaje**, especializada em presentes personalizados: camisetas, bottons, adesivos, chaveiros, canecas e decorativos 3D.

> **Proposição:** Criamos ideias. Transformamos em experiências.
> **Slogan:** Imagine diferente

---

## 🎯 Objetivo do projeto

Oferecer uma vitrine digital moderna, colorida e responsiva que reflita a identidade lúdica da marca, permitindo que clientes naveguem pelo catálogo, personalizem produtos, montem um carrinho persistente e registrem pedidos — com produção sob demanda e atendimento humano via WhatsApp.

---

## ✅ Funcionalidades implementadas

### Loja
- **Página inicial** com hero animado, formas geométricas da marca, showcase de categorias, produtos em destaque, diferenciais, "Como funciona", técnicas de produção, depoimentos e newsletter.
- **Catálogo** (`produtos.html`) com:
  - Busca por nome/descrição (com debounce)
  - Chips de categoria + checkboxes no painel lateral
  - Filtro por preço máximo (slider), por técnica (3D / Sublimação / Serigrafia) e por disponibilidade
  - Ordenação: relevância, menor preço, maior preço, nome A–Z, maior estoque
  - Contador de resultados e botão "Limpar filtros"
- **Página de produto** (`produto.html?id=…`) com imagem grande, descrição, opções dinâmicas de personalização (selects e campos livres), seletor de quantidade, botão de carrinho e produtos relacionados.
- **Carrinho** (`carrinho.html`) persistente via `localStorage`: aumentar/diminuir quantidade, remover item, esvaziar, aviso de frete grátis progressivo.
- **Checkout** (`checkout.html`): formulário sem validação rigorosa, autopreenchimento de endereço por CEP (ViaCEP), 5 opções de entrega com frete dinâmico, 3 formas de pagamento (PIX com 5% off, cartão, boleto) e resumo em tempo real.
- **Confirmação** (`confirmacao.html`): número de pedido gerado, detalhes completos, próximos passos, botão para enviar o pedido ao WhatsApp e opção de imprimir.
- **Páginas institucionais**: Sobre, FAQ (acordeão) e Política de Privacidade (LGPD).

### Administração
- **Painel do lojista** (`admin.html`) com abas:
  - **Produtos**: criar, editar, excluir; campos de preço, preço antigo, estoque, emoji, selo, imagem (caminho/URL ou upload), descrições, opções de personalização, técnicas, destaque e ativo/inativo.
  - **Pedidos**: lista com cliente, contato, entrega, total e alteração de status.
  - **Newsletter**: inscritos e remoção.
  - Cards de estatísticas (produtos ativos, pedidos, receita, estoque baixo, inscritos).

### Identidade visual
- Paleta: Magenta `#E91E63`, Ciano `#00BCD4`, Amarelo `#FDD835`, neutros.
- Tipografia: **Poppins** (títulos) + **Roboto** (corpo).
- Elementos de marca: círculos coloridos, "✕" geométricos, raios, splash, cards inclinados e hover animados.
- Logo original do cliente em `images/logo-imaje.png`.
- Mobile-first, menu hambúrguer, `prefers-reduced-motion` respeitado, ARIA labels e HTML semântico.

---

## 🔗 URIs funcionais

| Caminho | Descrição | Parâmetros |
|---|---|---|
| `index.html` | Página inicial | — |
| `produtos.html` | Catálogo completo | `?cat=<categoria>`, `?q=<busca>` |
| `produto.html` | Detalhe do produto | `?id=<id do produto>` **(obrigatório)** |
| `carrinho.html` | Carrinho de compras | — |
| `checkout.html` | Finalização do pedido | — |
| `confirmacao.html` | Confirmação (lê o último pedido do `localStorage`) | — |
| `sobre.html` | Sobre a marca | — |
| `faq.html` | Perguntas frequentes | — |
| `privacidade.html` | Política de privacidade | — |
| `admin.html` | Painel do lojista | — |

**Categorias válidas em `?cat=`:** `Camisetas`, `Bottons`, `Adesivos`, `Chaveiros`, `Canecas`, `Decorativos 3D`, `Personalizados`, `Promoções` (usar codificação de URL, ex.: `Decorativos%203D`).

### API de dados (RESTful Table API)

| Método | Endpoint | Uso |
|---|---|---|
| GET | `tables/products?limit=500` | Lista o catálogo |
| GET | `tables/products/{id}` | Um produto |
| POST | `tables/products` | Cria produto (admin) |
| PATCH | `tables/products/{id}` | Atualiza produto (admin) |
| DELETE | `tables/products/{id}` | Remove produto (admin) |
| POST | `tables/orders` | Registra pedido no checkout |
| GET | `tables/orders` | Lista pedidos (admin) |
| PATCH | `tables/orders/{id}` | Atualiza status do pedido |
| POST | `tables/newsletter` | Inscrição na newsletter |
| GET | `tables/reviews` | Depoimentos aprovados |

---

## 🗄️ Modelo de dados

### `products`
`id`, `name`, `category`, `price`, `old_price`, `description`, `short_desc`, `image`, `emoji`, `badge`, `stock`, `techniques[]`, `options`, `featured`, `active`

> **Formato do campo `options`:** `Rótulo:valor1,valor2|Outro rótulo:`
> Com valores → vira um `<select>`. Sem valores → vira campo de texto livre.
> Exemplo: `Tamanho:P,M,G|Cor:Branca,Preta|Frase personalizada:`

### `orders`
`id`, `order_number`, `customer_name`, `email`, `phone`, `cep`, `address`, `complement`, `notes`, `shipping_method`, `shipping_cost`, `payment_method`, `items` (JSON string), `subtotal`, `total`, `status`

### `newsletter`
`id`, `email`, `source`

### `reviews`
`id`, `customer_name`, `city`, `rating`, `comment`, `product_ref`, `approved`

### Armazenamento no navegador
- `imaje_cart_v1` → itens do carrinho (persistente)
- `imaje_last_order` → último pedido, lido pela página de confirmação

---

## ⚠️ Limitações importantes (leia antes de publicar)

1. **O site NÃO cobra pagamentos.** Processar cartão/PIX exige uma chave secreta do Mercado Pago rodando em servidor — impossível em site estático sem expor a credencial. O checkout registra o pedido e encaminha o cliente ao WhatsApp, onde você envia o **link de pagamento oficial** do Mercado Pago. Este é o fluxo seguro e usual para lojas pequenas.
2. **O `admin.html` não é protegido por senha.** Qualquer senha em JavaScript é legível no código-fonte por qualquer visitante — seria segurança falsa. Enquanto não houver backend, evite divulgar o endereço. Para restringir de verdade, use as **regras de acesso do Hosted Deploy** (libera só e-mails autorizados) ou um painel com servidor.
3. **Frete com valores fixos.** Cotação real por CEP exige API autenticada dos Correios/Melhor Envio. Os valores atuais são estimativas configuráveis em `js/checkout.js`.
4. **Upload de imagem no admin** converte o arquivo em *data URL* (limite ~900 KB) — ótimo para teste, ruim para catálogo grande. Prefira colocar o arquivo em `images/` e referenciar o caminho.
5. **Dois bancos separados:** as linhas criadas no editor (pré-visualização) **não** aparecem no site publicado via Hosted Deploy, e vice-versa. Se precisar copiar o catálogo para produção, é possível fazer isso com comandos SQL no banco ao vivo.

---

## 🛠️ Como adicionar ou editar produtos

**Opção A — pelo painel (recomendado):** acesse `admin.html` → aba Produtos → "Novo produto". Preencha e salve. Nenhum campo é obrigatório.

**Opção B — editando o JSON:** altere `data/products.json`, que serve de catálogo reserva quando a API de tabelas não responde. Mantenha o mesmo formato dos objetos existentes.

**Trocar contatos da marca:** edite o objeto `IMAJE` no topo de `js/store.js`:
```js
const IMAJE = {
  whatsapp: '5531999999999',   // DDI + DDD + número, só dígitos
  email: 'contato@imaje.com.br',
  instagram: 'https://instagram.com/imaje',
  freeShippingFrom: 199,       // valor mínimo para frete grátis
};
```
Atualize também o telefone e o e-mail exibidos no rodapé dos arquivos `.html`.

---

## 🚧 Não implementado / próximos passos

- [ ] **Cobrança real** via Mercado Pago (exige função serverless ou backend para gerar a preferência de pagamento)
- [ ] **Login de clientes** e histórico de pedidos por conta
- [ ] **Cotação de frete em tempo real** (API Melhor Envio autenticada)
- [ ] **Cupons de desconto** e programa de fidelidade
- [ ] **Galeria com múltiplas fotos** por produto e zoom
- [ ] **Envio automático de e-mail** de confirmação (requer serviço externo, ex.: EmailJS)
- [ ] **Avaliações enviadas pelos clientes** com moderação no admin
- [ ] **Lista de desejos** (favoritos)
- [ ] **Proteção do admin** por regras de acesso do Hosted Deploy
- [ ] **Fotos reais dos produtos** substituindo os emojis de placeholder

---

## 📁 Estrutura de arquivos

```
index.html            página inicial
produtos.html         catálogo com filtros
produto.html          detalhe do produto
carrinho.html         carrinho
checkout.html         finalização
confirmacao.html      confirmação do pedido
sobre.html            sobre a marca
faq.html              perguntas frequentes
privacidade.html      política de privacidade
admin.html            painel do lojista
css/
  └── style.css       identidade visual completa
js/
  ├── store.js        dados, configuração da marca e carrinho
  ├── main.js         header, toasts, cards, newsletter, FAQ
  ├── home.js         página inicial
  ├── shop.js         catálogo (busca/filtros/ordenação)
  ├── product.js      detalhe do produto
  ├── cart.js         carrinho
  ├── checkout.js     checkout e frete
  ├── confirm.js      confirmação
  └── admin.js        painel administrativo
data/
  └── products.json   catálogo reserva (offline)
images/
  ├── logo-imaje.png            logo oficial
  ├── promo-broche-pioneiro.jpg
  ├── promo-adesivos.jpg
  └── promo-bottons-tamanhos.jpg
```

---

## 🚀 Publicação

Para colocar o site no ar, use a aba **Publish** do editor (publicação em um clique) ou solicite um **Hosted Deploy**.

**Tecnologias:** HTML5, CSS3 e JavaScript vanilla (sem build). Bibliotecas via CDN: Google Fonts (Poppins/Roboto) e Font Awesome 6. Compatível com Netlify, Vercel, GitHub Pages e qualquer hospedagem estática.

---

© Imaje — Imagine diferente.

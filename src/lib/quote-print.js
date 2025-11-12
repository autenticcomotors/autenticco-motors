// src/lib/quote-print.js
// Gera uma janela de impressão (Imprimir/Salvar em PDF) com visual preto/amarelo, tabela alinhada e total.
// Sem dependências externas.

const esc = (s = '') =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const Money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v || 0));

export const openQuotePrint = (docData) => {
  const {
    title,
    vehicle,
    periodText,
    items = [],
    total = 0,
    brand = 'AutenTicco Motors',
    site = 'www.autenticcomotors.com',
    whatsapp = '(11) 97507-1300',
    instagram = '@autenticcomotors',
    docId = '#0000',
    dateBR = '',
    notes = '',
  } = docData || {};

  // Monta linhas da tabela
  const rowsHtml = (items || [])
    .map((it) => {
      const label = esc(it.label || '');
      const val = Money(it.amountNumber || 0);
      return `
        <tr>
          <td class="td-left">${label}</td>
          <td class="td-right">${val}</td>
        </tr>
      `;
    })
    .join('');

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;

  const logoUrlCandidate = `${window.location.origin}/logo.png`;

  win.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${esc(title)} — ${esc(brand)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; }
  .header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    border-bottom: 4px solid #111; padding-bottom: 12px; margin-bottom: 18px;
  }
  .brand {
    display: flex; align-items: center; gap: 12px;
  }
  .brand .logo {
    width: 56px; height: 56px; border-radius: 8px; background: #111; display:flex; align-items:center; justify-content:center;
  }
  .brand .logo img { max-width: 56px; max-height: 56px; display: block; }
  .brand .name { font-weight: 900; font-size: 20px; letter-spacing: 0.2px; }
  .meta { text-align: right; font-size: 12px; color: #444; }
  .title {
    background: #ffd400; color: #000; padding: 10px 14px; border-radius: 10px;
    font-weight: 800; font-size: 18px; display:inline-block; margin-bottom: 8px;
  }
  .subtitle { font-size: 13px; color: #444; margin: 0 0 14px 0; }
  .pill { display:inline-block; background:#111; color:#fff; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
  .section { margin-top: 10px; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; }
  th { text-align: left; padding: 8px 10px; background: #111; color: #fff; font-weight: 800; font-size: 12px; }
  td { padding: 8px 10px; font-size: 13px; vertical-align: top; }
  .td-left { border-left: 2px solid #111; border-right: 1px solid #eee; }
  .td-right { text-align: right; border-right: 2px solid #111; }
  tr:nth-child(odd) td { background: #fafafa; }
  tr:last-child td { border-bottom: 2px solid #111; }
  .total {
    margin-top: 10px; text-align: right; font-weight: 900; font-size: 18px;
  }
  .notes { margin-top: 8px; font-size: 12px; color: #444; }
  .footer {
    margin-top: 18px; border-top: 4px solid #111; padding-top: 10px; font-size: 12px; color: #222;
    display:flex; align-items:center; justify-content:space-between; gap:12px;
  }
  .footer .links { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  .badge { display:inline-block; background:#ffd400; color:#000; padding:2px 8px; border-radius:999px; font-weight:800; }
  .muted { color:#666; }
  .nowrap { white-space: nowrap; }
  .small { font-size: 11px; }
</style>
</head>
<body>
  <header class="header">
    <div class="brand">
      <div class="logo">
        <img src="${logoUrlCandidate}" alt="Logo" onerror="this.style.display='none';this.parentElement.style.background='#ffd400';this.parentElement.textContent='A';this.parentElement.style.fontWeight='900';this.parentElement.style.color='#000';" />
      </div>
      <div class="name">${esc(brand)}</div>
    </div>
    <div class="meta">
      <div><span class="badge">${esc(docId)}</span></div>
      <div class="small muted">Data: ${esc(dateBR)}</div>
    </div>
  </header>

  <main>
    <div class="title">${esc(title)}</div>
    <div class="subtitle">
      <strong>Veículo:</strong> ${esc(vehicle)}
      ${periodText ? ` • <span class="pill">${esc(periodText)}</span>` : ''}
    </div>

    <section class="section">
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="nowrap" style="text-align:right;">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="total">Total: ${esc(Money(total))}</div>
      ${notes ? `<div class="notes"><strong>Obs.:</strong> ${esc(notes)}</div>` : ''}
    </section>
  </main>

  <footer class="footer">
    <div class="links">
      <span>Site: <strong>${esc(site)}</strong></span>
      <span>WhatsApp: <strong>${esc(whatsapp)}</strong></span>
      <span>Instagram: <strong>${esc(instagram)}</strong></span>
    </div>
    <div class="muted small">Documento gerado automaticamente.</div>
  </footer>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 300);
    };
  </script>
</body>
</html>
  `);

  win.document.close();
};


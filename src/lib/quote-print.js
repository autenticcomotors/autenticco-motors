// src/lib/quote-print.js
const currencyBR = (v = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export async function generateQuotePDF(data) {
  const primary = data?.theme?.primary || '#FACC15';
  const dark = data?.theme?.dark || '#111111';
  const company = data?.companyName || 'AutenTicco Motors';
  const siteUrl = data?.siteUrl || 'https://autenticcomotors.com.br';
  const contact = data?.contact || {};
  const contactLine = [
    contact.address ? `📍 ${contact.address}` : null,
    contact.phone ? `☎ ${contact.phone}` : null,
    contact.site ? `🌐 ${contact.site}` : null,
  ].filter(Boolean).join(' • ');

  const rows = (data.items || [])
    .map(
      (it) => `
        <tr>
          <td class="td-left">${escapeHTML(it.label || '')}</td>
          <td class="td-right">${currencyBR(it.amount || 0)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHTML(data.title || 'Relatório de Custos')}</title>

<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<style>
:root{--primary:${primary};--dark:${dark};}
*{box-sizing:border-box}
body{
  margin:0;
  font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  color:#0f172a; background:#fff;
}
.wrap{
  max-width:900px; margin:24px auto; padding:28px 24px 84px;
  border:1px solid #e5e7eb; border-radius:18px; position:relative;
  background:#fff; box-shadow:0 8px 30px rgba(0,0,0,.06);
}
/* Header */
header{
  display:flex; align-items:center; gap:16px;
  padding-bottom:16px; margin-bottom:20px;
  border-bottom:6px solid var(--primary);
}
.brand{display:flex; align-items:center; gap:14px;}
.brand img{height:60px; width:auto; object-fit:contain; border-radius:10px; background:#fff;}
.brand h1{margin:0; font-size:22px; line-height:1.2; font-weight:900; color:#0b0b0b;}
.brand .site{color:#64748b; font-size:12px}
.header-meta{margin-left:auto; text-align:right}
.badge{display:inline-block;background:var(--primary);color:#111;font-weight:800;font-size:11px;padding:5px 10px;border-radius:999px}
.meta-small{color:#64748b; font-size:12px; margin-top:6px}
/* Título */
h2.title{
  margin:0 0 16px 0; font-size:22px; font-weight:900; color:#0f172a;
  display:flex; align-items:center; gap:10px;
}
.title .dot{width:8px;height:8px;border-radius:999px;background:var(--primary);display:inline-block}
/* Cards */
.cards{display:flex; gap:14px; flex-wrap:wrap; margin-bottom:8px}
.card{
  flex:1 1 260px; background:#fff; border:1px solid #eaecef; border-radius:14px; padding:14px 16px;
  box-shadow:0 4px 16px rgba(0,0,0,.04);
}
.card .label{font-size:12px; color:#64748b; display:flex; align-items:center; gap:6px; margin-bottom:6px}
.card .value{font-size:14px; color:#0f172a; font-weight:600}
/* Tabela */
.table-wrap{
  margin-top:10px; border:1px solid #eaecef; border-radius:14px; overflow:hidden; background:#fff;
  box-shadow:0 4px 16px rgba(0,0,0,.04);
}
table{width:100%; border-collapse:separate; border-spacing:0}
thead th{
  background:#0f172a; color:#fff; text-align:left; padding:12px 14px; font-size:12px; letter-spacing:.02em;
}
tbody td{padding:12px 14px; font-size:14px; border-top:1px solid #f1f5f9}
tbody tr:nth-child(odd) td{background:#fbfdff}
.td-left{width:70%}
.td-right{text-align:right; width:30%}
tfoot td{
  padding:16px 14px; background:#f8fafc; font-weight:900; border-top:1px solid #e2e8f0;
}
/* Footer */
footer{
  position:fixed; left:0; right:0; bottom:0;
  border-top:2px solid var(--primary);
  background:#fff; padding:10px 16px 12px; font-size:12px; color:#0f172a; text-align:center;
}
.footer-line-1{font-weight:800}
.footer-line-2{margin-top:2px; color:#475569}
/* Print */
@media print{
  .wrap{border:none; box-shadow:none; margin:0; padding:18mm 12mm 24mm;}
  footer{position:fixed;}
}
.icon{display:inline-block;width:14px;height:14px;vertical-align:-2px;color:#0f172a}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        ${data.logoUrl ? `<img src="${escapeAttr(data.logoUrl)}" alt="Logo" />` : ''}
        <div>
          <h1>${escapeHTML(company)}</h1>
          <div class="site">${escapeHTML(siteUrl.replace(/^https?:\\/\\//,''))}</div>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge">Documento</span>
        <div class="meta-small">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>
    </header>

    <h2 class="title"><span class="dot"></span>${escapeHTML(data.title || 'Relatório de Custos')}</h2>

    <div class="cards">
      <div class="card">
        <div class="label">${svgCar()} Veículo</div>
        <div class="value">${escapeHTML(data.vehicle || '-')}</div>
      </div>
      <div class="card">
        <div class="label">${svgCalendar()} Período</div>
        <div class="value">${escapeHTML(data.period || 'até vender')}</div>
      </div>
      <div class="card">
        <div class="label">${svgMoney()} Total</div>
        <div class="value" style="font-size:16px">${currencyBR(data.total || 0)}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Item</th><th style="text-align:right">Preço (R$)</th></tr></thead>
        <tbody>
          ${rows || `<tr><td class="td-left">—</td><td class="td-right">${currencyBR(0)}</td></tr>`}
        </tbody>
        <tfoot>
          <tr><td class="td-left" style="text-align:right">Total</td><td class="td-right">${currencyBR(data.total || 0)}</td></tr>
        </tfoot>
      </table>
    </div>

    ${data.notes ? `
      <div class="cards" style="margin-top:14px">
        <div class="card" style="flex:1 1 100%">
          <div class="label">${svgInfo()} Observações</div>
          <div class="value" style="white-space:pre-wrap; font-weight:500">${escapeHTML(data.notes)}</div>
        </div>
      </div>` : ''}
  </div>

  <footer>
    <div class="footer-line-1">${escapeHTML(company)}</div>
    <div class="footer-line-2">${escapeHTML(contactLine || siteUrl.replace(/^https?:\\/\\//,''))}</div>
  </footer>
</body>
</html>`;

  // impressão via IFRAME oculto
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0'; iframe.style.bottom = '0';
  iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();

  await new Promise((resolve) => {
    const done = () => setTimeout(resolve, 220);
    if (doc.readyState === 'complete') {
      const imgs = Array.from(doc.images || []);
      if (imgs.length === 0) return done();
      let loaded = 0;
      imgs.forEach((img) => {
        const fin = () => { loaded++; if (loaded === imgs.length) done(); };
        if (img.complete) fin(); else { img.addEventListener('load', fin); img.addEventListener('error', fin); }
      });
    } else {
      doc.addEventListener('readystatechange', () => doc.readyState === 'complete' && done());
    }
  });

  try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
  finally { setTimeout(() => iframe.parentNode && iframe.parentNode.removeChild(iframe), 1500); }
}

// helpers
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str){ return String(str || '').replace(/"/g, '&quot;'); }

// Ícones inline (SVG minimalistas)
function svgCar(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5"/><path d="M5 16h14"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>';}
function svgCalendar(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';}
function svgMoney(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h5a2 2 0 100-4h-3m0 8h4"/></svg>';}
function svgInfo(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';}


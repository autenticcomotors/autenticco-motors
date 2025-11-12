// src/lib/quote-print.js
const currencyBR = (v = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export async function generateQuotePDF(data) {
  const primary = data?.theme?.primary || '#FACC15';
  const dark = data?.theme?.dark || '#111111';

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
<style>
:root{--primary:${primary};--dark:${dark};}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial,"Noto Sans",sans-serif;color:#111827;background:#fff}
.wrap{max-width:900px;margin:24px auto;padding:28px 22px 62px;border:1px solid #e5e7eb;border-radius:16px;position:relative;}
header{display:flex;align-items:center;gap:16px;border-bottom:4px solid var(--primary);padding-bottom:16px;margin-bottom:20px;}
.brand{display:flex;align-items:center;gap:12px;}
.brand img{height:56px;width:auto;object-fit:contain;border-radius:8px;background:#fff;}
.brand h1{margin:0;font-size:22px;line-height:1.2;font-weight:900;color:#111;}
.muted{color:#6b7280;font-size:12px}
.h-badge{display:inline-flex;gap:8px;align-items:center}
.h-pill{display:inline-block;background:var(--primary);color:#000;font-weight:800;font-size:11px;padding:4px 8px;border-radius:999px}
/* títulos e boxes */
h2.title{margin:0 0 12px 0;font-size:20px;font-weight:900;color:#111;}
.box{border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:14px;background:#fff;}
.label{font-size:12px;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.value{font-size:14px;color:#111}
/* tabela */
table{width:100%;border-collapse:separate;border-spacing:0;margin-top:10px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;}
thead th{background:#111;color:#fff;text-align:left;padding:10px 12px;font-size:12px;letter-spacing:.02em;}
tbody td{padding:10px 12px;border-top:1px solid #f3f4f6;font-size:14px;}
.td-left{width:70%;}
.td-right{text-align:right;width:30%;}
tfoot td{padding:14px 12px;background:#f9fafb;font-weight:900;border-top:1px solid #e5e7eb;}
.total-label{text-align:right;}
.total-value{text-align:right;color:#111;}
footer{position:fixed;left:0;right:0;bottom:0;border-top:2px solid var(--primary);background:#fff;padding:8px 16px;font-size:12px;color:#111;text-align:center;}
@media print{
  .wrap{border:none;margin:0;padding:20px 12mm 20mm 12mm;}
  footer{position:fixed;}
}
.icon{display:inline-block;width:14px;height:14px;vertical-align:-2px;color:#111}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        ${data.logoUrl ? `<img src="${escapeAttr(data.logoUrl)}" alt="logo" />` : ''}
        <div>
          <h1>AutenTicco Motors</h1>
          <div class="muted">${escapeHTML(data.siteUrl || 'autenticcomotors.com.br')}</div>
        </div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div class="h-badge"><span class="h-pill">Documento</span></div>
        <div class="muted">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>
    </header>

    <h2 class="title">${escapeHTML(data.title || 'Relatório de Custos')}</h2>

    <div class="box">
      <div class="label">${svgCar()} Veículo</div>
      <div class="value">${escapeHTML(data.vehicle || '-')}</div>
    </div>

    <div class="box" style="display:flex; gap:16px; flex-wrap:wrap">
      <div style="flex:1 1 240px">
        <div class="label">${svgCalendar()} Período</div>
        <div class="value">${escapeHTML(data.period || 'até vender')}</div>
      </div>
      <div style="flex:1 1 240px">
        <div class="label">${svgMoney()} Total</div>
        <div class="value" style="font-weight:900">${currencyBR(data.total || 0)}</div>
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th style="text-align:right">Preço (R$)</th></tr></thead>
      <tbody>
        ${rows || `<tr><td class="td-left">—</td><td class="td-right">${currencyBR(0)}</td></tr>`}
      </tbody>
      <tfoot>
        <tr><td class="total-label">Total</td><td class="total-value">${currencyBR(data.total || 0)}</td></tr>
      </tfoot>
    </table>

    ${data.notes ? `
      <div class="box" style="margin-top:14px">
        <div class="label">${svgInfo()} Observações</div>
        <div class="value" style="white-space:pre-wrap">${escapeHTML(data.notes)}</div>
      </div>` : ''}
  </div>

  <footer><strong>${escapeHTML(data.siteUrl || 'autenticcomotors.com.br')}</strong></footer>
</body>
</html>`;

  // impressão via IFRAME (sem popup)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
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

// ícones inline (SVGs simples)
function svgCar(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5"/><path d="M5 16h14"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>';}
function svgCalendar(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';}
function svgMoney(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h5a2 2 0 100-4h-3m0 8h4"/></svg>';}
function svgInfo(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';}


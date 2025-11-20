// src/lib/checklist-print.js

const MAP_DESC = {
  OK: 'Estado adequado',
  RD: 'Riscado',
  AD: 'Amassado',
  DD: 'Danificado',
  QD: 'Quebrado',
  FT: 'Falta',
};

export async function generateChecklistPDF(payload) {
  const primary = payload?.theme?.primary || '#FACC15';
  const dark = payload?.theme?.dark || '#111111';
  const company = payload?.companyName || 'AutenTicco Motors';
  const siteUrl = payload?.siteUrl || 'https://autenticcomotors.com.br';
  const contact = payload?.contact || {};
  const meta = payload?.meta || {};
  const externo = payload?.externo || [];
  const interno = payload?.interno || [];
  const observacoes = payload?.observacoes || '';

  const problemas = [...externo, ...interno].filter(
    (x) => x.status && x.status !== 'OK'
  );

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Checklist do veículo</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--primary:${primary};--dark:${dark}}
*{box-sizing:border-box}
body{
  margin:0;
  background:#fff;
  color:#0f172a;
  font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  font-size:11px;
}
.wrap{
  max-width:940px;
  margin:16px auto;
  padding:18px 18px 70px;
  border:1px solid #e5e7eb;
  border-radius:16px;
  background:#fff;
  box-shadow:0 6px 24px rgba(0,0,0,.05);
}
header{
  display:flex;
  align-items:center;
  gap:12px;
  padding-bottom:10px;
  margin-bottom:12px;
  border-bottom:4px solid var(--primary);
}
.brand{display:flex;align-items:center;gap:10px}
.brand img{
  height:46px;
  width:auto;
  object-fit:contain;
  border-radius:8px;
  background:#fff;
}
.brand h1{
  margin:0;
  font-size:18px;
  line-height:1.2;
  font-weight:900;
}
.brand .site{color:#64748b;font-size:11px}
.header-meta{margin-left:auto;text-align:right}
.badge{
  display:inline-block;
  background:var(--primary);
  color:#111;
  font-weight:800;
  font-size:10px;
  padding:4px 8px;
  border-radius:999px;
}
.meta-small{color:#64748b;font-size:10px;margin-top:4px}

.section-title{
  display:flex;
  align-items:center;
  gap:6px;
  margin:10px 0 6px;
  font-weight:800;
  font-size:11px;
}
.section-title .dot{
  width:7px;
  height:7px;
  border-radius:99px;
  background:var(--primary);
}

.cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:8px;
  margin:4px 0 8px;
}
.card{
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:8px 9px;
  background:#fff;
}
.card .label{font-size:10px;color:#64748b;margin-bottom:4px}
.card .value{font-size:12px;font-weight:700}

.alert{
  border:1px dashed #eab308;
  background:#fffbeb;
  border-radius:10px;
  padding:8px 9px;
  font-size:10px;
  margin-bottom:8px;
}
.alert .title{font-weight:800;margin-bottom:4px}
.alert ul{margin:4px 0 0 16px;padding:0}
.alert li{margin-bottom:2px}

.two-cols{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(0,1fr));
  gap:8px;
  margin:4px 0 10px;
}
.table{
  border:1px solid #e5e7eb;
  border-radius:10px;
  overflow:hidden;
  background:#fff;
}
table{width:100%;border-collapse:separate;border-spacing:0}
thead th{
  background:#0f172a;
  color:#fff;
  text-align:left;
  padding:6px 7px;
  font-size:10px;
}
tbody td{
  padding:5px 7px;
  font-size:10px;
  border-top:1px solid #f1f5f9;
}
tbody tr:nth-child(odd) td{background:#fbfdff}
td.status{width:80px}
td.note{width:140px;font-size:9px;color:#6b7280}

.badge-status{
  display:inline-block;
  padding:3px 6px;
  border-radius:999px;
  font-size:9px;
  font-weight:700;
}
.s-ok{background:#dcfce7;color:#065f46}
.s-rd,.s-ad,.s-dd,.s-qd,.s-ft{background:#0f172a;color:#fff}

.obs-card{
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:8px 9px;
  background:#fff;
  font-size:10px;
  white-space:pre-wrap;
}

footer{
  position:fixed;
  left:0;right:0;bottom:0;
  border-top:2px solid var(--primary);
  background:#fff;
  padding:6px 12px 8px;
  font-size:9px;
  text-align:center;
}
.footer-line-1{font-weight:800}
.footer-line-2{margin-top:2px;color:#475569}

@media print{
  .wrap{
    border:none;
    box-shadow:none;
    margin:0;
    padding:14mm 10mm 22mm;
  }
  footer{position:fixed}
}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        ${payload.logoUrl ? `<img src="${escapeAttr(payload.logoUrl)}" alt="Logo" />` : ''}
        <div>
          <h1>${esc(company)}</h1>
          <div class="site">${esc(siteUrl.replace(/^https?:\/\/(www\.)?/, ''))}</div>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge">Checklist</span>
        <div class="meta-small">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>
    </header>

    <div class="section-title"><span class="dot"></span>Resumo do veículo</div>
    <div class="cards">
      <div class="card"><div class="label">Veículo</div><div class="value">${esc(meta.veiculo || '—')}</div></div>
      <div class="card"><div class="label">Tipo</div><div class="value">${esc(meta.tipo || '—')}</div></div>
      <div class="card"><div class="label">Combustível</div><div class="value">${esc(meta.nivel || '—')}</div></div>
      <div class="card"><div class="label">FIPE</div><div class="value">${esc(meta.fipe || '—')}</div></div>
      <div class="card"><div class="label">Preço do anúncio</div><div class="value">${esc(meta.preco || '—')}</div></div>
    </div>

    <div class="section-title"><span class="dot"></span>Pendências principais</div>
    ${
      problemas.length
        ? `<div class="alert">
            <div class="title">${problemas.length} item(ns) requer(em) atenção</div>
            <ul>
              ${problemas
                .map(
                  (p) =>
                    `<li><b>${esc(p.nome)}</b>: ${esc(
                      MAP_DESC[p.status] || p.status || '—'
                    )}${
                      p.note ? ` — ${esc(p.note)}` : ''
                    }</li>`
                )
                .join('')}
            </ul>
          </div>`
        : `<div class="alert">
            <div class="title">Sem pendências relevantes</div>
            Todos os itens avaliados estão em estado adequado.
          </div>`
    }

    <div class="section-title"><span class="dot"></span>Detalhamento dos itens</div>
    <div class="two-cols">
      <div class="table">
        <table>
          <thead>
            <tr><th colspan="3">Parte externa</th></tr>
            <tr><th>Item</th><th>Status</th><th>Obs.</th></tr>
          </thead>
          <tbody>
            ${externo
              .map(
                (row) => `
              <tr>
                <td>${esc(row.nome)}</td>
                <td class="status">${renderStatus(row.status)}</td>
                <td class="note">${row.note ? esc(row.note) : ''}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="table">
        <table>
          <thead>
            <tr><th colspan="3">Documentos / interno</th></tr>
            <tr><th>Item</th><th>Status</th><th>Obs.</th></tr>
          </thead>
          <tbody>
            ${interno
              .map(
                (row) => `
              <tr>
                <td>${esc(row.nome)}</td>
                <td class="status">${renderStatus(row.status)}</td>
                <td class="note">${row.note ? esc(row.note) : ''}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${
      observacoes
        ? `
      <div class="section-title"><span class="dot"></span>Observações gerais</div>
      <div class="obs-card">${esc(observacoes)}</div>
    `
        : ''
    }

  </div>

  <footer>
    <div class="footer-line-1">${esc(company)}</div>
    <div class="footer-line-2">${
      esc(
        [
          contact.phone ? `☎ ${contact.phone}` : null,
          contact.email ? `✉ ${contact.email}` : null,
          contact.address ? `📍 ${contact.address}` : null,
          contact.site
            ? `🌐 ${contact.site}`
            : siteUrl.replace(/^https?:\/\/(www\.)?/, ''),
        ]
          .filter(Boolean)
          .join(' • ')
      )
    }</div>
  </footer>
</body>
</html>`;

  // imprime via iframe oculto
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
  doc.open();
  doc.write(html);
  doc.close();

  await waitForImages(doc);
  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } finally {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1500);
  }
}

// helpers
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return String(s || '').replace(/"/g, '&quot;');
}
function renderStatus(code) {
  if (!code)
    return '<span class="badge-status">—</span>';
  const cls = code === 'OK' ? 's-ok' : `s-${code.toLowerCase()}`;
  const txt = MAP_DESC[code] || code;
  return `<span class="badge-status ${cls}">${esc(txt)}</span>`;
}
async function waitForImages(doc) {
  await new Promise((resolve) => {
    const done = () => setTimeout(resolve, 150);
    if (doc.readyState === 'complete') {
      const imgs = Array.from(doc.images || []);
      if (imgs.length === 0) return done();
      let n = 0;
      imgs.forEach((img) => {
        const fin = () => {
          n++;
          if (n === imgs.length) done();
        };
        if (img.complete) fin();
        else {
          img.addEventListener('load', fin);
          img.addEventListener('error', fin);
        }
      });
    } else {
      doc.addEventListener('readystatechange', () => {
        if (doc.readyState === 'complete') done();
      });
    }
  });
}


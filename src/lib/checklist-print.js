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

  const problemas = [...externo, ...interno].filter((x) => x.status && x.status !== 'OK');

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
body{margin:0;background:#fff;color:#0f172a;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:940px;margin:24px auto;padding:28px 24px 88px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.06)}
header{display:flex;align-items:center;gap:16px;padding-bottom:16px;margin-bottom:20px;border-bottom:6px solid var(--primary)}
.brand{display:flex;align-items:center;gap:14px}
.brand img{height:60px;width:auto;object-fit:contain;border-radius:10px;background:#fff}
.brand h1{margin:0;font-size:22px;line-height:1.2;font-weight:900}
.brand .site{color:#64748b;font-size:12px}
.header-meta{margin-left:auto;text-align:right}
.badge{display:inline-block;background:var(--primary);color:#111;font-weight:800;font-size:11px;padding:5px 10px;border-radius:999px}
.meta-small{color:#64748b;font-size:12px;margin-top:6px}

.section-title{display:flex;align-items:center;gap:8px;margin:16px 0 10px;font-weight:900}
.section-title .dot{width:8px;height:8px;border-radius:99px;background:var(--primary)}

.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:6px 0 14px}
.card{border:1px solid #eaecef;border-radius:14px;padding:12px 14px;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.04)}
.card .label{font-size:12px;color:#64748b;margin-bottom:6px}
.card .value{font-size:14px;font-weight:700}

.table{border:1px solid #eaecef;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.04);margin-bottom:14px}
table{width:100%;border-collapse:separate;border-spacing:0}
thead th{background:#0f172a;color:#fff;text-align:left;padding:10px 12px;font-size:12px}
tbody td{padding:10px 12px;font-size:14px;border-top:1px solid #f1f5f9}
tbody tr:nth-child(odd) td{background:#fbfdff}
td.status{width:180px}
.badge-status{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:700}
.s-ok{background:#dcfce7;color:#065f46}
.s-rd,.s-ad,.s-dd,.s-qd,.s-ft{background:#0f172a;color:#fff}

.alert{border:1px dashed #eab308;background:#fffbeb;border-radius:14px;padding:12px 14px}
.alert .title{font-weight:800;margin-bottom:6px}
.alert ul{margin:6px 0 0 18px}

footer{position:fixed;left:0;right:0;bottom:0;border-top:2px solid var(--primary);background:#fff;padding:10px 16px 12px;font-size:12px;text-align:center}
.footer-line-1{font-weight:800}
.footer-line-2{margin-top:2px;color:#475569}

@media print{
  .wrap{border:none;box-shadow:none;margin:0;padding:18mm 12mm 24mm}
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
      <div class="card"><div class="label">Nível de combustível</div><div class="value">${esc(meta.nivel || '—')}</div></div>
      <div class="card"><div class="label">FIPE</div><div class="value">${esc(meta.fipe || '—')}</div></div>
      <div class="card"><div class="label">Preço do anúncio</div><div class="value">${esc(meta.preco || '—')}</div></div>
    </div>

    ${problemas.length ? `
      <div class="section-title"><span class="dot"></span>Pendências e observações principais</div>
      <div class="alert">
        <div class="title">${problemas.length} item(ns) requer(em) atenção</div>
        <ul>
          ${problemas.map(p => `<li><b>${esc(p.nome)}</b>: ${esc(MAP_DESC[p.status] || p.status || '—')}</li>`).join('')}
        </ul>
      </div>
    ` : `
      <div class="section-title"><span class="dot"></span>Pendências e observações principais</div>
      <div class="alert"><div class="title">Sem pendências</div>Todos os itens inspecionados estão em estado adequado.</div>
    `}

    <div class="section-title"><span class="dot"></span>Parte externa</div>
    <div class="table">
      <table>
        <thead><tr><th>Item</th><th class="status">Status</th></tr></thead>
        <tbody>
          ${externo.map(row => `
            <tr>
              <td>${esc(row.nome)}</td>
              <td class="status">
                ${renderStatus(row.status)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title"><span class="dot"></span>Documentos / Interno</div>
    <div class="table">
      <table>
        <thead><tr><th>Item</th><th class="status">Status</th></tr></thead>
        <tbody>
          ${interno.map(row => `
            <tr>
              <td>${esc(row.nome)}</td>
              <td class="status">
                ${renderStatus(row.status)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${observacoes ? `
      <div class="section-title"><span class="dot"></span>Observações adicionais</div>
      <div class="card" style="white-space:pre-wrap">${esc(observacoes)}</div>
    ` : ''}

  </div>

  <footer>
    <div class="footer-line-1">${esc(company)}</div>
    <div class="footer-line-2">${
      esc(
        [
          contact.phone ? `☎ ${contact.phone}` : null,
          contact.email ? `✉ ${contact.email}` : null,
          contact.address ? `📍 ${contact.address}` : null,
          contact.site ? `🌐 ${contact.site}` : siteUrl.replace(/^https?:\/\/(www\.)?/, ''),
        ].filter(Boolean).join(' • ')
      )
    }</div>
  </footer>
</body>
</html>`;

  // imprime via iframe oculto
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0'; iframe.style.bottom = '0';
  iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();

  await waitForImages(doc);
  try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
  finally { setTimeout(() => iframe.parentNode && iframe.parentNode.removeChild(iframe), 1500); }
}

// helpers
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function escapeAttr(s){return String(s||'').replace(/"/g,'&quot;')}
function renderStatus(code){
  if(!code) return '<span class="badge-status">—</span>';
  const cls = code==='OK' ? 's-ok' : `s-${code.toLowerCase()}`;
  const txt = MAP_DESC[code] || code;
  return `<span class="badge-status ${cls}">${esc(txt)}</span>`;
}
async function waitForImages(doc){
  await new Promise((resolve)=>{
    const done=()=>setTimeout(resolve,200);
    if(doc.readyState==='complete'){
      const imgs=Array.from(doc.images||[]);
      if(imgs.length===0) return done();
      let n=0;
      imgs.forEach(img=>{
        const fin=()=>{n++; if(n===imgs.length) done();};
        if(img.complete) fin(); else {img.addEventListener('load',fin); img.addEventListener('error',fin);}
      });
    }else{
      doc.addEventListener('readystatechange',()=>doc.readyState==='complete'&&done());
    }
  });
}


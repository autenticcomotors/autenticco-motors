// src/lib/checklist-print.js

function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function openChecklistPrintWindow(config) {
  const {
    logoUrl,
    company,
    siteUrl,
    carLabel,
    tipo,
    nivel,
    fipeValue,
    precoAnuncio,
    externos,
    internos,
    observacoesGerais,
    generatedAt,
  } = config;

  const dataLabel = generatedAt.toLocaleDateString('pt-BR');
  const horaLabel = generatedAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displaySite = siteUrl ? siteUrl.replace(/^https?:\/\//, '') : '';

  const fmtMoney = (v) => {
    if (v == null || v === '') return '—';
    const num = Number(v);
    if (!Number.isFinite(num)) return '—';
    return `R$ ${num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const temExternos = Array.isArray(externos) && externos.length > 0;
  const temInternos = Array.isArray(internos) && internos.length > 0;

  const rowsExternos = temExternos
    ? externos
        .map(
          (r) => `
      <tr>
        <td>${escapeHTML(r.nome)}</td>
        <td class="status">${escapeHTML(r.status || '')}</td>
        <td>${escapeHTML(r.obs || '')}</td>
      </tr>`
        )
        .join('')
    : `
      <tr>
        <td colspan="3" class="none">Nenhum item marcado.</td>
      </tr>`;

  const rowsInternos = temInternos
    ? internos
        .map(
          (r) => `
      <tr>
        <td>${escapeHTML(r.nome)}</td>
        <td class="status">${escapeHTML(r.status || '')}</td>
        <td>${escapeHTML(r.obs || '')}</td>
      </tr>`
        )
        .join('')
    : `
      <tr>
        <td colspan="3" class="none">Nenhum item marcado.</td>
      </tr>`;

  const resumoVeiculo = carLabel || 'Checklist de veículo';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHTML(company)} - ${escapeHTML(resumoVeiculo)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f3f4f6;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 24px 0;
    }
    .page {
      width: 210mm;
      margin: 0 auto;
      padding: 16px 24px 32px 24px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
      border: 1px solid #e5e7eb;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #facc15;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand img {
      height: 36px;
    }
    .brand h1 {
      font-size: 16px;
      font-weight: 800;
    }
    .brand .site {
      font-size: 10px;
      color: #6b7280;
    }
    .meta {
      text-align: right;
      font-size: 9px;
      color: #6b7280;
    }
    .meta .title {
      font-weight: 600;
      color: #111827;
    }
    h2.section-title {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .block {
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      padding: 8px 10px;
      margin-bottom: 10px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .field-grid {
      display: grid;
      grid-template-columns: 90px 1fr 70px 1fr;
      gap: 4px 8px;
      font-size: 10px;
    }
    .label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .value {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      border-radius: 999px;
      padding: 2px 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }
    .section-gap {
      margin-top: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    thead {
      background: #f3f4f6;
    }
    th, td {
      border-bottom: 1px solid #e5e7eb;
      padding: 3px 4px;
      text-align: left;
    }
    th {
      font-weight: 600;
      color: #4b5563;
      font-size: 9px;
    }
    td.status {
      width: 40px;
      text-align: center;
      font-weight: 600;
    }
    td.status span {
      display: inline-block;
      min-width: 28px;
      border-radius: 999px;
      padding: 1px 6px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    td.none {
      text-align: center;
      color: #9ca3af;
      font-style: italic;
      padding: 6px 4px;
    }
    .tables {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 4px;
    }
    .pendencias {
      font-size: 9px;
      line-height: 1.4;
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px dashed #f97316;
      background: #fffbeb;
      margin-top: 6px;
    }
    .pendencias-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 2px;
    }
    footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8px;
      color: #6b7280;
    }
    footer .left {
      font-weight: 600;
      color: #111827;
    }
    footer .right span {
      margin-left: 8px;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .page {
        box-shadow: none;
        margin: 0;
        border-radius: 0;
        border: none;
        page-break-after: always;
      }
      .page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="brand">
        ${logoUrl ? `<img src="${escapeHTML(logoUrl)}" alt="Logo" />` : ''}
        <div>
          <h1>${escapeHTML(company)}</h1>
          ${
            displaySite
              ? `<div class="site">${escapeHTML(displaySite)}</div>`
              : ''
          }
        </div>
      </div>
      <div class="meta">
        <div class="title">Checklist do veículo</div>
        <div>Gerado em ${escapeHTML(dataLabel)} ${escapeHTML(horaLabel)}</div>
      </div>
    </header>

    <section class="block">
      <h2 class="section-title">Resumo do veículo</h2>
      <div class="field-grid">
        <div class="label">Veículo</div>
        <div class="value">${escapeHTML(resumoVeiculo)}</div>
        <div class="label">Tipo</div>
        <div class="value">${escapeHTML(tipo || '—')}</div>

        <div class="label">FIPE</div>
        <div class="value">${fmtMoney(fipeValue)}</div>
        <div class="label">Preço do anúncio</div>
        <div class="value">${fmtMoney(precoAnuncio)}</div>

        <div class="label">Combustível</div>
        <div class="value">${escapeHTML(nivel || '—')}</div>
        <div></div>
        <div></div>
      </div>
    </section>

    <section class="block section-gap">
      <h2 class="section-title">Detalhamento dos itens</h2>
      <div class="tables">
        <div>
          <table>
            <thead>
              <tr>
                <th colspan="3">Parte externa</th>
              </tr>
              <tr>
                <th>Item</th>
                <th style="width: 40px; text-align:center;">Status</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsExternos}
            </tbody>
          </table>
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th colspan="3">Documentos / interno</th>
              </tr>
              <tr>
                <th>Item</th>
                <th style="width: 40px; text-align:center;">Status</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsInternos}
            </tbody>
          </table>
        </div>
      </div>

      ${
        observacoesGerais && observacoesGerais.trim()
          ? `<div class="pendencias">
               <div class="pendencias-title">Observações gerais / pendências</div>
               <div>${escapeHTML(observacoesGerais.trim())}</div>
             </div>`
          : ''
      }
    </section>

    <footer>
      <div class="left">${escapeHTML(company)}</div>
      <div class="right">
        <span>Tel: (11) 97507-1300</span>
        <span>E-mail: contato@autenticcomotors.com.br</span>
        <span>R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo - São Paulo - SP</span>
      </div>
    </footer>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-up está ativo.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = `${company} - ${resumoVeiculo}`;
  printWindow.focus();

  // pequeno delay pra garantir render antes do print
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (_) {
      // se der erro, só deixa a janela aberta
    }
  }, 400);
}


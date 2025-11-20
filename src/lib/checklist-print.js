// src/lib/checklist-print.js
// Gera o PDF de checklist no layout "multi páginas" preferido pelo dono.

const BLOCO_EXTERNO = [
  'Teto',
  'Capô',
  'Para-choque dianteiro',
  'Paralama dianteiro direito',
  'Porta dianteira direita',
  'Porta traseira direita',
  'Coluna traseira direita',
  'Tampa porta-malas',
  'Para-choque traseiro',
  'Coluna traseira esquerda',
  'Porta traseira esquerda',
  'Porta dianteira esquerda',
  'Paralama dianteiro esquerdo',
  'Retrovisores',
  'Vidros',
  'Teto solar',
  'Rodas',
  'Pneus dianteiros',
  'Pneus traseiros',
  'Calotas',
  'Faróis',
  'Lanternas',
];

const BLOCO_INTERNO = [
  'Documentação',
  'IPVA',
  'Histórico de manutenção',
  'Revisões concessionária',
  'Manual',
  'Chave reserva',
  'Único dono',
  'Estepe / triângulo',
  'Macaco / chave de rodas',
  'Tapetes',
  'Bancos',
  'Forros de porta',
  'Tapeçaria teto',
  'Cinto de segurança',
  'Volante',
  'Manopla / câmbio / freio',
  'Pedais',
  'Extintor',
  'Som',
  'Multimídia',
  'Buzina',
  'Ar-condicionado',
  'Parte elétrica',
  'Trava / alarme',
  'Motor',
  'Câmbio',
  'Suspensão',
  'Freios / embreagem',
];

const statusLabel = (code) => {
  switch (code) {
    case 'OK':
      return 'Estado adequado';
    case 'RD':
      return 'Riscado';
    case 'AD':
      return 'Amassado';
    case 'DD':
      return 'Danificado';
    case 'QD':
      return 'Quebrado';
    case 'FT':
      return 'Falta';
    default:
      return '—';
  }
};

const statusClass = (code) => {
  if (code === 'OK') return 'status-ok';
  if (!code) return 'status-empty';
  return 'status-alert';
};

const capitalize = (str = '') =>
  String(str || '')
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());

const formatMoneyBR = (n) => {
  if (!n && n !== 0) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDateTimeBR = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const dia = String(dt.getDate()).padStart(2, '0');
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const ano = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano}, ${hh}:${mm}`;
};

const escapeHTML = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * itens pode estar em dois formatos:
 * - { [nome]: 'OK' }
 * - { [nome]: { status: 'OK', obs: '80%' } }
 */
const getItemData = (itens, nome) => {
  const raw = itens ? itens[nome] : undefined;
  if (!raw) return { statusCode: '', obs: '' };

  if (typeof raw === 'string') {
    return { statusCode: raw, obs: '' };
  }

  if (typeof raw === 'object' && raw !== null) {
    return { statusCode: raw.status || '', obs: raw.obs || '' };
  }

  return { statusCode: '', obs: '' };
};

const buildRowsHTML = (labels, itens) => {
  const rows = [];

  for (const nome of labels) {
    const { statusCode, obs } = getItemData(itens, nome);
    // Regra de funcionamento atual: só mostra se tiver status OU observação
    if (!statusCode && !obs) continue;

    rows.push({
      nome,
      statusCode,
      obs,
    });
  }

  if (!rows.length) {
    return `
      <tr class="row-empty">
        <td colspan="3">Nenhum item marcado.</td>
      </tr>
    `;
  }

  return rows
    .map((row) => {
      const statusTxt = statusLabel(row.statusCode);
      const cls = statusClass(row.statusCode);
      const obsTxt = row.obs ? escapeHTML(row.obs) : '—';
      return `
        <tr>
          <td class="cell-item">${escapeHTML(row.nome)}</td>
          <td class="cell-status ${cls}">${escapeHTML(statusTxt)}</td>
          <td class="cell-obs">${obsTxt}</td>
        </tr>
      `;
    })
    .join('');
};

const buildResumoPendencias = (itens) => {
  const allLabels = [...BLOCO_EXTERNO, ...BLOCO_INTERNO];
  let totalMarcados = 0;
  let comProblema = 0;

  for (const nome of allLabels) {
    const { statusCode } = getItemData(itens, nome);
    if (!statusCode) continue;
    totalMarcados++;
    if (statusCode !== 'OK') comProblema++;
  }

  if (!totalMarcados) {
    return {
      titulo: 'Checklist incompleto',
      texto: 'Nenhum item foi marcado ainda. Revise o veículo e preencha o checklist para gerar um relatório completo.',
    };
  }

  if (comProblema === 0) {
    return {
      titulo: 'Sem pendências relevantes',
      texto: 'Todos os itens avaliados estão em estado adequado.',
    };
  }

  return {
    titulo: 'Pendências identificadas',
    texto: `Foram identificados ${comProblema} item(s) com ressalvas. Consulte o detalhamento abaixo para ver os pontos de atenção.`,
  };
};

export function printChecklist({ car, tipo, nivel, itens, observacoes }) {
  if (typeof window === 'undefined') return;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Não foi possível abrir a janela de impressão. Verifique o bloqueio de pop-ups.');
    return;
  }

  const now = new Date();
  const dataHora = formatDateTimeBR(now);

  const tituloVeiculo = car
    ? `${car.brand || ''} ${car.model || ''} ${car.year ? `(${car.year})` : ''}`.trim()
    : 'Checklist de veículo';

  const docTitle = `AutenTicco Motors - ${tituloVeiculo || 'Checklist de veículo'}`;

  const fipe = car?.fipe_value ? formatMoneyBR(car.fipe_value) : '—';
  const price = car?.price ? formatMoneyBR(car.price) : '—';
  const tipoLabel = tipo ? capitalize(tipo) : '—';
  const combustivel = nivel || '—';

  const { titulo: pendTitulo, texto: pendTexto } = buildResumoPendencias(itens || {});
  const pendTituloEsc = escapeHTML(pendTitulo);
  const pendTextoEsc = escapeHTML(pendTexto);

  const observacoesTrim = (observacoes || '').trim();
  const hasObsGerais = !!observacoesTrim;

  const externoRowsHTML = buildRowsHTML(BLOCO_EXTERNO, itens || {});
  const internoRowsHTML = buildRowsHTML(BLOCO_INTERNO, itens || {});

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHTML(docTitle)}</title>
    <style>
      * {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f3f4f6;
        color: #111827;
      }
      body {
        padding: 24px 0;
      }
      .page {
        width: 210mm;
        margin: 0 auto 24px auto;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
        padding: 24px 28px 32px 28px;
        position: relative;
      }
      .page:last-of-type {
        margin-bottom: 0;
      }
      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }
        .page {
          width: auto;
          margin: 0;
          box-shadow: none;
          border-radius: 0;
          page-break-after: always;
        }
        .page:last-of-type {
          page-break-after: auto;
        }
      }
      .header-top {
        display: flex;
        justify-content: flex-end;
        font-size: 10px;
        color: #6b7280;
        margin-bottom: 6px;
      }
      .header-top span + span {
        margin-left: 8px;
      }
      .header-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .brand-logo {
        height: 32px;
        width: auto;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        font-size: 11px;
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .brand-site {
        color: #6b7280;
      }
      .doc-title-right {
        text-align: right;
        font-size: 10px;
      }
      .doc-title-right .title {
        font-weight: 600;
      }
      .divider {
        border-bottom: 3px solid #facc15;
        margin: 10px 0 20px 0;
      }
      .section-title {
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .grid-resumo {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        font-size: 11px;
        margin-bottom: 16px;
      }
      .card-resumo {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 8px 10px;
        background: #f9fafb;
      }
      .card-label {
        font-size: 9px;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 2px;
      }
      .card-value {
        font-size: 11px;
        font-weight: 500;
      }
      .card-resumo strong {
        font-weight: 600;
      }
      .card-pendencias {
        border-radius: 10px;
        border: 1px dashed #facc15;
        background: #fffbeb;
        padding: 8px 10px;
        font-size: 10px;
        margin-bottom: 18px;
      }
      .card-pendencias-title {
        font-weight: 600;
        margin-bottom: 2px;
      }
      .card-pendencias-text {
        color: #4b5563;
      }
      .card-pendencias small {
        display: block;
        color: #6b7280;
        margin-top: 4px;
      }
      .grid-detalhes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        font-size: 10px;
      }
      .box-table {
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }
      .box-header {
        background: #f9fafb;
        padding: 6px 10px;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 600;
        font-size: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      thead {
        background: #f3f4f6;
      }
      th, td {
        padding: 4px 8px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      th {
        font-weight: 600;
        font-size: 9px;
        color: #6b7280;
      }
      td {
        font-size: 9px;
      }
      .cell-item {
        width: 45%;
      }
      .cell-status {
        width: 30%;
        white-space: nowrap;
      }
      .cell-obs {
        width: 25%;
        text-align: right;
        white-space: nowrap;
      }
      .status-ok {
        color: #047857;
        font-weight: 600;
      }
      .status-alert {
        color: #b91c1c;
        font-weight: 600;
      }
      .status-empty {
        color: #9ca3af;
      }
      .row-empty td {
        text-align: center;
        padding: 10px 8px;
        color: #9ca3af;
        font-style: italic;
      }
      .observacoes-gerais {
        margin-top: 16px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        padding: 8px 10px;
        font-size: 10px;
      }
      .observacoes-gerais strong {
        display: block;
        margin-bottom: 4px;
      }
      .footer {
        font-size: 8px;
        color: #6b7280;
        border-top: 2px solid #facc15;
        margin-top: 18px;
        padding-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .footer-left {
        font-weight: 600;
      }
      .footer-right span + span {
        margin-left: 6px;
      }
      .footer-right span::before {
        content: "• ";
      }
      .footer-right span:first-child::before {
        content: "";
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header-top">
        <span>${escapeHTML(formatDateTimeBR(now).split(',')[0])}</span>
        <span>Checklist do veículo</span>
      </div>

      <div class="header-main">
        <div class="brand">
          <img src="${window.location.origin}/src/assets/logo.png" alt="AutenTicco Motors" class="brand-logo" />
          <div class="brand-text">
            <span class="brand-name">AutenTicco Motors</span>
            <span class="brand-site">autenticcomotors.com.br</span>
          </div>
        </div>
        <div class="doc-title-right">
          <div class="title">Checklist</div>
          <div>Gerado em ${escapeHTML(dataHora)}</div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section-title">Resumo do veículo</div>
      <div class="grid-resumo">
        <div class="card-resumo">
          <div class="card-label">Veículo</div>
          <div class="card-value">${escapeHTML(tituloVeiculo || '—')}</div>
        </div>
        <div class="card-resumo">
          <div class="card-label">Tipo</div>
          <div class="card-value">${escapeHTML(tipoLabel || '—')}</div>
        </div>
        <div class="card-resumo">
          <div class="card-label">Combustível</div>
          <div class="card-value">${escapeHTML(combustivel || '—')}</div>
        </div>
        <div class="card-resumo">
          <div class="card-label">FIPE</div>
          <div class="card-value">${escapeHTML(fipe)}</div>
        </div>
      </div>

      <div class="grid-resumo" style="margin-top:-8px;">
        <div class="card-resumo">
          <div class="card-label">Preço do anúncio</div>
          <div class="card-value">${escapeHTML(price)}</div>
        </div>
      </div>

      <div class="card-pendencias">
        <div class="card-pendencias-title">${pendTituloEsc}</div>
        <div class="card-pendencias-text">${pendTextoEsc}</div>
        ${
          hasObsGerais
            ? `<small>Observações gerais: ${escapeHTML(observacoesTrim)}</small>`
            : ''
        }
      </div>

      <div class="section-title">Detalhamento dos itens</div>

      <div class="grid-detalhes">
        <div class="box-table">
          <div class="box-header">Parte externa</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th style="text-align:right;">Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${externoRowsHTML}
            </tbody>
          </table>
        </div>

        <div class="box-table">
          <div class="box-header">Documentos / interno</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th style="text-align:right;">Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${internoRowsHTML}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">
        <div class="footer-left">AutenTicco Motors</div>
        <div class="footer-right">
          <span>☎ (11) 97507-1300</span>
          <span>✉ contato@autenticcomotors.com</span>
          <span>📍 R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo, São Paulo - SP</span>
          <span>🌐 autenticcomotors.com.br</span>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Pequeno delay para garantir que o logo e estilos carreguem antes do print
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
}


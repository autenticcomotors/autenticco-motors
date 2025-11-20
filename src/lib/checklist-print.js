// src/lib/checklist-print.js
import logoUrl from '@/assets/logo.png';

/**
 * Gera a página de impressão do checklist em layout A4,
 * com tabelas compactas, margem inferior segura e nome
 * de arquivo sugerido: "AutenTicco Motors - <veículo>".
 */
export function generateChecklistPDF({ car, tipo, nivel, itens, observacoes }) {
  if (typeof window === 'undefined') return;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Não foi possível abrir a janela de impressão.');
    return;
  }

  const now = new Date();
  const dataTexto = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const carLabel =
    car && (car.brand || car.model)
      ? `${car.brand || ''} ${car.model || ''}${
          car.year ? ` ${car.year}` : ''
        }${car.plate ? ` • ${car.plate}` : ''}`.trim()
      : 'Checklist do veículo';

  const fuelLabel = nivel || '—';

  const tipoLabel = (() => {
    if (tipo === 'assessoria') return 'assessoria';
    if (tipo === 'entrega') return 'entrega';
    return 'compra';
  })();

  const fipeLabel = car?.fipe_value
    ? `R$ ${Number(car.fipe_value).toLocaleString('pt-BR')}`
    : '—';

  const precoLabel = car?.price
    ? `R$ ${Number(car.price).toLocaleString('pt-BR')}`
    : '—';

  // itens pode ter formato antigo (string) ou novo ({ status, obs })
  const parseItem = (nome) => {
    const raw = itens?.[nome];
    if (!raw) return { status: '—', obs: '' };

    if (typeof raw === 'string') {
      return { status: raw, obs: '' };
    }

    return {
      status: raw.status || '—',
      obs: raw.obs || '',
    };
  };

  const statusToText = (code) => {
    switch (code) {
      case 'OK':
        return 'Estado adequado';
      case 'RD':
        return 'Risco / arranhão';
      case 'AD':
        return 'Amassado';
      case 'DD':
        return 'Dano mais grave';
      case 'QD':
        return 'Quebrado';
      case 'FT':
        return 'Falta / ausente';
      case '—':
      default:
        return '—';
    }
  };

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

  // Só considera códigos de itens realmente marcados (status diferente de "—")
  const codigosMarcados = Object.values(itens || {})
    .map((raw) => (typeof raw === 'string' ? raw : raw.status))
    .filter((c) => c && c !== '—');

  let resumoPendencias = null;

  if (codigosMarcados.length) {
    const temGrave = codigosMarcados.some(
      (c) => c === 'DD' || c === 'QD' || c === 'FT',
    );
    const temLeve = codigosMarcados.some((c) => c === 'RD' || c === 'AD');

    if (!temGrave && !temLeve) {
      resumoPendencias = {
        titulo: 'Sem pendências relevantes',
        texto: 'Todos os itens avaliados estão em estado adequado.',
      };
    } else if (temGrave) {
      resumoPendencias = {
        titulo: 'Pendências importantes',
        texto: 'Há itens com danos relevantes (DD, QD ou FT). Avalie antes da negociação.',
      };
    } else {
      resumoPendencias = {
        titulo: 'Pendências leves',
        texto: 'Foram identificados pequenos desgastes (RD ou AD).',
      };
    }
  }
  // se não tiver nenhum marcado, simplesmente não mostra o bloco de pendências

  const escapeHTML = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const siteUrl = 'https://autenticcomotors.com.br';
  const company = 'AutenTicco Motors';

  const pageTitle = `AutenTicco Motors - ${carLabel}`;
  win.document.title = pageTitle;

  // monta linhas só com itens marcados (status != "—" OU com observação)
  const makeRows = (lista) =>
    lista
      .map((nome) => {
        const { status, obs } = parseItem(nome);
        const hasStatus = status && status !== '—';
        const hasObs = !!obs;

        if (!hasStatus && !hasObs) return null;

        const statusText = statusToText(hasStatus ? status : '—');
        const statusClass = hasStatus && status === 'OK' ? 'status-ok' : 'status-other';
        const obsClass = hasObs ? 'obs-text' : 'obs-text muted';
        const obsText = hasObs ? obs : '—';

        return `
          <tr>
            <td>${escapeHTML(nome)}</td>
            <td class="${statusClass}">${escapeHTML(statusText)}</td>
            <td class="${obsClass}">${escapeHTML(obsText)}</td>
          </tr>
        `;
      })
      .filter(Boolean)
      .join('');

  const rowsExterno = makeRows(BLOCO_EXTERNO);
  const rowsInterno = makeRows(BLOCO_INTERNO);

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHTML(pageTitle)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 10mm 18mm 10mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11px;
      color: #111827;
      background: #f3f4f6;
    }
    .page {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 12px 0 0 0;
    }
    .page-inner {
      background: #ffffff;
      padding: 16px 24px 40px 24px; /* padding-bottom maior p/ afastar do rodapé */
      border-radius: 0;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .logo-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-box img {
      height: 38px;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .logo-text .name {
      font-weight: 800;
      letter-spacing: 0.02em;
      font-size: 14px;
    }
    .logo-text .site {
      font-size: 10px;
      color: #6b7280;
    }
    .doc-meta {
      text-align: right;
      font-size: 10px;
      color: #6b7280;
    }
    .doc-meta .title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 2px;
    }
    .divider {
      border-bottom: 2px solid #facc15;
      margin: 6px 0 14px 0;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #111827;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 6px 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .card-label {
      font-size: 9px;
      color: #6b7280;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card-value {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      word-break: break-word;
    }
    .summary-block {
      border-radius: 10px;
      border: 1px dashed #facc15;
      background: #fffbeb;
      padding: 6px 8px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .summary-title {
      font-size: 10px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 2px;
    }
    .summary-text {
      font-size: 10px;
      color: #92400e;
    }
    .items-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .table-wrapper {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 6px 8px;
      page-break-inside: avoid;
    }
    .table-title {
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    thead {
      background: #f9fafb;
    }
    th, td {
      padding: 3px 4px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th:first-child,
    td:first-child {
      padding-left: 0;
    }
    th:last-child,
    td:last-child {
      padding-right: 0;
    }
    th {
      text-align: left;
      color: #6b7280;
      font-weight: 600;
    }
    .status-ok {
      color: #047857;
      font-weight: 600;
    }
    .status-other {
      color: #111827;
      font-weight: 600;
    }
    .obs-text {
      color: #111827;
    }
    .obs-text.muted {
      color: #9ca3af;
    }
    .bottom-notes {
      margin-top: 10px;
      font-size: 9px;
      color: #6b7280;
      border-radius: 10px;
      border: 1px dashed #d1d5db;
      padding: 6px 8px;
      page-break-inside: avoid;
    }
    footer {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      font-size: 9px;
      color: #6b7280;
      padding: 4px 24px 0 24px;
    }
    footer .line {
      border-bottom: 2px solid #facc15;
      margin-bottom: 2px;
    }
    footer .content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    footer .brand {
      font-weight: 700;
    }
    footer .contacts span {
      margin-right: 6px;
      white-space: nowrap;
    }

    @media screen {
      body {
        padding: 16px 0;
      }
      .page-inner {
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      }
      footer {
        padding-bottom: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-inner">
      <header>
        <div class="logo-box">
          <img src="${logoUrl}" alt="Logo AutenTicco Motors" />
          <div class="logo-text">
            <div class="name">AutenTicco Motors</div>
            <div class="site">autenticcomotors.com.br</div>
          </div>
        </div>
        <div class="doc-meta">
          <div class="title">Checklist do veículo</div>
          <div>Gerado em ${escapeHTML(dataTexto)}</div>
        </div>
      </header>
      <div class="divider"></div>

      <section>
        <div class="section-title">Resumo do veículo</div>
        <div class="grid-3">
          <div class="card">
            <div class="card-label">Veículo</div>
            <div class="card-value">${escapeHTML(carLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">Tipo</div>
            <div class="card-value">${escapeHTML(tipoLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">Combustível</div>
            <div class="card-value">${escapeHTML(fuelLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">FIPE</div>
            <div class="card-value">${escapeHTML(fipeLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">Preço do anúncio</div>
            <div class="card-value">${escapeHTML(precoLabel)}</div>
          </div>
        </div>
      </section>

      ${
        resumoPendencias
          ? `<section>
              <div class="section-title">Pendências principais</div>
              <div class="summary-block">
                <div class="summary-title">${escapeHTML(resumoPendencias.titulo)}</div>
                <div class="summary-text">${escapeHTML(resumoPendencias.texto)}</div>
              </div>
            </section>`
          : ''
      }

      <section>
        <div class="section-title">Detalhamento dos itens</div>
        <div class="items-grid">
          <div class="table-wrapper">
            <div class="table-title">Parte externa</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Item</th>
                  <th style="width: 30%;">Status</th>
                  <th style="width: 20%;">Obs.</th>
                </tr>
              </thead>
              <tbody>
                ${
                  rowsExterno ||
                  '<tr><td colspan="3" class="obs-text muted">Nenhum item marcado.</td></tr>'
                }
              </tbody>
            </table>
          </div>

          <div class="table-wrapper">
            <div class="table-title">Documentos / interno</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Item</th>
                  <th style="width: 30%;">Status</th>
                  <th style="width: 20%;">Obs.</th>
                </tr>
              </thead>
              <tbody>
                ${
                  rowsInterno ||
                  '<tr><td colspan="3" class="obs-text muted">Nenhum item marcado.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      ${
        observacoes
          ? `<section class="bottom-notes">
              <b>Observações gerais:</b><br />
              ${escapeHTML(observacoes)}
            </section>`
          : ''
      }
    </div>
  </div>

  <footer>
    <div class="line"></div>
    <div class="content">
      <div class="brand">AutenTicco Motors</div>
      <div class="contacts">
        <span>☎ (11) 97507-1300</span>
        <span>✉ contato@autenticcomotors.com</span>
        <span>📍 R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo - São Paulo - SP</span>
        <span>🌐 autenticcomotors.com.br</span>
      </div>
    </div>
  </footer>
</body>
</html>`);

  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}


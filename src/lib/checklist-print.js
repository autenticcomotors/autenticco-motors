// src/lib/checklist-print.js

// Abre uma nova janela com o HTML pronto para impressão do checklist
// Mantém compatibilidade com o Checklist.jsx, que chama com { items: itens }
export function openChecklistPrintWindow({
  car,
  items = {},          // <- mantém o nome "items"
  observacoes = '',
  tipo = '',
  nivel = '',
}) {
  const allItems = items || {};

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

  // Normaliza o formato do item:
  // - se vier string: "OK" -> { status: "OK", obs: "" }
  // - se vier objeto: { status, obs }
  const getEntry = (nome) => {
    const raw = allItems[nome];
    if (!raw) return { status: '', obs: '' };
    if (typeof raw === 'string') {
      return { status: raw || '', obs: '' };
    }
    if (typeof raw === 'object') {
      return {
        status: (raw.status || '').trim(),
        obs: (raw.obs || '').trim(),
      };
    }
    return { status: '', obs: '' };
  };

  const getStatus = (nome) => getEntry(nome).status;
  const getObs = (nome) => getEntry(nome).obs;

  const externosMarcados = BLOCO_EXTERNO.filter((nome) => !!getStatus(nome));
  const internosMarcados = BLOCO_INTERNO.filter((nome) => !!getStatus(nome));
  const anyMarcado =
    externosMarcados.length > 0 || internosMarcados.length > 0;

  const resumoVeiculo = car
    ? `${car.brand || ''} ${car.model || ''} ${
        car.year ? `(${car.year})` : ''
      } ${car.plate ? `• ${car.plate}` : ''}`
    : '';

  const hoje = new Date();
  const dataStr = hoje.toLocaleDateString('pt-BR');
  const horaStr = hoje.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Checklist do veículo</title>
  <style>
    @page {
      margin: 10mm 8mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f1f5f9;
      color: #020617;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 14mm 16mm 18mm;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 9px;
      color: #64748b;
      margin-bottom: 8mm;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .company-name {
      font-size: 11px;
      font-weight: 700;
      color: #020617;
    }
    .company-site {
      font-size: 9px;
      color: #0f172a;
    }
    .header-right {
      text-align: right;
      font-size: 9px;
      color: #64748b;
    }
    .yellow-bar {
      height: 3px;
      width: 100%;
      background: #facc15;
      border-radius: 999px;
      margin-bottom: 8mm;
    }
    .section-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 8mm;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #0f172a;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      font-size: 9px;
    }
    .field {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 4px 6px;
    }
    .field-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 9px;
      color: #020617;
    }
    .alert-card {
      border-radius: 10px;
      border: 1px dashed #facc15;
      background: #fefce8;
      padding: 8px 10px;
      font-size: 9px;
      color: #854d0e;
      margin-bottom: 8mm;
    }
    .alert-title {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .items-section-title {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6mm;
      font-size: 9px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      font-size: 9px;
    }
    thead th {
      text-align: left;
      font-weight: 600;
      padding: 3px 4px;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
    }
    tbody td {
      padding: 2px 4px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .col-item {
      width: 45%;
    }
    .col-status {
      width: 15%;
      text-align: center;
    }
    .col-obs {
      width: 40%;
    }
    .no-items {
      padding: 6px 4px;
      font-size: 9px;
      color: #94a3b8;
    }
    .observacoes-gerais {
      font-size: 9px;
      margin-top: 6mm;
      border-radius: 10px;
      border: 1px dashed #e2e8f0;
      background: #f8fafc;
      padding: 8px 10px;
    }
    .observacoes-gerais .label {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .footer {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid #facc15;
      font-size: 8px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-weight: 500;
      color: #0f172a;
    }
    .footer-right span {
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <div class="company-name">AutenTicco Motors</div>
        <div class="company-site">autenticcomotors.com.br</div>
      </div>
      <div class="header-right">
        <div>Checklist do veículo</div>
        <div>${dataStr} • ${horaStr}</div>
      </div>
    </div>

    <div class="yellow-bar"></div>

    <div class="section-card">
      <div class="section-title">Resumo do veículo</div>
      <div class="summary-grid">
        <div class="field">
          <div class="field-label">Veículo</div>
          <div class="field-value">${resumoVeiculo || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Tipo de checklist</div>
          <div class="field-value">${tipo || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Combustível</div>
          <div class="field-value">${nivel || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Preço do anúncio</div>
          <div class="field-value">
            ${
              car && car.price
                ? 'R$ ' + Number(car.price).toLocaleString('pt-BR')
                : '—'
            }
          </div>
        </div>
      </div>
    </div>

    ${
      anyMarcado
        ? ''
        : `<div class="alert-card">
             <div class="alert-title">Checklist incompleto</div>
             <div>Nenhum item foi marcado ainda. Revise o veículo e preencha o checklist para gerar um relatório completo.</div>
           </div>`
    }

    <div class="section-card">
      <div class="items-section-title">Detalhamento dos itens</div>
      <div class="columns">
        <div>
          <div style="font-size:9px;font-weight:600;margin-bottom:2px;">Parte externa</div>
          <table>
            <thead>
              <tr>
                <th class="col-item">Item</th>
                <th class="col-status">Status</th>
                <th class="col-obs">Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${
                externosMarcados.length === 0
                  ? `<tr><td colspan="3" class="no-items">Nenhum item marcado.</td></tr>`
                  : externosMarcados
                      .map((nome) => {
                        const st = getStatus(nome);
                        const obs = getObs(nome);
                        return `<tr>
                          <td class="col-item">${nome}</td>
                          <td class="col-status">${st}</td>
                          <td class="col-obs">${obs}</td>
                        </tr>`;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
        <div>
          <div style="font-size:9px;font-weight:600;margin-bottom:2px;">Documentos / interno</div>
          <table>
            <thead>
              <tr>
                <th class="col-item">Item</th>
                <th class="col-status">Status</th>
                <th class="col-obs">Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${
                internosMarcados.length === 0
                  ? `<tr><td colspan="3" class="no-items">Nenhum item marcado.</td></tr>`
                  : internosMarcados
                      .map((nome) => {
                        const st = getStatus(nome);
                        const obs = getObs(nome);
                        return `<tr>
                          <td class="col-item">${nome}</td>
                          <td class="col-status">${st}</td>
                          <td class="col-obs">${obs}</td>
                        </tr>`;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    ${
      observacoes
        ? `<div class="observacoes-gerais">
             <div class="label">Observações gerais / pendências</div>
             <div>${observacoes}</div>
           </div>`
        : ''
    }

    <div class="footer">
      <div class="footer-left">AutenTicco Motors</div>
      <div class="footer-right">
        <span>(11) 97507-1300</span>
        <span>contato@autenticcomotors.com.br</span>
        <span>R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo, São Paulo - SP</span>
        <span>autenticcomotors.com.br</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  if (car && car.brand && car.model) {
    printWindow.document.title = `AutenTicco Motors - ${car.brand} ${car.model}`;
  } else {
    printWindow.document.title = 'AutenTicco Motors - Checklist do veículo';
  }

  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}


/**
 * ═══════════════════════════════════════════════════════════
 * GOOGLE APPS SCRIPT — DIM+ SAÚDE: Recebedor de Contratos
 * ═══════════════════════════════════════════════════════════
 *
 * INSTRUÇÕES DE INSTALAÇÃO (5 passos):
 *
 * 1. Abra https://sheets.google.com e crie uma planilha nova.
 *    Renomeie a aba para: Contratos
 *
 * 2. No menu superior: Extensões → Apps Script
 *
 * 3. Apague o código existente e cole TODO este arquivo.
 *
 * 4. Salve (Ctrl+S). Depois clique em "Implantar" → 
 *    "Nova implantação":
 *      - Tipo: Aplicativo da Web
 *      - Executar como: Eu mesmo (sua conta Google)
 *      - Quem pode acessar: Qualquer pessoa (anônimo)
 *    Clique em "Implantar" → copie a URL gerada.
 *
 * 5. Abra o index.html, localize a linha:
 *      const APPS_SCRIPT_URL = 'SUA_URL_APPS_SCRIPT_AQUI';
 *    e substitua pela URL copiada no passo 4.
 *    Salve e faça commit no GitHub.
 *
 * Pronto! Cada contrato salvo aparece como nova linha na planilha.
 * ═══════════════════════════════════════════════════════════
 */

const SHEET_NAME   = 'Contratos';
const SHEET_DEPS   = 'Dependentes';

// Cabeçalhos da aba principal
const HEADERS_CONTRATOS = [
  'Timestamp', 'Vendedor(a)', 'Nome Titular', 'CPF', 'Idade', 'Sexo',
  'Nascimento', 'Endereço', 'Bairro', 'Cidade', 'CEP', 'E-mail',
  'Telefone', 'Plano', 'Forma Pgto', 'Vencimento', 'Qtd Dependentes'
];

// Cabeçalhos da aba de dependentes
const HEADERS_DEPS = [
  'Timestamp', 'CPF Titular', 'Nome Titular', '#', 'Nome Dep.',
  'CPF Dep.', 'Parentesco', 'Nascimento', 'Idade', 'Sexo',
  'Endereço', 'Bairro', 'CEP'
];

/**
 * Recebe POST do formulário HTML
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();

    // ─── Aba Contratos ───────────────────────────────────────
    let sheetC = ss.getSheetByName(SHEET_NAME);
    if (!sheetC) {
      sheetC = ss.insertSheet(SHEET_NAME);
      sheetC.appendRow(HEADERS_CONTRATOS);
      sheetC.setFrozenRows(1);
      formatarCabecalho(sheetC, HEADERS_CONTRATOS.length);
    }

    sheetC.appendRow([
      data.timestamp    || new Date().toISOString(),
      data.vendedor     || '',
      data.nome         || '',
      data.cpf          || '',
      data.idade        || '',
      data.sexo         || '',
      data.nascimento   || '',
      data.endereco     || '',
      data.bairro       || '',
      data.cidade       || '',
      data.cep          || '',
      data.email        || '',
      data.telefone     || '',
      data.plano        || '',
      data.pagamento    || '',
      data.vencimento   ? 'Dia ' + data.vencimento : '',
      data.qtdDeps      || 0
    ]);

    // ─── Aba Dependentes ─────────────────────────────────────
    if (data.dependentes) {
      let deps = [];
      try { deps = JSON.parse(data.dependentes); } catch(_) {}
      deps = deps.filter(d => d.nome && d.nome.trim());

      if (deps.length > 0) {
        let sheetD = ss.getSheetByName(SHEET_DEPS);
        if (!sheetD) {
          sheetD = ss.insertSheet(SHEET_DEPS);
          sheetD.appendRow(HEADERS_DEPS);
          sheetD.setFrozenRows(1);
          formatarCabecalho(sheetD, HEADERS_DEPS.length);
        }
        deps.forEach((d, i) => {
          sheetD.appendRow([
            data.timestamp   || '',
            data.cpf         || '',
            data.nome        || '',
            i + 1,
            d.nome           || '',
            d.cpf            || '',
            d.parentesco     || '',
            d.nasc           || '',
            d.idade          || '',
            d.sexo           || '',
            [d.end, d.num].filter(Boolean).join(', '),
            d.bairro         || '',
            d.cep            || ''
          ]);
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Erro: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Permite testar via GET (abrir URL no browser)
 */
function doGet(e) {
  return ContentService
    .createTextOutput('DIM+ Saúde — Apps Script ativo ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Formata cabeçalho da planilha com cor DIM+
 */
function formatarCabecalho(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground('#0f2545');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontSize(11);
  sheet.setFrozenRows(1);
  // Auto-resize
  for (let i = 1; i <= numCols; i++) {
    sheet.setColumnWidth(i, 150);
  }
}

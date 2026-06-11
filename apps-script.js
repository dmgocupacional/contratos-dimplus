/**
 * ═══════════════════════════════════════════════════════════
 * GOOGLE APPS SCRIPT v1.1 — DIM+ SAÚDE
 * ═══════════════════════════════════════════════════════════
 * POST ?action=save  → grava contrato
 * GET  ?action=list  → retorna lista de contratos (JSON)
 * ═══════════════════════════════════════════════════════════
 */

const SHEET_NAME = 'Contratos';
const SHEET_DEPS = 'Dependentes';

const HEADERS_CONTRATOS = [
  'Timestamp','Vendedor(a)','Nome Titular','CPF','Idade','Sexo',
  'Nascimento','Endereço','Bairro','Cidade','CEP','E-mail',
  'Telefone','Plano','Forma Pgto','Vencimento','Qtd Dependentes','Assinatura'
];
const HEADERS_DEPS = [
  'Timestamp','CPF Titular','Nome Titular','#','Nome Dep.',
  'CPF Dep.','Parentesco','Nascimento','Idade','Sexo',
  'Endereço','Bairro','CEP'
];

// ─── POST: salvar contrato ─────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let sheetC = ss.getSheetByName(SHEET_NAME);
    if (!sheetC) {
      sheetC = ss.insertSheet(SHEET_NAME);
      sheetC.appendRow(HEADERS_CONTRATOS);
      formatarCabecalho(sheetC, HEADERS_CONTRATOS.length);
    }

    sheetC.appendRow([
      data.timestamp  || new Date().toISOString(),
      data.vendedor   || '',
      data.nome       || '',
      data.cpf        || '',
      data.idade      || '',
      data.sexo       || '',
      data.nascimento || '',
      data.endereco   || '',
      data.bairro     || '',
      data.cidade     || '',
      data.cep        || '',
      data.email      || '',
      data.telefone   || '',
      data.plano      || '',
      data.pagamento  || '',
      data.vencimento ? 'Dia ' + data.vencimento : '',
      data.qtdDeps    || 0,
      data.assinatura || 'NÃO'
    ]);

    // Dependentes
    if (data.dependentes) {
      let deps = [];
      try { deps = JSON.parse(data.dependentes); } catch(_) {}
      deps = deps.filter(d => d.nome && d.nome.trim());
      if (deps.length > 0) {
        let sheetD = ss.getSheetByName(SHEET_DEPS);
        if (!sheetD) {
          sheetD = ss.insertSheet(SHEET_DEPS);
          sheetD.appendRow(HEADERS_DEPS);
          formatarCabecalho(sheetD, HEADERS_DEPS.length);
        }
        deps.forEach((d, i) => {
          sheetD.appendRow([
            data.timestamp || '',
            data.cpf       || '',
            data.nome      || '',
            i + 1,
            d.nome         || '',
            d.cpf          || '',
            d.parentesco   || '',
            d.nasc         || '',
            d.idade        || '',
            d.sexo         || '',
            [d.end, d.num].filter(Boolean).join(', '),
            d.bairro       || '',
            d.cep          || ''
          ]);
        });
      }
    }

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    Logger.log('Erro POST: ' + err.toString());
    return jsonResponse({ status: 'error', msg: err.toString() });
  }
}

// ─── GET: listar contratos ─────────────────────────────────
function doGet(e) {
  const action = e?.parameter?.action || '';

  if (action === 'list') {
    try {
      const ss     = SpreadsheetApp.getActiveSpreadsheet();
      const sheet  = ss.getSheetByName(SHEET_NAME);
      if (!sheet) return jsonResponse({ contratos: [] });

      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return jsonResponse({ contratos: [] });

      const headers = rows[0].map(h => String(h).trim());
      const contratos = rows.slice(1).reverse().map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
        // Normaliza campos para o frontend
        return {
          timestamp:   obj['Timestamp']      || '',
          vendedor:    obj['Vendedor(a)']     || '',
          nome:        obj['Nome Titular']    || '',
          cpf:         obj['CPF']             || '',
          idade:       obj['Idade']           || '',
          sexo:        obj['Sexo']            || '',
          nascimento:  obj['Nascimento']      || '',
          endereco:    obj['Endereço']        || '',
          bairro:      obj['Bairro']          || '',
          cidade:      obj['Cidade']          || '',
          cep:         obj['CEP']             || '',
          email:       obj['E-mail']          || '',
          telefone:    obj['Telefone']        || '',
          plano:       obj['Plano']           || '',
          pagamento:   obj['Forma Pgto']      || '',
          vencimento:  (obj['Vencimento']||'').replace('Dia ',''),
          qtdDeps:     obj['Qtd Dependentes'] || '0',
          assinatura:  obj['Assinatura']      || '',
          dependentes: getDependentes(ss, obj['CPF'] || '')
        };
      });

      return jsonResponse({ contratos });
    } catch (err) {
      Logger.log('Erro GET list: ' + err.toString());
      return jsonResponse({ contratos: [], error: err.toString() });
    }
  }

  // Health check
  return ContentService
    .createTextOutput('DIM+ Saúde Apps Script v1.1 ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ─── Busca dependentes pelo CPF titular ───────────────────
function getDependentes(ss, cpfTitular) {
  if (!cpfTitular) return '[]';
  try {
    const sheet = ss.getSheetByName(SHEET_DEPS);
    if (!sheet) return '[]';
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return '[]';
    const headers = rows[0];
    const cpfIdx = headers.indexOf('CPF Titular');
    if (cpfIdx < 0) return '[]';
    const deps = rows.slice(1)
      .filter(r => String(r[cpfIdx]) === String(cpfTitular))
      .map(r => ({
        nome:       String(r[4]||''),
        cpf:        String(r[5]||''),
        parentesco: String(r[6]||''),
        nasc:       String(r[7]||''),
        idade:      String(r[8]||''),
        sexo:       String(r[9]||''),
        end:        String(r[10]||''),
        bairro:     String(r[11]||''),
        cep:        String(r[12]||'')
      }));
    return JSON.stringify(deps);
  } catch(_) { return '[]'; }
}

// ─── Helpers ──────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatarCabecalho(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground('#0f2545');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontSize(11);
  sheet.setFrozenRows(1);
  for (let i = 1; i <= numCols; i++) sheet.setColumnWidth(i, 160);
}

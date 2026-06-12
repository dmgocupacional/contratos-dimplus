// Deploy: 2026-06-12 11:34
// Deploy automático via GitHub Actions + clasp

const SHEET_CONTRATOS = 'Contratos';
const SHEET_DEPS      = 'Dependentes';
const SHEET_USUARIOS  = 'Usuarios';

const HDR_CONTRATOS = ['Timestamp','Vendedor','Email Vendedor','Nome Titular','CPF','Idade','Sexo','Nascimento','Endereço','Bairro','Cidade','CEP','E-mail','Telefone','Plano','Forma Pgto','Vencimento','Status','Qtd Deps','Assinatura'];
const HDR_DEPS      = ['Timestamp','CPF Titular','Nome Titular','#','Nome','CPF','Parentesco','Nascimento','Idade','Sexo','Endereço','Bairro','CEP'];
const HDR_USUARIOS  = ['Email','Nome','Senha Hash','Papel','Ativo'];

// ─── POST ─────────────────────────────────────────────────
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const action = d.action || 'save';
    if (action === 'login')        return handleLogin(d);
    if (action === 'saveUser')     return handleSaveUser(d);
    if (action === 'updateStatus') return handleUpdateStatus(d);
    if (action === 'save')         return handleSave(d);
    return jsonOk({ status: 'unknown action' });
  } catch(err) {
    Logger.log(err);
    return jsonErr(err.toString());
  }
}

// ─── GET ──────────────────────────────────────────────────
function doGet(e) {
  const action = e?.parameter?.action || '';
  if (action === 'list')      return handleList(e.parameter);
  if (action === 'listUsers') return handleListUsers();
  return ContentService.createTextOutput('DIM+ Saúde v1.2 ✓').setMimeType(ContentService.MimeType.TEXT);
}

// ─── LOGIN ────────────────────────────────────────────────
function handleLogin(d) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_USUARIOS, HDR_USUARIOS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    // Primeiro acesso: criar gestor padrão
    criarUsuarioPadrao(sheet);
    return jsonOk({ ok: false, msg: 'Sem usuários. Conta padrão criada: henrique.paludo@dimeg.com.br / Dimplus@2024' });
  }
  const hash = hashSenha(d.senha || '');
  for (let i = 1; i < rows.length; i++) {
    const [email, nome, senhaHash, papel, ativo] = rows[i];
    if (String(email).toLowerCase() === String(d.email || '').toLowerCase() &&
        String(senhaHash) === hash && String(ativo) !== 'false') {
      return jsonOk({ ok: true, email: String(email), nome: String(nome), papel: String(papel) });
    }
  }
  return jsonOk({ ok: false });
}

// ─── SAVE USER ────────────────────────────────────────────
function handleSaveUser(d) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_USUARIOS, HDR_USUARIOS);
  const rows  = sheet.getDataRange().getValues();
  const emailOrig = (d.emailOriginal || d.email || '').toLowerCase();
  // Verificar e-mail duplicado em novo usuário
  if (!d.emailOriginal) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === emailOrig)
        return jsonOk({ ok: false, msg: 'E-mail já cadastrado.' });
    }
  }
  // Procurar linha existente
  let rowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === emailOrig) { rowIdx = i; break; }
  }
  const senhaHash = d.senha ? hashSenha(d.senha) : (rowIdx >= 0 ? String(rows[rowIdx][2]) : '');
  const newRow = [d.email || d.emailOriginal, d.nome, senhaHash, d.papel || 'vendedor', d.ativo !== false && d.ativo !== 'false'];
  if (rowIdx >= 0) {
    sheet.getRange(rowIdx + 1, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }
  return jsonOk({ ok: true });
}

// ─── UPDATE STATUS ────────────────────────────────────────
function handleUpdateStatus(d) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONTRATOS);
  if (!sheet) return jsonOk({ ok: false });
  const rows = sheet.getDataRange().getValues();
  const hdrs = rows[0];
  const cpfIdx  = hdrs.indexOf('CPF');
  const tsIdx   = hdrs.indexOf('Timestamp');
  const stIdx   = hdrs.indexOf('Status');
  if (stIdx < 0) return jsonOk({ ok: false, msg: 'Coluna Status não encontrada' });
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][cpfIdx]) === String(d.cpf) && String(rows[i][tsIdx]) === String(d.timestamp)) {
      sheet.getRange(i + 1, stIdx + 1).setValue(d.status);
      return jsonOk({ ok: true });
    }
  }
  return jsonOk({ ok: false, msg: 'Contrato não encontrado' });
}

// ─── SAVE CONTRACT ────────────────────────────────────────
function handleSave(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetC = getOrCreateSheet(ss, SHEET_CONTRATOS, HDR_CONTRATOS);
  sheetC.appendRow([
    d.timestamp||new Date().toISOString(), d.vendedor||'', d.email_vendedor||'',
    d.nome||'', d.cpf||'', d.idade||'', d.sexo||'', d.nascimento||'',
    d.endereco||'', d.bairro||'', d.cidade||'', d.cep||'',
    d.email||'', d.telefone||'', d.plano||'', d.pagamento||'',
    d.vencimento?'Dia '+d.vencimento:'', d.status||'Ativo',
    d.qtdDeps||0, d.assinatura||'NÃO'
  ]);
  // Dependentes
  if (d.dependentes) {
    let deps = []; try { deps = JSON.parse(d.dependentes); } catch(_) {}
    deps = deps.filter(x => x.nome && x.nome.trim());
    if (deps.length > 0) {
      const sheetD = getOrCreateSheet(ss, SHEET_DEPS, HDR_DEPS);
      deps.forEach((dep, i) => sheetD.appendRow([
        d.timestamp||'', d.cpf||'', d.nome||'', i+1,
        dep.nome||'', dep.cpf||'', dep.parentesco||'', dep.nasc||'',
        dep.idade||'', dep.sexo||'',
        [dep.end, dep.num].filter(Boolean).join(', '),
        dep.bairro||'', dep.cep||''
      ]));
    }
  }
  return jsonOk({ status: 'ok' });
}

// ─── LIST CONTRACTS ───────────────────────────────────────
function handleList(params) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONTRATOS);
  if (!sheet) return jsonOk({ contratos: [] });
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return jsonOk({ contratos: [] });
  const hdrs  = rows[0];
  const filtroVendedor = params?.vendedor || '';
  const contratos = rows.slice(1).reverse().map(row => {
    const obj = {};
    hdrs.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
    return {
      timestamp:  obj['Timestamp']||'',
      vendedor:   obj['Vendedor']||'',
      nome:       obj['Nome Titular']||'',
      cpf:        obj['CPF']||'',
      idade:      obj['Idade']||'',
      sexo:       obj['Sexo']||'',
      nascimento: obj['Nascimento']||'',
      endereco:   obj['Endereço']||'',
      bairro:     obj['Bairro']||'',
      cidade:     obj['Cidade']||'',
      cep:        obj['CEP']||'',
      email:      obj['E-mail']||'',
      telefone:   obj['Telefone']||'',
      plano:      obj['Plano']||'',
      pagamento:  obj['Forma Pgto']||'',
      vencimento: (obj['Vencimento']||'').replace('Dia ',''),
      status:     obj['Status']||'Ativo',
      qtdDeps:    obj['Qtd Deps']||'0',
      dependentes: getDependentes(ss, obj['CPF']||'')
    };
  }).filter(c => !filtroVendedor || c.vendedor === filtroVendedor);
  return jsonOk({ contratos });
}

// ─── LIST USERS ───────────────────────────────────────────
function handleListUsers() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USUARIOS);
  if (!sheet) return jsonOk({ usuarios: [] });
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return jsonOk({ usuarios: [] });
  const usuarios = rows.slice(1).map(row => ({
    email: String(row[0]||''), nome: String(row[1]||''),
    papel: String(row[3]||'vendedor'), ativo: String(row[4]||'true')
  }));
  return jsonOk({ usuarios });
}

// ─── HELPERS ──────────────────────────────────────────────
function getDependentes(ss, cpf) {
  if (!cpf) return '[]';
  try {
    const sheet = ss.getSheetByName(SHEET_DEPS);
    if (!sheet) return '[]';
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return '[]';
    const hdrs  = rows[0];
    const cpfI  = hdrs.indexOf('CPF Titular');
    if (cpfI < 0) return '[]';
    const deps = rows.slice(1)
      .filter(r => String(r[cpfI]) === String(cpf))
      .map(r => ({ nome:String(r[4]||''), cpf:String(r[5]||''), parentesco:String(r[6]||''), nasc:String(r[7]||''), idade:String(r[8]||''), sexo:String(r[9]||''), end:String(r[10]||''), bairro:String(r[11]||''), cep:String(r[12]||'') }));
    return JSON.stringify(deps);
  } catch(_) { return '[]'; }
}

function hashSenha(senha) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, senha, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function criarUsuarioPadrao(sheet) {
  sheet.appendRow(['henrique.paludo@dimeg.com.br', 'Henrique Paludo', hashSenha('2026'), 'gestor', true]);
  sheet.appendRow(['rayane.godoy@dimeg.com.br', 'Rayane Godoy', hashSenha('2026'), 'vendedor', true]);
  sheet.appendRow(['shaukanson@dimeg.com.br', 'Shaukanson', hashSenha('2026'), 'vendedor', true]);
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const r = sheet.getRange(1, 1, 1, headers.length);
    r.setBackground('#0f2545'); r.setFontColor('#ffffff'); r.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOk(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function jsonErr(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg })).setMimeType(ContentService.MimeType.JSON);
}

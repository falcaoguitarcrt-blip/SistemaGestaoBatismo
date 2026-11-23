/**
 * Planilha espelho do Sistema de Gestão de Batismo
 * ------------------------------------------------
 * Lê os dados do Firebase (projeto batismo-8c5f8) e escreve, nesta planilha,
 * abas próprias com o prefixo "Sistema · ": "Sistema · Batismo", uma
 * "Sistema · Ordem NN" por turma e "Sistema · Sobre".
 *
 * Nenhuma aba é apagada e nenhum dado existente das abas originais é alterado ou retirado, então
 * o script pode ser instalado na planilha original sem mexer nos dados dela.
 * As abas "Sistema · " são SOMENTE PARA CONSULTA: o que for digitado nelas é
 * apagado na próxima atualização. Cadastros e alterações são feitos no sistema.
 *
 * Atualização instantânea (opcional): publicado como app da Web, o script
 * recebe um aviso do site logo depois de cada cadastro, edição ou marcação e
 * atualiza a planilha na hora. A atualização periódica continua como reserva.
 *
 * Funciona de dois jeitos:
 *  - vinculado à planilha (Extensões → Apps Script), com menu "Batismo";
 *  - avulso (projeto em script.google.com), com a propriedade do script
 *    "planilhaId" apontando para a planilha. As funções são rodadas no editor.
 *
 * Instalação: veja planilha-espelho/LEIA-ME.md no repositório.
 */

var PROJECT_ID = 'batismo-8c5f8';
var INTERVAL_MINUTES = 5; // 1, 5, 10, 15 ou 30
var PREFIXO = 'Sistema · ';
// Se true, acrescenta dados novos do site nas abas originais (Batismo e Ordem
// Batismo NN). DESLIGADO: as abas originais não recebem nenhuma escrita do script.
var ESCREVER_NAS_ABAS_ORIGINAIS = false;
var COL_PRESENTE = 'PRESENTE (SISTEMA)';
var COL_BATIZADO = 'BATIZADO (SISTEMA)';
var FIRESTORE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents';

/* ===================== Menu e agendamento ===================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Batismo')
    .addItem('Atualizar agora', 'atualizarAgora')
    .addSeparator()
    .addItem('Ativar atualização automática', 'ativarAtualizacaoAutomatica')
    .addItem('Desativar atualização automática', 'desativarAtualizacaoAutomatica')
    .addSeparator()
    .addItem('Ativar atualização instantânea', 'ativarAtualizacaoInstantanea')
    .addItem('Desativar atualização instantânea', 'desativarAtualizacaoInstantanea')
    .addSeparator()
    .addItem('Usar a planilha como fonte do site', 'ativarPlanilhaComoFonte')
    .addItem('Voltar a cadastrar pelo site', 'desativarPlanilhaComoFonte')
    .addToUi();
}

function ativarAtualizacaoAutomatica() {
  desativarAtualizacaoAutomatica();
  ScriptApp.newTrigger('atualizarPlanilha').timeBased().everyMinutes(INTERVAL_MINUTES).create();
  atualizarPlanilha(true);
  avisar('A planilha será atualizada a cada ' + INTERVAL_MINUTES + ' minutos.');
}

/** Mostra um aviso na planilha (script vinculado) ou no registro (script avulso). */
function avisar(msg) {
  Logger.log(msg);
  try { var ss = SpreadsheetApp.getActive(); if (ss) ss.toast(msg, 'Batismo', 6); } catch (ignored) {}
}

/** UI da planilha, ou null quando o script é avulso e roda pelo editor. */
function uiOuNull() {
  try { return SpreadsheetApp.getUi(); } catch (e) { return null; }
}

function desativarAtualizacaoAutomatica() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'atualizarPlanilha') ScriptApp.deleteTrigger(t);
  });
}

/* ===================== Atualização instantânea ===================== */

function ativarAtualizacaoInstantanea() {
  var ui = uiOuNull();
  var props = PropertiesService.getScriptProperties();
  var url;
  if (ui) {
    var resp = ui.prompt('Atualização instantânea',
      'Antes, publique este script: Implantar → Nova implantação → tipo "App da Web" → ' +
      'Executar como: Eu → Quem pode acessar: Qualquer pessoa → Implantar.\n\n' +
      'Cole aqui o URL do app da Web (termina em /exec):', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    url = String(resp.getResponseText() || '').trim();
  } else {
    // Script avulso: o URL fica na propriedade do script "urlWebApp".
    url = String(props.getProperty('urlWebApp') || '').trim();
  }
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    var msg = 'O endereço do app da Web precisa começar com https://script.google.com/ e terminar em /exec.' + (ui ? '' : ' Grave-o na propriedade do script "urlWebApp".');
    if (ui) { ui.alert('URL inválido', msg, ui.ButtonSet.OK); return; }
    throw new Error(msg);
  }
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('tokenInstantaneo', token);
  props.setProperty('planilhaId', planilha().getId());
  // Grava URL e token no Firebase, onde só contas autorizadas leem. O site usa
  // esses dados para avisar a planilha depois de cada alteração.
  var camposSync = {
    url: { stringValue: url },
    token: { stringValue: token },
    ativadoEm: { timestampValue: new Date().toISOString() }
  };
  if (props.getProperty('fonte') === 'planilha') camposSync.fonte = { stringValue: 'planilha' };
  props.setProperty('urlWebApp', url);
  firestorePatch('appData/primary', { planilhaSync: { mapValue: { fields: camposSync } } }, ['planilhaSync']);
  var ok = 'Atualização instantânea ativada: cada cadastro, edição ou marcação feita no site atualiza a planilha em poucos segundos. Recarregue o site nos aparelhos que já estavam abertos.';
  if (ui) ui.alert('Atualização instantânea ativada', ok, ui.ButtonSet.OK); else Logger.log(ok);
}

function desativarAtualizacaoInstantanea() {
  PropertiesService.getScriptProperties().deleteProperty('tokenInstantaneo');
  // Sem o campo no corpo, a máscara remove planilhaSync do documento.
  firestorePatch('appData/primary', {}, ['planilhaSync']);
  avisar('Atualização instantânea desativada. A atualização periódica continua.');
}

/* ===================== Planilha como fonte do site ===================== */

/**
 * Faz o site ler os cadastros e a ordem direto da planilha (abas Batismo e
 * Ordem Batismo NN). O site deixa de cadastrar e editar pessoas; turmas, datas
 * e marcações do dia continuam no sistema. Requer a atualização instantânea ativa.
 */
function ativarPlanilhaComoFonte() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('tokenInstantaneo')) throw new Error('Ative antes a atualização instantânea (ativarAtualizacaoInstantanea).');
  props.setProperty('fonte', 'planilha');
  firestorePatch('appData/primary', { planilhaSync: { mapValue: { fields: { fonte: { stringValue: 'planilha' } } } } }, ['planilhaSync.fonte']);
  avisar('O site agora lê os cadastros desta planilha. Recarregue o site nos aparelhos abertos.');
}

function desativarPlanilhaComoFonte() {
  PropertiesService.getScriptProperties().deleteProperty('fonte');
  firestorePatch('appData/primary', {}, ['planilhaSync.fonte']);
  avisar('O site voltou a usar os cadastros do sistema.');
}

/** Valores crus das duas primeiras abas originais, no formato que o site importa. */
function dadosDaPlanilha() {
  var ss = planilha();
  var tz = ss.getSpreadsheetTimeZone();
  var abas = ss.getSheets().filter(function (sh) { return sh.getName().indexOf(PREFIXO) !== 0; }).slice(0, 2).map(function (sh) {
    var lr = sh.getLastRow(), lc = sh.getLastColumn();
    var linhas = lr && lc ? sh.getRange(1, 1, lr, lc).getValues().map(function (r) {
      return r.map(function (v) {
        if (v instanceof Date) {
          var p = Utilities.formatDate(v, tz, 'yyyy-MM-dd').split('-');
          return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(1899, 11, 30)) / 86400000);
        }
        return v === '' ? null : v;
      });
    }) : [];
    return { nome: sh.getName(), linhas: linhas };
  });
  return { geradoEm: new Date().toISOString(), abas: abas };
}

function respostaJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * App da Web. Sem o token certo, responde "negado" e não devolve nada.
 *  - padrão: aviso do site para atualizar a planilha;
 *  - acao=dados (só com a planilha como fonte): devolve os dados das abas originais.
 */
function doGet(e) { return receberAviso(e); }
function doPost(e) { return receberAviso(e); }

function receberAviso(e) {
  var props = PropertiesService.getScriptProperties();
  var esperado = props.getProperty('tokenInstantaneo');
  var recebido = e && e.parameter ? String(e.parameter.token || '') : '';
  if (!esperado || recebido !== esperado) return ContentService.createTextOutput('negado');
  if (e.parameter.acao === 'dados') {
    if (props.getProperty('fonte') !== 'planilha') return respostaJson({ erro: 'a planilha não está configurada como fonte do site' });
    try { return respostaJson(dadosDaPlanilha()); } catch (err) { return respostaJson({ erro: String(err && err.message || err) }); }
  }
  try {
    atualizarPlanilha(false);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erro');
  }
}

function planilha() {
  var ss = null;
  try { ss = SpreadsheetApp.getActive(); } catch (ignored) {}
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty('planilhaId');
  if (id) return SpreadsheetApp.openById(id);
  throw new Error('Planilha não encontrada. Em script avulso, grave o ID da planilha na propriedade do script "planilhaId".');
}

function atualizarAgora() {
  atualizarPlanilha(true);
  avisar('Planilha atualizada com os dados do sistema.');
}

/* ===================== Atualização ===================== */

function atualizarPlanilha(forcar) {
  var lock = LockService.getScriptLock();
  // Espera a atualização em andamento terminar, para que a última alteração entre.
  if (!lock.tryLock(25000)) return;
  try {
    var data = carregarDados();
    var tabelas = montarTabelas(data);
    var assinatura = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(tabelas)));
    var props = PropertiesService.getScriptProperties();
    var ss = planilha();
    if (forcar === true || props.getProperty('assinatura') !== assinatura) {
      escreverTabelas(ss, tabelas);
      props.setProperty('assinatura', assinatura);
      props.setProperty('ultimaMudanca', new Date().toISOString());
    }
    if (ESCREVER_NAS_ABAS_ORIGINAIS && props.getProperty('fonte') !== 'planilha') anexarNasAbasOriginais(ss, data);
    escreverSobre(ss, data, props.getProperty('ultimaMudanca'), null);
  } catch (e) {
    try { escreverSobre(planilha(), null, null, e); } catch (ignored) {}
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/* ===================== Firestore (REST) ===================== */

function firestoreGet(path, params) {
  var url = FIRESTORE + '/' + path + (params ? '?' + params : '');
  var res = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Goog-User-Project': PROJECT_ID
    },
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error('Firestore respondeu ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

function firestorePatch(path, fields, mask) {
  var query = mask.map(function (m) { return 'updateMask.fieldPaths=' + encodeURIComponent(m); }).join('&') + '&currentDocument.exists=true';
  var res = UrlFetchApp.fetch(FIRESTORE + '/' + path + '?' + query, {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Goog-User-Project': PROJECT_ID
    },
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('Firestore respondeu ' + code + ' ao gravar: ' + res.getContentText().slice(0, 300));
}

function listarDocumentos(path) {
  var docs = [], token = '';
  do {
    var page = firestoreGet(path, 'pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    if (!page) break;
    (page.documents || []).forEach(function (d) { docs.push(d); });
    token = page.nextPageToken || '';
  } while (token);
  return docs;
}

function valor(v) {
  if (!v) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(valor);
  if ('mapValue' in v) return campos(v.mapValue.fields || {});
  return null;
}

function campos(fields) {
  var out = {};
  Object.keys(fields || {}).forEach(function (k) { out[k] = valor(fields[k]); });
  return out;
}

function carregarDados() {
  var root = firestoreGet('appData/primary');
  if (!root) throw new Error('Não encontrei appData/primary no Firestore.');
  var versionId = campos(root.fields).currentVersion;
  if (!versionId) throw new Error('Ainda não existe uma versão principal no sistema.');
  var metaDoc = firestoreGet('appData/primary/versions/' + encodeURIComponent(versionId));
  var meta = metaDoc ? campos(metaDoc.fields) : {};
  var ws = {
    versionId: versionId, sourceSheetNames: meta.sourceSheetNames || [], turmaPadrao: String(meta.turmaPadrao || '36'),
    ordemSequencia: meta.ordemSequencia || {}, people: [], order: [], turmas: [], ordensTurma: [], participantes: []
  };
  var chunks = listarDocumentos('appData/primary/versions/' + encodeURIComponent(versionId) + '/chunks')
    .map(function (d) { return campos(d.fields); })
    .filter(function (c) { return c.section !== 'rawSheet'; })
    .sort(function (a, b) { return String(a.section).localeCompare(String(b.section)) || (a.part - b.part); });
  chunks.forEach(function (c) { if (Array.isArray(ws[c.section])) ws[c.section] = ws[c.section].concat(c.items || []); });
  ws.marks = {};
  listarDocumentos('marcacoesBatismo').forEach(function (d) {
    var id = d.name.split('/').pop();
    ws.marks[id] = campos(d.fields);
  });
  return ws;
}

/* ===================== Mesmas regras do sistema (index.html) ===================== */

function isBlank(v) { return v === null || v === undefined || String(v).trim() === ''; }
function clean(v) { return isBlank(v) ? '' : String(v).trim(); }
function normal(v) { return clean(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function asBoolean(v) {
  if (v === true) return true;
  if (v === false) return false;
  var n = normal(v);
  if (['true', 'sim', 's', 'pago', 'ok', 'yes', '1'].indexOf(n) >= 0) return true;
  if (['false', 'nao', 'n', 'pendente', 'no', '0'].indexOf(n) >= 0) return false;
  return null;
}
function phoneDigits(v) { var t = clean(v); if (/^\d+\.0$/.test(t)) t = t.slice(0, -2); return t.replace(/\D/g, ''); }
function phoneValid(v) { var d = phoneDigits(v); return d.length === 10 || d.length === 11 || ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0); }
function phoneLabel(v) {
  var d = phoneDigits(v);
  if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return clean(v);
}
function shirtChoiceLabel(p) {
  var saved = normal(p && p.shirtChoice);
  if (saved === 'sim' || saved === 'quer camiseta') return 'Sim';
  if (saved === 'nao') return 'Não';
  if (saved === 'ja possui' || saved === 'ja tem' || saved === 'ja tenho') return 'Já possui';
  if (saved === 'pendente') return 'Pendente';
  var value = normal(p && p.shirt);
  if (!value) return 'Pendente';
  if (value === 'ja tem' || value === 'ja possui' || value === 'ja tenho') return 'Já possui';
  if (/nao quer|nao deseja|nao vai querer|sem camiseta|nao precisa|nao\.*/.test(value)) return 'Não';
  return 'Sim';
}
function shirtSizeValue(p) {
  if (p && p.shirtSize !== null && p.shirtSize !== undefined) return clean(p.shirtSize);
  var legacy = clean(p && p.shirt);
  if (!legacy || /^(ja tem|ja possui|ja tenho|nao quer|nao deseja|nao vai querer|sem camiseta|nao precisa|nao informado|pendente)$/i.test(normal(legacy))) return '';
  return legacy;
}
function shirtPaymentChoice(p) {
  if (p && p.shirtPaymentStatus) {
    var s = normal(p.shirtPaymentStatus);
    if (s === 'pago') return 'Pago';
    if (s === 'pendente' || s === 'a pagar') return 'Pendente';
  }
  return asBoolean(p && p.shirtPaid) === true ? 'Pago' : 'Pendente';
}
function manualAsPerson(p) {
  return {
    sourceRow: String(p.id), __manual: true, name: clean(p.nome), age: p.idade, phone: p.telefone, turma: p.turma,
    journey: p.jornada || null, lesson: p.aulaRepor || null, group: p.grupo === undefined ? null : p.grupo,
    shirt: p.shirtSize || null, shirtPaid: null, status: p.status || null, pending: p.pendencia || null, baptized: null,
    shirtChoice: p.shirtChoice, shirtSize: p.shirtSize, shirtPaymentStatus: p.shirtPaymentStatus, fields: []
  };
}
function importedTurma(ws) { var m = String((ws.sourceSheetNames || [])[1] || '').match(/(\d+)/); return m ? m[1] : '36'; }
function dayId(ws, row) {
  var t = String(row.__turmaId || importedTurma(ws));
  var pos = String(clean(row.id) || clean(row.number) || row.sourceRow).replace(/[^a-zA-Z0-9_-]/g, '_');
  return t === '36' && !row.__manual ? '36_' + pos : 'tur_' + t + '_' + pos;
}
function orderItemKey(row) { return row && row.__manual ? 'manual_' + String(row.id) : 'imported_' + String(row.sourceRow || row.id || row.number); }
function orderItems(ws, turma) {
  var it = importedTurma(ws), tid = String(turma.id);
  var manual = (ws.ordensTurma || []).filter(function (r) { return String(r.turmaId) === tid; })
    .map(function (r) { return Object.assign({}, r, { sourceRow: r.id, __manual: true, __turmaId: tid }); });
  var imported = tid === it ? (ws.order || []).map(function (r) { return Object.assign({}, r, { __turmaId: it }); }) : [];
  var items = imported.concat(manual);
  var seq = (ws.ordemSequencia || {})[tid] || [];
  if (!seq.length) return items;
  var rank = {};
  seq.forEach(function (k, i) { rank[String(k)] = i; });
  return items.slice().sort(function (a, b) {
    var ar = rank[orderItemKey(a)], br = rank[orderItemKey(b)];
    if (ar === undefined && br === undefined) return 0;
    if (ar === undefined) return 1;
    if (br === undefined) return -1;
    return ar - br;
  });
}
function eklesiaState(r, m) {
  if (m && typeof m.eklesia === 'boolean') return m.eklesia;
  return !isBlank(r.eklesiaStatus) && normal(r.eklesiaStatus) === 'ok';
}
function safeDayLink(ws, person) {
  var it = importedTurma(ws);
  if (!person || !person.name || String(person.turma) !== it) return null;
  var same = (ws.people || []).filter(function (p) { return String(p.turma) === it && normal(p.name) === normal(person.name); });
  if (same.length !== 1) return null;
  var rows = (ws.order || []).filter(function (r) { return !!r.name && normal(r.name) === normal(person.name); });
  return rows.length === 1 ? Object.assign({}, rows[0], { __turmaId: it }) : null;
}
function turmaDate(turma, people) {
  if (turma && turma.date) return dateFromISO(turma.date);
  var counts = {};
  (people || []).forEach(function (p) { if (typeof p.date === 'number' && p.date > 40000 && p.date < 60000) counts[p.date] = (counts[p.date] || 0) + 1; });
  var best = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  return best ? dateFromSerial(Number(best)) : null;
}
function dateFromSerial(n) { var d = new Date(1899, 11, 30, 12); d.setDate(d.getDate() + Math.floor(n)); return d; }
function dateFromISO(s) { var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; }
function dateFromAny(v) {
  if (typeof v === 'number' && v > 20000 && v < 90000) return dateFromSerial(v);
  var t = clean(v), m;
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return new Date(+m[3], +m[2] - 1, +m[1], 12);
  return dateFromISO(t) || (t || '');
}
function horaDe(iso) { return iso ? Utilities.formatDate(new Date(iso), Session.getScriptTimeZone(), 'HH:mm') : ''; }

/* ===================== Montagem das abas ===================== */

function montarTabelas(ws) {
  var people = (ws.people || []).concat((ws.participantes || []).map(manualAsPerson));
  var turmaPorNumero = {};
  (ws.turmas || []).forEach(function (t) { turmaPorNumero[String(t.number || t.id)] = t; });
  var header = ['NOME', 'IDADE', 'TELEFONE', 'TURMA', 'DATA', 'JORNADA', 'AULA P/ REPOR', 'ENTROU NO GRUPO', 'CAMISETA', 'PG CAMISETA', 'STATUS', 'PENDENCIA', 'BATIZADO', 'INVESTIGAÇÃO PERFIL (FBI)', 'ORIGEM'];
  var rows = [header];
  people.forEach(function (p) { rows.push(linhaBatismo(ws, p, people, turmaPorNumero)); });
  var tabelas = [{ nome: PREFIXO + 'Batismo', linhas: rows, colunaData: 5 }];
  return montarOrdens(ws, tabelas);
}

/** Uma linha no formato da aba Batismo (14 colunas originais + ORIGEM). */
function linhaBatismo(ws, p, people, turmaPorNumero) {
    var f = p.fields || [];
    var choice = shirtChoiceLabel(p);
    var shirt = choice === 'Já possui' ? 'Já tem' : (choice === 'Sim' ? (shirtSizeValue(p) || '') : (choice === 'Não' ? 'Não quer' : ''));
    var paid = choice === 'Sim' ? shirtPaymentChoice(p) === 'Pago' : asBoolean(p.shirtPaid) === true;
    var link = p.__manual ? null : safeDayLink(ws, p);
    var mark = link ? (ws.marks[dayId(ws, link)] || {}) : {};
    var baptized = mark.batizado ? 'SIM' + (mark.batizadoEm ? ' · ' + Utilities.formatDate(new Date(mark.batizadoEm), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '') : clean(p.baptized);
    var turmaRec = turmaPorNumero[clean(p.turma)];
    var data = p.__manual ? (turmaDate(turmaRec, people.filter(function (x) { return clean(x.turma) === clean(p.turma); })) || '') : dateFromAny(f[4]);
    var turmaNum = /^\d+$/.test(clean(p.turma)) ? Number(clean(p.turma)) : clean(p.turma);
    return [
      p.name || '',
      isBlank(p.age) ? '' : (isNaN(Number(p.age)) ? clean(p.age) : Number(p.age)),
      isBlank(p.phone) ? '' : (phoneValid(p.phone) ? phoneLabel(p.phone) : clean(p.phone)),
      turmaNum, data || '', clean(p.journey), clean(p.lesson), asBoolean(p.group) === true,
      shirt, paid, clean(p.status), clean(p.pending), baptized,
      p.__manual ? '' : clean(f[13]),
      p.__manual ? 'Cadastro pelo site' : 'Planilha · linha ' + p.sourceRow
    ];
}

function montarOrdens(ws, tabelas) {
  (ws.turmas || []).slice().sort(function (a, b) { return String(b.number).localeCompare(String(a.number), 'pt-BR', { numeric: true }); })
    .forEach(function (t) {
      var items = orderItems(ws, t);
      if (!items.length) return;
      var od = [['FICHAS RETIRADAS', 'NUMERAÇÃO', 'NOME', 'OBSERVAÇÃO', 'BATIZADO NO EKLESIA ', 'PRESENTE', 'HORA PRESENÇA', 'BATIZADO', 'HORA BATISMO']];
      items.forEach(function (r) {
        var m = ws.marks[dayId(ws, r)] || {};
        od.push([
          r.__manual ? '' : clean(r.removed),
          isBlank(r.number) ? '' : (Number(r.number) || clean(r.number)),
          r.name || '', clean(r.note),
          eklesiaState(r, m) ? 'OK' : (r.__manual ? '' : clean(r.eklesiaStatus)),
          m.presente ? 'SIM' : '', m.presente ? horaDe(m.presenteEm) : '',
          m.batizado ? 'SIM' : '', m.batizado ? horaDe(m.batizadoEm) : ''
        ]);
      });
      tabelas.push({ nome: (PREFIXO + 'Ordem ' + t.number).slice(0, 100), linhas: od });
    });
  return tabelas;
}

/* ===================== Abas originais: só acrescentar ===================== */

/**
 * Regras de segurança desta parte:
 *  - na aba Batismo, só escreve em linhas DEPOIS da última linha preenchida;
 *  - nas abas Ordem Batismo NN, só acrescenta linhas no fim e só escreve nas
 *    duas colunas próprias do script (PRESENTE (SISTEMA) e BATIZADO (SISTEMA)),
 *    criadas à direita da última coluna usada;
 *  - não cria nem apaga abas originais.
 */
function anexarNasAbasOriginais(ss, ws) {
  var props = PropertiesService.getScriptProperties();
  anexarCadastros(ss, ws, props);
  (ws.turmas || []).forEach(function (t) { atualizarOrdemOriginal(ss, ws, t, props); });
}

function abaOriginal(ss, nomeNormal) {
  var achada = null;
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (!achada && n.indexOf(PREFIXO) !== 0 && normal(n) === nomeNormal) achada = sh;
  });
  return achada;
}

function lerLista(props, chave) {
  try { return JSON.parse(props.getProperty(chave) || '[]'); } catch (e) { return []; }
}

function anexarCadastros(ss, ws, props) {
  var participantes = ws.participantes || [];
  if (!participantes.length) return;
  var sh = abaOriginal(ss, 'batismo');
  if (!sh) return;
  var feitos = lerLista(props, 'anexadosBatismo');
  var ultima = sh.getLastRow();
  var existentes = {};
  if (ultima > 0) sh.getRange(1, 1, ultima, 4).getValues().forEach(function (r) { existentes[normal(r[0]) + '|' + clean(r[3])] = true; });
  var people = (ws.people || []).concat(participantes.map(manualAsPerson));
  var turmaPorNumero = {};
  (ws.turmas || []).forEach(function (t) { turmaPorNumero[String(t.number || t.id)] = t; });
  var novas = [], ids = [];
  participantes.forEach(function (p) {
    var id = String(p.id);
    if (feitos.indexOf(id) >= 0) return;
    var pessoa = manualAsPerson(p);
    if (!pessoa.name) return; // espera ter nome
    ids.push(id);
    var chave = normal(pessoa.name) + '|' + clean(pessoa.turma);
    if (existentes[chave]) return; // já digitado à mão na aba
    existentes[chave] = true;
    novas.push(linhaBatismo(ws, pessoa, people, turmaPorNumero).slice(0, 14));
  });
  if (novas.length) sh.getRange(ultima + 1, 1, novas.length, 14).setValues(novas);
  if (ids.length) props.setProperty('anexadosBatismo', JSON.stringify(feitos.concat(ids)));
}

function atualizarOrdemOriginal(ss, ws, turma, props) {
  var items = orderItems(ws, turma);
  if (!items.length) return;
  var sh = abaOriginal(ss, normal('Ordem Batismo ' + turma.number));
  if (!sh) return;

  // 1) Posições novas cadastradas pelo site entram no fim (colunas A a D).
  var chaveFeitos = 'anexadosOrdem_' + turma.id;
  var feitos = lerLista(props, chaveFeitos);
  var ultima = sh.getLastRow();
  var existentes = {};
  if (ultima > 1) sh.getRange(2, 2, ultima - 1, 2).getValues().forEach(function (r) { existentes[clean(r[0]) + '|' + normal(r[1])] = true; });
  var novas = [], ids = [];
  items.forEach(function (r) {
    if (!r.__manual || r.removed || !r.name) return;
    var id = String(r.id);
    if (feitos.indexOf(id) >= 0) return;
    ids.push(id);
    var chave = clean(r.number) + '|' + normal(r.name);
    if (existentes[chave]) return;
    existentes[chave] = true;
    novas.push(['', isBlank(r.number) ? '' : (Number(r.number) || clean(r.number)), r.name, clean(r.note)]);
  });
  if (novas.length) { sh.getRange(ultima + 1, 1, novas.length, 4).setValues(novas); ultima += novas.length; }
  if (ids.length) props.setProperty(chaveFeitos, JSON.stringify(feitos.concat(ids)));
  if (ultima < 2) return;

  // 2) Presença e batismo do dia nas duas colunas próprias do script.
  var largura = Math.max(sh.getLastColumn(), 1);
  var cab = sh.getRange(1, 1, 1, largura).getValues()[0].map(clean);
  var cP = cab.indexOf(COL_PRESENTE) + 1, cB = cab.indexOf(COL_BATIZADO) + 1;
  var precisa = (cP ? 0 : 1) + (cB ? 0 : 1);
  if (precisa) {
    if (largura + precisa > sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), largura + precisa - sh.getMaxColumns());
    if (!cP) { cP = ++largura; sh.getRange(1, cP).setValue(COL_PRESENTE); }
    if (!cB) { cB = ++largura; sh.getRange(1, cB).setValue(COL_BATIZADO); }
  }
  var porNumero = {};
  items.forEach(function (r) { if (!isBlank(r.number)) (porNumero[clean(r.number)] = porNumero[clean(r.number)] || []).push(r); });
  var linhas = sh.getRange(2, 2, ultima - 1, 2).getValues();
  var colP = [], colB = [];
  linhas.forEach(function (l) {
    var cands = porNumero[clean(l[0])] || [];
    var nome = normal(l[1]);
    var r = cands.filter(function (c) { return !nome || normal(c.name) === nome; })[0];
    var m = r ? (ws.marks[dayId(ws, r)] || {}) : {};
    colP.push([m.presente ? 'SIM ' + horaDe(m.presenteEm) : '']);
    colB.push([m.batizado ? 'SIM ' + horaDe(m.batizadoEm) : '']);
  });
  sh.getRange(2, cP, colP.length, 1).setValues(colP);
  sh.getRange(2, cB, colB.length, 1).setValues(colB);
}

/* ===================== Escrita na planilha ===================== */

function escreverTabelas(ss, tabelas) {
  var aviso = 'Espelho do sistema: não edite aqui. As alterações são feitas no sistema e esta aba é reescrita automaticamente.';
  tabelas.forEach(function (tab) {
    if (tab.nome.indexOf(PREFIXO) !== 0) throw new Error('Proteção: o script só escreve em abas que começam com "' + PREFIXO + '".');
  });
  tabelas.forEach(function (tab) {
    // Abas novas entram no fim, sem mudar a posição das abas existentes.
    var sh = ss.getSheetByName(tab.nome) || ss.insertSheet(tab.nome, ss.getSheets().length);
    var filtro = sh.getFilter();
    if (filtro) filtro.remove();
    sh.clearContents();
    var largura = tab.linhas[0].length;
    sh.getRange(1, 1, tab.linhas.length, largura).setValues(tab.linhas);
    sh.getRange(1, 1, 1, largura).setFontWeight('bold').setBackground('#ff5a1f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    if (tab.colunaData && tab.linhas.length > 1) sh.getRange(2, tab.colunaData, tab.linhas.length - 1, 1).setNumberFormat('dd/mm/yyyy');
    if (tab.linhas.length > 1) sh.getRange(1, 1, tab.linhas.length, largura).createFilter();
    var protecoes = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (!protecoes.length) sh.protect().setDescription(aviso).setWarningOnly(true);
  });
  // Nenhuma aba é apagada por este script, nem as dele.
}

function escreverSobre(ss, data, ultimaMudanca, erro) {
  var sh = ss.getSheetByName(PREFIXO + 'Sobre') || ss.insertSheet(PREFIXO + 'Sobre', ss.getSheets().length);
  var tz = Session.getScriptTimeZone();
  var agora = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');
  var linhas = [
    ['Planilha espelho · Gestão de Batismo', ''],
    ['Somente consulta', 'As abas "' + PREFIXO + '…" são reescritas com os dados do sistema. As demais abas desta planilha não são alteradas.'],
    ['Última verificação', agora],
    ['Última mudança nos dados', ultimaMudanca ? Utilities.formatDate(new Date(ultimaMudanca), tz, 'dd/MM/yyyy HH:mm:ss') : '—'],
    ['Versão no Firebase', data ? data.versionId : '—'],
    ['Situação', erro ? 'ERRO: ' + (erro.message || erro) : 'OK'],
    ['Atualizar manualmente', 'Menu Batismo → Atualizar agora']
  ];
  sh.clearContents();
  sh.getRange(1, 1, linhas.length, 2).setValues(linhas);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  sh.getRange(2, 1, linhas.length - 1, 1).setFontWeight('bold');
  sh.getRange(6, 2).setFontColor(erro ? '#c0392b' : '#1e8e3e');
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 520);
}

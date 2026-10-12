import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('  var EXPECTED_BAPTISM_HEADERS = [');
const end = html.indexOf('  function normalizeWorkbook(file, buffer) {', start);
assert.ok(start >= 0 && end > start, 'helpers de importação segura devem existir');
const helpers = html.slice(start, end) + '\nglobalThis.testHelpers = { EXPECTED_BAPTISM_HEADERS, EXPECTED_ORDER_HEADERS, validateExpectedHeaders, importPersonKey, importDateIsValid, inspectImportRows, mergeImportWorkspace, restoreVersionAsNewVersion };';
const context = {
  Date, Map, Set, Number, String, Object, Array, Math, isNaN,
  normal: value => value == null ? '' : String(value).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''),
  clean: value => value == null ? '' : String(value).trim()
};
vm.runInNewContext(helpers, context, { filename: 'safe-import-helpers.mjs' });
const h = context.testHelpers;

// Cabeçalho trocado: rejeita antes de mapear valores por posição e mostra esperado/encontrado.
assert.throws(
  () => h.validateExpectedHeaders([['Telefone','Idade','Nome']], h.EXPECTED_BAPTISM_HEADERS, 'Batismo'),
  /coluna 1 esperada "nome", encontrada "Telefone"/
);

// Adicionar/atualizar é idempotente para o mesmo arquivo importado duas vezes e não apaga ausentes.
const current = { people: [
  { name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', age: 25 },
  { name: 'Bruno Lima', phone: '(16) 98888-1111', turma: '36', age: 31 }
], order: [{ name: 'Ana Souza', number: 1 }] };
const incoming = { people: [
  { sourceRow: 2, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', age: 26 },
  { sourceRow: 3, name: 'Carla Dias', phone: '(16) 97777-2222', turma: '37', age: 22 }
], order: [{ name: 'Carla Dias', number: 1 }] };
const first = h.mergeImportWorkspace(current, incoming, ['age']);
assert.equal(first.workspace.people.length, 3, 'a importação aditiva mantém as pessoas ausentes no arquivo');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').age, 26, 'altera apenas campo selecionado');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').phone, '(16) 99999-0000');
const second = h.mergeImportWorkspace(first.workspace, incoming, ['age']);
assert.equal(second.workspace.people.length, 3, 'importar o mesmo arquivo de novo não duplica pessoas');
assert.equal(second.report.imported, 0, 'a segunda importação não adiciona pessoas repetidas');

// Prévia detecta duplicidade, telefone inválido, turma vazia e data impossível.
const inspected = h.inspectImportRows([
  { sourceRow: 2, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '31/02/2026' },
  { sourceRow: 3, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '2026-10-12' },
  { sourceRow: 4, name: 'Pessoa', phone: '123', turma: '', date: '2026-10-12' }
], current.people);
assert.ok(inspected.invalid.some(x => x.issue === 'data impossível/inválida'));
assert.ok(inspected.invalid.some(x => x.issue === 'duplicado no arquivo'));
assert.ok(inspected.invalid.some(x => x.issue === 'telefone inválido'));
assert.ok(inspected.invalid.some(x => x.issue === 'turma vazia'));

// Restauração usa o serviço de salvar como nova versão, sem operação de apagar.
let savedPayload = null;
let createVersionFlag = false;
const restored = await h.restoreVersionAsNewVersion(
  'version-old',
  async id => ({ id: 'current', sourceFileName: 'backup.xlsx', people: [{ name: 'Histórico' }], order: [] , sourceWorkbook: {} }),
  async (payload, createVersion) => { savedPayload = payload; createVersionFlag = createVersion; },
  new Date('2026-10-12T18:00:00.000Z')
);
assert.equal(createVersionFlag, true, 'restaurar precisa chamar save como nova versão (CAS no serviço real)');
assert.equal(savedPayload.people[0].name, 'Histórico');
assert.equal(savedPayload.importedAt, '2026-10-12T18:00:00.000Z');
assert.ok(!Object.prototype.hasOwnProperty.call(savedPayload, 'sourceWorkbook'));
assert.equal(restored.people[0].name, 'Histórico');

// Contratos de UI, CAS, backup obrigatório, CSV seguro e dependência corrigida.
assert.ok(html.includes('validateExpectedHeaders(mainRows, EXPECTED_BAPTISM_HEADERS'), 'cabeçalho de Batismo deve ser validado antes do mapeamento');
assert.ok(html.includes('validateExpectedHeaders(orderRows, EXPECTED_ORDER_HEADERS'), 'cabeçalho da Ordem deve ser validado antes do mapeamento');
assert.ok(html.includes('Adicionar e atualizar (padrão, nunca apaga)'));
assert.ok(html.includes('value="replace">Substituir tudo'));
assert.ok(html.includes("replaceTextNode.value !== 'CONFIRMAR'"));
assert.ok(html.includes('replaceBackupDownloaded'));
assert.ok(html.includes('download-import-report'));
assert.ok(html.includes('firebaseSaveWorkspace(restoredPayload, true)') === false, 'restauração deve usar helper mockável, que chama save com createVersion=true');
assert.ok(html.includes('window.firebaseSaveWorkspace'));
assert.ok(html.includes('function assertWorkspaceVersion(tx, metaRef, expectedVersionId)'), 'salvamento deve preservar CAS do ponteiro');
assert.ok(html.includes('data-version-download') && html.includes('data-version-restore'));
assert.ok(html.includes('accessible-confirm-dialog') && html.includes("addEventListener('cancel', onCancel)"));
assert.ok(!html.includes('window.confirm('), 'não deve restar confirm() nativo');
assert.ok(!html.includes('window.alert('), 'não deve restar alert() nativo');
assert.ok(html.includes('xlsx-0.20.3/package/dist/xlsx.full.min.js'), 'SheetJS deve estar fixado na versão corrigida');
assert.ok(html.includes('integrity="sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT"'), 'SheetJS deve ter SRI fixo');
assert.ok(html.includes('createdByName'), 'histórico deve identificar o responsável em formato legível');

console.log('OK: cabeçalho trocado é bloqueado antes de ler colunas por posição.');
console.log('OK: importação duplicada é idempotente; modo aditivo nunca apaga ausentes.');
console.log('OK: prévia sinaliza duplicados, data impossível, telefone inválido e turma vazia.');
console.log('OK: restaurar versão chama salvamento de nova versão, mantendo CAS e sem apagar histórico.');
console.log('OK: controles de substituição, relatório seguro, diálogos acessíveis, SRI e SheetJS corrigido.');

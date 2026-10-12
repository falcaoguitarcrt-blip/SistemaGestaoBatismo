import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('  var EXPECTED_BAPTISM_HEADERS = [');
const end = html.indexOf('  function normalizeWorkbook(file, buffer) {', start);
assert.ok(start >= 0 && end > start, 'helpers de importação segura devem existir');
const helpers = html.slice(start, end) + '\nglobalThis.testHelpers = { EXPECTED_BAPTISM_HEADERS, EXPECTED_ORDER_HEADERS, normalizeHeader, validateExpectedHeaders, isRepeatedHeaderRow, importPersonKey, nextImportSourceRow, importDateIsValid, inspectImportRows, mergeImportWorkspace, restoreVersionAsNewVersion };';
const context = {
  Date, Map, Set, Number, String, Object, Array, Math, isNaN,
  normal: value => value == null ? '' : String(value).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  clean: value => value == null ? '' : String(value).trim()
};
vm.runInNewContext(helpers, context, { filename: 'safe-import-helpers.mjs' });
const h = context.testHelpers;

// Caixa, acentos, pontuação, espaços repetidos, aliases e coluna extra no final.
const variedHeaders = [
  '  NÔME!! ', 'IDADE', ' Telefone ', 'TURMA', 'DATA   DO BATISMO',
  'JORNADA', 'AULA', 'GRUPO', 'TAMANHO-CAMISETA', 'CAMISETA PAGA',
  'STATUS', 'PENDÊNCIA(S)', 'JÁ BATIZADO', 'TIPO DE PERFIL', 'COLUNA EXTRA'
];
const row = ['Maria', 22, '(16) 99999-1111', 37, '12/10/2026', 'J1', 'A2', 'GE', 'M', 'Sim', 'OK', 'Nenhuma', 'Não', 'Adulto', 'extra'];
const mapped = h.validateExpectedHeaders([variedHeaders, row], h.EXPECTED_BAPTISM_HEADERS, 'Batismo');
assert.equal(mapped[1][0], 'Maria');
assert.equal(mapped[1][8], 'M');
assert.equal(mapped[1][13], 'Adulto');
assert.equal(mapped[1][14], 'extra', 'coluna extra no fim não desloca os campos esperados');
assert.equal(h.normalizeHeader('  PÊNDENCIA---S  '), 'pendencia s');
assert.ok(h.isRepeatedHeaderRow(mapped[0], h.EXPECTED_BAPTISM_HEADERS), 'cabeçalho repetido deve ser ignorado');

// Só bloqueia por coluna obrigatória ausente e lista TODAS as colunas encontradas.
assert.throws(
  () => h.validateExpectedHeaders([['NOME', 'Idade', 'Telefone', 'EXTRA']], h.EXPECTED_BAPTISM_HEADERS, 'Batismo'),
  error => error.message.includes('coluna 4 esperada "turma"') &&
    error.message.includes('Colunas encontradas: 1: NOME; 2: Idade; 3: Telefone; 4: EXTRA')
);

// Telefone vazio/curto não é chave; nome normalizado e telefone válido geram chave.
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '(16) 99999-1111' }), 'joao avila|16999991111');
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '' }), '');
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '12345' }), '');

// Adicionar/atualizar: sem seleção explícita não altera campo; célula vazia nunca limpa.
const current = { people: [
  { sourceRow: 10, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', age: 25, group: 'GE' },
  { sourceRow: 30, name: 'Bruno Lima', phone: '(16) 98888-1111', turma: '36', age: 31 }
], order: [{ name: 'Ana Souza', number: 1 }] };
const incoming = { people: [
  { sourceRow: 2, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', age: 26, group: '' },
  { sourceRow: 3, name: 'Carla Dias', phone: '(16) 97777-2222', turma: '37', age: 22 }
], order: [{ name: 'Carla Dias', number: 1 }] };
const preview = h.inspectImportRows(incoming.people, current.people);
assert.equal(preview.changed.length, 1);
assert.ok(preview.changed[0].diffs.some(d => d.field === 'age'));
assert.ok(!preview.changed[0].diffs.some(d => d.field === 'group'), 'valor vazio não é diferença que apaga');
const first = h.mergeImportWorkspace(current, incoming, []);
assert.equal(first.workspace.people.length, 3, 'cadastros ausentes permanecem na base');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').age, 25, 'sem marcar campo não altera existente');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').group, 'GE', 'célula vazia nunca apaga');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').sourceRow, 10, 'sourceRow existente não é renumerado');
assert.equal(first.workspace.people.find(p => p.name === 'Bruno Lima').sourceRow, 30, 'sourceRow ausente no arquivo é preservado');
const carla = first.workspace.people.find(p => p.name === 'Carla Dias');
assert.equal(carla.sourceRow, 31, 'novo sourceRow é maior que o máximo atual, sem reutilizar linha do Excel');
assert.notEqual(carla.sourceRow, 10);
assert.notEqual(carla.sourceRow, 30);
const second = h.mergeImportWorkspace(first.workspace, incoming, []);
assert.equal(second.workspace.people.length, 3, 'reimportar não duplica');
assert.equal(second.report.imported, 0);
assert.equal(second.workspace.people.find(p => p.name === 'Carla Dias').sourceRow, 31, 'sourceRow da pessoa nova não muda na reimportação');
const explicit = h.mergeImportWorkspace(current, incoming, ['age']);
assert.equal(explicit.workspace.people.find(p => p.name === 'Ana Souza').age, 26, 'campo selecionado explicitamente é atualizado');
assert.equal(explicit.workspace.people.find(p => p.name === 'Ana Souza').group, 'GE');

// Homônimos sem telefone válido ficam ambíguos; linhas sem nome nunca entram na base.
const ambiguousPreview = h.inspectImportRows([
  { sourceRow: 2, name: 'João Silva', phone: '', turma: '36' },
  { sourceRow: 3, name: 'Joao Silva', phone: '1234', turma: '36' },
  { sourceRow: 4, name: '', phone: '', turma: '36' }
], [
  { sourceRow: 7, name: 'João Silva', phone: '(16) 99999-7777', turma: '36' }
]);
assert.ok(ambiguousPreview.ambiguous.length >= 2);
assert.ok(ambiguousPreview.invalid.some(x => x.issue.includes('nome vazio')));
const noPhoneMerge = h.mergeImportWorkspace({ people: [{ sourceRow: 7, name: 'João Silva', phone: '(16) 99999-7777' }] }, {
  people: [{ sourceRow: 2, name: 'João Silva', phone: '', turma: '36' }, { sourceRow: 3, name: '', phone: '', turma: '36' }]
}, ['name', 'phone']);
assert.equal(noPhoneMerge.workspace.people.length, 1, 'homônimo sem telefone e linha sem nome não são mesclados/adicionados');

// Duplicatas, data impossível, telefone curto e turma vazia aparecem na prévia.
const inspected = h.inspectImportRows([
  { sourceRow: 2, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '31/02/2026' },
  { sourceRow: 3, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '2026-10-12' },
  { sourceRow: 4, name: 'Pessoa', phone: '123', turma: '', date: '2026-10-12' }
], current.people);
assert.ok(inspected.invalid.some(x => x.issue === 'data impossível/inválida'));
assert.ok(inspected.invalid.some(x => x.issue === 'duplicado no arquivo'));
assert.ok(inspected.invalid.some(x => x.issue.includes('telefone vazio/curto')));
assert.ok(inspected.invalid.some(x => x.issue === 'turma vazia'));

// Restauração mockada salva como nova versão, sem apagar a anterior.
let savedPayload = null, createVersionFlag = false;
const restored = await h.restoreVersionAsNewVersion(
  'version-old',
  async id => ({ id: 'current', sourceFileName: 'backup.xlsx', people: [{ name: 'Histórico' }], order: [], sourceWorkbook: {} }),
  async (payload, createVersion) => { savedPayload = payload; createVersionFlag = createVersion; },
  new Date('2026-10-12T18:00:00.000Z')
);
assert.equal(createVersionFlag, true);
assert.equal(savedPayload.people[0].name, 'Histórico');
assert.equal(savedPayload.importedAt, '2026-10-12T18:00:00.000Z');
assert.ok(!Object.prototype.hasOwnProperty.call(savedPayload, 'sourceWorkbook'));
assert.equal(restored.people[0].name, 'Histórico');

// Fluxo da ordem, diálogo acessível, erro legível e dependência fixada.
assert.ok(html.includes("validateExpectedHeaders(mainRows, EXPECTED_BAPTISM_HEADERS"));
assert.ok(html.includes("validateExpectedHeaders(orderRows, EXPECTED_ORDER_HEADERS"));
assert.ok(html.includes('import-order-turma-select') && html.includes('confirmedImportOrderTurmaId'));
assert.ok(html.includes('firebaseHasMarksForTurma'));
assert.ok(html.includes('download-prior-order-closure') && html.includes('prior-order-closure-already-saved'));
assert.ok(html.includes('!closureSatisfied'));
assert.ok(html.includes("querySelectorAll('button:not([disabled]), input:not([disabled])"));
assert.ok(html.includes("document.contains(origin)) origin.focus()"));
assert.ok(html.includes('Falha ao ler o Excel:'));
assert.ok(html.includes('Nenhum dado foi alterado. O login e o check-in continuam disponíveis.'));
assert.ok(html.includes('function assertWorkspaceVersion(tx, metaRef, expectedVersionId)'));
assert.ok(html.includes('xlsx-0.20.3/package/dist/xlsx.full.min.js'));
assert.ok(html.includes('integrity="sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT"'));
assert.ok(!html.includes('window.confirm('));
assert.ok(!html.includes('window.alert('));

console.log('OK: caixa, acentos, pontuação, espaços, aliases, coluna extra e cabeçalho repetido.');
console.log('OK: telefone vazio/curto não forma chave; homônimos ambíguos e linhas sem nome não são mesclados.');
console.log('OK: nenhum campo muda por padrão; campo vazio não apaga; sourceRow monotônico e preservado.');
console.log('OK: escolha de turma, bloqueio por marcações, fechamento obrigatório e CAS preservados.');
console.log('OK: foco preso/devolvido, erro de Excel legível, SRI e SheetJS fixado.');

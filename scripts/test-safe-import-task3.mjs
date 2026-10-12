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
  normal: value => value == null ? '' : String(value).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''),
  clean: value => value == null ? '' : String(value).trim()
};
vm.runInNewContext(helpers, context, { filename: 'safe-import-helpers.mjs' });
const h = context.testHelpers;

// Variações de cabeçalho: caixa, acentos, pontuação, espaços repetidos e coluna extra no fim.
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
assert.equal(mapped[1][14], 'extra', 'coluna extra no final é preservada sem deslocar campos esperados');
assert.equal(h.normalizeHeader('  PÊNDENCIA---S  '), 'pendencia s');
assert.ok(h.isRepeatedHeaderRow(mapped[0], h.EXPECTED_BAPTISM_HEADERS), 'linha repetida de cabeçalho deve ser ignorada');

// Só falta de coluna obrigatória bloqueia, e a mensagem lista todas as colunas encontradas.
assert.throws(
  () => h.validateExpectedHeaders([['NOME', 'Idade', 'Telefone', 'EXTRA']], h.EXPECTED_BAPTISM_HEADERS, 'Batismo'),
  error => error.message.includes('coluna 4 esperada "turma"') &&
    error.message.includes('Colunas encontradas: 1: NOME; 2: Idade; 3: Telefone; 4: EXTRA')
);

// Chave só existe com telefone de 10 a 13 dígitos, após retirar pontuação.
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '(16) 99999-1111' }), 'joao avila|16999991111');
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '' }), '');
assert.equal(h.importPersonKey({ name: 'João Ávila', phone: '12345' }), '');

// Add/update is idempotent, explicit-only, does not clear fields, and preserves sourceRow.
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
assert.ok(!preview.changed[0].diffs.some(d => d.field === 'group'), 'campo vazio não propõe apagar valor existente');
const first = h.mergeImportWorkspace(current, incoming, []);
assert.equal(first.workspace.people.length, 3, 'cadastros ausentes no arquivo permanecem na base');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').age, 25, 'sem marcação explícita nenhum campo existente muda');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').group, 'GE', 'célula vazia nunca limpa campo existente');
assert.equal(first.workspace.people.find(p => p.name === 'Ana Souza').sourceRow, 10, 'sourceRow existente não é renumerado');
assert.equal(first.workspace.people.find(p => p.name === 'Bruno Lima').sourceRow, 30, 'sourceRow de cadastro ausente permanece intacto');
const carla = first.workspace.people.find(p => p.name === 'Carla Dias');
assert.equal(carla.sourceRow, 31, 'pessoa nova recebe sourceRow maior que o máximo existente, não reutiliza a linha do Excel');
assert.notEqual(carla.sourceRow, 10);
assert.notEqual(carla.sourceRow, 30);
const second = h.mergeImportWorkspace(first.workspace, incoming, []);
assert.equal(second.workspace.people.length, 3, 'importar o mesmo arquivo de novo não duplica pessoas');
assert.equal(second.report.imported, 0, 'segunda importação não adiciona pessoas repetidas');
assert.equal(second.workspace.people.find(p => p.name === 'Carla Dias').sourceRow, 31, 'sourceRow não muda na reimportação');
const explicit = h.mergeImportWorkspace(current, incoming, ['age']);
assert.equal(explicit.workspace.people.find(p => p.name === 'Ana Souza').age, 26, 'campo marcado explicitamente pode ser atualizado');
assert.equal(explicit.workspace.people.find(p => p.name === 'Ana Souza').group, 'GE');

// Homônimos sem telefone são ambíguos e não são mesclados; linhas sem nome ficam fora da base.
const ambiguousPreview = h.inspectImportRows([
  { sourceRow: 2, name: 'João Silva', phone: '', turma: '36' },
  { sourceRow: 3, name: 'Joao Silva', phone: '1234', turma: '36' },
  { sourceRow: 4, name: '', phone: '', turma: '36' }
], [
  { sourceRow: 7, name: 'João Silva', phone: '(16) 99999-7777', turma: '36' }
]);
assert.ok(ambiguousPreview.ambiguous.length >= 2, 'homônimos sem telefone válido devem aparecer como ambíguos');
assert.ok(ambiguousPreview.invalid.some(x => x.issue.includes('nome vazio')));
const noPhoneMerge = h.mergeImportWorkspace({ people: [{ sourceRow: 7, name: 'João Silva', phone: '(16) 99999-7777' }] }, {
  people: [{ sourceRow: 2, name: 'João Silva', phone: '', turma: '36' }, { sourceRow: 3, name: '', phone: '', turma: '36' }]
}, ['name', 'phone']);
assert.equal(noPhoneMerge.workspace.people.length, 1, 'homônimo sem telefone e linha sem nome nunca são mesclados/adicionados automaticamente');

// Prévia também detecta duplicidade, telefone inválido, turma vazia e data impossível.
const inspected = h.inspectImportRows([
  { sourceRow: 2, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '31/02/2026' },
  { sourceRow: 3, name: 'Ana Souza', phone: '(16) 99999-0000', turma: '36', date: '2026-10-12' },
  { sourceRow: 4, name: 'Pessoa', phone: '123', turma: '', date: '2026-10-12' }
], current.people);
assert.ok(inspected.invalid.some(x => x.issue === 'data impossível/inválida'));
assert.ok(inspected.invalid.some(x => x.issue === 'duplicado no arquivo'));
assert.ok(inspected.invalid.some(x => x.issue.includes('telefone vazio/curto')));
assert.ok(inspected.invalid.some(x => x.issue === 'turma vazia'));

// Restore-as-new-version is mockable and must never call a delete operation.
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

// Order protections, accessible focus handling, SRI and safe error reporting stay in place.
assert.ok(html.includes("validateExpectedHeaders(mainRows, EXPECTED_BAPTISM_HEADERS"));
assert.ok(html.includes("validateExpectedHeaders(orderRows, EXPECTED_ORDER_HEADERS"));
assert.ok(html.includes('import-order-turma-select') && html.includes('confirmedImportOrderTurmaId'));
assert.ok(html.includes('firebaseHasMarksForTurma'));
assert.ok(html.includes('download-prior-order-closure') && html.includes('prior-order-closure-already-saved'));
assert.ok(html.includes("!closureSatisfied"));
assert.ok(html.includes("querySelectorAll('button:not([disabled]), input:not([disabled])"));
assert.ok(html.includes('document.contains(origin) && origin.focus'));
assert.ok(html.includes('Falha ao ler o Excel:'));
assert.ok(html.includes('Nenhum dado foi alterado. O login e o check-in continuam disponíveis.'));
assert.ok(html.includes('function assertWorkspaceVersion(tx, metaRef, expectedVersionId)'));
assert.ok(html.includes('xlsx-0.20.3/package/dist/xlsx.full.min.js'));
assert.ok(html.includes('integrity="sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT"'));
assert.ok(!html.includes('window.confirm('));
assert.ok(!html.includes('window.alert('));

console.log('OK: aliases, caixa, acentos, pontuação, espaços, colunas extras e cabeçalho repetido.');
console.log('OK: telefone vazio/curto não forma chave; homônimos ambíguos e linhas sem nome não são mesclados.');
console.log('OK: nenhum campo muda por padrão; célula vazia não apaga; sourceRow é monotônico e preservado.');
console.log('OK: confirmação da turma, bloqueio por marcações, fechamento da ordem e CAS preservados.');
console.log('OK: foco preso/devolvido, erro legível de Excel, SRI e dependência fixada.');

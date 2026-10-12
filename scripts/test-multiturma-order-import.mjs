import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');

function extractSection(startText, endText) {
  const start = html.indexOf(startText);
  assert.notEqual(start, -1, 'não encontrou início: ' + startText);
  const end = html.indexOf(endText, start + startText.length);
  assert.ok(end > start, 'não encontrou fim: ' + endText);
  return html.slice(start, end);
}

const helperSource = [
  extractSection('function workspaceOrderTurmaId(', '\n  function dayMarkIdForRow('),
  extractSection('function dayMarkIdForRow(', '\n  function importMarksConfirmationValid('),
  extractSection('function importMarksConfirmationValid(', '\n  function matchPersonToOrder('),
  extractSection('function matchPersonToOrder(', '\n  function turmaDateSummary('),
  extractSection('function turmaDateSummary(', '\n  var importSection =')
].join('\n') + '\nglobalThis.testHelpers = { workspaceOrderTurmaId, dayMarkIdForRow, importMarksConfirmationValid, matchPersonToOrder, turmaDateSummary };';

const mainContext = {
  Date,
  Intl,
  String,
  Number,
  Math,
  isNaN,
  clean: value => value == null ? '' : String(value).trim(),
  normal: value => value == null ? '' : String(value).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
};
vm.runInNewContext(helperSource, mainContext, { filename: 'multiturma-helpers-extracted.js' });
const h = mainContext.testHelpers;

// (a) Workspace legado sem ordemTurmaId continua apontando a ordem para a turma histórica 36.
assert.equal(h.workspaceOrderTurmaId({ order: [{ number: 7 }] }), '36');
assert.equal(h.dayMarkIdForRow({ number: 7, sourceRow: 7, __turmaId: '36' }, h.workspaceOrderTurmaId({ order: [{}] })), '36_7');
assert.equal(h.dayMarkIdForRow({ number: 7, sourceRow: 7, __turmaId: '37' }, '37'), 'tur_37_7');
assert.equal(h.dayMarkIdForRow({ number: 7, sourceRow: 7, __turmaId: '99' }, '99'), 'tur_99_7');

// (b) A consulta de marcações para a turma 37 deve filtrar no Firestore e não ler os documentos da 36.
const markDocuments = [
  { id: '36_7', data: { turmaId: '36', presente: true } },
  { id: 'tur_37_7', data: { turmaId: '37', presente: false } },
  { id: 'tur_99_1', data: { turmaId: '99', presente: true } }
];
const queries = [];
const moduleContext = {
  auth: { currentUser: { uid: 'test-user' } },
  firestore: {},
  collection: (_db, name) => ({ name }),
  where: (field, op, value) => ({ field, op, value }),
  query: (ref, ...filters) => ({ ref, filters }),
  getDocs: async q => {
    queries.push(q);
    const filter = q.filters.find(f => f.field === 'turmaId');
    const docs = markDocuments.filter(d => !filter || d.data[filter.field] === filter.value)
      .map(d => ({ id: d.id, data: () => ({ ...d.data }) }));
    return { docs };
  },
  window: {},
  String,
  Object,
  Error
};
const apiStart = html.indexOf('window.firebaseHasMarksForTurma = async function (turmaId) {');
assert.notEqual(apiStart, -1, 'não encontrou a API de consulta por turma');
const apiEnd = html.indexOf('\n};', apiStart);
assert.ok(apiEnd > apiStart, 'não encontrou o fim da API de consulta por turma');
vm.runInNewContext(html.slice(apiStart, apiEnd + 3), moduleContext, { filename: 'firebase-marks-query-extracted.js' });
const has37 = await moduleContext.window.firebaseHasMarksForTurma('37');
assert.equal(has37, true);
assert.equal(queries[0].filters.length, 1);
assert.deepEqual(
  { field: queries[0].filters[0].field, op: queries[0].filters[0].op, value: queries[0].filters[0].value },
  { field: 'turmaId', op: '==', value: '37' }
);
assert.deepEqual(markDocuments[0].data, { turmaId: '36', presente: true }, 'consulta da turma 37 não pode alterar marcações da 36');
assert.equal(await moduleContext.window.firebaseHasMarksForTurma('99'), true);
assert.equal(queries[1].filters[0].value, '99');

// (c) Nome repetido em turmas diferentes não pode ligar uma pessoa à ordem da turma errada.
const people = [
  { name: 'Ana Souza', turma: '36', sourceRow: 2 },
  { name: 'Ana Souza', turma: '37', sourceRow: 8 }
];
const order36 = [{ name: 'Ana Souza', number: 7, __turmaId: '36' }];
const order37 = [{ name: 'Ana Souza', number: 9, __turmaId: '37' }];
assert.equal(h.matchPersonToOrder(people[1], people, order36, '36'), null);
assert.equal(h.matchPersonToOrder(people[1], people, order37, '37').number, 9);
assert.equal(h.matchPersonToOrder(people[0], people, order36, '36').number, 7);
assert.equal(h.matchPersonToOrder(people[1], [...people, { name: 'Ana Souza', turma: '37' }], order37, '37'), null,
  'nomes duplicados na mesma turma também devem permanecer sem vínculo automático');

// (d) Marcações existentes exigem confirmação digitada exatamente; sem confirmação, a importação é bloqueada.
assert.equal(h.importMarksConfirmationValid(true, '37', ''), false);
assert.equal(h.importMarksConfirmationValid(true, '37', '36'), false);
assert.equal(h.importMarksConfirmationValid(true, '37', '37'), true);
assert.equal(h.importMarksConfirmationValid(false, '37', ''), true);

// Integração: escolha explícita, campo opcional, Home por turma padrão e migração antiga protegida.
assert.ok(html.includes('Confirmar turma escolhida'), 'a turma sugerida não pode ser aplicada automaticamente');
assert.ok(html.includes('A sugestão não será aplicada sem sua confirmação explícita.'));
assert.ok(html.includes("pendingImport.ordemTurmaId = turmaId"), 'ordemTurmaId só entra no payload após confirmação explícita');
assert.ok(html.includes("if (Object.prototype.hasOwnProperty.call(payload, 'ordemTurmaId'))"), 'não persistir ordemTurmaId em workspaces antigos sem o campo');
assert.ok(html.includes("var turmaAtual = String(appData.turmaPadrao || '36')"), 'Home deve seguir turmaPadrao');
assert.ok(html.includes("if(String(workspace.ordemTurmaId || '36')!=='36')return;"), 'migração legada não pode rodar para outra turma');
assert.equal(h.turmaDateSummary({}), '', 'sem dataBatismo não deve mostrar contagem regressiva');

console.log('OK: workspace legado usa turma 36 e mantém IDs 36_n; IDs de outras turmas são isolados.');
console.log('OK: consulta de marcações da turma 37/99 filtra por turma e não lê documentos da 36.');
console.log('OK: nomes iguais em turmas diferentes não criam vínculo cruzado.');
console.log('OK: importação com marcações existentes exige confirmação digitada.');
console.log('OK: campo opcional, Home, migração legada e data opcional verificados.');

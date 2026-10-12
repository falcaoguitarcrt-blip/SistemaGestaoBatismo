import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

function section(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, 'Trecho inicial ausente: ' + start);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, 'Trecho final ausente: ' + end);
  return html.slice(from, to);
}

// Contrato de importação: preservar linhas com dados mesmo quando o nome está vazio.
// Existem 30 posições sem nome conhecidas no histórico; não podem desaparecer por filtro de nome.
const importCode = section('function normalizeWorkbook(file, buffer)', 'function namedPeople()');
assert.ok(importCode.includes('if (!hasData(row)) continue;'), 'Importação deve ignorar apenas linhas totalmente vazias.');
assert.ok(importCode.includes('people.push({'), 'Importação deve manter registros com dados, inclusive linhas sem nome.');
assert.ok(!/if\s*\(!\s*clean\(fields\[0\]\)\s*\)\s*continue/.test(importCode),
  'Não filtrar linhas importadas apenas porque o campo Nome está vazio.');

// Contrato de compatibilidade: não trocar o namespace das marcações históricas da turma 36.
const dayIdCode = section('function dayMarkIdForRow(row, orderTurmaId)', 'function importMarksConfirmationValid(');
assert.ok(dayIdCode.includes("turma === '36' && !(row && row.__manual) ? '36_' + position : 'tur_' + turma + '_' + position"),
  'O formato de ID legado 36_n deve continuar reservado à turma 36; outras turmas usam tur_<turma>_<posição>.');
assert.ok(html.includes("return String(workspace && workspace.ordemTurmaId || '36')"),
  'Workspace sem ordemTurmaId deve manter compatibilidade com a turma 36.');
assert.ok(html.includes('String(turmaAtual) === orderTurma'),
  'A Home não deve mostrar a ordem importada de outra turma.');
assert.ok(html.includes('workspace: remoteWorkspace || localWorkspace || {}'),
  'A migração deve priorizar o workspace remoto atual para evitar associar marcações à turma errada.');
assert.ok(html.includes("if(String(workspace.ordemTurmaId || '36')!=='36')return;"),
  'A migração de marcações antigas só deve executar para a ordem legada da turma 36.');

// Contrato de persistência: cadastros manuais, ordens multi-turma e marcações precisam estar nos backups.
assert.ok(html.includes('participantes: workspace.participantes || []'),
  'Backup deve preservar cadastros manuais.');
assert.ok(html.includes('ordensTurma: workspace.ordensTurma || []'),
  'Backup deve preservar ordens por turma.');
assert.ok(html.includes('marcacoesBatismo: workspace.marcacoesBatismo || {}'),
  'Backup deve preservar marcações de presença e batismo.');

console.log('OK: importação preserva linhas preenchidas sem nome.');
console.log('OK: IDs legados preservados e ordem isolada por turma.');
console.log('OK: backup inclui cadastros manuais, ordens multi-turma e marcações.');
console.log('Contratos de preservação de dados verificados: 3.');

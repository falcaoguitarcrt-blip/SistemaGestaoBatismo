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
const importCode = section('function normalizeWorkbook(file, buffer)', 'function buildPeople()');
assert.ok(importCode.includes('if (!hasData(row)) continue;'), 'Importação deve ignorar apenas linhas totalmente vazias.');
assert.ok(importCode.includes('people.push({'), 'Importação deve manter registros com dados, inclusive linhas sem nome.');
assert.ok(!/if\s*\(!\s*clean\(fields\[0\]\)\s*\)\s*continue/.test(importCode),
  'Não filtrar linhas importadas apenas porque o campo Nome está vazio.');

// Contrato de compatibilidade: não trocar o namespace das marcações históricas da turma 36.
const dayIdCode = section('function dayId(row)', 'function dayBadges(row,p)');
assert.ok(dayIdCode.includes("t==='36'&&!row.__manual?'36_'+pos:'tur_'+t+'_'+pos"),
  'O formato de ID legado da turma 36 precisa permanecer estável até uma migração validada.');

// Contrato de persistência: cadastros manuais, ordens multi-turma e marcações precisam estar nos backups.
assert.ok(html.includes('participantes: workspace.participantes || []'),
  'Backup deve preservar cadastros manuais.');
assert.ok(html.includes('ordensTurma: workspace.ordensTurma || []'),
  'Backup deve preservar ordens por turma.');
assert.ok(html.includes('marcacoesBatismo: workspace.marcacoesBatismo || {}'),
  'Backup deve preservar marcações de presença e batismo.');

console.log('OK: importação preserva linhas preenchidas sem nome.');
console.log('OK: identificadores legados da turma 36 permanecem estáveis.');
console.log('OK: backup inclui cadastros manuais, ordens multi-turma e marcações.');
console.log('Contratos de preservação de dados verificados: 3.');

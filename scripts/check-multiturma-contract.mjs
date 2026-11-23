import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

const requiredContracts = [
  ['seletor de turma na Ordem do Batismo (check-in do dia incorporado à Ordem)', 'id="order-turma-select"'],
  ['ordens separadas por turma', 'function orderForTurma()'],
  ['identificador estável para marcações', 'function dayId(row)'],
  ['cadastros manuais de participantes', 'function saveManualPerson(event)'],
  ['histórico de transferência', 'historicoTurmas.push'],
  ['filtro de turma em Pendências', 'id="pending-turma"'],
  ['filtro de turma em Camisetas', 'function shirtSummary(turmaFilter)'],
  ['filtro de turma em Reposição', 'id="return-turma"'],
  ['histórico de transferências visível', 'Transferências entre turmas'],
  ['backup com cadastros manuais', 'participantes: workspace.participantes || []'],
  ['backup com ordens multi-turma', 'ordensTurma: workspace.ordensTurma || []'],
  ['backup com marcações de presença e batismo', 'marcacoesBatismo: workspace.marcacoesBatismo || {}'],
  ['persistência de cadastros manuais no Firebase', "'participantes'"],
  ['persistência de ordens multi-turma no Firebase', "'ordensTurma'"],
  ['filtro de turma no Painel', 'id="home-turma"'],
  ['aviso à planilha espelho após salvar', 'avisarPlanilha();'],
  ['aviso à planilha espelho após marcação do dia', '.then(avisarPlanilha)'],
  ['planilha como fonte: leitura da planilha', 'async function carregarDaPlanilha()'],
  ['planilha como fonte: cadastro bloqueado', 'if(bloqueadoPelaPlanilha())return;'],
  ['planilha como fonte: edição bloqueada', 'if (bloqueadoPelaPlanilha()) return;']
];

const missing = requiredContracts.filter(([label, snippet]) => !html.includes(snippet));
if (missing.length) {
  for (const [label, snippet] of missing) console.error('FALHOU: ' + label + ' (trecho esperado: ' + snippet + ')');
  process.exit(1);
}
for (const [label] of requiredContracts) console.log('OK: ' + label);
console.log('Contratos estruturais multi-turma verificados: ' + requiredContracts.length + '.');

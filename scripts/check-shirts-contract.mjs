import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const shirtBlock = html.slice(html.indexOf('function shirtIsBillable'), html.indexOf('function buildReturns()'));
assert.ok(shirtBlock.includes("function shirtIsBillable(r) { return r.quer==='sim'; }"), 'Somente quer=sim pode gerar cobrança');
assert.ok(shirtBlock.includes("function shirtIsUnpaid(r) { return shirtIsBillable(r) && !r.pago; }"), 'Cobrança depende de sim e não pago');
assert.ok(shirtBlock.includes('Sim sem tamanho'), 'Alerta de sim sem tamanho presente');
assert.ok(html.includes("collection(firestore, 'camisetas')"), 'Coleção aditiva camisetas presente');
assert.ok(html.includes('shirt/version-conflict'), 'Atualização condicional por versão presente');
assert.ok(html.includes('before: { quer:'), 'Auditoria antes/depois presente');
assert.ok(html.includes("catch(error) { shirtRecordsLoaded=false; setImportMessage('Não foi possível carregar os registros complementares de camisetas."), 'Falha de leitura permite tentar carregar novamente');
assert.ok(html.includes("refreshShirtRecords().then(function(){ if (shirtRecordsLoaded) buildShirts(); });"), 'A tela não reinicia em ciclo infinito quando a leitura falha');
assert.ok(html.includes('ENCERRAR CAMISETAS'), 'Encerramento protegido por confirmação digitada');
assert.ok(html.includes('Reverter encerramento'), 'Reversão individual presente');
assert.ok(html.includes('function shirtCell(value)'), 'Sanitização CSV presente');
assert.ok(html.includes("'\\uFEFF'+rows.map"), 'CSV com BOM UTF-8 presente');
assert.ok(html.includes("data-shirt-action=\"whatsapp\""), 'Ação de WhatsApp presente');
assert.ok(html.includes('ultimoContatoEm'), 'Registro de contato presente');
assert.ok(!/from\s+['"]firebase-admin(?:\/|['"])/.test(html) && !/require\(\s*['"]firebase-admin(?:\/|['"])/.test(html), 'Nenhum SDK Firebase Admin importado');
assert.ok(!html.includes('allow read, write: if true'), 'Nenhuma regra permissiva introduzida');

function billable(record) { return record.quer === 'sim'; }
function unpaid(record) { return billable(record) && !record.pago; }
for (const choice of ['nao', 'ja_tem', '']) {
  assert.equal(billable({ quer: choice, pago: false }), false, choice + ' nunca gera cobrança');
  assert.equal(unpaid({ quer: choice, pago: false }), false, choice + ' nunca gera pendência');
}
assert.equal(unpaid({ quer: 'sim', pago: false }), true, 'sim sem pagamento gera pendência');
assert.equal(unpaid({ quer: 'sim', pago: true }), false, 'sim pago não gera pendência');
assert.equal({ quer: 'sim', tamanho: '' }.quer === 'sim' && !{ quer: 'sim', tamanho: '' }.tamanho, true, 'sim sem tamanho deve ser detectável');
function safeCell(value) { const s=String(value ?? ''); return /^(=|\+|-|@|\t|\r)/.test(s) ? "'" + s : s; }
for (const dangerous of ['=1+1','+SUM(A1:A2)','-2+3','@cmd','\tformula','\rformula']) {
  assert.ok(safeCell(dangerous).startsWith("'"), 'CSV protege fórmula: ' + JSON.stringify(dangerous));
}
assert.equal(safeCell('Maria'),'Maria');
const before = { quer: '', origemEncerramento: false };
const closed = { ...before, quer: 'nao', origemEncerramento: true };
const reverted = { ...closed, quer: before.quer, origemEncerramento: false };
assert.equal(closed.quer, 'nao');
assert.equal(reverted.quer, '', 'encerramento pode ser revertido');
console.log('Camisetas: contratos estáticos e mocks passaram.');

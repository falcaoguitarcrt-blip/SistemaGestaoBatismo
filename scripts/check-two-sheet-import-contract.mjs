import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

function includes(text, message) {
  assert.ok(html.includes(text), message);
}

// A importação deve ler apenas as duas primeiras abas.
includes('workbook.SheetNames.slice(0, 2)', 'A importação deve selecionar apenas as duas primeiras abas.');
includes('var orderRows = rawSheets[secondSheetName] || null;', 'A ordem deve ser lida da segunda aba real, sem exigir o nome genérico "Ordem".');
includes("secondSheetKey.indexOf('ordem') !== 0", 'A segunda aba deve ser identificada como uma aba de ordem.');
includes('sourceSheetNames: selectedSheetNames.slice()', 'A prévia deve registrar quais duas abas foram selecionadas.');
includes('Confirmar turma escolhida', 'A turma da ordem deve ser confirmada explicitamente antes de importar.');
includes('pendingImport.ordemTurmaId = turmaId', 'A turma da ordem só deve ser aplicada após a confirmação explícita.');
includes('firebaseHasMarksForTurma(targetTurmaId)', 'A importação deve verificar marcações já existentes na turma escolhida.');
includes('importMarksConfirmationValid(true, targetTurmaId', 'Marcações existentes devem exigir confirmação digitada.');
includes('Sugestão pelo nome da aba', 'A prévia deve explicar a sugestão de turma sem aplicá-la automaticamente.');

// Compatibilidade com a planilha pós-batismo: "Ordem Batismo 36" e status Eklesia.
includes("header.indexOf('batizado no eklesia') >= 0", 'O cabeçalho BATIZADO NO EKLESIA deve ser identificado.');
includes('eklesiaStatus: eklesiaIndex >= 0 ? row[eklesiaIndex] : null', 'O status Eklesia deve ser preservado como campo próprio.');
includes("key.indexOf('ordem') === 0", 'A prévia deve reconhecer nomes específicos de abas de ordem.');
includes('Batizado no Eklesia:', 'A ordem deve exibir o status Eklesia quando estiver preenchido.');

// Editar os quatro campos operacionais não pode apagar colunas adicionais da planilha original.
includes('var preservedRow = (rows[rowIndex] || []).slice();', 'A edição da ordem deve partir da linha original.');
includes('fields.forEach(function (value, fieldIndex) { preservedRow[fieldIndex] = value; });', 'A edição deve alterar apenas os campos editáveis e preservar as demais colunas.');
includes('normalizedName.indexOf(\'ordem\') === 0', 'A edição deve localizar a segunda aba mesmo quando seu nome é "Ordem Batismo 36".');

console.log('OK: importação limitada às duas primeiras abas.');
console.log('OK: sugestão de turma, confirmação explícita e status Eklesia reconhecidos.');
console.log('OK: edição preserva colunas originais adicionais.');
console.log('Contratos da planilha pós-batismo verificados: 3.');

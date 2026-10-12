# Etapa 5 — Integração das funcionalidades por turma

## Objetivo
Reduzir o risco de misturar registros de turmas diferentes enquanto a arquitetura multi-turma da Etapa 4 é preparada para validação.

## Implementado nesta etapa
- Filtro de turma em **Pendências**, aplicando o filtro tanto às métricas quanto à lista e à busca.
- Filtro de turma em **Camisetas**, aplicando o filtro aos totais, distribuição por tamanho e lista de pagamentos pendentes.
- Filtro de turma em **Reposição de aulas**, aplicando o filtro às métricas e à lista.
- Seletor de turma usa o registro de turmas já existente; a opção “Todas as turmas” mantém a consulta ampla.
- Histórico visual das transferências de participantes cadastrados diretamente no sistema, incluindo turma anterior, turma seguinte e data registrada.
- Backup JSON passa a incluir os cadastros manuais (`participantes`) e as ordens por turma (`ordensTurma`), evitando que uma exportação omita esses dados.
- Não foram alteradas regras de segurança do Firestore nem incluídos dados pessoais no repositório.

## Limites conhecidos
- Os filtros de Pendências, Camisetas e Reposição cobrem os registros importados da aba Batismo, pois os cadastros manuais ainda não têm campos operacionais equivalentes para pendências, camiseta ou reposição.
- O histórico de transferências reflete os eventos guardados em `historicoTurmas`; não substitui um histórico completo de presença, batismo ou participação por turma.
- A Etapa 4 ainda precisa de teste integrado em navegador e Firebase. Esta PR depende da branch `feature/etapa-4-multi-turma` e não deve ser mesclada diretamente em `main` antes da validação da Etapa 4.

## Testes realizados
- Verificação estática de sintaxe dos scripts clássicos embutidos.
- A validação do script `type="module"` requer análise como módulo; não se afirma teste completo de navegador.
- Ainda pendente: login real, leitura/escrita Firestore, filtros com dados reais de duas turmas, transferência, check-ins, impressão e regressão móvel.

## Critérios para validação manual
1. Selecionar uma turma e conferir que Pendências, Camisetas e Reposição mostram somente registros daquela turma.
2. Selecionar “Todas as turmas” e conferir que a lista retorna ao escopo geral.
3. Cadastrar participante, transferi-lo duas vezes e confirmar a sequência no Histórico.
4. Confirmar que a ordem e os check-ins históricos da turma 36 continuam presentes e inalterados.
5. Recarregar em outro navegador autorizado e confirmar persistência, sem abrir permissões públicas.

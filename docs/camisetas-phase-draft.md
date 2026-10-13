# Camisetas: proposta aditiva e validação

## Verificação prévia do salvamento atual

A tela antiga chama `firebaseSaveWorkspace(draft, true)` ao editar campos da camiseta. No módulo Firebase, `saveCloudWorkspace(payload, true)` cria uma nova versão completa do workspace: divide seções como `people`, `order`, `general`, `turmas`, `ordensTurma`, `participantes` e planilhas brutas em blocos, e depois atualiza o ponteiro da versão-base. Portanto, cada edição pode criar uma nova versão integral da base, não apenas o registro da camiseta.

## Direção de arquitetura

- Não escrever nos campos originais da planilha.
- Usar a coleção aditiva `camisetas/{pessoaId}`, com leitura de reserva dos campos legados.
- Atualização individual via transação Firestore com comparação de `updatedAt`; conflito exige recarregar, sem sobrescrita silenciosa.
- Auditoria antes/depois e ator/horário no registro complementar.
- Nenhuma mudança em regras Firebase, UIDs autorizados ou dados reais.
- Nenhum teste deve apontar para o projeto Firebase de produção.

## O que esta branch inclui

- API aditiva para carregar e salvar registro por pessoa com controle otimista de concorrência.
- Tela inicial de camisetas com filtros, estado por pessoa, tamanho/pagamento apenas para `quer=sim`, alerta “Sim sem tamanho”, totais, WhatsApp e registo de contato, confirmação digitada para encerrar escolha, reversão individual, exportação CSV com BOM e proteção contra fórmula, impressão e ação de entrega.
- CI com contratos estáticos e mocks para as regras críticas.

## Limitações conhecidas desta primeira entrega Draft

Antes de qualquer uso operacional, concluir e testar no Firebase de teste:
- catálogo editável persistido, prazo limite por turma e preço configurável por tamanho/valor único;
- campos completos de pagamento (data, forma, recebido por e observação);
- persistência do instantâneo do pedido, estados de pedido e detecção persistente de alterações pós-fechamento;
- listas de entrega por nome/tamanho e integração visual do Dia do Batismo sem dependência de `marcacoesBatismo`;
- garantir que Pendências liste camiseta somente para `quer=sim` e não pago;
- teste de impressão e de acessibilidade com teclado/leitor de tela;
- confirmar que as regras atuais permitem a coleção nova sem alteração de regras. Se negarem acesso, interromper e solicitar revisão de regras separada, sem ampliar acesso nesta tarefa.

## Roteiro de validação no projeto Firebase de teste

1. Use um projeto Firebase separado e duas contas autorizadas de teste; não copie dados reais.
2. Criar pessoas de teste com `quer=sim`, `nao`, `ja_tem` e vazio. Verificar que somente `sim` pode entrar em totais/cobrança e que `sim` sem tamanho mostra alerta.
3. Abrir a mesma pessoa em duas sessões, salvar valores diferentes e confirmar que a segunda gravação recebe conflito em vez de sobrescrever.
4. Encerrar escolha com confirmação incorreta e correta; validar que apenas vazios mudam para `nao`, e reverter uma pessoa, conferindo auditoria.
5. Verificar CSV em Excel/LibreOffice: BOM UTF-8, acentos e células iniciadas por `=`, `+`, `-`, `@`, tab e CR escapadas.
6. Testar WhatsApp apenas para `sim` não pago, entrega sem alterar presença/batismo, impressão e todos os filtros.
7. Validar totais e pedido após atualizar/reabrir a página.

## Como reverter

- Como a branch é isolada, fechar este PR sem mesclar descarta a proposta sem afetar produção.
- Se futuramente mesclado, reverter o commit de merge pelo GitHub e confirmar que nenhum código de migração foi executado.
- Não apagar a coleção `camisetas` automaticamente; preservar os registros para recuperação/auditoria. Qualquer limpeza deve ser manual, revisada e feita apenas no projeto de teste.

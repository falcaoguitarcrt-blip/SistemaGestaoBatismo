# Fase 6 — Pagamentos (demonstração)

**Status:** módulo demonstrativo implementado em `index.html`. Não há conexão com banco de dados, processamento financeiro ou persistência.

## Funcionalidades
- Criar lançamento vinculado a uma pessoa fictícia cadastrada na sessão.
- Descrição, valor positivo, status, vencimento opcional e observação não confidencial.
- Status: Pendente, Pago e Cancelado.
- Editar e remover lançamento, com confirmação antes da remoção.
- Alterar o status diretamente na lista.
- Pesquisar por participante, descrição, status e observação.
- Filtrar por status e por participante.
- Indicadores de quantidade de lançamentos, valor pendente e valor recebido.
- Formatação de valores em reais (BRL).

## Regras de cálculo
- Somente lançamentos com status **Pago** entram no indicador de recebido.
- Somente lançamentos com status **Pendente** entram no indicador de valores em aberto.
- Lançamentos **Cancelados** ficam fora dos dois totais.
- O indicador de quantidade inclui todos os lançamentos, inclusive cancelados.
- Um lançamento não é considerado pago por ter sido criado nem por ter uma data de vencimento.
- Os totais são calculados a partir dos lançamentos fictícios mantidos na memória desta sessão.

## Limites e segurança
- Os lançamentos desaparecem ao recarregar ou fechar a página.
- Não há Firebase, autenticação, autorização, persistência nem integração com meios de pagamento.
- Não registrar dados reais, comprovantes, dados bancários ou informações financeiras de pessoas reais.
- Esta demonstração não deve ser usada para cobrança, conciliação ou prestação de contas real.
- A remoção de uma pessoa do módulo Pessoas não apaga automaticamente seus lançamentos demonstrativos, para não apagar o histórico silenciosamente; os registros podem aparecer como “Pessoa removida”. A futura implementação deve definir regras de integridade e histórico antes de permitir exclusões reais.

## Verificação técnica realizada
- Confirmada a presença do formulário, validação de valor positivo, filtros, edição e confirmação de exclusão.
- Confirmada a separação de cálculos entre status Pendente e Pago e a exclusão de Cancelado dos totais.
- Confirmada a ausência de referências ao SDK Firebase e a `localStorage` neste protótipo.

## Checklist manual pendente
- [ ] Criar uma pessoa fictícia e lançar um valor pendente.
- [ ] Confirmar que o pendente entra em “Em aberto”, não em “Recebido”.
- [ ] Mudar para Pago e conferir a transferência entre indicadores.
- [ ] Mudar para Cancelado e confirmar que fica fora dos dois totais.
- [ ] Testar validação de valor zero, negativo e campo obrigatório.
- [ ] Testar pesquisa, filtros, edição, cancelamento da edição e exclusão.
- [ ] Conferir em desktop e celular.
- [ ] Confirmar que recarregar a página apaga os dados de demonstração.

A validação estática não substitui os testes manuais. Esta fase está concluída como demonstração, não como sistema financeiro pronto para uso real.

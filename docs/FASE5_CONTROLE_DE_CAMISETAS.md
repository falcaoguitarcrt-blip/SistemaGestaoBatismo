# Fase 5 — Controle de camisetas (demonstração)

**Status:** interface e operações demonstrativas implementadas em `index.html`. Não está conectada a banco de dados.

## Funcionalidades
- Reutiliza os registros fictícios criados no módulo Pessoas durante a sessão atual.
- Exibe a quantidade de participantes demonstrativos.
- Conta os registros com tamanho informado, sem contar “Não informado” ou “Não precisa”.
- Conta participantes com pagamento explicitamente marcado como “Pendente”.
- Permite pesquisar por nome, turma, tamanho e situação de pagamento.
- Permite alterar tamanho e situação de pagamento diretamente na lista.
- Atualiza os indicadores com base nos registros existentes na sessão.
- Mantém os campos de tamanho e pagamento separados e permite “Não informado”.

## Regras e limites
- Os indicadores refletem somente dados fictícios inseridos nesta sessão, não o cadastro oficial.
- “Não informado” não é considerado pago nem pendente.
- “Não precisa” não entra na contagem de tamanho informado.
- A lista depende dos registros temporários do módulo Pessoas.
- Os dados ficam apenas na memória da página e desaparecem ao recarregar ou fechar a aba.
- Não há Firebase, autenticação, autorização ou persistência.
- Não usar dados reais nem considerar esta tela adequada para distribuição ou cobrança real de camisetas.

## Validação técnica realizada
- Confirmada a presença do módulo, dos indicadores, da pesquisa e dos seletores de tamanho e pagamento.
- Confirmada a atualização dos indicadores ao abrir a área e após alterações nos participantes.
- Confirmada a ausência de referências a SDK do Firebase e a `localStorage` neste protótipo.

## Checklist manual pendente
- [ ] Criar pessoas fictícias em Pessoas e verificar se aparecem em Camisetas.
- [ ] Alterar tamanhos e pagamentos e confirmar atualização dos indicadores.
- [ ] Pesquisar por nome, turma, tamanho e situação de pagamento.
- [ ] Conferir visualização em desktop e celular.
- [ ] Confirmar que os dados desaparecem ao recarregar, pois ainda não há persistência.

A verificação estática do código não substitui o checklist manual. Esta fase está concluída como demonstração, não como ferramenta pronta para uso real.

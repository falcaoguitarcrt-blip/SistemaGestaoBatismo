# Etapa 6 — Validação automatizada básica

## Objetivo
Adicionar uma verificação repetível para detectar erros de sintaxe nos scripts JavaScript embutidos em `index.html`, incluindo o script ES module.

## Implementado
- Script `scripts/check-inline-scripts.mjs` que extrai os scripts inline do HTML e executa `node --check` com extensão apropriada para script clássico ou módulo.
- GitHub Actions em `.github/workflows/validate-inline-scripts.yml`, executada em pull requests e pushes para `main` ou branches `feature/etapa-*`.
- Teste estrutural `scripts/check-multiturma-contract.mjs` para proteger os principais contratos de integração e os campos obrigatórios do backup JSON.

## O que essa verificação cobre
- Erros de sintaxe nos scripts inline do arquivo principal.
- Garante que os scripts inline sejam encontrados e que falhas resultem em status não zero.
- Confere a presença de seletores, persistência, histórico e campos de backup necessários à operação multi-turma.

## O que não cobre
- Não executa a aplicação num navegador real.
- Não testa autenticação Google, regras ou persistência no Firebase.
- Não comprova a integridade dos dados existentes nem o funcionamento visual em celular.
- Não substitui testes funcionais de cadastro, transferência, ordem, check-in e impressão.

## Critério de aceite
- A verificação deve concluir sem erros no GitHub Actions.
- Em seguida, ainda é necessária a validação funcional manual com contas autorizadas e dados de teste, sem expor permissões públicas nem alterar os registros reais sem backup.


## Ampliação da Etapa 7
O teste estrutural também verifica que o backup JSON inclui `marcacoesBatismo`, ou seja, as marcações sincronizadas de presença e batismo do dia do evento. A exportação da tela de backup já passava esse mapa para `downloadJson`, mas o arquivo não o incluía; esta correção fecha essa lacuna.

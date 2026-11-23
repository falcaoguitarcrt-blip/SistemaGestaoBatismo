# Etapa 9 — Planilha Batismo como fonte dos cadastros

## Objetivo
Permitir que a equipe continue cadastrando só na planilha Batismo (Google Planilhas) e use o site para consultar os dados.

## Como funciona
- O script da planilha (`planilha-espelho/Codigo.gs`) responde `acao=dados` no app da Web com as duas primeiras abas originais (Batismo e Ordem Batismo NN), só para quem envia o token guardado em `appData/primary.planilhaSync`.
- O modo é ligado pela função do script `ativarPlanilhaComoFonte`, que grava `planilhaSync.fonte = 'planilha'`. O módulo Firebase expõe a configuração em `window.planilhaSyncConfig` e avisa com o evento `planilha-config`.
- Com o modo ligado, o site lê a planilha ao entrar, quando o Firebase recarrega, a cada 2 minutos com a aba visível e no botão “Atualizar agora”. Os dados passam pelo mesmo `normalizeWorkbook` da importação de Excel. Nada é gravado de volta na planilha.
- Cadastro, edição de pessoas, camisetas, ordem e importação ficam bloqueados com o aviso “edite direto na planilha”. Turmas, datas, turma em foco e marcações de presença e batismo do dia continuam no Firebase.
- Um aviso no topo mostra a hora da última leitura ou o erro, mantendo a última versão carregada.

## Segurança
- O hash aprovado do módulo Firebase em `apply-batizantes-v1.yml` foi atualizado: o módulo mudou só para expor `window.planilhaSyncConfig` e disparar `planilha-config`. O login Google não mudou.

## Testes
- Sintaxe dos scripts inline e testes de contrato (3 contratos novos).
- Leitura testada em Node com os dados reais da planilha passando pelo `normalizeWorkbook` do site: 1.562 pessoas e 140 posições da Ordem 36, com datas, turmas e caixas de seleção reconhecidas.
- Falta: teste no navegador com login real e com o modo ligado.

## Limites
- O site lê apenas as duas primeiras abas da planilha, como na importação de Excel. Ordens de outras turmas precisariam de outra aba na segunda posição.
- Edições feitas no site antes da troca e que não estão na planilha deixam de aparecer enquanto o modo estiver ligado (continuam guardadas no Firebase).

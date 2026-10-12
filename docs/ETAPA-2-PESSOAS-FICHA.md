# Etapa 2 | Pessoas e ficha individual

**Objetivo:** simplificar o acesso à ficha individual e oferecer um filtro de turma padrão na área Pessoas.

## Alterações propostas nesta branch

1. Removido o botão independente **Ficha** do menu principal.
2. A seção de ficha individual fica oculta até a pessoa ser aberta a partir de Pessoas.
3. O comando **Abrir ficha** continua levando ao registro selecionado, agora sem exigir uma aba própria no menu.
4. A ficha inclui um botão para voltar à listagem de Pessoas.
5. O filtro de Pessoas seleciona inicialmente a turma com maior numeração encontrada na base, como comportamento provisório de turma padrão. O seletor continua permitindo escolher outra turma ou “Todas as turmas”.

## Decisão importante sobre a turma atual

A aplicação não possui, no modelo inspecionado, uma configuração explícita e validada de “turma atual”. Por isso, esta implementação usa provisoriamente a turma de maior numeração como padrão. Isso é uma heurística, não uma garantia de que essa seja a turma ativa operacionalmente. Antes de tornar essa regra definitiva, a equipe deve confirmar que a maior numeração corresponde à turma vigente ou substituir a heurística por uma configuração explícita.

## Preservação e segurança

- Nenhuma coleção, documento, regra ou configuração do Firebase foi alterada.
- Nenhum registro foi removido, mesclado ou migrado.
- Os 14 campos atuais da ficha continuam sendo montados pela função existente.
- O editor e o fluxo de salvamento existentes foram mantidos.
- A mudança está isolada em branch e deve ser revisada antes de integrar à branch principal.

## Testes estáticos realizados

- Confirmado que não existe mais botão de navegação independente para Ficha.
- Confirmado que a seção de ficha começa oculta e é exibida ao abrir uma pessoa.
- Confirmado que o filtro seleciona visualmente a turma padrão escolhida.
- Confirmado que a ação de abrir ficha continua ligada ao `sourceRow` do registro.
- Confirmado que o caminho de retorno navega para Pessoas.

## Testes dinâmicos pendentes

A ferramenta disponível permitiu alterar e inspecionar o código versionado, mas não executar a aplicação em navegador autenticado contra o Firebase. Antes de mesclar, validar manualmente:
- login e carregamento da base;
- abrir fichas com e sem nome;
- voltar à lista e usar busca/filtro/paginação;
- editar e salvar um registro de teste autorizado;
- recarregar e confirmar a persistência.

**Status:** implementação isolada para revisão. Não mesclar nem publicar como validada antes dos testes dinâmicos e da confirmação da regra de turma atual.

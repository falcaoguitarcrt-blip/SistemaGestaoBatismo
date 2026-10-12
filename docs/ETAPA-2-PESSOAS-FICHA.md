# Etapa 2 | Pessoas e ficha individual

**Objetivo:** simplificar o acesso à ficha individual e oferecer um filtro de turma padrão na área Pessoas.

## Alterações propostas nesta branch

1. Removido o botão independente **Ficha** do menu principal.
2. A seção de ficha individual fica oculta até a pessoa ser aberta a partir de Pessoas.
3. O comando **Abrir ficha** continua levando ao registro selecionado, agora sem exigir uma aba própria no menu.
4. A ficha inclui um botão para voltar à listagem de Pessoas.
5. O filtro de Pessoas começa em “Todas as turmas” até existir uma configuração explícita e confirmada de turma vigente. O seletor continua permitindo escolher uma turma específica.

## Decisão importante sobre a turma atual

A aplicação não possui, no modelo inspecionado, uma configuração explícita e validada de “turma atual”. Para evitar filtrar pessoas incorretamente, o padrão agora é “Todas as turmas”. A turma vigente precisa ser confirmada antes de implementar um filtro padrão específico.

## Preservação e segurança

- Nenhuma coleção, documento, regra ou configuração do Firebase foi alterada.
- Nenhum registro foi removido, mesclado ou migrado.
- Os 14 campos atuais da ficha continuam sendo montados pela função existente.
- O editor e o fluxo de salvamento existentes foram mantidos.
- A mudança está isolada em branch e deve ser revisada antes de integrar à branch principal.

## Testes estáticos realizados

- Confirmado que não existe mais botão de navegação independente para Ficha.
- Confirmado que a seção de ficha começa oculta e é exibida ao abrir uma pessoa.
- Confirmado por inspeção estática que o filtro começa em “Todas as turmas” e não presume qual turma está vigente.
- Confirmado que a ação de abrir ficha continua ligada ao `sourceRow` do registro.
- Confirmado que o caminho de retorno navega para Pessoas.

## Testes dinâmicos pendentes

A ferramenta disponível permitiu alterar e inspecionar o código versionado, mas não executar a aplicação em navegador autenticado contra o Firebase. Antes de mesclar, validar manualmente:
- login e carregamento da base;
- abrir fichas com e sem nome;
- voltar à lista e usar busca/filtro/paginação;
- editar e salvar um registro de teste autorizado;
- recarregar e confirmar a persistência.

**Status:** implementação isolada para revisão. A escolha automática da turma foi removida por segurança. Permanecem pendentes os testes dinâmicos autenticados e a confirmação da turma vigente.

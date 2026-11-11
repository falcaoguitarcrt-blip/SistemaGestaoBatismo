# Revisão funcional do sistema de Gestão de Batismos

**Data:** 2026-10-12  
**Base revisada:** `main`  
**Escopo:** inspeção estática do `index.html`, documentos das etapas e contratos de validação.  
**Limitação:** não foi executado navegador autenticado contra o Firebase; resultados abaixo não equivalem a aprovação de testes ponta a ponta.

## Resumo executivo

As melhorias recentes reduziram a navegação, aproximaram dados operacionais da área Pessoas e corrigiram o caminho de abertura da ficha. A revisão encontrou lacunas entre o comportamento descrito e o modelo de dados atual. A próxima alteração deve ser pequena, testável e isolada; não se recomenda reescrever a aplicação nem migrar registros sem testes de recuperação.

## Achados priorizados

### P0 — Não alterar o modelo de dados sem esclarecer as duas fontes de participantes

O código mantém registros importados em `appData.people` e cadastros manuais em `appData.participantes`. O formulário de cadastro manual salva em `participantes`, enquanto a listagem operacional principal é construída a partir de `people`. Há também `ordensTurma` e registros legados de `order`.

**Impacto:** a experiência pode parecer fragmentada; antes de prometer uma lista única, é necessário definir como os dois modelos se relacionam, sem duplicar ou apagar dados.

**Ação:** mapear IDs, origem, turma, ordem e marcações de cada modelo; propor uma estratégia de unificação compatível, com backup e migração reversível. Não migrar nesta revisão estática.

### P1 — O conceito de turma padrão não é aplicado de forma consistente

O modelo já possui `turmaPadrao` e a interface possui uma ação para defini-la. Porém, `buildHome()` fixa `turmaAtual = '36'`; `buildPeople()` inicializa o filtro com a turma 36; `safeDayLinkForPerson()` limita o vínculo operacional à turma 36. A variável inicial `peopleState` também começa em 36.

**Impacto:** a configuração de turma padrão pode não controlar a Visão Geral e a operação de Pessoas; partes da aplicação continuam exclusivas da turma 36.

**Ação:** estabelecer uma única função para resolver a turma operacional (configuração explícita, com fallback seguro e documentado para dados legados), e utilizá-la de forma consistente. Não trocar IDs de marcações nem habilitar associação automática ambígua.

### P1 — Marcação de presença exige associação inequívoca

O código protege contra homônimos em `safeDayLinkForPerson()`, o que é positivo, mas a associação depende de nome e registros da turma 36. O Dia do Batismo usa `orderForTurma()` e `dayId()`, que devem continuar compatíveis com marcações existentes.

**Impacto:** uma ampliação ingênua para outras turmas pode mostrar estado incorreto ou registrar presença para a pessoa errada.

**Ação:** desenhar e testar associação por identificador estável, mantendo leitura compatível com os IDs legados. Até que isso seja comprovado, manter bloqueio de associações ambíguas.

### P1 — HTML inicial mistura protótipo demonstrativo e interface dinâmica

O `index.html` contém conteúdo demonstrativo estático (nomes de exemplo, totais fixos, texto de protótipo e botões demonstrativos desativados) e, posteriormente, funções que reconstroem as seções com dados reais após a autenticação.

**Impacto:** aumenta a complexidade, cria dois lugares para manter a interface e torna mais difícil garantir que nenhuma seção permaneça com conteúdo demonstrativo após o login ou em estados vazios.

**Ação:** inventariar cada seção e cada listener antes de remover o protótipo. Em uma alteração isolada, substituir os dados demonstrativos por estados vazios/loading e garantir que a aplicação continue funcional sem dados importados. Não remover elementos necessários aos seletores dos scripts sem atualizar os scripts correspondentes.

### P2 — Ficha completa: correção de navegação não prova o fluxo inteiro

A PR #26 corrige a busca do cadastro e a exibição da seção. A função `buildFiche()` apresenta os 14 campos originais e o botão de edição, mas a revisão estática não comprova a persistência e o retorno à listagem em uso real.

**Ação:** testar com múltiplas pessoas, registros sem nome, filtros, paginação, edição, salvamento e recarga. Preservar o contexto de pesquisa/turma ao retornar.

### P2 — Visão Geral e resumos precisam declarar o escopo

Os indicadores da Visão Geral são calculados com base na turma 36 e os resumos de Pessoas dependem das associações seguras disponíveis. Isso deve ser explicitamente ligado à turma operacional, sem misturar registros sem turma ou apresentar dados ausentes como zero.

**Ação:** usar uma única fonte de turma e apresentar estados vazios/indisponíveis com rótulos claros.

### P2 — Contratos automatizados não cobrem todos os comportamentos

O teste estrutural verifica a existência de funções e seletores multi-turma, mas a presença de uma string no código não prova que o fluxo está funcional. Também não prova autenticação, regras reais do Firestore, sincronização, impressão ou responsividade.

**Ação:** manter os testes estáticos e adicionar testes de comportamento possíveis, documentando separadamente o que exige conta Firebase autorizada e navegador.

### P3 — Documentação e interface de importação

A interface de importação explica o mapeamento das abas Batismo, Ordem, Ordem Batismo 35 e GERAL. O requisito operacional atual precisa permanecer explícito: importar apenas as abas autorizadas para a carga principal e preservar os dados históricos sem mesclar automaticamente.

**Ação:** alinhar os textos de ajuda ao fluxo real da importação e validar os quantitativos na prévia antes de qualquer substituição.

## Ordem recomendada de execução

1. Criar testes de contrato para turma padrão, dados demonstrativos e separação entre participantes importados/manuais.
2. Unificar a resolução da turma padrão sem alterar identificadores de marcação.
3. Corrigir a experiência de Pessoas e da Visão Geral com essa fonte única de turma.
4. Planejar a unificação dos modelos importado/manual com migração reversível; executar apenas após validar backup e vínculos.
5. Remover o HTML demonstrativo em alteração separada, depois de mapear todos os seletores/listeners.
6. Testar ficha, ordem, presença, importação, backup, sincronização e celular.
7. Revisar a PR e só então integrar à branch estável.

## Testes e limites

- Inspeção estática do `index.html` e das funções citadas: realizada.
- Inspeção dos contratos estruturais multi-turma: realizada.
- Execução de scripts de validação nesta sessão: não realizada.
- Login Google e e-mail/senha com usuário autorizado: pendente.
- Leitura/escrita real e sincronização Firestore entre dispositivos: pendente.
- Teste visual em celular e desktop: pendente.
- Exportação/restauração real de backup: pendente.

**Conclusão:** não declarar o sistema integralmente validado. A prioridade técnica é resolver a consistência da turma padrão e definir com segurança a relação entre participantes importados, cadastros manuais, ordens e marcações.
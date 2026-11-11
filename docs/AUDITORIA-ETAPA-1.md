# Auditoria técnica | Etapa 1

**Data:** 2026-10-12  
**Repositório:** `falcaoguitarcrt-blip/SistemaGestaoBatismo`  
**Branch-base auditada:** `main`  
**Commit-base:** `d5d91eaa603d4e960b81a5d1268ccb0899c39554`  
**Arquivo principal:** `index.html`  
**Cópia-base preservada:** `prototipos/gestao-batismo-base.html`

## Escopo e limites

Esta auditoria foi realizada por inspeção estática dos arquivos versionados no GitHub. Não foram alterados dados do Firebase, regras de segurança, autenticação nem arquivos de aplicação nesta etapa. Não foi possível validar diretamente o conteúdo real do Firestore, as regras atualmente publicadas no console Firebase, nem executar testes autenticados de ponta a ponta. Portanto, esses itens aparecem como validações pendentes, não como aprovados.

## Inventário técnico

- A aplicação principal está concentrada em um único `index.html` com aproximadamente 1.900 linhas, HTML, CSS e JavaScript inline.
- A interface contém 11 seções/abas: Visão geral, Pessoas, Ficha, Ordem, Dia do Batismo, Pendências, Camisetas, Reposição, Histórico, Importar e Config.
- A cópia-base `prototipos/gestao-batismo-base.html` é um arquivo separado e deve permanecer preservada para comparação. Não deve ser tratada como substituta automática da aplicação principal.
- A planilha é lida no navegador com a biblioteca SheetJS carregada por CDN.
- O módulo Firebase usa SDK JavaScript 12.8.0, Firebase Authentication (Google e e-mail/senha) e Firestore.
- Há armazenamento local via IndexedDB, incluindo workspace e snapshots/backups locais.
- A estrutura de nuvem no código inclui `appData/primary`, versões e chunks em subcoleções, `appData/primary/live/state` e a coleção `marcacoesBatismo`.
- O check-in do Dia do Batismo tem listener Firestore próprio e lógica de sincronização.
- O código salva versões da base quando há importação/edição; o check-in também é atualizado separadamente.
- O arquivo README ainda descreve a aplicação como modo local sem sincronização, o que diverge do código atual com autenticação e Firestore. Essa documentação precisa ser revisada em uma etapa apropriada.

## Mapa funcional atual

| Área | Implementação observada | Impacto para a reestruturação |
|---|---|---|
| Visão Geral | Indicadores calculados a partir de `appData.people`, ordem, camisetas, reposições e distribuição por turma. | Pode ser mantida com filtro de turma; hoje os indicadores principais agregam a base inteira. |
| Pessoas | Lista paginada, pesquisa e filtros por turma/situação. O filtro de turma começa em “Todas as turmas”. | Alterar o padrão para turma atual exige definir uma fonte confiável para identificar a turma vigente. |
| Ficha | Seção própria e função de edição de cadastro; campos da planilha são apresentados na ficha. | Migrar a experiência para a ficha aberta a partir de Pessoas sem perder os 14 campos atuais. |
| Ordem | Lista paginada, pesquisa e ação “Editar posição”. | Ainda não há ação dedicada para mover diretamente para uma posição nem reordenação visual identificada na interface. |
| Dia do Batismo | Lista operacional com filtros, controles de presença/batismo e sincronização própria. | A lógica atual usa turma `36` em identificadores/consultas e busca pessoa pelo nome com fallback. Deve ser generalizada cuidadosamente antes de suportar outras turmas. |
| Pendências | Visão derivada de campos de cadastro, com ação para abrir a ficha. | Integrar a edição à ficha individual; evitar criar coleção ou cópia paralela sem necessidade. |
| Camisetas | Resumo e filtros calculados a partir dos campos de camiseta e pagamento do cadastro. | Integrar à ficha preservando a distinção entre tamanho, pagamento e outros estados disponíveis. |
| Reposição | Visão calculada a partir de `JORNADA` e `AULA P/ REPOR`. | Confirmar se o modelo atual é apenas texto de origem ou se há campos de estado estruturados antes de desenhar ações de conclusão. |
| Histórico | A função principal atualmente exibe uma explicação sobre a base e versões; há também funções auxiliares para exibir registros históricos de abas adicionais. | Antes de remover a aba, identificar se as funções auxiliares ainda são chamadas e qual histórico é efetivamente acessível. Preservar versões de dados. |
| Importar | Pré-visualização, mapeamento, importação, backups e exportação. | Não alterar o fluxo sem teste de regressão e comparação dos quantitativos. |
| Config | Área administrativa/configurações. | Preservar durante a simplificação do menu, salvo decisão explícita posterior. |

## Riscos e inconsistências identificados

### 1. Turma do check-in fixada no código

A sincronização do Dia do Batismo consulta `marcacoesBatismo` com `turmaId == '36'`; os IDs e a procura de pessoa também usam lógica específica da turma 36. Isso é uma dependência concreta que precisa ser mapeada antes de habilitar seleção de turma nessa tela. Não alterar isso nesta etapa.

### 2. Identidade da pessoa e posição

O check-in usa identificadores formados com turma e número/posição. A futura movimentação da ordem precisa assegurar que as marcações continuem associadas à pessoa correta quando a posição mudar. A solução não deve simplesmente renomear documentos de check-in sem uma estratégia de migração segura e testada.

### 3. Filtro padrão da aba Pessoas

O filtro atual começa em “Todas as turmas”. O requisito futuro é abrir na turma vigente, mas a aplicação precisa de uma regra explícita e verificável para determinar qual é essa turma. Não presumir que será sempre a turma 36.

### 4. Importação das abas da planilha

O código contém estruturas para `people`, `order`, `order35`, `general`, `generalAll` e `generalUnmapped`, e a pré-visualização menciona as abas “Ordem Batismo 35” e “GERAL”. O fluxo efetivo de importação deve ser verificado contra o requisito vigente de utilizar somente as duas primeiras abas (“Batismo” e “Ordem”) antes de qualquer mudança na importação. Não apagar dados já existentes no Firestore durante essa verificação.

### 5. README desatualizado

O README afirma que o modo atual é local e não possui sincronização entre usuários, enquanto o código principal contém Firebase Authentication e Firestore. A documentação deve ser alinhada ao comportamento real após validar o fluxo de produção, sem divulgar dados pessoais ou detalhes sensíveis.

### 6. Segurança do Firebase não verificável apenas pelo repositório

A configuração do cliente Firebase aparece no código, o que é comum em aplicações web Firebase; a proteção dos dados depende das regras do Firestore, dos provedores de autenticação e das permissões efetivamente configuradas. Esta auditoria não acessou o console Firebase e não declara as regras aprovadas. Não tornar o Firestore público e não adicionar dados pessoais ao repositório.

### 7. Validação dinâmica pendente

A inspeção do código não comprova o funcionamento em navegador. Permanecem pendentes testes de login, leitura/escrita autorizada, sincronização entre dispositivos, persistência após recarregar e erros de rede.

## Mapa das relações a preservar

- **Pessoa:** cadastro original e identificador estável, idealmente independente da posição.
- **Turma:** associação da pessoa à turma, separada do filtro de tela.
- **Ordem:** posição e referência da pessoa, incluindo posições reservadas e registros incompletos.
- **Presença/batismo:** marcações do check-in associadas de forma estável à pessoa e à turma.
- **Pendências/camisetas/reposições:** hoje parte relevante do resumo é derivada de campos do cadastro. Confirmar o modelo atual antes de criar estados novos.
- **Versões/backup:** manter versões de importação/edição e os backups locais existentes.

## Plano recomendado para as próximas etapas

1. **Etapa 2:** ficha individual e filtro padrão por turma. Antes de definir a turma atual, documentar a regra de seleção; não modificar ainda a estrutura do check-in.
2. **Etapa 3:** movimentação de ordem somente após definir como os registros de check-in continuam ligados à pessoa quando a posição muda.
3. **Etapa 4:** unificar a apresentação de presença e batismo sem quebrar a sincronização existente; suportar turma selecionada somente após generalizar com segurança a lógica atualmente fixada na turma 36.
4. **Etapas 5–7:** integrar pendências, camisetas e reposições usando os dados existentes, evitando duplicação.
5. **Etapa 8:** remover abas apenas depois de testar a equivalência funcional; revisar o README e decidir se a Visão Geral permanece com filtro por turma.
6. **Etapa 9:** executar testes dinâmicos, revisar o diff, verificar dados reais com acesso autorizado e publicar somente após validação.

## Checklist de saída da Etapa 1

- [x] Arquivo principal e cópia-base identificados.
- [x] Branch de auditoria criada a partir de `main`.
- [x] Abas e principais funções inventariadas.
- [x] Estrutura de armazenamento local e Firestore identificada no código.
- [x] Dependência do check-in na turma 36 identificada.
- [x] Discrepância de documentação/importação registrada.
- [ ] Regras reais do Firestore verificadas no console Firebase.
- [ ] Teste autenticado de ponta a ponta executado.
- [ ] Quantitativos reais do Firestore comparados com a origem.

Os três itens pendentes dependem de acesso/execução fora da inspeção estática; não devem ser marcados como aprovados por inferência.

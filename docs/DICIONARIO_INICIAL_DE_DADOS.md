# Dicionário inicial de campos — fonte de batismo

Este documento registra apenas nomes de colunas e regras de tratamento. Não contém nomes, telefones, observações individuais nem linhas de participantes.

## Aba principal: ` Batismo`

| Campo original | Uso proposto | Regra inicial |
|---|---|---|
| NOME | Nome de exibição | Não usar como ID único; possíveis duplicidades exigem revisão. |
| IDADE | Idade | Campo opcional; validar tipo e necessidade de coleta. |
| TELEFONE | Contato | Dado pessoal; restringir acesso e exportações. |
| TURMA | Turma vinculada | Normalizar para referência de turma, após validar os valores existentes. |
| DATA | Data associada ao registro | Confirmar significado e formato antes de migrar. |
| JORNADA | Situação da jornada | Preservar o valor original e mapear opções válidas após revisão. |
| AULA P/ REPOR | Aulas a repor | Não inferir ausência de pendência quando o campo estiver vazio. |
| ENTROU NO GRUPO | Entrada no grupo | Converter valores somente após conferir os valores reais e seu significado. |
| CAMISETA | Tamanho de camiseta | Campo opcional; validar lista de tamanhos. |
| PG CAMISETA | Pagamento de camiseta | Separar “não informado” de “não pago”. |
| STATUS | Situação administrativa | Confirmar significado e opções válidas antes de mapear. |
| PENDENCIA | Pendência legada | Preservar em cópia restrita; converter em registros individuais somente após revisão. |
| BATIZADO | Resultado do batismo | Não inferir resultado a partir de campo vazio; confirmar em fonte confiável. |
| INVESTIGAÇÃO PERFIL (FBI) | Nota altamente confidencial | Não migrar automaticamente. Avaliar necessidade, finalidade e acesso restrito antes de qualquer armazenamento. |

A planilha também contém colunas vazias ou auxiliares após os campos acima. Não migrá-las sem confirmar se contêm fórmulas, dados ocultos ou finalidade operacional.

## Aba: `Ordem`

Cabeçalhos observados:
- Coluna A: `FICHAS RETIRADAS`
- Coluna B: `NUMERAÇÃO`
- Coluna E: `Situação no ekklesia`

A estrutura também contém colunas intermediárias e adicionais sem cabeçalho evidente na primeira linha. Antes de importar, é necessário mapear células mescladas, fórmulas, dados nas colunas restantes e a relação entre numeração, pessoa e situação. Não assumir que o número da linha identifica uma pessoa ou um evento.

## Abas históricas

- `Ordem Batismo 35`: contém campos de ordem e indicadores relacionados à aula de batismo e ao batismo na missão. Usar apenas para consulta histórica e validação manual, não para importação automática.
- `GERAL`: contém cabeçalhos relacionados a nome, idade, telefone, turma e ano. Manter como referência histórica, sem importação automática.

## Regras de conversão

1. Criar ID interno estável para cada pessoa e manter uma tabela de rastreabilidade protegida entre o registro original e o ID novo.
2. Preservar os valores originais em uma cópia de auditoria restrita.
3. Distinguir explicitamente: concluído, não concluído, não se aplica e não informado, quando o significado puder ser confirmado.
4. Não converter texto livre em estados automaticamente sem validação.
5. Não unir registros por nome aproximado. Correspondências duvidosas devem ser revisadas por pessoa autorizada.
6. Validar totais, duplicidades candidatas, campos vazios e registros sem vínculo antes de aprovar a migração.

## Limitação da auditoria inicial

Este dicionário é preliminar. Os nomes dos campos foram inspecionados, mas os significados operacionais de `DATA`, `STATUS`, `Situação no ekklesia` e outros campos ambíguos ainda precisam de confirmação dos responsáveis. Nenhuma migração ou alteração na planilha original foi realizada.

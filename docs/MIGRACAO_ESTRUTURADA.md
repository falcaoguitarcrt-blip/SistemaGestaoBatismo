# Migração estruturada da base de batismo

## Coleções

- `turmas/{turmaId}`: `numero`, `dataBatismo`, `local`, `status` (`planejada | ativa | encerrada`), `capacidade`, `quantidadeNaPlanilha`, `camposAConfirmar`.
- `pessoas/{pessoaId}`: dados normalizados de nome, telefone, idade, faixa etária, menor, status, jornada, aulas, aulão (inscrito/data/dataTexto), camiseta, pendência e referência `origem` (aba/linha/versão). O telefone está neste documento, que não é acessível ao perfil voluntário.
- `pessoas/{pessoaId}/privado/origem`: cópia exata da linha original, acessível só a admin/pastor; a origem não é substituída pela normalização.
- `ordem/{posicaoId}`: turma, posição, nome de origem, nome de busca, `pessoaId` e campos originais. Uma posição sem nome também vira documento.
- `gruposDuplicados/{id}`: decisão confirmada (`mesclar | manter | ignorar`), IDs envolvidos e pessoa canônica quando houver.
- `regrasInterpretacao/{id}`: texto exato e normalizado, tipo sugerido, frequência e aprovação.
- `auditoria/{id}`: lote, admin, data, caminhos criados e total ignorado. Não replica valores pessoais.
- `usuarios/{uid}`: perfil e `ativo`, usados pelas regras como autorização. Criar o primeiro admin pelo Console do Firebase.

## Regras de transformação

- IDs são determinísticos pela turma e linha da origem. A execução usa transações create-only: se o documento já existir, preserva e registra como ignorado.
- A turma 36 recebe `ativa` e `2026-10-12`, a data informada no sistema. Turmas 19–35 ficam `encerrada`, 37 `planejada`. O local e a capacidade ficam vazios para preenchimento confirmado. A data de outras turmas não é inferida da coluna `DATA`, pois essa coluna não identifica com segurança a data do batismo.
- Faixas: menor (<18), jovem adulto (18–29), adulto (30–59), 60+; idade ausente fica desconhecida e `menor: null`.
- Telefone é normalizado para `+55DDDNÚMERO` quando há 10 ou 11 dígitos nacionais. Formatação suspeita ou dígito inválido é listada para revisão, sem corrigir silenciosamente.
- Camiseta preenchida vira `quer`; “já tem” vira `ja_tem`; vazio permanece `""` (sem pendência). Apenas `PG CAMISETA = true` vira pago. Valor e entrega ficam nulos se não existem na planilha.
- Texto livre é agrupado e sugerido. A sugestão não altera os campos estruturados até o admin aprová-la. O texto original fica preservado em `privado/origem`.
- Duplicados não são apagados. “Mesclar” exige escolher o documento principal e confirmação explícita; copia somente campos estruturados vazios para o principal, registra conflitos sem escolher valores e mantém todos os documentos e origens ligados pela relação canônica. “Manter ambos” e “Ignorar” também mantêm cada pessoa.
- Ordem associa automaticamente apenas nome normalizado com correspondência única. Repetidos exigem escolha na revisão; sem correspondência ficam sem `pessoaId` para revisão posterior.

## Segurança e publicação

`migracao.html` é ferramenta de uso único, exige autenticação e `usuarios/{uid}.perfil == "admin"` com `ativo == true`. Ela baixa o backup JSON no aparelho antes de habilitar a execução. Não enviar esse backup, a planilha nem qualquer documento pessoal ao GitHub.

O arquivo `firestore.rules` protege as novas coleções e restringe os blocos antigos `appData/primary` a admin/pastor. **Não publicar essas regras antes de adaptar as telas normais do sistema para ler as novas coleções**: hoje o aplicativo carrega os blocos antigos inteiros, então a restrição fará usuários secretaria/líder/voluntário perderem acesso às telas. Não é seguro contornar isso com acesso amplo, pois os blocos antigos contêm campos pessoais e sensíveis.

## Execução e conferência

1. Ativar/conferir o usuário admin em Authentication e cadastrar `usuarios/{uid}` com `email`, `perfil: "admin"`, `ativo: true`.
2. Revisar a configuração do Firebase e publicar as regras de teste em ambiente de homologação; testar acesso sem perfil e leitura de `privado/origem` com voluntário.
3. Abrir `/migracao.html` autenticado como admin. A ferramenta mostra contagem existente → prevista, registros para revisar, textos, duplicados e vínculos da Ordem.
4. Resolver as revisões necessárias e atualizar a simulação. Baixar o backup JSON; guardar em local criptografado e privado.
5. Digitar `MIGRAR` quando solicitado. A execução cria em lotes e não sobrescreve IDs já existentes; se for interrompida, reabra e repita, pois a migração é idempotente.
6. Conferir os totais exibidos com as coleções e o log em `auditoria`. Só depois adaptar e validar as telas de uso diário para operar nas coleções estruturadas.


## Checklist de validação

**Antes da execução (simulação):**
- Conferir que o Firestore tem 1.563 registros importados de Batismo, 140 posições de Ordem e 58 nomes na Ordem (os totais do painel devem refletir a versão atual, não esses números fixos).
- Conferir 19 turmas propostas (19 a 37), turma 36 ativa e data 12/10/2026.
- Conferir 54 grupos repetidos, 30 registros sem nome e as posições vazias da Ordem.
- Aprovar interpretações uma a uma; validar especificamente “REPOR AULA 2 E 3” e “INSCRITA PARA AULÃO 09/11”.
- Para cada mescla, escolher a pessoa principal e confirmar; verificar campos conflitantes antes de aplicar.
- Resolver as posições ambíguas da Ordem e deixar as posições vazias sem `pessoaId`.
- Baixar o JSON e guardar em local privado antes de digitar `MIGRAR`.

**Depois da execução:**
- Conferir no painel antes → depois: turmas, pessoas e ordem; somar a diferença com os documentos criados e confirmar que registros já existentes aparecem como ignorados.
- Confirmar que a repetição da migração não cria novos documentos nem altera os já existentes.
- Conferir que cada posição da Ordem, inclusive vazia, existe e que os vínculos únicos correspondem à pessoa correta.
- Conferir em `auditoria` quem executou, quando, caminhos/campos criados e lotes processados; conferir que os valores da origem pessoal não foram duplicados no log.
- Testar como visitante não autenticado, usuário sem `usuarios/{uid}` ativo, voluntário e admin; validar que o voluntário não lê telefone nem `privado/origem`.
- Confirmar que a tela administrativa do sistema só mostra a entrada da migração para admin.

## Contagens para a conferência

No código atual, a fonte foi importada dentro de `appData/primary` como pessoas e posições, além das abas brutas. O arquivo anexado mostra 1.564 linhas não vazias abaixo do cabeçalho na aba Batismo; uma é cabeçalho repetido, portanto a expectativa após a filtragem é 1.563 registros. A revisão de nomes repete os 54 grupos identificados. A aba Ordem tem 140 posições, incluindo posições sem nome; 58 nomes foram reportados na importação anterior. Os números de antes/depois das coleções estruturadas devem ser os lidos no Firestore pela simulação, não estimativas fixas.

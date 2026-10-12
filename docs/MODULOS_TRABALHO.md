# Pendências, Reposição e Camisetas

Este documento descreve os módulos conectados às coleções estruturadas do Firestore. O arquivo Excel não é carregado por estas telas, não é salvo no repositório e não faz parte do pedido de camisetas: a exportação contém apenas contagens por tamanho.

## Antes de usar

1. Confira que os documentos estruturados de \`turmas\` e \`pessoas\` já existem no Firestore.
2. Publique \`firestore.rules\` no projeto Firebase correto, depois de revisar as regras no Console ou no Firebase Emulator.
3. Cadastre perfis ativos em \`usuarios/{uid}\`. Secretaria e líder da turma podem operar os módulos; só admin/secretaria alteram a configuração.
4. Configure o preço da camiseta em **Configuração de trabalho**. Enquanto o preço estiver em zero, o esperado financeiro também será zero.
5. Use contas e registros de teste antes de trabalhar com dados reais.

## Dados gravados

| Caminho | Conteúdo e comportamento |
| --- | --- |
| \`pendencias/{id}\` | \`turmaId\`, \`pessoaId\`, \`tipo\`, \`responsavel\`, \`prazo\`, \`status\`, \`notas\`, \`automatico\`, \`autoKey\`, revisão e autoria. O status é \`aberta\`, \`em_contato\`, \`resolvida\` ou \`arquivada\`. |
| \`auloes/{aulaoId}\` | Turma, data, hora, local, vagas, aulas 1–4 que serão repostas, contador de inscritos, status e revisão. |
| \`auloes/{aulaoId}/inscricoes/{pessoaId}\` | Uma inscrição por pessoa e aulão. Guarda situação, horários e quem inscreveu ou registrou presença. |
| \`pessoas/{pessoaId}/camisetaPagamentos/{pagamentoId}\` | Registro imutável do valor, data, forma, responsável pelo recebimento e autoria. Cada pagamento fica em documento próprio. |
| \`pessoas/{pessoaId}\` | O estado atual da camiseta continua em \`camiseta\`: opção, tamanho, pago, valor, data, entrega e data da entrega. |
| \`configuracoes/ferramentas\` | Preço padrão, catálogo de tamanhos, catálogo de tipos de pendência e modelos de mensagem. |
| \`auditoria/{id}\` | Inclusões somente. Registra usuário, nome, horário, documento, revisão e valores anteriores/novos dos campos alterados. |

### Pendências automáticas

Ao abrir uma turma em uma sessão autorizada, a tela observa as pessoas e pendências daquela turma. Ela cria registros com identificadores determinísticos para:

- menor sem responsável informado;
- telefone ausente ou marcado como inválido;
- aula explicitamente marcada como faltante (\`aulas[n] === false\`);
- camiseta com opção \`quer\` e sem pagamento.

Quando uma dessas causas deixa de existir, a pendência automática aberta passa para resolvida. Se ela foi resolvida automaticamente e a causa reaparecer, a tela a reabre. Uma resolução feita manualmente não é reaberta automaticamente. Campos vazios/desconhecidos de aula são preservados e não são tratados como faltantes.

O tipo **Sem Ekklesia** continua disponível para registro manual. Turmas encerradas aparecem em **Arquivadas, a revisar**; pendências abertas ou em contato passam para arquivadas e ficam sem ações operacionais.

Como o site é estático, essa reconciliação acontece quando uma pessoa autorizada abre a turma no site. Para criar/fechar pendências mesmo quando ninguém está conectado, seria necessário publicar uma Cloud Function no projeto Firebase.

### Reposição

A criação de um aulão exige data, hora, local, vagas e ao menos uma aula de reposição. A inscrição usa uma transação que confere o contador e a disponibilidade de vagas no servidor. A presença só é aceita para pessoa inscrita; na mesma transação, marca como concluídas as aulas informadas para aquele aulão. O contador e a inscrição ficam consistentes entre aparelhos.

O botão de impressão gera a chamada dos inscritos, com aulas, presença e espaço para assinatura. O convite pelo WhatsApp aparece para quem tem aula faltante e ainda não está inscrito no aulão escolhido.

### Camisetas e valores

A opção vazia significa **não respondeu**. Somente \`quer\` conta no pedido e no valor esperado. \`nao_quer\` e \`ja_tem\` não geram cobrança. Pagamento em lote registra, para cada pessoa, valor, data, PIX/dinheiro/cartão e quem recebeu; os pagamentos não são editáveis nem apagáveis pelas regras. A entrega atualiza o cadastro e cria auditoria.

O resumo esperado usa \`quantidade com opção quer × preço configurado\`. O recebido soma os valores dos pagamentos registrados. Para cadastros antigos marcados como pagos sem valor guardado, a tela estima o recebido pelo preço configurado e identifica a estimativa no rótulo. O pedido Excel contém somente tamanho e quantidade, sem nomes ou telefones.

## Permissões das regras

- Todas as coleções continuam negadas por padrão.
- Sem perfil ativo em \`usuarios/{uid}\`, não há acesso.
- Secretaria e admin podem operar os módulos. Líderes ficam limitados à turma cadastrada em seu perfil.
- Voluntários não leem telefone, pagamentos, pendências nem inscrições.
- Aulas e vagas são validadas por tipo; a inscrição, o contador e a presença são vinculados por regras de caminho e escritas atômicas.
- Pagamentos exigem atualização correspondente do cadastro na mesma transação.
- Auditoria permite inclusão, mas nega edição e exclusão.
- A implantação destas regras não é feita por um commit GitHub. Publique-as somente no projeto Firebase identificado como o correto.

## Checklist de validação

Faça primeiro no Emulator ou com uma turma e pessoas de teste.

### Acesso e regras

- [ ] Sem login ou com usuário sem perfil ativo: leituras e gravações dos módulos são negadas.
- [ ] Voluntário não consegue ler telefone, pendências, inscrições nem pagamentos, inclusive tentando acessar diretamente a coleção.
- [ ] Secretaria opera os registros e altera os catálogos; líder altera somente sua turma; turma encerrada fica em leitura para as ações do dia a dia.
- [ ] Tentar editar/excluir um documento de auditoria é negado.
- [ ] Tentar registrar pagamento sem atualizar a camiseta na mesma transação, ou para uma opção diferente de \`quer\`, é negado.

### Pendência automática e ações em lote

- [ ] Em uma pessoa de teste, marcar telefone inválido, remover responsável de menor, deixar aula explicitamente falsa e selecionar camiseta \`quer\` sem pagamento; conferir a criação das pendências correspondentes.
- [ ] Corrigir cada causa e conferir a resolução automática da pendência correspondente.
- [ ] Resolver várias pendências em lote; conferir estado e uma entrada de auditoria para cada documento.
- [ ] Atribuir várias pendências em lote e confirmar pessoa, horário e campos antigos/novos na auditoria.
- [ ] Simular mais de 30 dias e conferir o selo **Antiga**.
- [ ] Encerrar uma turma e conferir pendências abertas em **Arquivadas, a revisar**, sem cobrança ativa.

### Reposição

- [ ] Criar aulão com aulas, data, hora, local e uma vaga; validar campos obrigatórios.
- [ ] Com dois aparelhos, tentar inscrever duas pessoas para a última vaga; somente uma deve ser confirmada.
- [ ] Registrar a presença de uma pessoa inscrita e confirmar que as aulas escolhidas passam a verdadeiras no cadastro.
- [ ] Tentar registrar presença sem inscrição e repetir a presença; ambas devem ser recusadas.
- [ ] Conferir o convite de WhatsApp para alguém com aula faltante que não esteja inscrito.
- [ ] Conferir a chamada impressa em A4, inclusive datas, aulas e coluna de assinatura.

### Camisetas

- [ ] Conferir que \`quer\` entra no pedido, \`não_quer\`, \`já_tem\` e vazio não entram.
- [ ] Confirmar que vazio não cria pendência de cobrança; somente \`quer\` sem pagamento cria.
- [ ] Registrar pagamentos em lote e conferir valor, data, forma, recebedor, resumo financeiro e auditoria.
- [ ] Confirmar que uma segunda tentativa não duplica o pagamento.
- [ ] Registrar e desfazer entrega; conferir valor atual e histórico.
- [ ] Editar preço e tamanhos em Configuração; conferir os totais e a exportação agregada por tamanho.
- [ ] Confirmar que o Excel exportado não contém dados pessoais.
- [ ] Testar os modelos de WhatsApp com substituição de \`{nome}\` e \`{data}\`.

## Limite desta entrega

A alteração de código prepara as telas e as regras no branch do Pull Request. Ela não publica regras, não implanta o site e não grava dados de produção. O teste real das permissões e transações depende de executar o checklist no projeto Firebase correto.

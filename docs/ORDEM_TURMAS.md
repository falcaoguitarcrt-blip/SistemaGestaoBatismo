# Ordem por turma

A tela **Ordem do batismo** lê as coleções estruturadas do Firestore. Ela não depende de anexar novamente a planilha. As posições que já existem, inclusive as vazias, mantêm seus IDs e a origem privada.

## Dados usados

- `turmas/{turmaId}`: número, data, local, situação, capacidade e revisão.
- `ordem/{posicaoId}`: posição, pessoa vinculada ou visitante/externo, pastor, subgrupo, ficha retirada, prioridades e revisão. A origem importada continua em `ordem/{posicaoId}/privado/origem`.
- `ordemTurma/{turmaId}`: revisão compartilhada, trava da ordem e estado de encerramento.
- `edicaoOrdem/{turmaId_uid}`: presença temporária de quem está editando. A interface ignora sinais com mais de 30 segundos.
- `batismos/{id}`: registro imutável criado ao encerrar, somente para posições marcadas como batizadas no check-in.
- `auditoria/{id}`: histórico somente de adição. Alterações das pessoas arquivadas apontam para a revisão atual do cadastro.

Para que voluntários vejam as etiquetas de menor, camiseta e pendência sem ler os documentos completos de Pessoas, a Ordem armazena um resumo mínimo: menor, responsável informado, opção/tamanho da camiseta e existência de pendência. Ele não contém telefone, nome de responsável nem texto da pendência. Admin, secretaria ou líder da turma podem selecionar **Atualizar dados da Ordem** para preencher/atualizar esses resumos.

As observações impressas são compostas por etiquetas controladas, como prioridade, Kids, camiseta, menor e alerta. A tela não coleta texto livre nesse campo.

## Reordenação e conflitos

SortableJS 1.15.7 permite arrastar pela alça. A gravação atualiza todos os números em uma transação e incrementa uma revisão única da turma. Se alguém salvou enquanto o arrasto ou edição estava aberto, a transação é recusada e o dispositivo mostra os dados atuais; reabra a posição ou arraste novamente.

## Encerramento recuperável

O botão só habilita no dia seguinte à data do batismo. Admin/secretaria inicia o encerramento, que congela a Ordem e bloqueia novas alterações da turma. As pendências abertas são arquivadas em grupos pequenos, cada uma com auditoria. Depois, uma transação confirma que não restam pendências abertas, cria os documentos de batismo para quem foi marcado como batizado e muda a turma para encerrada.

Se a conexão cair durante o arquivamento, a turma continua bloqueada com o estado de encerramento em andamento. Quando a conexão voltar, use **Continuar encerramento**. As pendências já arquivadas são ignoradas, então a retomada não duplica os registros. O histórico original dos cadastros não é apagado.

## Publicar com segurança

1. Revise as alterações neste pull request. O site publicado não muda enquanto o PR não for mesclado e publicado.
2. Publique `firestore.rules` no projeto Firebase correto antes de ativar a tela para equipe. Não substitua as regras por acesso público.
3. Primeiro teste com contas e registros fictícios no simulador de regras ou em um projeto de homologação.
4. Não suba Excel, exportação JSON, telefones, nomes de responsáveis ou dados de pessoas ao GitHub.

## Checklist de validação

### Ordem e dois usuários

- [ ] Entre como secretaria em dois navegadores/aparelhos, abra a mesma turma e confirme que ambos veem as mesmas posições.
- [ ] No primeiro aparelho, arraste uma posição para outra sequência. No segundo, confirme a renumeração em poucos segundos.
- [ ] Comece a arrastar no segundo enquanto o primeiro altera a ordem. Confirme que só uma gravação vence; a outra mostra conflito e recarrega a versão atual.
- [ ] Abra a mesma posição em dois aparelhos. Salve em um deles e, no outro, tente salvar o formulário antigo; confirme o aviso de conflito.
- [ ] Enquanto o modal está aberto, confira que o outro aparelho vê quem está editando. Feche o modal e aguarde o sinal desaparecer.
- [ ] No celular, arraste pela alça sem iniciar seleção de texto ou rolagem horizontal.

### Vínculo e alertas

- [ ] Selecione uma pessoa cadastrada da turma pelo autocompletar e confira que o vínculo e as etiquetas aparecem.
- [ ] Digite um nome sem selecionar cadastro e tente salvar: deve pedir a opção Visitante/externo. Marque essa opção e confirme o selo.
- [ ] Teste uma posição sem nome, ficha não retirada, menor sem responsável, pendência impeditiva e vínculo de pessoa de outra turma.
- [ ] Toque em **Ficha retirada** e confira que o estado sincroniza em outro aparelho.
- [ ] Atualize os dados resumidos e confira que ficam disponíveis na conta voluntária sem telefone ou texto de pendência.

### Impressão

- [ ] Imprima a ordem inteira em A4 e confira turma, data, local, número, nome, pastor, ficha, observações controladas e espaço de assinatura.
- [ ] Imprima **somente pendentes** e confirme que não aparecem as posições sem alertas.
- [ ] Confira quebra de página, repetição do cabeçalho da tabela e leitura em preto e branco.

### Turma e encerramento

- [ ] Crie uma turma de teste, confira que aparece no seletor e edite data, local e capacidade.
- [ ] Tente encerrar antes da data e no próprio dia: a ação deve permanecer indisponível.
- [ ] Em homologação, avance a data para o dia seguinte. Marque alguns batismos e deixe pelo menos uma pendência aberta.
- [ ] Inicie o encerramento. Confirme que posição e cadastro não aceitam nova edição, que a pendência recebe `arquivadaRevisao: true` e auditoria, e que só pessoas marcadas geram `batismos/{id}`.
- [ ] Simule interrupção de rede durante o arquivamento, volte à tela e use **Continuar encerramento**. Confirme que a pendência já arquivada não duplica.
- [ ] Depois de encerrar, tente reordenar, editar posição e alterar dados da turma; deve ser bloqueado pelas regras.

### Regras e privacidade

- [ ] Voluntário ativo consegue ler somente a ordem da turma ativa e não consegue editar posição, turma ou resumo.
- [ ] Voluntário não lê Pessoas, telefones, contatos privados nem auditoria.
- [ ] Líder lê as turmas conforme o perfil e só altera sua turma.
- [ ] Secretaria/admin cria e edita turmas e pode encerrar após o batismo.
- [ ] Usuário inativo, não cadastrado, ou de outra turma recebe permissão negada.
- [ ] Auditoria aceita somente criação; edição e exclusão são negadas.
- [ ] Posições e registros de batismo não podem ser apagados pelas telas.

## Limite desta entrega

O código e as regras foram preparados no pull request. Não houve publicação, implantação de regras, sessão autenticada de teste ou gravação no Firestore de produção. Faça o checklist em homologação antes do uso real.

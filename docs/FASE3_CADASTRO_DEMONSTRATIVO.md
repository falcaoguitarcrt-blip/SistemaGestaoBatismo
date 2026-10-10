# Fase 3 — Cadastro de participantes (demonstração)

**Status:** formulário e ciclo de cadastro demonstrativo implementados no `index.html`. Os registros existem somente na memória da página e não constituem cadastro oficial.

## Campos cobertos

- Nome de demonstração e turma.
- Situação da jornada.
- Aulas a repor.
- Aula de preparação para batismo.
- Entrada no grupo de batismo.
- Tamanho da camiseta e situação do pagamento.
- Participação no próximo evento, separada do resultado final.
- Pendências em texto para demonstração.
- Observação administrativa não confidencial para demonstração.

Não foram incluídos telefone nem notas de investigação/confidenciais. Os dados reais não devem ser inseridos na página pública.

## Operações disponíveis

- Adicionar registros fictícios.
- Validar nome, turma e situação da jornada.
- Editar registros.
- Remover registros.
- Pesquisar em tempo real por nome, turma, jornada, pendências, aulas a repor, preparação, participação, resultado, grupo, camiseta, pagamento e observação.
- Mostrar campos sem informação como “Não informado”.
- Exibir mensagens de validação e confirmação antes da remoção.
- Cancelar a edição e voltar ao formulário limpo.
- Renderizar valores digitados como texto, sem interpretar entradas como HTML.

## Regras de negócio separadas

- Conclusão da jornada não implica participação no evento.
- Participação confirmada não implica que o batismo foi realizado.
- Resultado final fica em campo separado e começa como “Não informado”.
- Campos vazios opcionais permanecem como “Não informado”.
- As pendências nesta versão são um campo de demonstração. A modelagem definitiva deve permitir múltiplas pendências independentes por pessoa.

## Limites

- Sem Firebase, autenticação, autorização ou persistência.
- Sem armazenamento em localStorage.
- Os registros desaparecem ao recarregar ou fechar a página.
- Sem importação de planilha ou dados reais.
- A lista temporária não alimenta os indicadores do painel.
- Não é apropriado para uso real.

## Validação de código realizada

Foi relido o `index.html` após a atualização e conferida a presença dos campos, edição, remoção com confirmação, pesquisa em tempo real e cancelamento da edição. Também foi verificado que o protótipo não usa `localStorage` nem SDK do Firebase. A execução do workflow de publicação para o commit mais recente foi iniciada, mas ainda estava na fila no momento da consulta. A leitura do código não substitui teste manual completo em navegadores/dispositivos.

## Testes manuais restantes

- [ ] Adicionar registro fictício preenchendo todos os campos.
- [ ] Validar obrigatórios vazios.
- [ ] Editar e confirmar que todos os campos preservam os valores.
- [ ] Buscar por campos adicionais e conferir os resultados.
- [ ] Remover um registro.
- [ ] Recarregar e confirmar que os dados temporários desaparecem.
- [ ] Conferir layout em desktop e celular.
- [ ] Confirmar que os demais módulos e o painel seguem sem métricas inventadas.

## Para liberar uso real posteriormente

1. Aprovar o dicionário final de dados.
2. Configurar Firebase Authentication e autorização.
3. Definir regras de acesso restritivas e testá-las com usuários não autorizados.
4. Criar IDs internos estáveis e entidades separadas para pendências e eventos.
5. Testar backup, restauração e migração em cópia privada.
6. Aprovar a migração somente após conferência dos registros e das ambiguidades.

**Conclusão:** a etapa de cadastro demonstrativo está implementada. A conclusão da Fase 3 para uso real permanece condicionada ao Firebase, à segurança, à persistência e aos testes manuais listados acima.

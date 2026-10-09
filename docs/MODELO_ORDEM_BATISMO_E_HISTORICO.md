# Modelo funcional da ordem de batismo

**Objetivo:** definir como a ordem deve funcionar antes de implementar a interface ou importar registros reais.

## 1. Conceito central

A ordem pertence a um evento específico, e não diretamente à pessoa. Uma mesma pessoa pode aparecer em eventos diferentes, com decisões, posições, observações e resultados diferentes.

Modelo conceitual:
- **Pessoa**: cadastro permanente com ID interno imutável.
- **Evento de batismo**: evento individual com ID, data, identificação e estado.
- **Participação no evento**: vínculo entre pessoa e evento, com decisão de participação, posição, observação e resultado.

A posição é atributo da participação no evento. Não usar o número da linha da planilha como identificador.

## 2. Campos propostos para cada evento

- `eventId`: identificador único e estável.
- `title`: nome do evento.
- `eventDate`: data, se definida.
- `status`: planejamento, aberto para organização, concluído ou cancelado.
- `createdAt` e `updatedAt`: datas de auditoria.
- `createdBy` e `updatedBy`: usuário responsável, se disponível na camada segura.

## 3. Campos propostos para a participação

- `eventParticipantId`: identificador estável do vínculo.
- `eventId`: referência ao evento.
- `participantId`: referência ao cadastro da pessoa.
- `participationStatus`: em avaliação, confirmado, não participará ou não informado.
- `orderPosition`: posição numérica na ordem, quando aplicável.
- `eventNote`: observação específica do evento, com acesso restrito conforme a classificação.
- `baptismResult`: realizado, não realizado, ou não informado; somente preencher após confirmação.
- `createdAt`, `updatedAt`, `updatedBy`: trilha de auditoria.

Não registrar o resultado como “realizado” apenas porque a pessoa aparece na lista ou estava confirmada.

## 4. Comportamento da ordenação

A interface deverá permitir:
1. Arrastar e soltar participantes para mudar a posição.
2. Informar diretamente uma posição numérica.
3. Usar comandos para subir ou descer uma posição.
4. Remover uma pessoa da ordem sem apagar seu cadastro permanente.
5. Inserir uma pessoa em qualquer posição.
6. Recalcular a numeração sem duplicações ou lacunas após cada alteração.
7. Salvar a alteração e informar claramente quando houver falha.
8. Recuperar a ordem salva após recarregar a página.
9. Exibir conflitos de edição quando mais de um usuário alterar a mesma ordem, sem descartar silenciosamente alterações.
10. Preservar a ordem de eventos já concluídos; mudanças retroativas devem ser restritas e auditáveis.

As operações de renumeração devem ser atômicas ou usar mecanismo equivalente para impedir que duas gravações concorrentes deixem posições duplicadas. A interface nunca deve afirmar que salvou antes da confirmação do banco.

## 5. Regras para observações e histórico

- A observação deve estar vinculada à participação da pessoa naquele evento, não à linha, à posição ou ao nome.
- Mover uma pessoa não pode transferir a observação para outra.
- Novo evento começa com novas participações e nova ordem; não copia automaticamente o resultado de eventos passados.
- A visualização histórica deve mostrar o que foi registrado em cada evento, sem reescrever o passado.
- Alterações e remoções importantes devem ser auditáveis; evitar guardar dados pessoais desnecessários no log.

## 6. Tratamento dos registros da planilha antiga

Na aba `Ordem`, os cabeçalhos identificados incluem `FICHAS RETIRADAS`, `NUMERAÇÃO` e `Situação no ekklesia`, mas a relação completa entre colunas e registros ainda exige inspeção. Por isso:

- Não assumir que a coluna de numeração é um ID permanente.
- Não vincular automaticamente nomes a participantes por semelhança aproximada.
- Não interpretar “ficha retirada” ou “situação no ekklesia” sem confirmar o significado com os responsáveis.
- Criar uma tabela de correspondência de migração apenas na cópia de teste, com candidatos ambíguos para revisão humana.
- Manter os dados originais intactos até que a conferência seja aprovada.

## 7. Segurança

A ordem pode expor dados pessoais. Somente usuários autorizados devem poder consultar e editar os registros. A autorização precisa ser verificada no banco/backend, não apenas escondendo botões na interface. Notas altamente confidenciais não devem ser exibidas nessa tela por padrão.

## 8. Testes obrigatórios antes de usar dados reais

- Inserir três participantes fictícios e ordenar em posições diferentes.
- Mover o segundo para o primeiro lugar e confirmar a renumeração.
- Recarregar a página e confirmar persistência.
- Editar uma observação, mover a pessoa e confirmar que a observação continua com a pessoa/evento corretos.
- Criar um segundo evento e confirmar que a ordem do primeiro não muda.
- Marcar um resultado como realizado apenas por ação autorizada e verificar o histórico.
- Tentar ler e editar com uma conta não autorizada; o acesso deve ser negado no banco.
- Simular falha de rede e garantir que a interface não informe salvamento concluído.
- Simular edições concorrentes e garantir que não haja perda silenciosa de alterações.

## Situação

Este é um modelo de requisitos, não uma funcionalidade implementada. O esquema final deverá ser validado junto à configuração real do Firebase e às permissões antes de importar dados pessoais.

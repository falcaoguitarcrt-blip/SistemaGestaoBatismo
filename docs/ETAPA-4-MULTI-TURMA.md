# Etapa 4 — Arquitetura multi-turma

## Objetivo

Preparar o Gestão de Batismo para ciclos sucessivos de batismo sem exigir nova importação da planilha. A planilha atual é uma fonte histórica da turma 36, não o mecanismo de cadastro das próximas turmas.

## Requisitos funcionais

1. **Turmas**
   - Cada turma tem identificador estável, nome/número, situação e datas opcionais.
   - Criar uma turma nova inicia uma turma vazia.
   - A turma selecionada para o Dia do Batismo pode ser salva como padrão até ser alterada.
   - A turma 36 existente deve continuar acessível e seus dados atuais não podem ser apagados nem reimportados durante a migração.

2. **Pessoas**
   - Cadastro e edição de pessoas diretamente no sistema.
   - O cadastro da pessoa é independente da participação em uma turma.
   - O campo Turma atual permite transferir a pessoa para uma turma seguinte.
   - Transferir uma pessoa não apaga sua participação, ordem ou marcações na turma anterior.
   - Não deduplicar automaticamente registros históricos da planilha; qualquer vínculo/mesclagem deve ser explícito.

3. **Participação por turma**
   - Cada vínculo pessoa-turma guarda o histórico daquela pessoa naquela turma.
   - Ordem de batismo própria por turma, incluindo posições sem nome/reservadas quando necessário.
   - Presença, batismo, observações operacionais e posição devem ser associados à participação/turma, não apenas ao cadastro global da pessoa.
   - Participantes e marcações de uma turma não podem aparecer em outra por coincidência de nome.

4. **Dia do Batismo**
   - Seletor explícito de turma.
   - Lista, contagens, filtros, paginação, impressão e marcações refletem apenas a turma selecionada.
   - Salvar a turma padrão sem impedir que a equipe selecione outra.
   - Ao trocar de turma, carregar a lista e as marcações correspondentes; não migrar nem sobrescrever marcações.

5. **Persistência e segurança**
   - Usar o Firebase/Firestore existente e manter as regras de autenticação restritivas.
   - Nunca publicar dados pessoais no repositório GitHub.
   - Não usar Google Sheets nem Apps Script.
   - Preservar backup e permitir migração compatível com os documentos atuais.

## Estratégia técnica obrigatória

- Antes de alterar o modelo em produção, inspecionar e documentar o formato atual de `appData/primary`, versões/chunks, `live/state` e `marcacoesBatismo`.
- Definir IDs estáveis para turmas, pessoas, participações e posições; não usar nome como chave.
- Criar uma migração idempotente para a turma 36: executar mais de uma vez não pode duplicar nem resetar dados.
- Manter compatibilidade de leitura com o formato antigo enquanto os dados existentes forem validados.
- Separar migração de dados, interface e ativação da nova lógica em commits pequenos.
- Não alterar as regras do Firestore para permitir acesso público.

## Critérios de aceite

- [ ] Usuário autenticado consegue criar turma nova vazia.
- [ ] É possível cadastrar, editar e localizar participantes sem importar Excel.
- [ ] É possível alterar a turma atual de um participante.
- [ ] A transferência mantém o histórico da turma anterior.
- [ ] Cada turma tem sua própria ordem e suas próprias marcações.
- [ ] O seletor do Dia do Batismo troca lista, totais, filtros, impressão e marcações.
- [ ] A turma padrão permanece selecionada após recarregar a página.
- [ ] A turma 36 mantém seus dados e marcações existentes.
- [ ] Testes de repetição da migração não duplicam dados.
- [ ] Nenhum dado pessoal é adicionado ao repositório.
- [ ] Testes reais de Firebase/autenticação são executados antes de mesclar.

## Estado inicial / riscos conhecidos

A versão atual tem o Dia do Batismo e os documentos de marcação vinculados explicitamente à turma 36 (`turmaId: '36'` e IDs no formato `36_...`). A ordem importada não possui um campo explícito de turma. Portanto, simplesmente adicionar um seletor de turma à interface seria insuficiente e poderia misturar participantes ou marcações.

Esta especificação é planejamento técnico; não significa que a migração ou as funções descritas já estejam implementadas.
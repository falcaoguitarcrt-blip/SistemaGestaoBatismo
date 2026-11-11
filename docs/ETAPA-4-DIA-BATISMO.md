# Etapa 4 | Dia do Batismo e sincronização

**Branch:** `feature/etapa-4-dia-batismo`  
**Base:** `main`  
**Escopo planejado:** consolidar a experiência de presença/batismo e preparar o suporte seguro a turmas, sem quebrar as marcações existentes.

## Auditoria do código atual

- A tela já exibe os controles de **Presente** e **Batizado** na mesma linha por pessoa e tem filtros operacionais para aguardando, presentes e batizados.
- Os resumos de presença e batismo são calculados separadamente.
- O identificador de marcação é montado como `36_<número-ou-linha>`.
- O listener do Firestore consulta somente documentos com `turmaId == '36'`.
- A gravação e a migração das marcações antigas também registram `turmaId: '36'`.
- A associação entre a linha da aba **Ordem** e o cadastro em **Batismo** usa principalmente o nome e dá preferência à turma 36.
- A estrutura lida do código não demonstra uma associação estável entre cada posição da aba **Ordem** e uma pessoa/turma. Por isso, adicionar um seletor de turma neste momento pode exibir ou alterar a marcação da pessoa errada quando houver nomes repetidos ou mais de uma turma.

## Decisão de segurança

**Não foi alterado nenhum dado, identificador, documento ou regra do Firebase.** Também não foi implementado um seletor de turma ainda: primeiro é necessário confirmar a relação entre a aba Ordem e as turmas, ou definir uma chave estável de pessoa/turma. A migração automática de documentos de check-in seria arriscada sem essa confirmação.

## Próximos passos para concluir a Etapa 4

1. Confirmar se a aba **Ordem** corresponde exclusivamente à turma 36 ou se precisa atender a várias turmas.
2. Definir a associação estável entre pessoa, turma e posição antes de mudar os IDs de check-in.
3. Implementar a seleção/filtragem de turma somente depois dessa decisão.
4. Validar presença, batismo, filtros, sincronização entre dispositivos e persistência após recarregar, usando acesso autenticado.
5. Preservar as marcações antigas e planejar qualquer migração sem sobrescrever registros existentes.

## Validação

Esta etapa contém apenas auditoria estática e documentação do risco. Não houve teste de navegador autenticado nem escrita no Firestore.

# Etapa 8 — Planilha atualizada na hora e Painel por turma

## Objetivo
Fazer a planilha espelho refletir cada registro logo depois de salvo no site e permitir consultar o Painel de qualquer turma.

## Implementado
- **Aviso à planilha após cada gravação.** `window.firebaseSaveWorkspace` chama `avisarPlanilha()` depois de salvar, e as marcações do dia (presença e batismo) também avisam depois que o Firestore confirma. O aviso espera 4 segundos para juntar alterações seguidas e é enviado com `fetch` em modo `no-cors`; se falhar, a atualização periódica de 5 minutos cobre.
- **Configuração sem dados no repositório.** URL do app da Web e token ficam em `appData/primary.planilhaSync`, gravados pelo próprio script (menu **Batismo → Ativar atualização instantânea**). O site lê esse campo no carregamento e no listener do documento raiz.
- **Script da planilha publicado como app da Web.** `doGet`/`doPost` conferem o token, rodam `atualizarPlanilha(false)` (só reescreve se os dados mudaram) e não devolvem dados. A trava espera até 25 s pela atualização em andamento para que a última alteração entre.
- **Painel por turma.** Seletor “Ver painel da” no topo do Painel com todas as turmas. A escolha vale só para quem está olhando e não altera a turma em foco da equipe; o botão “Voltar à turma em foco” desfaz. Em “Turmas recentes”, o botão passou de “Focar” (que mudava a turma em foco para todos) para “Ver”. Mudar a turma em foco continua em **Turmas → Colocar em foco**.

## Testes realizados
- `node scripts/check-inline-scripts.mjs` e os três testes de contrato, com 3 contratos novos em `check-multiturma-contract.mjs`.
- Sintaxe do `Codigo.gs` verificada com Node.

## Ainda pendente (validação manual)
1. Instalar/atualizar o script na planilha espelho, publicar como app da Web e ativar a atualização instantânea.
2. Cadastrar um participante de teste no site e conferir que ele aparece na planilha em menos de 1 minuto.
3. Marcar presença e batismo na Ordem e conferir as colunas PRESENTE/BATIZADO na aba da turma.
4. Trocar a turma no seletor do Painel e conferir que números, alertas, funil e camisetas mudam, sem mudar a turma em foco em outro aparelho.
5. Desativar a atualização instantânea e conferir que o site continua salvando normalmente.

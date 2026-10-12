# Gestão de Batismo

Sistema web responsivo para cadastros, preparação, ordem, check-in e acompanhamento de batismos.

## Acessar

- Aplicação: https://falcaoguitarcrt-blip.github.io/SistemaGestaoBatismo/
- Código principal: [index.html](index.html)

## Importação

A área **Importar** é exclusiva de administração e usa um assistente em quatro etapas: envio do Excel, conferência das abas/colunas, simulação e confirmação.

O modo **Adicionar e atualizar** é o padrão. Ele preserva registros que não aparecem no novo arquivo, mantém posições vazias e não usa células em branco para apagar valores existentes. O modo **Substituir tudo** exige digitar `CONFIRMAR`; as versões anteriores continuam guardadas no Firestore. Antes de qualquer gravação, o navegador baixa um backup JSON do estado atual.

O arquivo Excel é lido em memória durante a sessão; o binário original não é retido. O aplicativo remove cópias antigas do binário e das linhas brutas que ele próprio guardou em IndexedDB. A persistência offline do Firebase continua ativa e pode manter documentos autorizados do Firestore no cache local; o service worker guarda somente os arquivos públicos da interface. **Não envie a planilha, backups ou dados pessoais ao GitHub.**

As abas Batismo e Ordem seguem para a base privada versionada. As posições da Ordem, inclusive vazias, são mantidas. A aba GERAL fica separada como histórico legado somente leitura. Abas não selecionadas, como Ordem Batismo 35, não entram na importação.

## Dados e privacidade

Dados pessoais ficam no Firestore, protegidos por autenticação e regras por perfil. O histórico legado da aba GERAL fica em `appData/primary`, com leitura reservada a administração e pastor. A interface pública contém somente código e configuração pública do Firebase; não contém registros da planilha.

A aplicação também mantém coleções estruturadas para turmas, pessoas, ordem, batismos e módulos operacionais. O assistente de importação atualiza a base versionada da planilha; ele não substitui documentos estruturados já editados nem executa a ferramenta de migração/revisão de dados. A importação e a atualização dos cadastros estruturados são etapas distintas.

## PWA

O manifesto permite instalar o site como aplicativo. O service worker mantém em cache apenas o shell público (HTML, JavaScript, manifesto e ícone), nunca respostas do Firestore ou dados pessoais. O Firebase aplica sua própria persistência offline autenticada.

## Publicação

As mudanças desta tarefa estão na branch `migracao-dados-estruturados` e no PR em rascunho. Nenhuma alteração foi mesclada ou publicada pelo assistente.
# Checklist de validação do Firebase antes de dados reais

**Status atual:** planejamento. Este repositório ainda não comprova conexão com Firebase, projeto selecionado, Authentication ativo, coleções criadas ou regras publicadas.

## 1. Identificação e propriedade do projeto

Antes de configurar:
- Confirmar no Firebase Console qual projeto será exclusivo para o Sistema de Gestão de Batismo.
- Verificar que o projeto não é o mesmo usado por Agenda ou Fluxo do Casal, a menos que exista decisão explícita e isolamento técnico comprovado.
- Não publicar IDs privados de planilhas, tokens administrativos ou credenciais de servidor.
- Registrar os ambientes de teste e produção, evitando usar dados reais em testes.

## 2. Autenticação e autorização

- Definir quem pode entrar no sistema e como será concedido/revogado o acesso.
- Não reintroduzir tela de login até que o fluxo real de autenticação esteja configurado.
- Não confiar em e-mail, papel ou permissão guardados apenas no navegador.
- Definir funções mínimas, por exemplo administrador e operador, somente se os responsáveis aprovarem.
- Verificar autorização em toda leitura, criação, alteração e exclusão.
- Revogar o acesso de usuários que deixarem de estar autorizados.
- Proteger notas confidenciais com uma regra específica; esconder um campo visualmente não é proteção suficiente.

## 3. Regras de Firestore

As regras devem começar negando acesso por padrão. Só liberar operações autenticadas e autorizadas para as coleções necessárias. Validar, conforme a modelagem:
- identidade válida;
- usuário incluído na lista autorizada ou função aprovada;
- campos permitidos e tipos de dados;
- limites de atualização para impedir mudanças em IDs e campos de auditoria;
- acesso separado a notas confidenciais;
- proibição de leitura/escrita anônima;
- proibição de acesso amplo a todos os documentos sem necessidade.

Não copiar uma regra genérica para produção sem adaptá-la e testá-la.

## 4. Matriz mínima de testes

| Cenário | Resultado esperado |
|---|---|
| Usuário sem login tenta ler dados | Negado |
| Usuário sem autorização tenta ler dados | Negado |
| Usuário sem autorização tenta escrever | Negado |
| Usuário autorizado lê apenas dados permitidos | Permitido |
| Usuário autorizado tenta acessar nota confidencial sem permissão específica | Negado |
| Cliente tenta alterar ID permanente ou campos protegidos | Negado |
| Escrita contém tipo ou campo inválido | Negado |
| Operação falha por rede/permissão | Interface informa falha, sem afirmar que salvou |
| Alteração válida é confirmada pelo banco | Interface atualiza após confirmação |
| Usuário perde autorização | Acesso posterior negado |

Executar esses testes com Firebase Emulator Suite ou ambiente de teste separado antes de produção.

## 5. Dados e backups

- Manter a planilha original intacta e privada.
- Não usar nomes, telefones ou notas reais nos testes.
- Definir rotina de backup e testar restauração antes da migração.
- Registrar data, responsável e resultado da migração.
- Fazer comparação de contagens e amostras autorizadas entre origem e destino, sem publicar dados pessoais nos logs.
- Ter um procedimento de interrupção/rollback se a conferência falhar.

## 6. Condições para autorização da migração

A migração só poderá ser autorizada depois de:
1. Confirmar o projeto Firebase correto e o acesso administrativo.
2. Implementar autenticação e autorização reais.
3. Publicar e testar regras restritivas.
4. Passar pelos testes negativos de acesso.
5. Confirmar backups e restauração.
6. Concluir uma importação de ensaio em dados fictícios.
7. Validar o mapeamento de participantes e da ordem, com ambiguidades revisadas manualmente.
8. Receber aprovação explícita dos responsáveis para a migração definitiva.

## Limite desta documentação

Criar este checklist não altera o console Firebase, não cria coleções e não aplica regras. Essas operações precisam ser feitas e verificadas no projeto real. Até lá, o sistema permanece inadequado para dados reais.

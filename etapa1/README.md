# Etapa 1 · Fundação segura

Esta pasta contém uma primeira implementação isolada de login Firebase e dashboard com indicadores fictícios. Ela não substitui a página principal do protótipo até ser validada.

## Estado atual

- Interface responsiva em português.
- Login e recuperação de senha via Firebase Authentication, após configurar o projeto.
- Dashboard com dados exclusivamente fictícios, exibido após autenticação.
- Regras iniciais restritivas em `firestore.rules`.
- Nenhum dado real importado.
- A conexão Firebase não estará ativa até preencher a configuração abaixo.

## 1. Criar ou abrir o projeto Firebase

1. Entre em https://console.firebase.google.com/ usando a conta exclusiva do sistema.
2. Crie ou selecione o projeto destinado ao Sistema de Gestão de Batismo.
3. Em Authentication, abra a opção de provedores de acesso e ative **E-mail/senha**.
4. Em Firestore Database, crie o banco de dados. Durante a configuração, não habilite acesso público.
5. Registre um aplicativo Web nas configurações do projeto.
6. Copie os campos de configuração do aplicativo Web para `js/firebase.js`.

A configuração do aplicativo Web identifica o projeto, mas **não substitui as regras de segurança**. A proteção real depende de Authentication e Firestore Security Rules.

## 2. Preencher a configuração

Edite `js/firebase.js` e substitua os valores `PREENCHER_...` pelos campos do seu próprio projeto Firebase.

Não coloque senhas, chaves de conta de serviço ou tokens administrativos nesse arquivo. Não envie credenciais por chat.

## 3. Criar o primeiro usuário

1. Em Authentication, cadastre o e-mail autorizado.
2. Copie o UID desse usuário na tela de Authentication.
3. No Firestore, crie manualmente o documento `usuarios/UID_DO_USUARIO`.
4. Preencha os campos:
   - `perfil`: `admin`
   - `ativo`: `true`
   - `email`: endereço autorizado
5. Publique as regras de `firestore.rules` no Firebase Console.

Crie esse primeiro documento somente para a pessoa responsável pelo sistema. Não permita que o cadastro público conceda perfil administrativo.

## 4. Publicação de teste

O GitHub Pages publica o conteúdo do repositório publicamente. A pasta `etapa1` poderá ser visualizada em:

https://falcaoguitarcrt-blip.github.io/SistemaGestaoBatismo/etapa1/

Essa tela não contém dados reais. Não coloque dados pessoais, IDs de planilhas privadas, senhas ou arquivos de importação no repositório.

## 5. Testes mínimos

- Sem configurar Firebase, tente entrar: o sistema deve informar que a configuração está pendente.
- Com Firebase configurado, teste e-mail e senha válidos.
- Teste senha inválida e recuperação de senha.
- Confirme que a sessão é encerrada pelo botão Sair.
- Confirme que o dashboard mostra aviso explícito de demonstração.
- Teste as regras com o Firebase Rules Playground ou Emulator Suite.
- Confirme que usuários sem documento de autorização em `usuarios` não acessam coleções protegidas.

## Limitações desta etapa

- O dashboard ainda usa indicadores fictícios.
- Os perfis de líder e voluntário não receberam permissões de leitura de dados pessoais.
- O módulo de gestão de usuários ainda não existe.
- As regras são uma fundação restritiva e devem ser revisadas junto com o modelo final antes de inserir dados reais.
- O login não foi testado contra um projeto Firebase real nesta etapa, porque exige configuração da conta proprietária.
- Não importar a planilha real até validar todas as etapas e a estratégia de backup.

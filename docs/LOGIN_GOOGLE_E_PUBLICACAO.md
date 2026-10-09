# Autenticação futura e publicação

## Importante
O acesso pelo botão Google foi removido temporariamente da interface, conforme solicitado. A autenticação ainda não está implementada. Não devemos fingir uma sessão no frontend nem permitir que o navegador acesse diretamente a planilha.

GitHub Pages serve conteúdo estático. O código HTML/CSS/JS fica público; portanto, não coloque dados de membros, identificadores privados de planilhas, client secrets, service-account keys ou tokens neste repositório.

## Arquitetura necessária antes do uso real
1. Escolher provedor de autenticação e cadastrar o aplicativo no console correspondente.
2. Usar um fluxo de autenticação oficialmente suportado, com redirect URI exatamente configurado.
3. Validar o token/identidade no backend confiável. Não confiar apenas em um e-mail guardado no navegador, em parâmetros de URL, nem em esconder telas.
4. Aplicar uma allowlist no backend para restringir a conta ou as contas autorizadas.
5. Manter a planilha de dados privada e acessá-la somente pelo backend com permissões mínimas.
6. Verificar autorização em toda leitura e escrita e testar o acesso negado de uma conta não autorizada.
7. Nunca colocar credenciais de servidor no frontend ou no repositório.
8. Só importar dados reais depois de testes com registros fictícios, backup e validação das permissões.

## Publicar a prévia visual
Na página do repositório, abra Settings > Pages e configure a publicação a partir da branch main, pasta raiz. Salve e aguarde a URL do Pages. A prévia é pública e não deve ser usada para dados pessoais até que exista backend autenticado.

## Escopo desta versão
A página atual é uma prévia da interface com navegação demonstrativa e sem tela de login. A autenticação real, o backend de autorização, a persistência e os módulos de dados ainda não estão implementados. A publicação da página não significa que o sistema esteja pronto para uso real.

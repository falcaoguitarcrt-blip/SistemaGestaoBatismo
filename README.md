# Sistema de Gestão de Batismo

Aplicação web para apoiar a gestão de pessoas, turmas, inscrições, aulas, presenças, fichas de batismo, camisetas, pagamentos e relatórios.

## Estado atual

Este repositório está em preparação inicial. O acesso pela tela de login Google foi removido temporariamente, conforme solicitado. A autenticação real e a camada de dados protegida ainda precisam ser configuradas e testadas antes de inserir dados reais.

## Segurança obrigatória

- Não incluir dados pessoais, planilhas reais, tokens, chaves privadas ou credenciais neste repositório.
- A interface no GitHub Pages é pública quando publicada. Login apenas no lado do navegador não protege dados.
- O acesso aos dados deve ser validado no servidor em todas as operações, por meio de autenticação confiável e uma lista explícita de usuários autorizados.
- Manter a planilha Google de origem privada; usar dados fictícios durante os testes.
- Não declarar a aplicação pronta para uso real até que autenticação, autorização no servidor, regras de acesso e testes tenham sido concluídos.

## Próximas etapas

1. Manter a interface inicial responsiva sem botão de login por enquanto.
2. Definir e configurar autenticação confiável antes de liberar dados reais.
3. Definir a camada de dados privada, sem credenciais no frontend.
4. Implementar autorização por usuário e testes de acesso negado.
5. Publicar pelo GitHub Pages apenas a interface sem segredos e validar cada integração antes dos dados reais.

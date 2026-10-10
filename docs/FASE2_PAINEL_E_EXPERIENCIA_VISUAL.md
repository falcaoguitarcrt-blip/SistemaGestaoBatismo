# Fase 2 — Painel e experiência visual

**Status:** refinamento visual implementado no `index.html`. A publicação precisa ser conferida no GitHub Pages; este documento não afirma que os módulos funcionais ou a integração de dados estejam concluídos.

## Entregas da fase

- Painel responsivo com indicadores para pessoas cadastradas, turmas ativas, batismos confirmados e pendências em aberto.
- Indicadores exibidos como indisponíveis enquanto não existe conexão com dados, evitando números fictícios.
- Área de resumo do próximo evento e painel de segurança/conexão.
- Atalhos para Pessoas, Turmas e inscrições, Aulas e presenças, Ordem de batismo, Camisetas, Pagamentos e Relatórios.
- Navegação para telas de preparação por módulo, com descrição do escopo e aviso explícito de que não há leitura nem gravação de dados.
- Menu móvel com botão de abrir/fechar, camada de fundo para fechar, tecla Escape e fechamento após escolher um módulo.
- Estados de foco visíveis para navegação por teclado e suporte à preferência de movimento reduzido.
- Texto de aviso que impede confusão entre prévia visual e sistema pronto para uso real.
- Nenhum dado real, senha, token ou chave privada adicionado ao frontend.

## Validação técnica realizada

- Arquivo `index.html` foi atualizado no branch principal.
- Conferido que a versão contém os elementos do painel, navegação móvel, estado de conexão e módulos.
- Corrigidos os eventos de interface para que o botão de status leve ao aviso correto e o fundo do menu feche a navegação.
- A verificação feita por leitura do código não equivale a um teste completo em navegadores ou dispositivos físicos.

## Critérios de aceite

- [x] Estrutura visual do painel inicial.
- [x] Indicadores sem valores inventados.
- [x] Atalhos para os módulos previstos.
- [x] Estados vazios e aviso de prévia.
- [x] Layout responsivo definido para desktop e celular.
- [x] Navegação móvel com fechamento por botão, fundo e Escape.
- [x] Acessibilidade básica de foco e movimento reduzido.
- [x] Separação explícita entre protótipo e dados reais.
- [ ] Conferência manual no GitHub Pages em desktop e celular.
- [ ] Testes de usabilidade com o responsável pelo processo.

## Limites conhecidos

- Não há cadastro real de participantes.
- Não há operações de criação, leitura, edição ou exclusão de dados.
- Não há Firebase configurado ou conectado.
- Autenticação, autorização e regras de banco continuam pendentes.
- Os módulos internos ainda são telas demonstrativas.
- O painel não pode ser usado para administrar dados reais.

## Resultado

A parte de implementação visual prevista para a Fase 2 foi refinada no código. A fase só deve ser considerada validada após a conferência manual da página publicada. A Fase 3, de cadastro de participantes, não deve ser iniciada como sistema funcional até que a arquitetura e a segurança de dados estejam alinhadas; se for desenvolvida antes do Firebase, deverá usar apenas dados fictícios.

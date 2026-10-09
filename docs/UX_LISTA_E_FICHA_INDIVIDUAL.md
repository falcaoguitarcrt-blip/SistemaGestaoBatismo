# Experiência prática do módulo Pessoas

## Fluxo principal
- O menu leva a uma lista compacta de pessoas.
- Cada linha mostra apenas os dados úteis para consulta rápida: nome, turma, situação da jornada, participação no batismo e pendências.
- Clicar na linha ou pressionar Enter/Espaço abre a ficha individual.
- A ficha reúne as informações administrativas em uma única tela.
- A edição é feita pela ficha e permite voltar à lista.
- A lista oferece busca textual e preserva o termo de busca ao abrir/fechar fichas.
- Depois de salvar um cadastro, o sistema retorna à lista.

## Princípios de usabilidade
- Evitar uma aba lateral para cada detalhe de uma pessoa.
- Manter ações secundárias fora da lista principal para reduzir ruído visual.
- Mostrar apenas o resumo na lista; mostrar todos os campos na ficha individual.
- Não inventar presença ou resultado quando os dados não estiverem informados.
- Usar “Não informado” quando a informação estiver desconhecida.

## Segurança e limitações
A interface atual é demonstrativa, sem Firebase, autenticação, autorização ou persistência. Os registros desaparecem ao recarregar. Usar somente dados fictícios até concluir a integração segura. Não incluir informações pessoais ou confidenciais no repositório público.

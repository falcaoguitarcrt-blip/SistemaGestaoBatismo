# Fase 3 — Cadastro demonstrativo de participantes

**Status:** primeira implementação visual e interativa, exclusivamente em memória do navegador. Não é cadastro oficial e não deve receber dados reais.

## Entregas implementadas

- Formulário de demonstração com nome, turma, situação da jornada, entrada no grupo, tamanho de camiseta e situação de pagamento.
- Validação dos campos obrigatórios de nome, turma e situação da jornada.
- Adição de registros temporários à lista da sessão.
- Edição e remoção de registros demonstrativos.
- Pesquisa temporária por nome, turma ou situação da jornada.
- Mensagens de validação e confirmação.
- Lista criada usando APIs de elementos de texto, sem inserir os valores digitados como HTML.
- Formulário e lista adaptados a telas menores.
- Aviso explícito para não usar dados reais nesta versão.

## Limites e proteção dos dados

- Os registros existem apenas na memória JavaScript desta aba.
- Recarregar ou fechar a página apaga os registros demonstrativos.
- Não foi implementado localStorage, Firebase, Google Sheets ou outro armazenamento.
- Não foi implementada autenticação nem autorização.
- Não foram adicionados campos de telefone ou observações confidenciais nesta demonstração.
- Não foram importados dados da planilha original.
- A lista não altera os indicadores do painel, pois não é uma fonte oficial de dados.

## Testes manuais necessários

1. Abrir Pessoas e verificar que a mensagem de demonstração está visível.
2. Tentar enviar o formulário vazio e confirmar a validação.
3. Adicionar um registro fictício e conferir sua exibição.
4. Pesquisar pelo nome e pela turma.
5. Editar um registro e confirmar que os dados atualizados aparecem.
6. Remover um registro e confirmar que desaparece da lista.
7. Recarregar a página e confirmar que a lista temporária é reiniciada.
8. Repetir os passos em viewport de celular.
9. Confirmar que os outros módulos continuam exibindo o estado de preparação e que o painel não apresenta métricas fictícias.

## Próximos requisitos antes do uso real

- Confirmar o dicionário final de campos com os responsáveis.
- Configurar autenticação, autorização e regras do banco.
- Criar IDs internos estáveis no armazenamento definitivo.
- Implementar operações persistentes somente após testar o acesso negado para usuários não autorizados.
- Planejar e validar a migração em cópia privada, sem alterar a planilha original.

**Resultado:** o fluxo de cadastro pode ser avaliado visualmente com dados fictícios. A Fase 3 funcional com persistência e dados reais continua pendente da configuração segura do Firebase.

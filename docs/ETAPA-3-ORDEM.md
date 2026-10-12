# Etapa 3 | Ordem de batismo

**Objetivo:** facilitar a conferência da ordem sem alterar a identidade nem a posição original dos registros.

## Alterações nesta branch

1. Adicionado filtro de posições: todas, com nome e sem nome/reservadas.
2. O filtro combina com a busca textual já existente.
3. Alterar a busca ou o filtro retorna à primeira página.
4. Mantidos cadastro de posição, edição existente, impressão da lista visível e paginação.
5. Nenhuma reordenação, renumeração ou migração de marcações de check-in foi implementada.

## Preservação e segurança

- Não altera dados do Firebase, regras de acesso ou estrutura de coleções.
- Não remove, mescla ou renumera posições.
- Não muda os identificadores de check-in, que dependem atualmente da turma e do número da posição.
- Branch baseada na Etapa 2 para manter as alterações de Pessoas/Ficha e o filtro seguro “Todas as turmas”.

## Validação estática

- Verificado que o filtro por nome usa a função existente de busca.
- Verificado que filtro e busca reiniciam a paginação.
- Verificado que as ações de edição e cadastro de posição continuam presentes.

## Testes dinâmicos pendentes

- Conferir todas as posições, posições com nome e posições sem nome.
- Combinar busca e filtro, navegar pelas páginas e imprimir a lista filtrada.
- Abrir e editar uma posição de teste autorizada; salvar e recarregar para confirmar persistência.
- Confirmar que a contagem e as posições reservadas continuam corretas com os dados reais.

**Status:** implementação isolada para revisão. Não mesclada nem publicada. Testes dinâmicos no Firebase ainda não executados.

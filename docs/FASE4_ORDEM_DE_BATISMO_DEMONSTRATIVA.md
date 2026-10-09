# Fase 4 — Ordem de batismo por evento (demonstração)

**Status:** módulo demonstrativo implementado em `index.html`; publicação e testes manuais ainda precisam ser confirmados.

## O que está incluído
- Criar eventos fictícios com nome e data opcional.
- Visualizar e pesquisar eventos desta sessão.
- Selecionar um evento para administrar sua própria ordem.
- Adicionar, editar e remover participantes fictícios.
- Alterar manualmente a posição com controles para cima e para baixo; a numeração é recalculada conforme a lista.
- Registrar turma, situação de participação e resultado final em campos separados.
- Registrar observação não confidencial de demonstração.
- Pesquisar participantes por nome, turma, participação, resultado e observação.
- Confirmar antes de excluir um evento ou participante.
- Manter listas separadas por evento enquanto a página permanecer aberta.

## Regras importantes
- Cada evento tem sua própria lista; modificar a ordem de um evento não modifica os demais.
- A posição é a ordem demonstrativa atual, não um identificador permanente.
- Participação e resultado final são campos diferentes. “Não informado” não deve ser interpretado como “não realizado”.
- A lista demonstrativa não é uma fonte oficial nem atualiza indicadores do painel.
- O histórico fica apenas na memória da página nesta fase. Recarregar ou fechar a aba apaga os eventos e participantes criados.

## Segurança e limitações
- Não há Firebase, autenticação, autorização ou persistência.
- Não importar nem inserir nomes, telefones ou informações reais. O repositório e o site são públicos.
- A ordem não deve ser usada em um evento real até que o armazenamento, as permissões, a recuperação de falhas e a migração estejam configurados e testados.
- A planilha histórica não é importada nesta fase. A correspondência de pessoas e a reconciliação de registros exigem validação segura e revisão de ambiguidades.

## Checklist de validação manual
- [ ] Criar dois eventos fictícios e conferir que cada um mantém sua própria lista.
- [ ] Adicionar três participantes fictícios e mudar a ordem com as setas.
- [ ] Editar turma, participação e resultado final; confirmar que os campos permanecem separados.
- [ ] Pesquisar evento e participante.
- [ ] Cancelar uma edição.
- [ ] Testar a confirmação e o cancelamento ao remover evento e participante.
- [ ] Verificar layout em desktop e celular.
- [ ] Confirmar que atualizar a página apaga os dados de demonstração, deixando claro que ainda não existe persistência.

A conferência estática do código não substitui os testes manuais. Não declarar esta fase pronta para uso real antes de concluir o checklist e configurar a camada segura de dados.

# Fase 7 — Relatórios e indicadores (demonstração)

**Status:** módulo de relatórios demonstrativos implementado em `index.html`. Não conectado a banco de dados.

## Relatórios disponíveis
- Pessoas agrupadas por turma e situação da jornada.
- Lançamentos agrupados por status, com total em reais.
- Camisetas agrupadas por tamanho e situação de pagamento.
- Eventos de batismo com total de participantes na ordem e contagem de resultados marcados como realizados.
- Pesquisa textual nas linhas do relatório.
- Atualização manual do relatório.
- Ação de imprimir ou salvar como PDF pelo diálogo de impressão do navegador.

## Indicadores e regras
- Os indicadores usam somente registros fictícios mantidos na memória da sessão.
- Pagamentos pendentes são separados dos recebidos; somente status “Pago” entra no recebido e status “Cancelado” fica fora dos totais de pendente e recebido.
- Participação em um evento é separada do resultado final do batismo.
- “Não informado” permanece como informação desconhecida, sem ser convertido em resultado negativo.
- Os números não representam dados oficiais e não devem ser usados para decisões operacionais.

## Limites e segurança
- Sem Firebase, autenticação, autorização, persistência ou integração com a planilha original.
- Os dados de demonstração desaparecem ao recarregar ou fechar a aba.
- Não inserir nomes, telefones, dados financeiros ou informações confidenciais reais.
- O comando imprimir/Salvar como PDF opera sobre a página exibida no navegador; a aparência final deve ser conferida manualmente antes de compartilhar.

## Verificação estática realizada
- Confirmada a presença dos tipos de relatório, filtros, pesquisa, atualização e comando de impressão.
- Confirmada a separação entre pendente, pago e cancelado nos cálculos financeiros.
- Confirmada a separação entre participação no evento e resultado final.
- Confirmada a ausência de referências ao SDK Firebase e a `localStorage` neste protótipo.

## Checklist manual pendente
- [ ] Criar pessoas fictícias de turmas diferentes e conferir o agrupamento.
- [ ] Criar lançamentos pendentes, pagos e cancelados e conferir os totais.
- [ ] Alterar tamanhos de camisetas e conferir as contagens.
- [ ] Criar dois eventos com participantes e resultados diferentes.
- [ ] Testar pesquisa, troca de tipo de relatório, atualização e impressão/PDF.
- [ ] Conferir layout em desktop e celular.
- [ ] Confirmar que recarregar apaga os registros temporários.

A verificação estática não substitui o checklist manual. A Fase 7 está concluída como protótipo demonstrativo, não como relatório oficial pronto para uso real.

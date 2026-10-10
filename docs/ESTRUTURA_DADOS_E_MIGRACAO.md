# Estrutura funcional e migração segura

## Lista principal
A primeira aba da cópia privada da planilha é a origem da lista de pessoas. Cada linha com nome é preservada como registro separado, com ID interno próprio. Não mesclar por nome, pois podem existir nomes repetidos ou inscrições duplicadas.

Campos operacionais: nome, idade, telefone, turma, data, jornada, aulas a repor, entrada no grupo, tamanho da camiseta, pagamento da camiseta, status de origem, pendência e situação de batismo. O campo `INVESTIGAÇÃO PERFIL (FBI)` deve ser deliberadamente excluído.

## Indicadores
- **Pessoas na lista:** registros ativos importados/cadastrados.
- **Com pendências:** pessoas com texto em `PENDENCIA`, status de origem `PENDENCIA` ou jornada com `REPOR`.
- **Jornada concluída:** registros cuja jornada indica conclusão.
- **Camisetas sem pagamento confirmado:** pessoas com tamanho registrado e pagamento não confirmado.

Uma linha de dados repete o cabeçalho `NOME`; ela será ignorada na importação. O campo `BATIZADO` está vazio na planilha analisada. A importação deve usar “Não informado”, sem inferir que a pessoa foi ou não batizada. O total da lista não deve ser rotulado como “batizados confirmados”.

## Ordem de batismo
O módulo permite criar eventos, vincular pessoas já cadastradas por seleção explícita, adicionar um nome manualmente e organizar a sequência. Participação no evento e resultado final são campos separados.

A segunda aba original `Ordem` possui numerações em várias linhas e poucos nomes na coluna de situação. O vínculo não pode ser presumido. Revisão humana é necessária antes de importar uma ordem oficial. Não associar automaticamente por nome aproximado.

## Segurança
Instalar a aplicação operacional em Apps Script e planilhas privadas. O repositório GitHub Pages é público e não pode armazenar planilhas reais ou dados pessoais. Restringir o acesso ao aplicativo web na tela real de implantação.
# Gestão de Batismo

Protótipo web responsivo para organizar cadastro, preparação, ordem do batismo, check-in, camisetas, reposição e histórico.

## Acessar

- **Aplicação:** https://falcaoguitarcrt-blip.github.io/SistemaGestaoBatismo/
- **Código principal:** [index.html](index.html)
- **Cópia-base visual:** [prototipos/gestao-batismo-base.html](prototipos/gestao-batismo-base.html)

## Importar a planilha

1. Abra a aplicação e entre em **Importar**.
2. Selecione o arquivo Excel que contém as abas **Batismo**, **Ordem**, **Ordem Batismo 35** e **GERAL**.
3. Confira os quantitativos de cada aba.
4. Clique em **Importar e salvar neste navegador**.

A planilha original, todas as linhas lidas e as marcações de check-in são mantidas localmente no navegador. A aplicação não envia os registros importados para o GitHub. Duplicidades e linhas incompletas não são apagadas nem mescladas automaticamente. Antes de substituir uma importação, a versão local ativa é arquivada como backup.

## Limites deste modo

Este é um modo local, sem sincronização entre diferentes computadores ou usuários. Para trabalho compartilhado, é necessário implementar um backend privado, autenticação real e permissões de acesso. O GitHub Pages deste repositório é público e contém apenas o código da interface.

**Não commit dados pessoais, telefones, informações de menores ou observações de perfil neste repositório público.** Use o arquivo Excel a partir do navegador e mantenha uma cópia segura do original.

## Regra para próximas atualizações

Evoluir o `index.html` em pequenas etapas, mantendo a cópia-base disponível para comparação. Preservar a organização do protótipo e não alterar os dados de origem por deduplicação, correções automáticas ou mudanças estruturais não solicitadas.

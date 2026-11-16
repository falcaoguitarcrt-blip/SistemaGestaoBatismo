# Planilha espelho (Google Planilhas)

Uma planilha do Google que se atualiza sozinha a cada 5 minutos com os dados do sistema, no mesmo formato da planilha original:

- aba **Batismo**, com as mesmas colunas da original e a coluna extra **ORIGEM**;
- uma aba **Ordem Batismo NN** para cada turma que tenha ordem, com presença, batismo e Ekklesia do dia;
- aba **Sobre**, com o horário da última atualização e eventuais erros.

**É somente para consulta.** O que for digitado nas abas é apagado na próxima atualização. Cadastros e mudanças são feitos no sistema.

## Instalação (uma vez, cerca de 5 minutos)

> Faça tudo logado na **conta Google dona do projeto Firebase `batismo-8c5f8`**. A planilha usa o acesso dessa conta para ler o Firestore e não precisa de mudanças nas regras de segurança.

1. Abra **https://sheets.new** e dê um nome, por exemplo *Batismo · espelho do sistema*.
2. Menu **Extensões → Apps Script**.
3. Na engrenagem **Configurações do projeto**, marque **Mostrar arquivo de manifesto "appsscript.json" no editor**.
4. Volte em **Editor** (`< >`):
   - abra `appsscript.json`, apague tudo e cole o conteúdo de [`appsscript.json`](appsscript.json);
   - abra `Código.gs`, apague tudo e cole o conteúdo de [`Codigo.gs`](Codigo.gs);
   - clique em **Salvar** (ícone de disquete).
5. Volte para a planilha e recarregue a página. Vai aparecer o menu **Batismo**.
6. Clique em **Batismo → Ativar atualização automática**.
   - O Google pede autorização. Escolha a sua conta e clique em **Avançado → Acessar (não seguro)** → **Permitir**. O aviso aparece porque o script é seu e não passou pela verificação do Google; ele só lê o Firestore e escreve nesta planilha.
7. Pronto. As abas aparecem em alguns segundos. Para atualizar na hora, use **Batismo → Atualizar agora**.

## Compartilhar com a equipe

Botão **Compartilhar** → adicione as pessoas como **Leitor**. Quem tiver só leitura não consegue alterar nada. Quem for editor recebe um aviso se tentar mexer nas abas.

## Problemas comuns

| Aba **Sobre** mostra | O que fazer |
|---|---|
| `Firestore respondeu 403` | A conta que instalou o script não tem acesso ao projeto `batismo-8c5f8`. Reinstale com a conta dona do projeto. |
| `Não encontrei appData/primary` | O sistema ainda não tem dados importados. |
| Nada muda | Confira em Apps Script → **Acionadores** (ícone de relógio) se existe o acionador `atualizarPlanilha`. Se não existir, use o menu **Batismo → Ativar atualização automática** de novo. |

## Custo

Cada atualização lê cerca de 80 documentos do Firestore (cerca de 23 mil leituras por dia a cada 5 minutos). O plano gratuito do Firebase permite 50 mil por dia. Para economizar, troque `INTERVAL_MINUTES = 5` por `10` no `Codigo.gs` e ative de novo.

## Manutenção

As regras de leitura (`shirtChoiceLabel`, `dayId`, ordem por turma etc.) são uma cópia das regras do `index.html`. Se a forma de guardar os dados mudar no sistema, atualize também este script.

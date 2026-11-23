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

## Atualização instantânea (recomendado, mais 3 minutos)

Com isso, cada cadastro, edição ou marcação feita no site aparece na planilha em poucos segundos, sem esperar os 5 minutos. A atualização periódica continua ligada como reserva.

1. No Apps Script, clique em **Implantar → Nova implantação**.
2. Na engrenagem ao lado de "Selecione o tipo", escolha **App da Web** e preencha:
   - **Executar como:** Eu;
   - **Quem pode acessar:** Qualquer pessoa.
3. Clique em **Implantar**, autorize se o Google pedir e **copie o URL do App da Web** (termina em `/exec`).
4. Volte para a planilha e clique em **Batismo → Ativar atualização instantânea**. Cole o URL e confirme.
5. Recarregue o site nos celulares e computadores que já estavam abertos.

**Segurança:** o URL só atualiza a planilha e não devolve nenhum dado. Ele exige um código secreto gerado na ativação, guardado no Firebase (que só as contas autorizadas leem), e nunca entra neste repositório público. Para cancelar, use **Batismo → Desativar atualização instantânea**.

**Ao mudar o `Codigo.gs` depois:** em **Implantar → Gerenciar implantações**, edite a implantação e escolha **Nova versão**. Assim o URL continua o mesmo e não é preciso ativar de novo.

## Compartilhar com a equipe

Botão **Compartilhar** → adicione as pessoas como **Leitor**. Quem tiver só leitura não consegue alterar nada. Quem for editor recebe um aviso se tentar mexer nas abas.

## Problemas comuns

| Aba **Sobre** mostra | O que fazer |
|---|---|
| `Firestore respondeu 403` | A conta que instalou o script não tem acesso ao projeto `batismo-8c5f8`. Reinstale com a conta dona do projeto. |
| `Não encontrei appData/primary` | O sistema ainda não tem dados importados. |
| Site salva, mas a planilha só muda depois de alguns minutos | A atualização instantânea não está ativa ou o site estava aberto antes da ativação. Recarregue o site; se continuar, ative de novo pelo menu. |
| `Firestore respondeu 404 ao gravar` | O sistema ainda não tem dados importados. Importe primeiro e depois ative a atualização instantânea. |
| Nada muda | Confira em Apps Script → **Acionadores** (ícone de relógio) se existe o acionador `atualizarPlanilha`. Se não existir, use o menu **Batismo → Ativar atualização automática** de novo. |

## Custo

Cada atualização lê cerca de 80 documentos do Firestore (cerca de 23 mil leituras por dia a cada 5 minutos). O plano gratuito do Firebase permite 50 mil por dia. Para economizar, troque `INTERVAL_MINUTES = 5` por `10` no `Codigo.gs` e ative de novo.

## Manutenção

As regras de leitura (`shirtChoiceLabel`, `dayId`, ordem por turma etc.) são uma cópia das regras do `index.html`. Se a forma de guardar os dados mudar no sistema, atualize também este script.

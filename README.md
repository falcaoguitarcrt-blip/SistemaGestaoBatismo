# Gestão de Batismo

Protótipo web responsivo para organizar cadastro, preparação, ordem do batismo, check-in, camisetas, reposição e histórico.

## Acessar

- **Aplicação:** https://falcaoguitarcrt-blip.github.io/SistemaGestaoBatismo/
- **Código principal:** [index.html](index.html)
- **Cópia-base visual:** [prototipos/gestao-batismo-base.html](prototipos/gestao-batismo-base.html)

## Acesso

- Login **somente com conta Google** autorizada. O provedor E-mail/senha deve ficar desativado no Firebase Authentication.
- Quem pode ler e gravar é definido nas regras do Cloud Firestore do projeto `batismo-8c5f8`.

## Importar a planilha

1. Abra a aplicação e entre em **Mais → Importar**.
2. Selecione o Excel. Apenas as duas primeiras abas são usadas: **Batismo** e **Ordem Batismo NN**.
3. Confira os quantitativos e clique em **Importar e salvar no Firebase**.

Depois da carga inicial, cadastre e edite pelo site. Importe outro Excel somente para substituir a base inteira.

## Dados

Os registros ficam no Cloud Firestore (acesso apenas para contas autorizadas) e as marcações do dia do batismo sincronizam entre os celulares. O GitHub Pages deste repositório é público e contém apenas o código da interface.

**Não commit dados pessoais, telefones, informações de menores ou observações de perfil neste repositório público.**

## Regra para próximas atualizações

Evoluir o `index.html` em pequenas etapas, mantendo a cópia-base disponível para comparação. Preservar a organização do protótipo e não alterar os dados de origem por deduplicação, correções automáticas ou mudanças estruturais não solicitadas.

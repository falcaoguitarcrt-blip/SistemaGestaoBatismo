# Pessoas e Ficha

Esta etapa refaz as telas de Pessoas e Ficha em `index.html`, mantendo as demais telas no formato atual.

## Como funciona

- A lista lê `pessoas/{id}` com `onSnapshot`; atualizações autorizadas aparecem em tempo real.
- A turma 36 inicia selecionada, conforme a configuração atual da turma ativa.
- A busca compara nome sem acentos e telefone só com dígitos. Os filtros podem ser combinados e a lista pode ser ordenada e paginada em 25, 50 ou 100 registros.
- A ficha abre em `#/pessoas/{id}`. No computador aparece como painel lateral; no celular ocupa a tela. Fechar/voltar usa o histórico de navegação.
- Gravações usam transação, contador de revisão e documento append-only em `auditoria`. Se a revisão mudou desde a abertura, aparece o aviso de conflito e o botão para recarregar.
- Telefone e responsável também são gravados em `pessoas/{id}/privado/contato`. O campo raiz `telefone` continua como índice de busca para equipe autorizada; voluntários não podem ler a coleção `pessoas`. O documento privado `perfil` só pode ser lido ou editado por admin/pastor.
- Registros que ainda estão somente no bloco antigo do aplicativo aparecem para consulta, sem edição. Após a migração para `pessoas`, a ficha estruturada habilita edição.
- Cadastro de menor exige responsável com nome e telefone. Um nome já existente gera uma confirmação antes de cadastrar outra pessoa.
- O perfil voluntário não recebe a navegação Pessoas. As permissões reais continuam sendo aplicadas pelas regras do Firestore; esconder um botão não é controle de segurança.

## Publicação segura

1. Revise o PR antes de mesclar. Esta mudança não publicou os dados da planilha no GitHub.
2. Publique as regras junto do aplicativo. Não substitua as regras por regras permissivas.
3. Use primeiro uma cópia de homologação do projeto Firestore ou o simulador de regras. O arquivo antigo `appData/primary` continua restrito a admin/pastor; outras telas legadas podem precisar da migração delas antes de usar novos perfis.
4. Cadastre usuários ativos em `usuarios/{uid}`, com o mesmo e-mail de Authentication e perfil apropriado.
5. Confirme que a migração estruturada de pessoas já foi concluída. As pessoas antigas permanecem visíveis para consulta, mas o sistema não as regrava nem tenta duplicar dados.

## Checklist de validação

### Pessoas

- [ ] Entrar como secretaria e confirmar que a lista carrega sem erros.
- [ ] Confirmar que turma 36 é o filtro inicial; alterar a turma.
- [ ] Buscar por `João` e por `Joao`; os dois termos devem localizar o mesmo nome.
- [ ] Buscar por telefone com espaços, parênteses e hífen; a busca deve comparar os dígitos.
- [ ] Combinar turma + jornada + camiseta + menor; confirmar a contagem e os registros resultantes.
- [ ] Testar pendência, sem telefone e nomes repetidos em combinação.
- [ ] Ordenar nome, turma, idade, telefone, jornada, camiseta e pendências.
- [ ] Trocar página para 25, 50 e 100; testar a seleção em lote e limpar a seleção.
- [ ] No celular, confirmar cartões compactos sem rolagem horizontal.
- [ ] Confirmar selos: jornada concluída, pendência, camiseta a pagar, menor sem responsável e telefone inválido.
- [ ] Testar WhatsApp com telefone válido e conferir a mensagem pré-preenchida.

### Ficha e rotas

- [ ] Clicar numa pessoa e confirmar URL `#/pessoas/ID`; atualizar a página e abrir o mesmo cadastro.
- [ ] Abrir uma pessoa, usar Voltar do navegador e confirmar retorno à lista.
- [ ] Copiar o link de uma ficha e abrir em outra aba com uma conta autorizada.
- [ ] Testar as abas Resumo, Jornada, Camiseta, Pendências, Batismo, Histórico e Privado.
- [ ] Editar um campo e confirmar “Salvo”; recarregar e conferir persistência.
- [ ] Usar Desfazer e verificar que a alteração foi revertida e auditada.
- [ ] Em duas abas, editar o mesmo cadastro quase ao mesmo tempo: a segunda deve mostrar conflito, não sobrescrever silenciosamente, e permitir recarregar.
- [ ] Entrar como voluntário: Pessoas e telefones devem permanecer inacessíveis.
- [ ] Entrar como secretaria/líder: não mostrar Privado nem histórico detalhado; entrar como admin/pastor e confirmar acesso.
- [ ] Cadastrar adulto sem telefone, adulto com telefone, menor sem responsável (deve bloquear) e menor com responsável (deve salvar).
- [ ] Cadastrar um nome repetido; confirmar o aviso e só salvar após confirmação.
- [ ] No simulador do Firestore, testar negativa para usuário inativo, telefone por voluntário, atualização de `origem` e edição/apagamento de auditoria.

## Limite desta entrega

O código foi revisado e os scripts JavaScript passaram por verificação sintática. Não houve gravação nem leitura autenticada no Firestore de produção nesta tarefa, e as regras não foram publicadas. Faça o checklist com contas e dados de teste antes de ativar as regras em produção.

# Etapa 2 · Pessoas e Pendências

Esta etapa acrescenta os módulos de cadastro de pessoas e central de pendências à aplicação isolada em `etapa1/`. Ela segue a fundação criada na Etapa 1 e não substitui o protótipo público na raiz do repositório.

## Arquivos

- `index.html`: adiciona pontos de entrada para os módulos após login.
- `css/modules.css`: estilos responsivos dos módulos.
- `js/modules.js`: leitura e escrita de Pessoas e Pendências no Firestore.
- `firestore.rules`: regras iniciais da Etapa 1, que já restringem Pessoas e Pendências a usuários ativos com perfil `admin` ou `secretaria`.

## Funcionalidades desta versão

### Pessoas
- Lista com paginação local de 25 itens por página.
- Consulta de até 100 registros por carregamento.
- Busca sem diferenciar acentos ou maiúsculas/minúsculas.
- Filtros por turma, situação, pendência e cadastro Ekklesia.
- Atalhos para pendentes e pessoas sem Ekklesia.
- Cadastro e edição de campos básicos.
- Ficha lateral com abas Dados, Jornada, Camiseta, Pendências e Histórico.
- Normalização de nome para busca.
- Validação básica de telefone brasileiro e de data de nascimento futura.
- A tentativa de cadastro de menor pela ficha rápida é interrompida; o fluxo completo com responsável precisa estar disponível antes de salvar menores.
- Checagem de possível duplicidade por nome normalizado e telefone, com confirmação manual para manter ambos.

### Pendências
- Criar pendência vinculada a pessoa cadastrada.
- Catálogo inicial de tipos na interface.
- Busca e filtros por status e tipo.
- Indicadores de itens abertos e pessoas com pendência.
- Resolver ou reabrir com confirmação.
- Registrar usuário e horário nas alterações de status.

## Configuração necessária

A Etapa 1 ainda depende de preencher a configuração do seu projeto Firebase em `js/firebase.js`. Não publique credenciais administrativas nem senhas. O identificador de configuração do app Web não substitui as regras de segurança.

Para acessar os módulos:
1. Configure Firebase Authentication com e-mail/senha.
2. Crie o usuário no Authentication.
3. Crie o documento `usuarios/{UID}` no Firestore com `perfil: "admin"` e `ativo: true` para o administrador inicial.
4. Publique e teste `firestore.rules`.
5. Faça login com essa conta.

Se o documento do usuário estiver ausente, inativo ou sem perfil autorizado, os atalhos dos módulos permanecem ocultos e as regras do Firestore negam as operações.

## Estrutura dos documentos

### `pessoas`
O módulo usa campos como `nome`, `nomeNormalizado`, `telefoneE164`, `telefoneExibicao`, `turmaId`, `dataNascimento`, `jornada`, `jornadaConcluida`, `cadastroEkklesia`, `entrouNoGrupo`, `camiseta`, `statusGeral`, `pendenciaTexto`, `criadoEm`, `criadoPor`, `atualizadoEm` e `atualizadoPor`.

### `pendencias`
Usa `pessoaId`, `nomePessoa`, `tipo`, `responsavel`, `prazo`, `status`, `nota`, `criadoEm`, `criadoPor`, `atualizadoEm`, e, quando resolvida, `resolvidoEm` e `resolvidoPor`.

## Limitações conhecidas

- Esta é a primeira versão funcional dos módulos, não uma declaração de prontidão para produção.
- A consulta é limitada a 100 documentos por carregamento. Para bases maiores, deve ser substituída por paginação real baseada em cursor do Firestore.
- A edição em lote, o drawer completo com histórico detalhado e mensagens de WhatsApp ainda precisam de refinamento.
- A trilha de auditoria centralizada para todas as operações precisa ser consolidada na Etapa 5.
- A verificação de menores interrompe o cadastro rápido, mas o formulário completo de responsável precisa ser implementado antes de aceitar cadastros de menores.
- Líderes e voluntários não recebem acesso aos dados pessoais por estas regras iniciais.
- Os módulos dependem de Firebase configurado, documento de usuário autorizado e regras publicadas. Não foram testados em um projeto Firebase real nesta sessão.
- Não importe a planilha real até validar segurança, duplicidades, backup e assistente de importação.

## Testes manuais recomendados

- Entrar sem Firebase configurado: os módulos devem ficar ocultos.
- Entrar sem documento de usuário ou com perfil inativo: módulos inacessíveis.
- Entrar como admin e secretaria: módulos disponíveis.
- Tentar abrir e gravar dados com perfil voluntário: operação negada pelas regras.
- Criar e editar pessoa de teste.
- Testar busca sem acento, filtros e paginação.
- Tentar telefone inválido e data futura.
- Tentar cadastrar menor pela ficha rápida e confirmar que não é salvo.
- Criar, resolver e reabrir pendência.
- Conferir que os dados aparecem após recarregar e entrar novamente.

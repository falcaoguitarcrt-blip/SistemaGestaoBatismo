# Início, Histórico e Importação

## Mockups em texto

### Início — desktop

```
Início                                               Turma selecionada [36 ▾]

┌ Próximo batismo · Turma 36 ────────────────────────┐ ┌ Pessoas 57 ┐ ┌ Pendências 15 ┐
│ 12/10/2026 · Local a definir     Faltam 0 dias     │ │ Jornada 49 │ │ Aulas a repor 8│
│ 42 de 57 prontos                                   │ └ Camisetas a pagar 11 ──────┘
│ [barra: prontos / a preparar] [Abrir ordem]        │
└────────────────────────────────────────────────────┘

┌ Atenção agora ───────────────┐ ┌ Funil de preparação ──────────┐
│ 15 pessoas com pendências  › │ │ Cadastro       ███████ 57    │
│ 3 menores sem responsável › │ │ Aulas 1–4       ██████  54    │
└──────────────────────────────┘ └───────────────────────────────┘

┌ Pessoas por turma: barras clicáveis, turma mais recente primeiro ───────┐
└─────────────────────────────────────────────────────────────────────────┘
```

### Histórico

```
Histórico
[Batizados] [Log de alterações — admin] [Histórico legado · GERAL]

Ano [todos ▾] Turma [todas ▾] Busca [nome, turma ou pastor] [Exportar CSV]
Pessoa · Turma · Data · Pastor · Posição                              [Certificado PDF]

No certificado, o modelo usa os campos {nome}, {turma}, {data} e {igreja}.
Administração pode editar e salvar o texto do modelo no Firestore.
O GERAL aparece como arquivo somente leitura e separado da base ativa.
```

### Importar

```
Importar · Somente admin
(1 Enviar) ─ (2 Conferir colunas) ─ (3 Simulação) ─ (4 Confirmar)

[Solte o arquivo Excel aqui] [Escolher arquivo]
Abas reconhecidas: Batismo · Ordem · GERAL

Simulação:
Novos | Atualizações | Sem nome | Possíveis duplicados
Datas impossíveis | Telefones inválidos
[Modo: Adicionar e atualizar ▾]
[Substituir tudo: digite CONFIRMAR]

Antes de gravar: baixa backup JSON → progresso → gravação no Firestore
Final: resumo baixável
```

## Observações de dados

- O countdown calcula o dia civil no fuso `America/Sao_Paulo`.
- A barra “prontos” usa os campos estruturados disponíveis: jornada concluída, aulas, contato, camiseta solicitada e pendências.
- A mesclagem usa aba e número da linha como referência, preserva duplicados como registros independentes e ignora células vazias ao atualizar. A substituição muda o ponteiro da versão ativa; versões antigas permanecem no Firestore.
- O service worker mantém somente arquivos públicos da interface em cache. Ele não intercepta chamadas ao Firebase. A persistência offline do SDK Firebase pode manter documentos autorizados já lidos em IndexedDB; isso não é o arquivo Excel original e permite uso offline.
- O histórico legado GERAL permanece dentro do bloco privado versionado e não é copiado para a lista de pessoas ativas.
- Importar uma nova planilha não reescreve a coleção estruturada `pessoas` nem resolve automaticamente sugestões de texto ou duplicados. A base versionada e a migração estruturada continuam sendo fluxos distintos.

## Checklist manual de validação

### Início
- [ ] Confirmar turma/data/local corretos e countdown em `America/Sao_Paulo`, antes, durante e após a data.
- [ ] Trocar a turma no seletor e conferir indicadores, funil e barras clicáveis.
- [ ] Abrir Ordem a partir do cartão e abrir listas pelos alertas.
- [ ] Verificar vazio, erro de leitura e carregamento sem valores de demonstração.

### Histórico
- [ ] Buscar nomes com e sem acento; filtrar por ano e turma; exportar CSV.
- [ ] Abrir certificado, editar o texto-modelo como admin, salvar, recarregar e imprimir como PDF.
- [ ] Confirmar que secretaria/liderança não veem Log de alterações e que voluntário não vê Histórico.
- [ ] Confirmar que GERAL é pesquisável, somente leitura, separado da lista ativa e visível só para admin/pastor.
- [ ] Filtrar o log por usuário, documento/campo e intervalo de datas com a conta admin.

### Importar e segurança
- [ ] Entrar como secretaria: Importar não aparece e gravação é negada.
- [ ] Entrar como admin, soltar um Excel com Batismo, Ordem e GERAL; conferir cabeçalhos antes de seguir.
- [ ] Conferir no relatório duplicados, linhas sem nome, datas impossíveis, telefones inválidos e posições vazias.
- [ ] Simular **Adicionar e atualizar**: linhas existentes permanecem, duplicados não se mesclam e células vazias não apagam valores.
- [ ] Simular **Substituir tudo** com texto diferente de CONFIRMAR (bloqueado) e depois com CONFIRMAR.
- [ ] Verificar que o backup JSON baixa antes de qualquer gravação, que há progresso e que o relatório final é baixável.
- [ ] Após a leitura, cancelar ou confirmar e verificar que o seletor do Excel foi limpo e que IndexedDB não contém `sourceWorkbook` nem `rawSheets`.
- [ ] Confirmar que o service worker não armazena resposta Firebase nem o arquivo enviado. A persistência offline do Firebase pode manter dados já lidos; verificar se isso atende ao uso em aparelho compartilhado.
- [ ] Confirmar que nenhum dado pessoal entrou em commits.
- [ ] Testar service worker/PWA, instalação, navegação por teclado, contraste AA e modo escuro em Android, iPhone e desktop.

## Estado dos testes

Este documento define verificações para executar em homologação. Não houve escrita no Firestore, implantação, nem execução deste checklist nesta alteração.

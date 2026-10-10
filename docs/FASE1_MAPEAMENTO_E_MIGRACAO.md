# Fase 1 — Auditoria e mapeamento funcional

**Status:** documento de planejamento; não significa que o backend, a autenticação ou a migração estejam implementados.

## 1. Regras de preservação

- A planilha original é fonte de consulta e deve permanecer intacta.
- Toda análise de importação será feita primeiro em uma cópia de teste, com acesso restrito.
- Não enviar planilhas, nomes, telefones, observações ou outros dados reais para este repositório público.
- Não importar automaticamente as abas históricas `GERAL` e `Ordem Batismo 35`.
- Não apagar, fundir ou sobrescrever registros durante a migração.
- Registros com correspondência duvidosa devem ficar para revisão manual.

## 2. Módulos funcionais

### Pessoas e turmas

Cada pessoa terá um identificador interno imutável (ID), independente do nome. O nome não será usado como chave única. Os dados ausentes serão exibidos como “Não informado”, nunca convertidos automaticamente em “Não”, “pendente” ou “concluído”.

Campos funcionais previstos:
- Identificação: ID, nome, idade (quando necessária), telefone (acesso restrito), turma e data de cadastro.
- Jornada: situação da jornada, aulas concluídas e aulas a repor.
- Preparação para o batismo: confirmação de entrada no grupo, camiseta/tamanho, situação de pagamento e pendências.
- Resultado do evento: participação confirmada e situação final de batismo, registradas separadamente.
- Auditoria: data de criação/alteração e usuário responsável, quando suportado pela arquitetura.

Os campos exatos, tipos, opções permitidas e obrigatoriedade deverão ser confirmados durante a validação da planilha.

### Pendências

Pendências serão registros individuais, permitindo mais de uma por pessoa:
- ID da pendência e ID da pessoa;
- descrição e categoria;
- situação (aberta, em andamento ou resolvida);
- data de abertura, responsável e data/observação de resolução, quando disponíveis.

O painel diferenciará a quantidade de pessoas com pendências da quantidade total de pendências abertas.

### Eventos e ordem de batismo

Cada evento terá um ID próprio, data, identificação e estado. A participação de uma pessoa em um evento será um registro separado, ligado pelo ID da pessoa e pelo ID do evento.

Cada registro de participação poderá conter:
- decisão de participação (confirmada, não participará, em avaliação ou não informada);
- posição na ordem;
- observação específica daquele evento;
- resultado final, incluindo se foi efetivamente batizada, quando confirmado.

A ordem será editável por movimentação, posição numérica e comandos de subir/descer. Após uma alteração, a numeração será recalculada e salva. Observações ficam vinculadas ao registro da pessoa naquele evento, nunca ao número da linha. Eventos anteriores não serão sobrescritos.

### Informações confidenciais

O campo histórico “INVESTIGAÇÃO PERFIL (FBI)” é altamente sensível. Não deve aparecer em listas gerais, pesquisa comum, painel, exportações gerais ou registros de demonstração. Antes de armazenar qualquer nota dessa natureza, a organização deve confirmar a necessidade, a finalidade e quem tem autorização para acessá-la. Se realmente necessária, ficará isolada em área de acesso restrito e com regras próprias. Não migrar esse conteúdo automaticamente.

## 3. Estratégia de correspondência e migração

1. Fazer backup preservado da planilha original.
2. Criar cópia de teste com acesso restrito.
3. Mapear cabeçalhos, tipos, valores válidos, fórmulas e campos vazios das abas principais `Batismo` e `Ordem`.
4. Tratar `GERAL` e `Ordem Batismo 35` apenas como referência histórica, sem importação automática.
5. Criar IDs internos para os registros da cópia de teste.
6. Preparar uma tabela de correspondências candidatas entre participantes e ordem. Nome parecido não é prova suficiente. Casos duplicados, homônimos ou sem vínculo claro exigem revisão manual.
7. Validar contagens, campos vazios, duplicidades candidatas e referências órfãs.
8. Executar testes de leitura, criação, edição, ordenação e recuperação de dados na cópia.
9. Somente após aprovação explícita e testes de segurança será considerada qualquer migração definitiva.

## 4. Arquitetura proposta

- **GitHub Pages:** interface estática pública, sem dados reais nem segredos.
- **Firebase Authentication:** autenticação real, após configuração e validação.
- **Cloud Firestore:** banco de dados privado, com regras de segurança restritivas.
- **Regras e autorização:** bloquear por padrão; conceder acesso somente a usuários autorizados. Validar permissões em cada operação e separar os dados confidenciais.
- **Credenciais:** nenhuma chave privada, token administrativo ou credencial de servidor no frontend ou neste repositório.

A configuração do Firebase ainda precisa ser realizada e testada. A existência de configuração no frontend, por si só, não torna os dados privados. Regras de Firestore, identidade, autorização e testes negativos devem estar corretos antes de usar dados reais.

## 5. Coleções conceituais propostas

Os nomes são uma proposta de modelagem, não coleções já criadas:

- `participants`: dados cadastrais mínimos e IDs internos.
- `classes`: turmas e informações de organização.
- `journeyRecords`: acompanhamento da jornada/aulas, se for necessário histórico.
- `pendingItems`: pendências individuais.
- `baptismEvents`: eventos de batismo.
- `eventParticipants`: participação, posição, observações e resultado por evento.
- `restrictedNotes`: notas estritamente confidenciais, caso a necessidade seja aprovada e exista controle de acesso específico.
- `auditLogs`: trilha de alterações, evitando registrar dados pessoais desnecessários.

A modelagem final deve minimizar os dados coletados, limitar acesso por função e considerar regras do Firestore e limites de consulta.

## 6. Critérios para concluir a Fase 1

- [ ] Dicionário de dados validado com os responsáveis.
- [ ] Diferença entre jornada concluída, participação no evento e batismo realizado confirmada.
- [ ] Campos confidenciais identificados e política de acesso definida.
- [ ] Estratégia de correspondência entre as abas documentada.
- [ ] Plano de backup e migração de teste aprovado.
- [ ] Projeto Firebase correto identificado, sem expor IDs ou credenciais no repositório.
- [ ] Regras de segurança planejadas e testadas em ambiente de teste.
- [ ] Nenhum dado real importado antes da validação.

**Situação atual:** o documento registra a proposta. Não comprova que Firebase, autenticação, permissões, coleções ou migração já estejam configurados. A fase só poderá ser marcada como concluída depois das verificações acima.

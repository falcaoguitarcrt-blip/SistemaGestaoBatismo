from pathlib import Path
import re
import subprocess

PATH = Path('index.html')
text = PATH.read_text(encoding='utf-8')

MODULE_RE = re.compile(r'<script\s+type="module">.*?</script>', re.S)
def auth_module(source: str) -> str:
    blocks = MODULE_RE.findall(source)
    if len(blocks) != 1:
        raise SystemExit(f'Proteção Auth: esperado 1 módulo Firebase, encontrado {len(blocks)}')
    return blocks[0]

# A referência de autenticação é sempre a main estável. Se já houver qualquer
# diferença antes da alteração, o processo para sem tocar no index.
main_text = subprocess.check_output(['git', 'show', 'origin/main:index.html'], text=True)
main_auth = auth_module(main_text)
current_auth = auth_module(text)
if current_auth != main_auth:
    raise SystemExit('BLOQUEADO: o módulo Google/Firebase Auth da branch já difere da main estável.')

style = r'''
<style id="batizantes-v1-style">
#pes .batizantes-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
#pes .batizantes-head .section-sub{margin:0}
#pes .prep-summary{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
#pes .prep-summary .tag{font-size:10px;padding:4px 7px}
#pes .batizante-item{align-items:flex-start;cursor:pointer;transition:border-color .15s ease,transform .15s ease,background .15s ease}
#pes .batizante-item:hover{border-color:color-mix(in srgb,var(--pri) 48%,var(--ln));transform:translateY(-1px);background:color-mix(in srgb,var(--card) 96%,var(--pri))}
#pes .batizante-item .item-main{min-width:0}
#pes .batizante-item .person-title{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#pes .batizante-item .person-title strong{font-size:15px}
#pes .prep-title{font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-top:9px}
#pes .prep-compact{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:5px}
#pes .prep-cell{padding:7px 8px;border:1px solid var(--ln);border-radius:9px;background:color-mix(in srgb,var(--bg) 72%,var(--card));min-width:0}
#pes .prep-cell small{display:block;color:var(--mut);font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
#pes .prep-cell b{display:block;font-size:11px;overflow-wrap:anywhere}
#pes .pending-compact{margin-top:6px;font-size:11px;color:var(--pe)}
#pes .batizante-item .item-actions{align-self:center;min-width:105px}
#pes .batizante-item .item-actions .btn{white-space:nowrap}
#fic .ficha-prep-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
#fic .ficha-prep{border:1px solid var(--ln);border-radius:11px;padding:10px;background:color-mix(in srgb,var(--bg) 72%,var(--card))}
#fic .ficha-prep small{display:block;color:var(--mut);font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
#fic .ficha-prep strong{display:block;font-size:12px;overflow-wrap:anywhere}
#fic .ficha-section-title{display:block;font-size:14px;margin-bottom:7px}
@media(max-width:760px){
 #pes .prep-compact{grid-template-columns:repeat(2,minmax(0,1fr))}
 #pes .batizante-item .item-actions{width:100%;min-width:0;align-self:stretch}
 #pes .batizante-item .item-actions .btn{width:100%}
 #fic .ficha-prep-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:420px){#pes .prep-compact{grid-template-columns:1fr 1fr}#fic .ficha-prep-grid{grid-template-columns:1fr}}
</style>
'''
if 'id="batizantes-v1-style"' not in text:
    text = text.replace('</head>', style + '\n</head>', 1)

new_build_people = r'''function buildPeople() {
    var section = document.getElementById('pes');
    var turmas = Array.from(new Set((appData.turmas || []).map(function(t){return clean(t.number || t.name).replace(/^Turma\s+/i,'');}).concat(appData.people.map(function (p) { return clean(p.turma); })).filter(Boolean))).sort(function (a, b) { return Number(a) - Number(b); });
    if (turmas.indexOf('36') >= 0) { if (!peopleState.turma) peopleState.turma = '36'; }
    else if (peopleState.turma && turmas.indexOf(peopleState.turma) < 0) peopleState.turma = '';
    section.innerHTML = '<div class="batizantes-head"><div><h2 class="t">Batizantes · ' + numberLabel(appData.people.length) + ' registros</h2><p class="section-sub">Consulta cadastral e acompanhamento compacto da preparação. Clique em uma pessoa para abrir a ficha completa.</p></div><button type="button" class="btn" data-add-person>+ Cadastrar pessoa</button></div>' +
      '<div class="card"><h3 style="margin-top:0">Cadastro direto no sistema</h3><form id="manual-person-form"><div class="record-editor-fields"><label class="record-editor-field">Nome<input id="manual-person-name" required maxlength="160" autocomplete="name"></label><label class="record-editor-field">Telefone<input id="manual-person-phone" maxlength="50" autocomplete="tel"></label><label class="record-editor-field">Idade<input id="manual-person-age" type="number" min="0" max="120"></label><label class="record-editor-field">Turma<select id="manual-person-turma" required><option value="">Selecione a turma</option>' + (appData.turmas || []).map(function(t){return '<option value="'+esc(t.number || t.name)+'">Turma '+esc(t.number || t.name)+'</option>';}).join('') + '</select></label></div><div class="record-editor-actions"><button type="button" class="btn o" id="manual-person-cancel" hidden>Cancelar edição</button><button type="submit" class="btn" id="manual-person-save">Cadastrar pessoa</button></div><div id="manual-person-status" class="import-status" role="status" aria-live="polite"></div></form><div id="manual-person-results" class="data-list"></div></div>' +
      '<div class="data-metrics" id="people-ops-summary"></div>' +
      '<div class="card"><div class="data-toolbar"><input id="people-search" type="search" placeholder="Buscar nome, telefone, observação ou linha…" aria-label="Buscar pessoas"><select id="people-turma" aria-label="Filtrar turma"><option value="">Todas as turmas</option>' + turmas.map(function (t) { return '<option value="' + esc(t) + '" ' + (peopleState.turma === t ? 'selected' : '') + '>Turma ' + esc(t) + '</option>'; }).join('') + '</select><select id="people-filter" aria-label="Filtrar registros"><option value="all">Todos os registros</option><option value="pending">Com pendência</option><option value="without-phone">Sem telefone</option><option value="without-name">Sem nome</option></select></div></div>' +
      '<div id="people-count" class="data-summary"></div><div id="people-results" class="data-list"></div><div id="people-pager" class="data-pager"></div>';
    document.getElementById('people-search').addEventListener('input', function () { peopleState.query = this.value; peopleState.page = 1; drawPeopleResults(); });
    document.getElementById('people-turma').addEventListener('change', function () { peopleState.turma = this.value; peopleState.page = 1; drawPeopleResults(); });
    document.getElementById('people-filter').addEventListener('change', function () { peopleState.filter = this.value; peopleState.page = 1; drawPeopleResults(); });
    drawPeopleResults();
    drawManualPeople();
    document.getElementById('manual-person-form').addEventListener('submit', saveManualPerson);
    document.getElementById('manual-person-cancel').addEventListener('click', resetManualPersonForm);
}
'''
pattern_build = re.compile(r'  function buildPeople\(\) \{.*?\n  \}\n\n  function drawManualPeople', re.S)
text, count = pattern_build.subn('  ' + new_build_people + '\n  function drawManualPeople', text, count=1)
if count != 1:
    raise SystemExit('Não foi possível localizar buildPeople para a V1.')

new_helpers = r'''function prepJourney(person) {
    var value = clean(person && person.journey);
    var n = normal(value);
    if (!value) return 'Não informado';
    if (n.indexOf('4/4') >= 0 || n.indexOf('conclu') >= 0) return value;
    if (n.indexOf('3/4') >= 0) return value;
    if (n.indexOf('repor') >= 0) return 'Reposição necessária';
    return value;
  }
  function prepGroup(person) {
    var value = clean(person && person.group);
    if (!value) return 'Não informado';
    var b = asBoolean(value);
    if (b === true) return '✓ Grupo WhatsApp';
    if (b === false) return 'Não entrou no grupo';
    return value;
  }
  function prepEklesia(person) {
    var value = clean(person && (person.eklesia || person.eklesiaStatus || person.baptized));
    var n = normal(value);
    if (!value) return 'Não informado';
    if (n === 'ok' || n.indexOf('incluid') >= 0 || n.indexOf('sim') >= 0) return '✓ Eklesia';
    if (n.indexOf('pend') >= 0) return 'Pendente';
    return value;
  }
  function prepShirt(person) {
    var choice = shirtChoiceLabel(person);
    if (choice === 'Não') return 'Não deseja camiseta';
    if (choice === 'Já possui') return 'Já possui camiseta';
    if (choice === 'Pendente') return 'Camiseta pendente';
    var size = shirtSizeValue(person);
    var payment = shirtPaymentChoice(person);
    if (!size) return 'Camiseta pendente';
    return 'Camiseta ' + size + ' · ' + payment;
  }
  function prepClass(value, kind) {
    var n = normal(value);
    if (n.indexOf('conclu') >= 0 || n.indexOf('✓') >= 0 || n === 'sim' || n === 'pago' || n.indexOf('incluid') >= 0) return 't-ok';
    if (n.indexOf('pend') >= 0 || n.indexOf('nao') >= 0 || n.indexOf('não') >= 0 || n.indexOf('repor') >= 0 || n.indexOf('informado') >= 0) return 't-pe';
    return kind === 'shirt' ? 't-in' : 't-in';
  }
  function prepCell(label, value, kind) {
    return '<div class="prep-cell"><small>' + esc(label) + '</small><b>' + esc(value) + '</b></div>';
  }
  function personPendingText(person) {
    var flags = signalFlags(person);
    return flags.length ? flags.slice(0, 3).join(' · ') : 'Nenhuma pendência registrada';
  }
'''
marker = '  function drawPeopleResults() {'
if marker not in text:
    raise SystemExit('Não foi possível localizar drawPeopleResults.')
text = text.replace(marker, new_helpers + '\n' + marker, 1)

new_draw = r'''function drawPeopleResults() {
    if (!appData || !document.getElementById('people-results')) return;
    var query = normal(peopleState.query);
    var items = appData.people.filter(function (p) {
      var text = normal([p.name, p.phone, p.turma, p.journey, p.lesson, p.status, p.pending, p.profile, p.sourceRow, p.shirt, p.shirtPaid, p.group].join(' '));
      if (query && text.indexOf(query) < 0) return false;
      if (peopleState.turma && clean(p.turma) !== peopleState.turma) return false;
      if (peopleState.filter === 'pending' && !hasPendingSignal(p)) return false;
      if (peopleState.filter === 'without-phone' && !isBlank(p.phone)) return false;
      if (peopleState.filter === 'without-name' && p.name) return false;
      return true;
    });
    drawPeopleOpsSummary((appData.people || []).filter(function (p) { return matchesTurmaFilter(p, peopleState.turma); }));
    var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    peopleState.page = Math.min(Math.max(1, peopleState.page), pages);
    var start = (peopleState.page - 1) * PAGE_SIZE;
    var view = items.slice(start, start + PAGE_SIZE);
    document.getElementById('people-count').textContent = numberLabel(items.length) + ' registros encontrados · página ' + peopleState.page + ' de ' + pages;
    document.getElementById('people-results').innerHTML = view.map(function (p) {
      var status = isBlank(p.status) ? (p.name ? 'Status não preenchido' : 'Registro incompleto') : p.status;
      var classes = p.name ? 't-in' : 't-er';
      var journey = prepJourney(p);
      var group = prepGroup(p);
      var eklesia = prepEklesia(p);
      var shirt = prepShirt(p);
      var pending = hasPendingSignal(p);
      return '<div class="data-item batizante-item" data-open-person="' + esc(p.sourceRow) + '" tabindex="0" role="button" aria-label="Abrir ficha de ' + esc(displayName(p)) + '">' +
        '<div class="av">' + esc(p.name ? p.name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (s) { return s.charAt(0); }).join('').toUpperCase() : '—') + '</div>' +
        '<div class="item-main">' +
          '<div class="person-title"><strong>' + esc(displayName(p)) + '</strong>' + chip(status, classes) + '</div>' +
          '<div class="item-meta">Turma ' + esc(display(p.turma)) + ' · Idade: ' + esc(display(p.age)) + ' · Telefone: ' + esc(display(p.phone)) + '</div>' +
          '<div class="prep-title">Preparação</div>' +
          '<div class="prep-compact">' +
            prepCell('Jornada', journey, 'journey') +
            prepCell('WhatsApp', group, 'group') +
            prepCell('Eklesia', eklesia, 'eklesia') +
            prepCell('Camiseta', shirt, 'shirt') +
          '</div>' +
          '<div class="pending-compact">' + (pending ? '⚠ ' + esc(personPendingText(p)) : '✓ Nenhuma pendência registrada') + '</div>' +
        '</div>' +
        '<div class="item-actions"><button type="button" class="btn o" data-open-person="' + esc(p.sourceRow) + '">Ver ficha</button></div>' +
      '</div>';
    }).join('') || '<div class="data-empty">Nenhum registro encontrado com estes filtros.</div>';
    document.getElementById('people-pager').innerHTML = '<button type="button" class="btn o" data-page="people:-1" ' + (peopleState.page <= 1 ? 'disabled' : '') + '>← Anterior</button><span>' + numberLabel(start + (view.length ? 1 : 0)) + '–' + numberLabel(start + view.length) + ' de ' + numberLabel(items.length) + '</span><button type="button" class="btn o" data-page="people:1" ' + (peopleState.page >= pages ? 'disabled' : '') + '>Próxima →</button>';
  }
'''
pattern_draw = re.compile(r'  function drawPeopleResults\(\) \{.*?\n  \}\n\n  function buildFiche', re.S)
text, count = pattern_draw.subn('  ' + new_draw + '\n  function buildFiche', text, count=1)
if count != 1:
    raise SystemExit('Não foi possível localizar drawPeopleResults para a V1.')

new_fiche = r'''function buildFiche(person) {
    var section = document.getElementById('fic');
    if (!person) {
      section.innerHTML = '<h2 class="t">Ficha individual</h2><div class="data-empty">Selecione uma pessoa para abrir a ficha completa.</div>';
      return;
    }
    var fields = [
      ['NOME', person.fields[0]], ['IDADE', person.fields[1]], ['TELEFONE', person.fields[2]], ['TURMA', person.fields[3]],
      ['DATA', excelDate(person.fields[4])], ['JORNADA', person.fields[5]], ['AULA P/ REPOR', person.fields[6]],
      ['ENTROU NO GRUPO', person.fields[7]], ['CAMISETA', person.fields[8]], ['PG CAMISETA', person.fields[9]],
      ['STATUS', person.fields[10]], ['PENDENCIA', person.fields[11]], ['BATIZADO', person.fields[12]],
      ['INVESTIGAÇÃO PERFIL (FBI)', person.fields[13]]
    ];
    section.innerHTML = '<div class="bb"><button type="button" class="btn o" data-go="pes">← Voltar para Batizantes</button></div><h2 class="t">Ficha completa</h2>' +
      '<div class="card"><div class="row" style="border:0;padding-top:0"><div class="av" style="width:52px;height:52px;font-size:18px">' + esc(person.name ? person.name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (s) { return s.charAt(0); }).join('').toUpperCase() : '—') + '</div><div class="m"><h2 style="font-size:20px">' + esc(displayName(person)) + '</h2><div>' + esc(display(person.age)) + ' anos · ' + esc(display(person.phone)) + ' · Turma ' + esc(display(person.turma)) + '</div></div></div><div class="item-badges" style="margin-top:8px">' + badgeForStatus(person.status) + (!isBlank(person.pending) ? chip('Pendência', 't-pe') : chip('Sem pendências registradas', 't-ok')) + '</div></div>' +
      '<div class="card"><span class="ficha-section-title">Preparação</span><div class="ficha-prep-grid">' +
        '<div class="ficha-prep"><small>Jornada</small><strong>' + esc(prepJourney(person)) + '</strong></div>' +
        '<div class="ficha-prep"><small>Grupo WhatsApp</small><strong>' + esc(prepGroup(person)) + '</strong></div>' +
        '<div class="ficha-prep"><small>Eklesia</small><strong>' + esc(prepEklesia(person)) + '</strong></div>' +
        '<div class="ficha-prep"><small>Camiseta</small><strong>' + esc(prepShirt(person)) + '</strong></div>' +
      '</div></div>' +
      '<div class="card"><b>Jornada e pendências</b><div class="data-field-grid">' +
        '<div class="data-field"><small>Status da jornada</small><strong>' + esc(display(person.journey)) + '</strong></div>' +
        '<div class="data-field"><small>Aulas / reposição</small><strong>' + esc(display(person.lesson)) + '</strong></div>' +
        '<div class="data-field"><small>Pendências</small><strong>' + esc(display(person.pending)) + '</strong></div>' +
        '<div class="data-field"><small>Observações / perfil</small><strong>' + esc(display(person.profile)) + '</strong></div>' +
      '</div></div>' +
      '<div class="card"><b>Todos os campos da planilha</b><div class="data-field-grid">' + fields.map(function (field) { return '<div class="data-field"><small>' + esc(field[0]) + '</small><strong>' + esc(display(field[1])) + '</strong></div>'; }).join('') + '</div></div>' +
      '<div class="bb"><button type="button" class="btn o" data-go="pes">← Voltar para Batizantes</button><button type="button" class="btn" data-edit-person="' + esc(person.sourceRow) + '">Editar cadastro</button></div>';
  }
'''
pattern_fiche = re.compile(r'  function buildFiche\(person\) \{.*?\n  \}\n\n  function openRecordEditor', re.S)
text, count = pattern_fiche.subn('  ' + new_fiche + '\n  function openRecordEditor', text, count=1)
if count != 1:
    raise SystemExit('Não foi possível localizar buildFiche para a V1.')

# Ficha por teclado sem alterar a autenticação.
keyboard = r'''
<script>
(function(){
  document.addEventListener('keydown', function(event){
    var item = event.target.closest && event.target.closest('#pes .batizante-item[data-open-person]');
    if (!item || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.target.closest('button')) return;
    event.preventDefault();
    var button = item.querySelector('[data-open-person]');
    if (button) button.click();
  });
})();
</script>
'''
if 'id="batizantes-v1-keyboard"' not in text:
    keyboard = keyboard.replace('<script>', '<script id="batizantes-v1-keyboard">', 1)
    text = text.replace('</body>', keyboard + '\n</body>', 1)

# A prova final: Auth continua byte a byte idêntico à main.
if auth_module(text) != main_auth:
    raise SystemExit('BLOQUEADO: a transformação alterou o módulo Google/Firebase Auth.')

PATH.write_text(text, encoding='utf-8')
print('V1 Batizantes aplicada com proteção Auth ativa.')
print('Auth: idêntico à main.')
PY
from pathlib import Path
import re
import hashlib

path = Path('index.html')
text = path.read_text(encoding='utf-8')


def firebase_module(value):
    match = re.search(r'<script type="module">.*?</script>', value, flags=re.S)
    if not match:
        raise SystemExit('FALHA: módulo Firebase/Google não encontrado')
    return match.group(0)


def module_hash(value):
    return hashlib.sha256(firebase_module(value).encode('utf-8')).hexdigest()

before_hash = module_hash(text)
module = firebase_module(text)
for required in (
    'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js',
    'signInWithPopup',
    'signInWithRedirect',
    'getRedirectResult',
):
    if required not in module:
        raise SystemExit('FALHA: proteção Google ausente: ' + required)

css = '''\n<style id="batizantes-order-operacional-v1">\n.order-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-top:10px}\n.order-kpi{background:var(--card);border:1px solid var(--ln);border-radius:13px;padding:12px;min-width:0}\n.order-kpi span{display:block;color:var(--mut);font-size:11px;line-height:1.35}\n.order-kpi strong{display:block;font-size:24px;line-height:1.1;margin-top:5px;font-variant-numeric:tabular-nums}\n.order-kpi.is-present strong{color:#49b86b}.order-kpi.is-baptized strong{color:#4d8dff}.order-kpi.is-eklesia strong{color:#a98aff}.order-kpi.is-unbaptized strong{color:var(--pe)}.order-kpi.is-pending strong{color:var(--er)}\n@media(max-width:1050px){.order-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n@media(max-width:600px){.order-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.order-kpi{padding:10px}.order-kpi strong{font-size:21px}.order-status-actions{width:100%}}\n</style>\n'''
if 'id="batizantes-order-operacional-v1"' not in text:
    text = text.replace('</head>', css + '</head>', 1)

text = text.replace('Ekklesia', 'Eklesia')

old_operation = '<div class="card order-operation-card"><b>Operação do batismo</b><p class="section-sub">Arraste para reorganizar. Marque Presente, Batizado e Incluído no Eklesia diretamente nesta lista.</p></div>'
new_operation = '<div class="card order-operation-card"><b>Operação do batismo</b><p class="section-sub">Arraste para reorganizar. Marque Presente, Batizado e Incluído no Eklesia diretamente nesta lista.</p><div id="order-kpis" class="order-kpi-grid" aria-label="Resumo operacional da turma"></div></div>'
if old_operation not in text:
    raise SystemExit('FALHA: bloco da operação da Ordem não encontrado')
text = text.replace(old_operation, new_operation, 1)

old_baptism = '''        if (marks.batizado) {\n          statusActions += '<button class="btn g" data-checkin="batizado" data-checkin-id="' + esc(dayId(r)) + '" data-order-row="' + esc(r.sourceRow) + '">✓ Batizado</button>';\n        }\n        \n        statusActions += '<button class="btn ' + (eklesiaMarked ? 'g' : 'o') + '" data-checkin="eklesia" data-checkin-id="' + esc(dayId(r)) + '" data-order-row="' + esc(r.sourceRow) + '">' + (eklesiaMarked ? '✓ Incluído no Eklesia' : 'Incluído no Eklesia') + '</button>';'''
new_baptism = '''        statusActions += '<button class="btn ' + (marks.batizado ? 'g' : 'o') + '" data-checkin="batizado" data-checkin-id="' + esc(dayId(r)) + '" data-order-row="' + esc(r.sourceRow) + '">' + (marks.batizado ? '✓ Batizado' : 'Não batizado') + '</button>';\n        \n        statusActions += '<button class="btn ' + (eklesiaMarked ? 'g' : 'o') + '" data-checkin="eklesia" data-checkin-id="' + esc(dayId(r)) + '" data-order-row="' + esc(r.sourceRow) + '">' + (eklesiaMarked ? '✓ Incluído no Eklesia' : 'Incluído no Eklesia') + '</button>';'''
if old_baptism not in text:
    raise SystemExit('FALHA: bloco de Batizado não encontrado')
text = text.replace(old_baptism, new_baptism, 1)

old_summary = "    document.getElementById('order-count').innerHTML='<span>'+numberLabel(items.length)+' posições · '+numberLabel(named)+' com nome</span><span class=\"order-live-summary\"><b>'+present+'</b> presentes · <b>'+baptized+'</b> batizados · <b>'+eklesia+'</b> no Eklesia</span>';"
new_summary = "    var pending=allOrder.filter(function(r){var p=personForDay(r);return p&&hasPendingSignal(p);}).length;\n    var unbaptized=Math.max(0,total-baptized);\n    var kpiHost=document.getElementById('order-kpis');\n    if(kpiHost){kpiHost.innerHTML='<div class=\"order-kpi\"><span>Total de batizantes</span><strong>'+numberLabel(total)+'</strong></div><div class=\"order-kpi is-present\"><span>Presentes</span><strong>'+numberLabel(present)+'</strong></div><div class=\"order-kpi is-baptized\"><span>Batizados</span><strong>'+numberLabel(baptized)+'</strong></div><div class=\"order-kpi is-eklesia\"><span>Incluídos no Eklesia</span><strong>'+numberLabel(eklesia)+'</strong></div><div class=\"order-kpi is-unbaptized\"><span>Não batizados</span><strong>'+numberLabel(unbaptized)+'</strong></div><div class=\"order-kpi is-pending\"><span>Pendências</span><strong>'+numberLabel(pending)+'</strong></div>';}\n    document.getElementById('order-count').innerHTML='<span>'+numberLabel(items.length)+' posições · '+numberLabel(named)+' com nome</span>';"
if old_summary not in text:
    raise SystemExit('FALHA: resumo da Ordem não encontrado')
text = text.replace(old_summary, new_summary, 1)

if re.search(r'<nav id="nav"[^>]*>[\s\S]*?data-s="dia"', text):
    raise SystemExit('FALHA: Dia do Batismo voltou para a navegação')

if 'id="order-kpis"' not in text or 'Não batizado' not in text or 'data-checkin="eklesia"' not in text:
    raise SystemExit('FALHA: alterações da Ordem não foram aplicadas')

after_hash = module_hash(text)
if before_hash != after_hash:
    raise SystemExit('FALHA CRÍTICA: módulo Firebase/Google foi alterado')

path.write_text(text, encoding='utf-8')
print('OK: atualização da Ordem aplicada; módulo Google preservado por hash', before_hash)

from pathlib import Path
import hashlib
import re
import subprocess


def module_hash(value):
    match = re.search(r'<script type="module">.*?</script>', value, flags=re.S)
    if not match:
        raise SystemExit('FALHA: módulo Firebase/Google não encontrado')
    return hashlib.sha256(match.group(0).encode('utf-8')).hexdigest(), match.group(0)

current = Path('index.html').read_text(encoding='utf-8')
base = subprocess.check_output(['git', 'show', 'origin/main:index.html'], text=True)
current_hash, current_module = module_hash(current)
base_hash, base_module = module_hash(base)
if current_hash != base_hash:
    raise SystemExit('FALHA CRÍTICA: o módulo Firebase/Google foi alterado. A prévia será interrompida.')
for required in (
    'firebasejs/12.19.0/firebase-app.js',
    'firebasejs/12.19.0/firebase-auth.js',
    'signInWithPopup',
    'signInWithRedirect',
    'getRedirectResult',
):
    if required not in current_module:
        raise SystemExit('FALHA: requisito Google ausente: ' + required)
print('OK: módulo Firebase/Google idêntico ao main:', current_hash)

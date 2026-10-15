from pathlib import Path
import subprocess

GOOD = "5c02803d0996a399055864b87a9bac4cf77cba8d"
INDEX = Path("index.html")

current = INDEX.read_text(encoding="utf-8")
good = subprocess.check_output(["git", "show", GOOD + ":index.html"], text=True)

# A V8 aprovada preserva a camada visual/HTML, mas o index publicado ficou
# truncado no início do módulo Firebase. O módulo contém autenticação,
# Firestore e persistência, portanto não é seguro tentar reconstruí-lo por
# pequenos trechos.
module_marker = '<script type="module">'
current_module_start = current.rfind(module_marker)
good_module_start = good.rfind(module_marker)
if current_module_start < 0 or good_module_start < 0:
    raise SystemExit("Módulo Firebase não localizado nas versões comparadas.")

# O módulo estável é a implementação completa que funcionava antes da V8.
# Substituímos somente o módulo Firebase, mantendo integralmente o HTML/CSS e
# o primeiro script da V8, inclusive a Ordem com arrastar e soltar.
good_module = good[good_module_start:]
if 'firebasejs/12.19.0/firebase-auth.js' not in good_module:
    raise SystemExit("A versão estável não contém Firebase Auth 12.19.0.")
if 'getRedirectResult' not in good_module or 'signInWithRedirect' not in good_module:
    raise SystemExit("A versão estável não contém o fluxo Google por redirect.")
if 'signInWithPopup' not in good_module:
    raise SystemExit("A versão estável não contém o fluxo Google por popup.")

current = current[:current_module_start] + good_module

# Provas de que a camada V8 não foi trocada junto com o módulo.
required_v8_markers = [
    'var draggedOrderKey = null;',
    'data-order-key',
    'order-dragging',
    'firebase-google-login'
]
missing_v8 = [marker for marker in required_v8_markers if marker not in current]
if missing_v8:
    raise SystemExit("A camada V8 perdeu marcadores essenciais: " + ", ".join(missing_v8))

INDEX.write_text(current, encoding="utf-8")
print("Módulo Firebase completo restaurado da versão estável", GOOD)

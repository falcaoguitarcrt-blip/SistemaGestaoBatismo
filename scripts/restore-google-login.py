from pathlib import Path
import subprocess

GOOD = "5c02803d0996a399055864b87a9bac4cf77cba8d"
INDEX = Path("index.html")

current = INDEX.read_text(encoding="utf-8")
good = subprocess.check_output(["git", "show", GOOD + ":index.html"], text=True)


def stable_import(text: str, filename: str) -> str:
    for line in text.splitlines():
        if filename in line and line.lstrip().startswith("import "):
            return line.strip()
    raise SystemExit(f"Import estável não encontrado: {filename}")


# Firebase deve permanecer na mesma versão da última versão estável.
lines = current.splitlines()
for filename in ("firebase-app.js", "firebase-auth.js", "firebase-firestore.js"):
    replacement = stable_import(good, filename)
    for index, line in enumerate(lines):
        if filename in line and line.lstrip().startswith("import "):
            lines[index] = replacement
            break
    else:
        raise SystemExit(f"Import atual não encontrado: {filename}")
current = "\n".join(lines) + ("\n" if current.endswith("\n") else "")


# Mantém o tratamento de erros da versão que estava funcionando.
stable_error_start = good.find("function explainAuthError(error) {")
stable_error_end = good.find("\nfunction safeValue(value) {", stable_error_start)
current_error_start = current.find("function explainAuthError(error) {")
current_error_end = current.find("\nfunction safeValue(value) {", current_error_start)
if min(stable_error_start, stable_error_end, current_error_start, current_error_end) < 0:
    raise SystemExit("Não foi possível localizar explainAuthError/safeValue.")
current = (
    current[:current_error_start]
    + good[stable_error_start:stable_error_end]
    + current[current_error_end:]
)


# A V8 já possui um handler Google. Em vez de reescrever esse handler e correr o
# risco de apagar outras funções, instalamos um listener em fase de captura.
# stopImmediatePropagation impede o handler antigo de abrir um segundo popup.
anchor = "const googleLoginButton = document.getElementById('firebase-google-login');"
if anchor not in current:
    raise SystemExit("Âncora do botão Google não encontrada.")

marker = "window.__stableGoogleAuthInstalled = true;"
if marker not in current:
    guard = '''window.__stableGoogleAuthInstalled = true;
const stableGoogleProvider = new GoogleAuthProvider();
const googleRedirectResultPromise = getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    setLoginStatus('Autenticação Google concluída. Carregando dados…');
    await handleAuthenticatedUser(result.user);
  }
  return result;
}).catch((error) => {
  lastAuthError = explainAuthError(error);
  if (error?.code !== 'auth/no-auth-event') setLoginStatus(lastAuthError, true);
  return null;
});

googleLoginButton.addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  setLoginStatus('Abrindo Google…');
  googleLoginButton.disabled = true;
  try {
    await googleRedirectResultPromise;
    const result = await signInWithPopup(auth, stableGoogleProvider);
    await handleAuthenticatedUser(result.user);
  } catch (error) {
    const code = error && error.code ? error.code : '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        setLoginStatus('Redirecionando para o Google…');
        await signInWithRedirect(auth, stableGoogleProvider);
        return;
      } catch (redirectError) {
        lastAuthError = explainAuthError(redirectError);
        setLoginStatus(lastAuthError, true);
      }
    } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
      lastAuthError = explainAuthError(error);
      setLoginStatus(lastAuthError, true);
    }
  } finally {
    googleLoginButton.disabled = false;
  }
}, true);
'''
    current = current.replace(anchor, anchor + "\n" + guard, 1)

required = [
    "firebasejs/12.19.0/firebase-app.js",
    "firebasejs/12.19.0/firebase-auth.js",
    "firebasejs/12.19.0/firebase-firestore.js",
    "getRedirectResult",
    "signInWithRedirect",
    marker,
    "googleLoginButton.addEventListener('click', async function (event)",
]
missing = [item for item in required if item not in current]
if missing:
    raise SystemExit("Correção Google incompleta: " + ", ".join(missing))

INDEX.write_text(current, encoding="utf-8")
print("Google Login restaurado a partir da versão estável", GOOD)

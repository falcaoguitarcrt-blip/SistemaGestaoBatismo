import { auth, firebaseConfigurado } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form = document.querySelector("#loginForm");
const message = document.querySelector("#authMessage");
const loginButton = document.querySelector("#loginButton");
const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = type ? `message ${type}` : "message";
}
function setBusy(busy) {
  loginButton.disabled = busy;
  loginButton.textContent = busy ? "Aguarde..." : "Entrar com segurança";
}

document.querySelector("#togglePassword").addEventListener("click", (event) => {
  const input = document.querySelector("#password");
  const visible = input.type === "password";
  input.type = visible ? "text" : "password";
  event.currentTarget.textContent = visible ? "Ocultar" : "Mostrar";
  event.currentTarget.setAttribute("aria-pressed", String(visible));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!firebaseConfigurado || !auth) {
    showMessage("O Firebase ainda não foi configurado. Siga o guia em etapa1/README.md.");
    return;
  }
  setBusy(true);
  showMessage("");
  try {
    await signInWithEmailAndPassword(auth, form.email.value.trim(), form.password.value);
    showMessage("Acesso confirmado.", "success");
  } catch (error) {
    // Não revelar detalhes técnicos nem confirmar se um e-mail existe.
    const messages = {
      "auth/invalid-credential": "E-mail ou senha não conferem.",
      "auth/invalid-email": "Confira o formato do e-mail.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
      "auth/network-request-failed": "Sem conexão. Verifique a internet e tente novamente."
    };
    showMessage(messages[error.code] || "Não foi possível entrar. Confira seus dados ou fale com a administração.");
  } finally {
    setBusy(false);
  }
});

document.querySelector("#resetPassword").addEventListener("click", async () => {
  if (!firebaseConfigurado || !auth) {
    showMessage("Configure o Firebase primeiro, conforme etapa1/README.md.");
    return;
  }
  const email = document.querySelector("#email").value.trim();
  if (!email) {
    showMessage("Digite seu e-mail acima para solicitar a recuperação.");
    document.querySelector("#email").focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Se o endereço estiver cadastrado, você receberá as instruções de recuperação.", "success");
  } catch {
    showMessage("Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.");
  }
});

if (auth) onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.hidden = true;
    dashboardView.hidden = false;
    document.querySelector("#userLine").textContent = user.email || "Usuário autenticado";
  } else {
    loginView.hidden = false;
    dashboardView.hidden = true;
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  if (!auth) return;
  try { await signOut(auth); }
  catch { showMessage("Não foi possível encerrar a sessão. Tente novamente."); }
});

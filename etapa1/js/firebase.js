// Fundação do Firebase. Configure os dados do seu projeto somente neste arquivo.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PREENCHER_COM_API_KEY_DO_PROJETO",
  authDomain: "PREENCHER_COM_AUTH_DOMAIN",
  projectId: "PREENCHER_COM_PROJECT_ID",
  appId: "PREENCHER_COM_APP_ID"
};

export const firebaseConfigurado = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0 && !value.startsWith("PREENCHER_")
);

let app = null;
let auth = null;
let db = null;

if (firebaseConfigurado) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

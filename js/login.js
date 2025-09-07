import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlPTVvP5rzT5roLZ1ZH2jx1T3rWoWkkxc",
  authDomain: "theweatherthebetterproj.firebaseapp.com",
  databaseURL: "https://theweatherthebetterproj-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "theweatherthebetterproj",
  storageBucket: "theweatherthebetterproj.appspot.com",
  messagingSenderId: "382904854538",
  appId: "1:382904854538:web:7b60d55776b44db61cd7f3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

loginBtn.addEventListener("click", async () => {
  errorMsg.textContent = ""; // clear previous errors
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    errorMsg.textContent = "Please enter both email and password.";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in as:", userCredential.user.email);
    // Redirect to main app page
    window.location.href = "wthrapp2.html";
  } catch (error) {
    errorMsg.textContent = error.message;
    console.error(error);
  }
});

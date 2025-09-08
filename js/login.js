import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlPTVvP5rzT5roLZ1ZH2jx1T3rWoWkkxc",
  authDomain: "theweatherthebetterproj.firebaseapp.com",
  projectId: "theweatherthebetterproj",
  storageBucket: "theweatherthebetterproj.appspot.com",
  messagingSenderId: "382904854538",
  appId: "1:382904854538:web:7b60d55776b44db61cd7f3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Email/password login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "wthrapp2.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Google login
document.getElementById("googleLogin").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "wthrapp2.html";
  } catch (error) {
    console.error("Google login error:", error);
    alert("Google login failed: " + error.message);
  }
});



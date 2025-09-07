    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

    // Email/password sign up
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
        window.location.href = "wthrapp2.html";
      } catch (error) {
        alert("Error: " + error.message);
      }
    });

    // Google sign up
    document.getElementById("googleSignup").addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        window.location.href = "wthrapp2.html";
      } catch (error) {
        console.error("Google sign-up error:", error);
        alert("Google sign-up failed: " + error.message);
      }
    });

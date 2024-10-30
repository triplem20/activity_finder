        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword ,signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
        import { getDatabase, ref, set, update,get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

          const firebaseConfig = {
    //
  };


        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        
        // Use window.onload to ensure the DOM is fully loaded
        window.onload = function() {
            const user = auth.currentUser;

        
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log("User is signed in:", user);
                    setupUserDetails(user.uid); 
                } else {
                    console.log("No user is signed in.");
                    
                    window.location.href = "../HTMLS/login.html";
                }
            });
        
            const loginForm = document.getElementById("loginForm");
            const registerForm = document.getElementById("registerForm"); 
            if (loginForm) {
                loginForm.addEventListener("submit", login);
            } else {
                console.error("Login form not found!");
            }
        
            if (registerForm) { 
                registerForm.addEventListener("submit", register);
            } else {
                console.error("Register form not found!");
            }
        
            async function login(event) {
                event.preventDefault();
        
                try {
                    const email = document.getElementById("lemail").value;
                    const password = document.getElementById("lpassword").value;
        
                    if (!validate_email(email) || !validate_password(password)) {
                        alert("Invalid email or password");
                        return;
                    }
        
                    if (!validate_field(email) || !validate_field(password)) {
                        alert("Please fill all the fields");
                        return;
                    }
        
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
        
                    const user_data = {
                        lastLogin: Date.now()
                    };
        
                    await update(ref(database, 'users/' + user.uid), user_data);
                    
                    window.location.href = "../HTMLS/ActivityFinder.html";
                    alert("Welcome");
        
                } catch (error) {
                    console.error("Error during login:", error);
                    alert(error.message);
                }
            }
        
            async function register(event) {
                event.preventDefault(); 
                try {
                    const email = document.getElementById("email").value; 
                    const userName = document.getElementById("username").value; 
                    const password = document.getElementById("password").value; 
        
                    if (!validate_email(email) || !validate_password(password)) {
                        alert("Invalid email or password");
                        return;
                    }
        
                    if (!validate_field(userName)) {
                        alert("Please fill all the fields");
                        return;
                    }
        
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
        
                    const user_data = {
                        email: email,
                        userName: userName,
                        lastLogin: Date.now()
                    };
        
                    await set(ref(database, 'users/' + user.uid), user_data);
                    window.location.href = "../HTMLS/ActivityFinder.html";
                    alert("User Created!");
                } catch (error) {
                    console.error("Error during registration:", error);
                    alert(error.message);
                }
            }
        
            // Validation functions
            function validate_email(email) {
                const expressions = /^[^@]+@\w+(\.\w+)+\w$/; 
                return expressions.test(email); 
            }
        
            function validate_password(password) {
                return password.length > 6; 
            }
        
            function validate_field(field) {
                return field && field.length > 0; 
            }
        };
        function setupUserDetails(userId) {
            const db = getDatabase();
            const userRef = ref(db, 'users/' + userId); 
        
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val(); 
        
                    
                    const usernameDisplay = document.getElementById('usernameDisplay');
                    const userEmail = document.getElementById('userEmaild');
                    const userName = document.getElementById('userNamed');
                    const userCity = document.getElementById('userCity');
        
                    
                    usernameDisplay.innerText = `Welcome, ${userData.userName || user.email}!`;
                    userEmail.innerText = userData.email; 
                    userName.innerText = userData.userName || 'Not specified'; 
                    userCity.innerText = userData.city || 'Not specified'; 
                } else {
                    console.log("No user data available");
                }
            }).catch((error) => {
                console.error("Error fetching user data:", error);
            });
        }
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged , signOut} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set, update, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const firebaseConfig = {
   
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

function signOutUser() {
    signOut(auth).then(() => {
       
        window.location.href = "../HTMLS/loginpage.html"; 
    }).catch((error) => {
        console.error("Error signing out:", error);
        alert("Sign-out failed. Please try again.");
    });
}


// Ensure the DOM is fully loaded before running Firebase auth state check
document.addEventListener("DOMContentLoaded", function () {

   
    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
        
        if (user) {
            console.log("User is signed in:", user);
            if (currentPath.endsWith("loginpage.html")) {
                window.location.href = "../HTMLS/ActivityFinder.html"; 
            } else {
                setupUserDetails(user.uid); 
            }
        } else {
            
            console.log("User is signed out");
            if (!currentPath.endsWith("loginpage.html")) {
                window.location.href = "../HTMLS/loginpage.html"; 
            
            clearUserDetails();
        }
    }
});

    const signOutButton = document.getElementById("signOutButton");
    if (signOutButton) {
        signOutButton.addEventListener("click", signOutUser);
    }
    
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
    } else {
        console.error("Login form not found!");
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", register);
    } else {
        console.error("Register form not found!");
    }
});

// Login function
async function login(event) {
    event.preventDefault();

    try {
        const email = document.getElementById("lemail").value;
        const password = document.getElementById("lpassword").value;

        if (!validate_email(email) || !validate_password(password)) {
            alert("Invalid email or password");
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update last login time in the database
        await update(ref(database, 'users/' + user.uid), { lastLogin: Date.now() });
        
        window.location.href = "../HTMLS/ActivityFinder.html";
        alert("Welcome");

    } catch (error) {
        console.error("Error during login:", error);
        alert(error.message);
    }
}

// Register function
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

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user details in the database
        await set(ref(database, 'users/' + user.uid), {
            email: email,
            userName: userName,
            lastLogin: Date.now()
        });
        
        window.location.href = "../HTMLS/ActivityFinder.html";
        alert("User Created!");

    } catch (error) {
        console.error("Error during registration:", error);
        alert(error.message);
    }
}

// Setup user details function
function setupUserDetails(userId) {
    const userRef = ref(database, 'users/' + userId);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();

            // Display user data if elements are found
            const usernameDisplay = document.getElementById('usernameDisplay');
            const userEmail = document.getElementById('userEmaild');
            const userName = document.getElementById('userNamed');
            const userCity = document.getElementById('userCity');

            if (usernameDisplay) usernameDisplay.innerText = `Welcome, ${userData.userName || 'User'}!`;
            if (userEmail) userEmail.innerText = userData.email;
            if (userName) userName.innerText = userData.userName || 'Not specified';
            if (userCity) userCity.innerText = userData.city || 'Not specified';
        } else {
            console.log("No user data available");
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
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
function clearUserDetails() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userEmail = document.getElementById('userEmaild');
    const userName = document.getElementById('userNamed');
    const userCity = document.getElementById('userCity');

    if (usernameDisplay) usernameDisplay.innerText = '';
    if (userEmail) userEmail.innerText = '';
    if (userName) userName.innerText = '';
    if (userCity) userCity.innerText = '';
}



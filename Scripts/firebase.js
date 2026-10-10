import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged , signOut} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set, update, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";




const firebaseConfig = {
    apiKey: "AIzaSyAOw7Sa_qlc4k9ITwZmD-CTtSnyZeXs-jg",
    authDomain: "activity-finder-a789b.firebaseapp.com",
    projectId: "activity-finder-a789b",
    storageBucket: "activity-finder-a789b.appspot.com",
    messagingSenderId: "1005086000503",
    appId: "1:1005086000503:web:91ebeeaa3a059a31a84d72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);






// Ensure the DOM is fully loaded before running Firebase auth state check
document.addEventListener("DOMContentLoaded", function () {
    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
    
        if (user) {
            console.log("User is signed in:", user);
           
            if (currentPath.endsWith("loginpage.html") || currentPath.endsWith("registerpage.html")) {
                window.location.href = "../HTMLS/ActivityFinder.html"; 
                console.log("User UID:", user.uid); 
               
            } else{
                setupUserDetails(user.uid);
            }
        } else {
            console.log("User is signed out");
           
            if (!currentPath.endsWith("loginpage.html") && !currentPath.endsWith("registerpage.html")) {
                window.location.href = "../HTMLS/loginpage.html"; 
            } else {
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
async function register(e) {
    e.preventDefault();

   
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
       
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user; 
        
        await set(ref(database, 'users/' + user.uid), {
        
            email: email,
            created_at: Date.now()
        });

        
        window.location.href = "../HTMLS/ActivityFinder.html";
        alert("Welcome");
    } catch (error) {
        
        console.error("Error during registration:", error);
        alert("Registration failed: " + error.message);
    }
}






function setupUserDetails(userId) {
    const userRef = ref(database, 'users/' + userId);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("User Data:", userData); 

            // Display user data
            const usernameDisplay = document.getElementById('usernameDisplay');
            const userEmail = document.getElementById('userEmaild');
            const userName = document.getElementById('userNamed');
            const userCity = document.getElementById('userCity');

            // Display values
            if (usernameDisplay) usernameDisplay.innerText = `Welcome, ${userData.userName || 'User'}!`;
            if (userEmail) userEmail.innerText = userData.email || 'Not specified';
            if (userName) userName.innerText = userData.userName || 'Not specified';
            if (userCity) userCity.innerText = userData.city || 'Not specified';
        } else {
            console.log("No user data available for userId:", userId);
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}

function clearUserDetails() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userName = document.getElementById('userNamed');
    const userCity = document.getElementById('cityName');

    if (usernameDisplay) usernameDisplay.innerText = '';
    if (userName) userName.innerText = '';
    if (userCity) userCity.innerText = '';
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

// Edit and Save
document.addEventListener("DOMContentLoaded", () => {
        const editButton = document.getElementById("edit-btn");
        const saveButton = document.getElementById("saveButton");
        const userNamed = document.getElementById("userNamed");
        const userCity = document.getElementById("cityName");
    
        
        if (editButton) {
            editButton.addEventListener("click", () => {
               
                userNamed.contentEditable = "true";
                userCity.contentEditable = "true";
    
               
                userNamed.classList.add("editable");
                userCity.classList.add("editable");
    
               
                editButton.style.display = "none";
                saveButton.style.display = "block";
            });
        } else {
            console.error("Edit button not found!");
        }
    
        
        if (saveButton) {
            saveButton.addEventListener("click", () => {
                // Retrieve updated values
                const name = userNamed.innerText.trim();
                const city = userCity.innerText.trim();
    
                // Prepare updated user data
                const updatedUserData = {};
                if (name) updatedUserData.name = name;
                if (city) updatedUserData.city = city;
    
               
                const userId = auth.currentUser.uid; 
                const userRef = ref(database, `users/${userId}`);
    
               
                if (Object.keys(updatedUserData).length > 0) {
                    update(userRef, updatedUserData)
                        .then(() => {
                            
                            userNamed.contentEditable = "false";
                            userCity.contentEditable = "false";
    
                            userNamed.classList.remove("editable");
                            userCity.classList.remove("editable");
    
                            
                            saveButton.style.display = "none";
                            editButton.style.display = "block";
    
                            alert("User details updated successfully!");
                        })
                        .catch((error) => {
                            console.error("Error updating user details:", error);
                            alert("Update failed. Please try again.");
                        });
                } else {
                    alert("No data to update.");
                }
            });
        } else {
            console.error("Save button not found!");
        }
 });
// Sign Out Function
 async function signOutUser() {
    try {
        await getAuth().signOut();
        console.log("User signed out successfully.");
       
        window.location.href = "../HTMLS/login.html"; 
        
    } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
    }
}


// Add Activity

// Function to handle form submission for adding an activity
document.getElementById('activityForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get current user ID
    const userId = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;

    if (userId) {
        // Reference to the user in the database
        const userRef = database.ref('users/' + userId); // Adjust the path based on your structure

        try {
            // Fetch user data
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                console.log("User Data:", userData); 

                // Gather activity form data
                const activityName = document.getElementById('activityName').value;
                const activityLocation = document.getElementById('activityLocation').value;
                const activityType = document.getElementById('activityType').value;
                const startLocation = document.getElementById('startLocation') ? document.getElementById('startLocation').value : '';
                const endLocation = document.getElementById('endLocation') ? document.getElementById('endLocation').value : '';

                // Get the current date and time
                const createdAt = new Date().toISOString(); // ISO format for easier date parsing

                // Prepare the activity data to be saved
                const activityData = {
                    name: activityName,
                    location: activityLocation,
                    type: activityType,
                    startLocation: startLocation,
                    endLocation: endLocation,
                    username: userData.userName || 'Unknown User', // Use user name from fetched data
                    userId: userId,     // Add the user ID
                    createdAt: createdAt // Add the date of creation
                };

                // Save to Realtime Database
                await database.ref('activities').push(activityData);
                alert('Activity added successfully!');
                // Reset the form
                document.getElementById('activityForm').reset();
            } else {
                console.log("No user data available for userId:", userId);
            }
        } catch (error) {
            console.error("Error fetching user data or adding activity:", error);
        }
    } else {
        console.log('No user is signed in.'); // Alert user that they need to sign in
    }
});

    
 
  
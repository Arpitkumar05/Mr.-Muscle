import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAfKqzkvYzCSefuyrItBmJe8i4k5ZEupxk",
    authDomain: "mr-muscle-53f7b.firebaseapp.com",
    projectId: "mr-muscle-53f7b",
    storageBucket: "mr-muscle-53f7b.appspot.com",
    messagingSenderId: "876513171038",
    appId: "1:876513171038:web:7043e4133a4667406d86cf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
        messageDiv.style.opacity = 0;
    }, 5000);
}

function toggleButtonState(btn, isLoading) {
    btn.disabled = isLoading;
    btn.innerText = isLoading ? 'Processing...' : btn.dataset.defaultText;
}

// Sign Up (Email/Password)
const signUp = document.getElementById('submitSignUp');
signUp.dataset.defaultText = "Sign Up";

signUp.addEventListener('click', (event) => {
    event.preventDefault();
    toggleButtonState(signUp, true);

    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email,
                firstName,
                lastName
            };
            const docRef = doc(db, "users", user.uid);
            return setDoc(docRef, userData);
        })
        .then(() => {
            showMessage('Account Created Successfully', 'signUpMessage');
            setTimeout(() => window.location.href = 'login.html', 2000);
        })
        .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
                showMessage('Email Address Already Exists!', 'signUpMessage');
            } else if (error.code === 'auth/weak-password') {
                showMessage('Password should be at least 6 characters', 'signUpMessage');
            } else {
                showMessage('Error: ' + error.message, 'signUpMessage');
            }
        })
        .finally(() => toggleButtonState(signUp, false));
});

// Sign In (Email/Password)
const signIn = document.getElementById('submitSignIn');
signIn.dataset.defaultText = "Sign In";

signIn.addEventListener('click', (event) => {
    event.preventDefault();
    toggleButtonState(signIn, true);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showMessage('Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', userCredential.user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                showMessage('Incorrect Email or Password', 'signInMessage');
            } else if (error.code === 'auth/user-not-found') {
                showMessage('Account does not exist', 'signInMessage');
            } else {
                showMessage('Error: ' + error.message, 'signInMessage');
            }
        })
        .finally(() => toggleButtonState(signIn, false));
});

// Google Sign-In
const googleBtn = document.getElementById('googleBtn');
const googleProvider = new GoogleAuthProvider();

googleBtn.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .then(async (result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Save user to Firestore if first time login
                await setDoc(docRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    provider: 'google'
                });
            }

            showMessage('Google Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            showMessage('Google Sign-In Error: ' + error.message, 'signInMessage');
        });
});

googleBtn.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .then(async (result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Save user to Firestore if first time login
                await setDoc(docRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    provider: 'google'
                });
            }

            showMessage('Google Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            if (error.code === 'auth/popup-closed-by-user') {
                alert('Popup closed before completing sign-in. Please try again.');
            } else {
                showMessage('Google Sign-In Error: ' + error.message, 'signInMessage');
            }
        });
});

 

// Facebook Sign-In
const fbBtn = document.getElementById('facebookBtn');
const fbProvider = new FacebookAuthProvider();

fbBtn.addEventListener('click', () => {
    signInWithPopup(auth, fbProvider)
        .then(async (result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    provider: 'facebook'
                });
            }

            showMessage('Facebook Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            showMessage('Facebook Sign-In Error: ' + error.message, 'signInMessage');
        });
});

// Google Sign-In for Sign In section
const googleBtnSignIn = document.getElementById('googleBtnSignIn');
googleBtnSignIn.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .then(async (result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    provider: 'google'
                });
            }

            showMessage('Google Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            if (error.code === 'auth/popup-closed-by-user') {
                alert('Popup closed before completing sign-in. Please try again.');
            } else {
                showMessage('Google Sign-In Error: ' + error.message, 'signInMessage');
            }
        });
});

// Facebook Sign-In for Sign In section
const facebookBtnSignIn = document.getElementById('facebookBtnSignIn');
facebookBtnSignIn.addEventListener('click', () => {
    signInWithPopup(auth, fbProvider)
        .then(async (result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    email: user.email,
                    displayName: user.displayName || '',
                    provider: 'facebook'
                });
            }

            showMessage('Facebook Login Successful', 'signInMessage');
            localStorage.setItem('loggedInUserId', user.uid);
            setTimeout(() => window.location.href = 'homepage.html', 2000);
        })
        .catch((error) => {
            if (error.code === 'auth/popup-closed-by-user') {
                alert('Popup closed before completing sign-in. Please try again.');
            } else {
                showMessage('Facebook Sign-In Error: ' + error.message, 'signInMessage');
            }
        });
});


// Dark mode toggle
const toggleBtn = document.querySelector('.toggle-darkmode');
toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = toggleBtn.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Password showing button


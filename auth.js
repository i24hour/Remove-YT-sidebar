// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVVQfZfxV0MxTkssBVe1sOlNaMNeQwgsA",
    authDomain: "planning-with-ai-65e91.firebaseapp.com",
    projectId: "planning-with-ai-65e91",
    storageBucket: "planning-with-ai-65e91.firebasestorage.app",
    messagingSenderId: "979284817946",
    appId: "1:979284817946:web:0838082e43180d2bc4f9a3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const verificationSection = document.getElementById('verificationSection');
const statusDiv = document.getElementById('status');

// Toggle between forms
document.getElementById('showLogin').addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    clearStatus();
});

document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    clearStatus();
});

// Show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = '';
}

// Validate inputs
function validateSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (!name || !email || !phone || !password || !confirm) {
        showStatus('All fields are required', 'error');
        return null;
    }

    if (name.length < 2) {
        showStatus('Please enter your full name', 'error');
        return null;
    }

    if (!email.includes('@')) {
        showStatus('Please enter a valid email', 'error');
        return null;
    }

    if (phone.length < 10) {
        showStatus('Please enter a valid phone number', 'error');
        return null;
    }

    if (password.length < 6) {
        showStatus('Password must be at least 6 characters', 'error');
        return null;
    }

    if (password !== confirm) {
        showStatus('Passwords do not match', 'error');
        return null;
    }

    return { name, email, phone, password };
}

// Sign Up
document.getElementById('signupBtn').addEventListener('click', async () => {
    const data = validateSignup();
    if (!data) return;

    const btn = document.getElementById('signupBtn');
    btn.disabled = true;
    btn.textContent = 'Creating Account...';

    try {
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
        const user = userCredential.user;

        // Save user data to Firestore
        await db.collection('users').doc(user.uid).set({
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Send verification email
        await user.sendEmailVerification();

        // Store locally for quick access
        await chrome.storage.local.set({
            userName: data.name,
            userPhone: data.phone,
            userEmail: data.email,
            userId: user.uid
        });

        // Show verification section
        signupForm.classList.add('hidden');
        verificationSection.classList.add('show');
        showStatus('Verification email sent!', 'success');

    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            showStatus('Email already registered. Please sign in.', 'error');
        } else {
            showStatus(error.message, 'error');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign Up';
    }
});

// Sign In
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showStatus('Email and password are required', 'error');
        return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing In...';

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            loginForm.classList.add('hidden');
            verificationSection.classList.add('show');
            showStatus('Please verify your email first', 'info');
            btn.disabled = false;
            btn.textContent = 'Sign In';
            return;
        }

        // Get user data from Firestore
        let userName = '';
        let userPhone = '';

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userName = userData.name || '';
                userPhone = userData.phone || '';
            }
        } catch (firestoreError) {
            console.warn('Firestore fetch failed:', firestoreError);
        }

        // Save to local storage
        await chrome.storage.local.set({
            userName: userName,
            userPhone: userPhone,
            userEmail: user.email,
            userId: user.uid,
            isAuthenticated: true
        });

        showStatus('Login successful!', 'success');

        // Redirect to main popup
        setTimeout(() => {
            window.location.href = 'popup.html';
        }, 500);

    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            showStatus('No account found with this email', 'error');
        } else if (error.code === 'auth/wrong-password') {
            showStatus('Incorrect password', 'error');
        } else {
            showStatus(error.message, 'error');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});

// Check if verified
document.getElementById('checkVerifiedBtn').addEventListener('click', async () => {
    const btn = document.getElementById('checkVerifiedBtn');
    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
        await auth.currentUser.reload();
        const user = auth.currentUser;

        if (user && user.emailVerified) {
            // Get stored data and ensure isAuthenticated is set
            const storedData = await chrome.storage.local.get(['userEmail', 'userPhone']);
            await chrome.storage.local.set({
                isAuthenticated: true,
                userEmail: storedData.userEmail || user.email,
                userId: user.uid
            });
            showStatus('Email verified! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'popup.html';
            }, 500);
        } else {
            showStatus('Email not verified yet. Please check your inbox.', 'info');
        }
    } catch (error) {
        console.error('Verification check error:', error);
        showStatus('Please sign in again', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = "I've Verified";
    }
});

// Resend verification email
document.getElementById('resendBtn').addEventListener('click', async () => {
    const btn = document.getElementById('resendBtn');
    btn.disabled = true;

    try {
        const user = auth.currentUser;
        if (user) {
            await user.sendEmailVerification();
            showStatus('Verification email resent!', 'success');
        } else {
            showStatus('Please sign up again', 'error');
        }
    } catch (error) {
        showStatus('Please wait before resending', 'error');
    } finally {
        btn.disabled = false;
    }
});

// Check auth state on load
auth.onAuthStateChanged(async (user) => {
    if (user && user.emailVerified) {
        // Already logged in and verified
        const authData = await chrome.storage.local.get(['isAuthenticated']);
        if (authData.isAuthenticated) {
            window.location.href = 'popup.html';
        }
    }
});

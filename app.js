// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA9kQtiCf4xEQovXwU4P70r58CVQP7rDk4",
    authDomain: "password-manager-56dec.firebaseapp.com",
    projectId: "password-manager-56dec",
    storageBucket: "password-manager-56dec.firebasestorage.app",
    messagingSenderId: "692499229625",
    appId: "1:692499229625:web:49dec23872c30fe5c02468",
    measurementId: "G-E4P9TLTTY7"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// UI Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const passwordForm = document.getElementById('password-form');
const cardList = document.getElementById('card-list');

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        loadPasswords();
    } else {
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        cardList.innerHTML = '';
    }
});

// Signup
signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            signupForm.reset();
        })
        .catch(err => alert(err.message));
});

// Login
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginForm.reset();
        })
        .catch(err => alert(err.message));
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Add Password
passwordForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const userid = document.getElementById('userid').value;
    const password = document.getElementById('password').value;
    const user = auth.currentUser;
    if (!user) return;
    db.collection('users').doc(user.uid).collection('passwords').add({
        title, userid, password
    }).then(() => {
        passwordForm.reset();
        loadPasswords();
    }).catch(err => alert(err.message));
});

// Load Passwords
let unsubscribePasswords = null;
function loadPasswords() {
    const user = auth.currentUser;
    if (!user) return;
    if (unsubscribePasswords) unsubscribePasswords();
    unsubscribePasswords = db.collection('users').doc(user.uid).collection('passwords')
        .onSnapshot(snapshot => {
            cardList.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = 'password-card';
                card.innerHTML = `
                    <div class="card-title">${data.title}</div>
                    <div class="card-userid"><strong>User ID:</strong> ${data.userid}</div>
                    <div class="card-password"><strong>Password:</strong> <span class="pw">${data.password}</span></div>
                    <div class="actions">
                        <button class="copy-id">Copy ID</button>
                        <button class="copy-pass">Copy Pass</button>
                        <button class="delete">Delete</button>
                    </div>
                `;
                // Copy ID button
                card.querySelector('.copy-id').onclick = function () {
                    navigator.clipboard.writeText(data.userid);
                    const btn = this;
                    const original = btn.textContent;
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = original;
                        btn.classList.remove('copied');
                    }, 1000);
                };
                // Copy Pass button
                card.querySelector('.copy-pass').onclick = function () {
                    navigator.clipboard.writeText(data.password);
                    const btn = this;
                    const original = btn.textContent;
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = original;
                        btn.classList.remove('copied');
                    }, 1000);
                };
                // Delete button
                card.querySelector('.delete').onclick = () => {
                    db.collection('users').doc(user.uid).collection('passwords').doc(doc.id).delete();
                };
                cardList.appendChild(card);
            });
        });
}

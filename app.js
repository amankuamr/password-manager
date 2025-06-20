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

document.addEventListener('DOMContentLoaded', function () {
    // UI Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const passwordForm = document.getElementById('password-form');
    const cardList = document.getElementById('card-list');
    // Modal Elements for Delete Confirmation
    const deleteModal = document.getElementById('delete-modal');
    const modalYes = document.getElementById('modal-yes');
    const modalNo = document.getElementById('modal-no');
    let pendingDelete = null;

    // Auth Section Switch Logic
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');
    const notSignedInMessage = document.getElementById('not-signed-in-message');
    document.getElementById('show-signup').onclick = function(e) {
        e.preventDefault();
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    };
    document.getElementById('show-login').onclick = function(e) {
        e.preventDefault();
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    };

    // Auth State Listener
    auth.onAuthStateChanged(user => {
        if (user) {
            notSignedInMessage.style.display = 'none';
            authSection.style.display = 'none';
            appSection.style.display = 'block';
            loadPasswords();
        } else {
            notSignedInMessage.style.display = 'none'; // Always hide unless triggered by login error
            authSection.style.display = 'block';
            appSection.style.display = 'none';
            cardList.innerHTML = '';
            // Always show login by default
            loginContainer.style.display = 'block';
            signupContainer.style.display = 'none';
        }
    });

    // Signup
    const signupBtn = document.getElementById('signup-btn');
    const signupLoading = document.getElementById('signup-loading');
    const signupError = document.getElementById('signup-error');
    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signupBtn.style.display = 'none';
        signupLoading.style.display = 'flex';
        signupError.style.display = 'none';
        signupError.textContent = '';
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                signupForm.reset();
            })
            .catch(err => {
                let msg = err.message.replace(/^Firebase:\s*/i, '');
                signupError.textContent = msg;
                signupError.style.display = 'block';
            })
            .finally(() => {
                signupBtn.style.display = 'block';
                signupLoading.style.display = 'none';
            });
    });

    // Login
    const loginBtn = document.getElementById('login-btn');
    const loginLoading = document.getElementById('login-loading');
    const loginError = document.getElementById('login-error');
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginBtn.disabled = true;
        loginLoading.style.display = 'flex';
        loginError.style.display = 'none';
        loginError.textContent = '';
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                loginForm.reset();
            })
            .catch(err => {
                let msg = err.message.replace(/^Firebase:\s*/i, '');
                if (err.code === 'auth/user-not-found') {
                    notSignedInMessage.style.display = 'block';
                    loginError.style.display = 'none';
                } else {
                    notSignedInMessage.style.display = 'none';
                    loginError.textContent = msg;
                    loginError.style.display = 'block';
                }
            })
            .finally(() => {
                loginBtn.disabled = false;
                loginLoading.style.display = 'none';
            });
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

    // Modal Logic for Delete Confirmation
    modalNo.onclick = () => {
        deleteModal.style.display = 'none';
        pendingDelete = null;
    };
    modalYes.onclick = () => {
        if (pendingDelete) {
            const { userId, docId } = pendingDelete;
            db.collection('users').doc(userId).collection('passwords').doc(docId).delete();
        }
        deleteModal.style.display = 'none';
        pendingDelete = null;
    };

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
                        pendingDelete = { userId: user.uid, docId: doc.id };
                        deleteModal.style.display = 'flex';
                    };
                    cardList.appendChild(card);
                });
            });
    }
});

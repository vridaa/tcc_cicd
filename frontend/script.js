const BASE_URL = "https://notes-be082-749281711221.us-central1.run.app";

const authSection = document.getElementById('auth-section');
const notesSection = document.getElementById('notes-section');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutButton = document.getElementById('logout-button');
const statusDiv = document.getElementById('status');

function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? 'red' : 'green';
    setTimeout(() => { statusDiv.textContent = ''; }, 3000);
}

function setAuthToken(token) {
    localStorage.setItem('jwtToken', token);
    checkAuthStatus();
}

function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

function removeAuthToken() {
    localStorage.removeItem('jwtToken');
    checkAuthStatus();
}

async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            setAuthToken(data.token);
            showStatus('Pendaftaran berhasil!');
        } else {
            showStatus(data.msg || 'Pendaftaran gagal.', true);
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showStatus('Terjadi kesalahan saat mendaftar.', true);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            setAuthToken(data.token);
            showStatus('Login berhasil!');
        } else {
            showStatus(data.msg || 'Login gagal.', true);
        }
    } catch (error) {
        console.error('Error during login:', error);
        showStatus('Terjadi kesalahan saat login.', true);
    }
}

function handleLogout() {
    removeAuthToken();
    showStatus('Anda telah logout.');
}

function checkAuthStatus() {
    const token = getAuthToken();
    if (token) {
        authSection.style.display = 'none';
        notesSection.style.display = 'block';
        getCatatan(); // Load notes if logged in
    } else {
        authSection.style.display = 'block';
        notesSection.style.display = 'none';
    }
}

// Event Listeners
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'block';
});

loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
logoutButton.addEventListener('click', handleLogout);

// Modify existing notes functions to include JWT token
document.getElementById("catatan-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const category = document.getElementById("category").value;
    if (!title || !content) return showStatus("Judul dan konten wajib diisi!", true);

    const token = getAuthToken();
    if (!token) { showStatus("Anda harus login untuk menambah catatan!", true); return; }

    await fetch(`${BASE_URL}/add-notes`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-auth-token": token
        },
        body: JSON.stringify({ title, content, category })
    });

    document.getElementById("catatan-form").reset();
    getCatatan();
});

async function getCatatan() {
    const token = getAuthToken();
    if (!token) { 
        showStatus("Anda harus login untuk melihat catatan!", true);
        renderNotesByCategory([]); // Clear notes if not logged in
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/notes`, {
            headers: { "x-auth-token": token }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || 'Gagal mengambil catatan.');
        }
        renderNotesByCategory(data);
    } catch (error) {
        console.error('Error fetching notes:', error);
        showStatus(error.message || 'Terjadi kesalahan saat mengambil catatan.', true);
        removeAuthToken(); // Token might be invalid, force logout
    }
}

function renderNotesByCategory(data) {
    const container = document.getElementById("catatan-by-category");
    container.innerHTML = "";

    const categories = ["tugas", "hutang", "kerja", "penting", "lainnya"];
    categories.forEach(cat => {
        const notes = data.filter(note => note.category === cat);
        if (notes.length > 0) {
            const section = document.createElement("div");
            section.innerHTML = `<h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
            notes.forEach(note => {
                const noteDiv = document.createElement("div");
                noteDiv.style.border = "1px solid #ccc";
                noteDiv.style.padding = "10px";
                noteDiv.style.margin = "5px 0";
                noteDiv.style.borderRadius = "6px";
                noteDiv.innerHTML = `
                    <strong>${note.title}</strong><br>
                    <em>${note.content}</em><br>
                    <button onclick="editCatatan(${note.id})">Edit</button>
                    <button onclick="deleteCatatan(${note.id})">Delete</button>
                `;
                section.appendChild(noteDiv);
            });
            container.appendChild(section);
        }
    });
}

async function deleteCatatan(id) {
    if (!confirm("Yakin ingin menghapus catatan ini?")) return;

    const token = getAuthToken();
    if (!token) { showStatus("Anda harus login untuk menghapus catatan!", true); return; }

    await fetch(`${BASE_URL}/delete-notes/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token }
    });
    getCatatan();
}

function editCatatan(id) {
    const token = getAuthToken();
    if (!token) { showStatus("Anda harus login untuk mengedit catatan!", true); return; }

    fetch(`${BASE_URL}/notes/${id}`, {
        headers: { "x-auth-token": token }
    })
        .then(response => response.json())
        .then(note => {
            document.getElementById("catatan-id").value = note.id;
            document.getElementById("title").value = note.title;
            document.getElementById("content").value = note.content;
            document.getElementById("category").value = note.category;
        })
        .catch(error => {
            console.error('Error fetching note for edit:', error);
            showStatus('Terjadi kesalahan saat mengambil catatan untuk diedit.', true);
        });
}

async function updateCatatan() {
    const id = document.getElementById("catatan-id").value;
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const category = document.getElementById("category").value;

    if (!id || !title || !content) return showStatus("Semua field wajib diisi!", true);

    const token = getAuthToken();
    if (!token) { showStatus("Anda harus login untuk memperbarui catatan!", true); return; }

    await fetch(`${BASE_URL}/edit-notes/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "x-auth-token": token
        },
        body: JSON.stringify({ title, content, category })
    });

    document.getElementById("catatan-form").reset();
    getCatatan();
}

// Initial check when the page loads
window.onload = checkAuthStatus;

// Expose functions to global scope if they are used in onclick attributes in index.html
window.editCatatan = editCatatan;
window.deleteCatatan = deleteCatatan;
window.updateCatatan = updateCatatan; 
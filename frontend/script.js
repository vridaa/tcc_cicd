const BASE_URL = 'http://localhost:4000'; // Ensure this is your backend URL

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

// Function to save token (access token now)
const saveToken = (token) => {
    localStorage.setItem('jwtToken', token);
};

// Function to get token (access token now)
const getToken = () => {
    return localStorage.getItem('jwtToken');
};

// Function to remove token
const removeToken = () => {
    localStorage.removeItem('jwtToken');
};

// Function to refresh access token
const refreshAccessToken = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Refresh token is sent automatically via cookie
        });

        if (!response.ok) {
            // If refresh fails, log out the user
            await logoutUser();
            throw new Error('Failed to refresh access token');
        }

        const data = await response.json();
        saveToken(data.token); // Save new access token
        return data.token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
};

// Generic fetch function with authentication and token refresh logic
const fetchWithAuth = async (url, options = {}) => {
    let token = getToken();

    if (token) {
        options.headers = {
            ...options.headers,
            'x-auth-token': token
        };
    }

    let response = await fetch(url, options);

    // If access token is expired (401), try to refresh it
    if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
            options.headers['x-auth-token'] = newAccessToken;
            response = await fetch(url, options); // Retry the original request with the new token
        } else {
            // If refresh failed, ensure user is logged out and redirect to login
            await logoutUser();
            return response; // Return the 401 response
        }
    }

    return response;
};

async function signupUser(username, password) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Signup failed');
        }

        saveToken(data.token); // Save the access token
        checkAuthAndRender();
        alert('Signup successful!');

    } catch (error) {
        console.error('Error during signup:', error);
        alert(error.message);
    }
}

// Login User
const loginUser = async (username, password) => {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Login failed');
        }

        saveToken(data.token); // Save the access token
        checkAuthAndRender();
        alert('Login successful!');

    } catch (error) {
        console.error('Error during login:', error);
        alert(error.message);
    }
};

// Logout User
const logoutUser = async () => {
    try {
        // Invalidate refresh token on the server
        await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Refresh token cookie will be sent automatically
        });

        removeToken(); // Remove access token from local storage
        checkAuthAndRender();
        alert('Logged out successfully!');
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Logout failed, but token cleared locally.');
        removeToken(); // Ensure token is cleared locally even if server logout fails
        checkAuthAndRender();
    }
};

function checkAuthStatus() {
    const token = getToken();
    if (token) {
        authSection.style.display = 'none';
        notesSection.style.display = 'block';
        document.getElementById('logout-button').style.display = 'block';
        getCatatan(); // Load notes if authenticated
    } else {
        authSection.style.display = 'block';
        notesSection.style.display = 'none';
        document.getElementById('logout-button').style.display = 'none';
        notesList.innerHTML = ''; // Clear notes if not authenticated
    }
}

// Add Catatan
async function addCatatan(event) {
    event.preventDefault();
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;

    if (!title || !content) return alert("Judul dan konten wajib diisi!");

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to add note');
        }

        alert('Catatan berhasil ditambahkan!');
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        getCatatan();
    } catch (error) {
        console.error('Error adding note:', error);
        alert(error.message);
    }
}

// Get Catatan
async function getCatatan() {
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/notes`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to fetch notes');
        }

        notesList.innerHTML = ''; // Clear current notes
        data.forEach(note => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <button onclick="editCatatan(${note.id})">Edit</button>
                <button onclick="deleteCatatan(${note.id})">Delete</button>
            `;
            notesList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        alert(error.message);
    }
}

// Delete Catatan
async function deleteCatatan(id) {
    if (!confirm("Yakin ingin menghapus catatan ini?")) return;

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/notes/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.msg || 'Failed to delete note');
        }

        alert('Catatan berhasil dihapus!');
        getCatatan();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert(error.message);
    }
}

// Edit Catatan (Populate form)
async function editCatatan(id) {
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/notes/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to fetch note for editing');
        }

        document.getElementById('edit-note-id').value = data.id;
        document.getElementById('edit-note-title').value = data.title;
        document.getElementById('edit-note-content').value = data.content;
        document.getElementById('edit-note-modal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching note for editing:', error);
        alert(error.message);
    }
}

// Update Catatan (Submit form)
async function updateCatatan() {
    const id = document.getElementById('edit-note-id').value;
    const title = document.getElementById('edit-note-title').value;
    const content = document.getElementById('edit-note-content').value;

    if (!id || !title || !content) return alert("Semua field wajib diisi!");

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to update note');
        }

        alert('Catatan berhasil diperbarui!');
        document.getElementById('edit-note-modal').style.display = 'none';
        getCatatan();
    } catch (error) {
        console.error('Error updating note:', error);
        alert(error.message);
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

document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    await signupUser(username, password);
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    await loginUser(username, password);
});

document.getElementById('logout-button').addEventListener('click', logoutUser);
document.getElementById('add-note-form').addEventListener('submit', addCatatan);
document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-note-modal').style.display = 'none';
});

// Initial check on page load
const checkAuthAndRender = () => {
    checkAuthStatus();
    getCatatan();
}; 
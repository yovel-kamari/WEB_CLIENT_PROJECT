// Get current user from sessionStorage
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

// Get auth token from sessionStorage
function getToken() {
    return sessionStorage.getItem("token");
}

// Redirect to login if not authenticated
function requireAuth() {
    const token = getToken();

    if (!currentUser || !token) {
        window.location.href = "login.html";
    }
}

// Render user info in header
function renderUserHeader() {
    if (!currentUser) return;

    const nameEl = document.getElementById("headerUsername");
    const imgEl = document.getElementById("headerUserImage");

    if (nameEl && imgEl) {
        nameEl.textContent = currentUser.fullName;
        imgEl.src = currentUser.imageUrl;
    }
}

// Fetch wrapper with Authorization header
async function authFetch(url, options = {}) {
    const token = getToken();

    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
}

// Logout helper
async function logout() {
    await authFetch("http://localhost:3000/api/logout", {
        method: "POST"
    });

    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("token");

    window.location.href = "login.html";
}

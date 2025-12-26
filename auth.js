// Get current user from sessionStorage
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

// Redirect to login if not authenticated
function requireAuth() {
    if (!currentUser) {
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

const API_URL = "http://localhost:5000/api";

function getToken() {
    return localStorage.getItem("token");
}

async function apiRequest(url, options = {}) {

    const response = await fetch(
        `${API_URL}${url}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
                ...(options.headers || {})
            }
        }
    );

    return await response.json();
}
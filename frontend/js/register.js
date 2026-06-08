document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const batchInput = document.getElementById("batch");
    const alertBox = document.getElementById("alertBox");

    batchInput.required = true;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = 'student';
        const batch = batchInput.value;

        // Reset alert
        alertBox.className = "alert d-none";
        alertBox.innerText = "";

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password, role, batch })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration failed. Please try again.");
            }

            alertBox.className = "alert alert-success";
            alertBox.innerText = "Registration successful! Redirecting to login...";
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } catch (error) {
            alertBox.className = "alert alert-danger";
            alertBox.innerText = error.message;
        }
    });
});

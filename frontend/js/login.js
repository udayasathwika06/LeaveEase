document.addEventListener("DOMContentLoaded", () => {
    // If user is already logged in, redirect them
    const currentRole = localStorage.getItem("role");
    const currentStudentId = localStorage.getItem("studentId");
    
    if (currentRole === "student" && currentStudentId) {
        window.location.href = "student-dashboard.html";
        return;
    } else if (currentRole === "mentor") {
        window.location.href = "admin-dashboard.html";
        return;
    } else if (currentRole === "administrator") {
        window.location.href = "manage-mentors.html";
        return;
    }

    const loginForm = document.getElementById("loginForm");
    const alertBox = document.getElementById("alertBox");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        // Reset alert
        alertBox.className = "alert d-none";
        alertBox.innerText = "";

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Login failed. Please try again.");
            }

            // Save user session in localStorage
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            
            if (data.user.role === "student") {
                localStorage.setItem("studentId", data.user._id);
                localStorage.setItem("batch", data.user.batch || "");
                
                alertBox.className = "alert alert-success";
                alertBox.innerText = "Login successful! Redirecting...";
                setTimeout(() => {
                    window.location.href = "student-dashboard.html";
                }, 1000);
            } else if (data.user.role === "mentor") {
                localStorage.setItem("adminId", data.user._id); // optional
                
                alertBox.className = "alert alert-success";
                alertBox.innerText = "Login successful! Redirecting...";
                setTimeout(() => {
                    window.location.href = "admin-dashboard.html";
                }, 1000);
            } else if (data.user.role === "administrator") {
                localStorage.setItem("adminId", data.user._id); // optional
                
                alertBox.className = "alert alert-success";
                alertBox.innerText = "Login successful! Redirecting...";
                setTimeout(() => {
                    window.location.href = "manage-mentors.html";
                }, 1000);
            }
        } catch (error) {
            alertBox.className = "alert alert-danger";
            alertBox.innerText = error.message;
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    const allowedAdminEmails = [
        "udayasathvikachiiti@gmail.com",
        "rishi2006h@gmail.com"
    ];

    if (role !== "administrator" || !allowedAdminEmails.includes(email)) {
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    document.getElementById("userNameDisplay").innerText = username || "Administrator";

    const adminForm = document.getElementById("adminForm");
    const mentorApprovalForm = document.getElementById("mentorApprovalForm");
    const approvedMentorListBody = document.getElementById("approvedMentorListBody");
    const adminListBody = document.getElementById("adminListBody");
    const alertBox = document.getElementById("actionAlertBox");
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    adminForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        updateAlert();

        const usernameValue = document.getElementById("adminName").value.trim();
        const emailValue = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;

        if (!emailValue || !password) {
            updateAlert("Administrator email and password are required.", "danger");
            return;
        }

        try {
            const res = await fetch("/api/auth/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: usernameValue, email: emailValue, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Could not add administrator.");
            }

            updateAlert(data.message, "success");
            adminForm.reset();
            loadAdmins();
        } catch (error) {
            updateAlert(error.message, "danger");
        }
    });

    mentorApprovalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        updateAlert();

        const nameValue = document.getElementById("mentorApproveName").value.trim();
        const emailValue = document.getElementById("mentorApproveEmail").value.trim();

        if (!emailValue) {
            updateAlert("Mentor email is required.", "danger");
            return;
        }

        try {
            const res = await fetch("/api/auth/approved-mentors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nameValue, email: emailValue })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Could not approve mentor email.");
            }

            updateAlert(data.message, "success");
            mentorApprovalForm.reset();
            loadApprovedMentors();
        } catch (error) {
            updateAlert(error.message, "danger");
        }
    });

    async function loadApprovedMentors() {
        try {
            const res = await fetch("/api/auth/approved-mentors");
            const mentors = await res.json();

            if (!res.ok) {
                throw new Error(mentors.message || "Failed to load approved mentors.");
            }

            approvedMentorListBody.innerHTML = "";
            if (mentors.length === 0) {
                approvedMentorListBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4 text-muted">No approved mentor emails found.</td>
                    </tr>`;
                return;
            }

            mentors.forEach((mentor) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${mentor.name || "-"}</td>
                    <td>${mentor.email}</td>
                    <td>${new Date(mentor.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-approved-mentor-btn" data-id="${mentor._id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                approvedMentorListBody.appendChild(row);
            });

            approvedMentorListBody.querySelectorAll(".delete-approved-mentor-btn").forEach((btn) => {
                btn.addEventListener("click", () => deleteApprovedMentor(btn.dataset.id));
            });
        } catch (error) {
            approvedMentorListBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-danger">${error.message}</td>
                </tr>`;
        }
    }

    async function loadAdmins() {
        try {
            const res = await fetch("/api/auth/admins");
            const admins = await res.json();

            if (!res.ok) {
                throw new Error(admins.message || "Failed to load administrators.");
            }

            adminListBody.innerHTML = "";
            if (admins.length === 0) {
                adminListBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4 text-muted">No administrator accounts found.</td>
                    </tr>`;
                return;
            }

            admins.forEach((admin) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${admin.username || "-"}</td>
                    <td>${admin.email}</td>
                    <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-admin-btn" data-id="${admin._id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                adminListBody.appendChild(row);
            });

            adminListBody.querySelectorAll(".delete-admin-btn").forEach((btn) => {
                btn.addEventListener("click", () => deleteAdmin(btn.dataset.id));
            });
        } catch (error) {
            adminListBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-danger">${error.message}</td>
                </tr>`;
        }
    }

    async function deleteApprovedMentor(id) {
        if (!confirm("Remove this approved mentor email?")) return;
        try {
            const res = await fetch(`/api/auth/approved-mentors/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to remove approved mentor.");
            updateAlert(data.message, "success");
            loadApprovedMentors();
        } catch (error) {
            updateAlert(error.message, "danger");
        }
    }

    async function deleteAdmin(id) {
        if (!confirm("Remove this administrator account?")) return;
        try {
            const res = await fetch(`/api/auth/admins/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to remove administrator.");
            updateAlert(data.message, "success");
            loadAdmins();
        } catch (error) {
            updateAlert(error.message, "danger");
        }
    }

    function updateAlert(message = "", type = "") {
        if (!alertBox) return;
        if (!message) {
            alertBox.className = "alert d-none";
            alertBox.innerText = "";
            return;
        }
        alertBox.className = `alert alert-${type}`;
        alertBox.innerText = message;
    }

    loadApprovedMentors();
    loadAdmins();
});

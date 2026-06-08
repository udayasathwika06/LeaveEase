document.addEventListener("DOMContentLoaded", () => {
    // 1. Session check (Route guard)
    const role = localStorage.getItem("role");
    const studentId = localStorage.getItem("studentId");
    const username = localStorage.getItem("username");
    const batch = localStorage.getItem("batch");

    if (role !== "student" || !studentId) {
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    // Populate navbar and form fields
    document.getElementById("userNameDisplay").innerText = username || "Trainee";
    document.getElementById("studentIdInput").value = studentId;
    document.getElementById("studentNameInput").value = username || "";
    document.getElementById("batchInput").value = batch || "";

    // File input change detector
    const fileInput = document.getElementById("document");
    const fileNameDisplay = document.getElementById("fileNameDisplay");
    
    fileInput.addEventListener("change", (e) => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.innerText = `Selected file: ${fileInput.files[0].name}`;
        } else {
            fileNameDisplay.innerText = "";
        }
    });

    // 2. Form submission with validation
    const leaveForm = document.getElementById("leaveForm");
    const alertBox = document.getElementById("alertBox");

    leaveForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fromDateVal = new Date(document.getElementById("fromDate").value);
        const toDateVal = new Date(document.getElementById("toDate").value);

        // Reset alert
        alertBox.className = "alert d-none";
        alertBox.innerText = "";

        // Validation: To Date must be after or equal to From Date
        if (toDateVal < fromDateVal) {
            alertBox.className = "alert alert-danger";
            alertBox.innerText = "Error: End Date cannot be earlier than Start Date.";
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const formData = new FormData(leaveForm);

        try {
            const res = await fetch("/api/leaves/apply", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to submit leave request.");
            }

            alertBox.className = "alert alert-success";
            alertBox.innerText = "Leave request submitted successfully! Redirecting...";
            
            // Disable submit button to prevent double clicks
            const submitBtn = leaveForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            setTimeout(() => {
                window.location.href = "student-dashboard.html";
            }, 1500);

        } catch (error) {
            alertBox.className = "alert alert-danger";
            alertBox.innerText = error.message;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // 3. Logout trigger
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
});

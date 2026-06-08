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

    // Update Navbar headers
    document.getElementById("userNameDisplay").innerText = username || "Trainee";
    document.getElementById("userBatchDisplay").innerText = `Batch: ${batch || "N/A"}`;

    // 2. Fetch stats and recent leaves
    const totalEl = document.getElementById("total");
    const approvedEl = document.getElementById("approved");
    const pendingEl = document.getElementById("pending");
    const rejectedEl = document.getElementById("rejected");
    const recentLeavesBody = document.getElementById("recentLeavesBody");
    const studentBatchInput = document.getElementById("studentBatchInput");
    const batchAlertBox = document.getElementById("batchAlertBox");
    const withdrawnEl = document.getElementById("withdrawn");

    if (studentBatchInput) {
        studentBatchInput.value = batch || "";
    }

    async function loadDashboardData() {
        try {
            const res = await fetch(`/api/leaves/student/${studentId}`);
            if (!res.ok) throw new Error("Failed to fetch leave records.");
            
            const leaves = await res.json();

            // Set metric counts
            totalEl.innerText = leaves.length;
            approvedEl.innerText = leaves.filter(x => x.status === "Approved").length;
            pendingEl.innerText = leaves.filter(x => x.status === "Pending").length;
            rejectedEl.innerText = leaves.filter(x => x.status === "Rejected").length;

            if (withdrawnEl) {
                const withdrawnRes = await fetch(`/api/leaves/withdrawn/student/${studentId}`);
                if (withdrawnRes.ok) {
                    const withdrawnLeaves = await withdrawnRes.json();
                    withdrawnEl.innerText = withdrawnLeaves.length;
                } else {
                    withdrawnEl.innerText = "0";
                }
            }

            // Display 5 most recent requests
            const recentLeaves = leaves.slice(0, 5);
            recentLeavesBody.innerHTML = "";

            if (recentLeaves.length === 0) {
                recentLeavesBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">You haven't submitted any leave requests yet.</td>
                    </tr>
                `;
                return;
            }

            recentLeaves.forEach(leave => {
                const appliedDate = new Date(leave.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                const fromD = new Date(leave.fromDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
                const toD = new Date(leave.toDate).toLocaleDateString(undefined, { dateStyle: 'medium' });

                // Document link
                let docHtml = `<span class="text-muted">None</span>`;
                if (leave.document) {
                    docHtml = `
                        <a href="/uploads/${leave.document}" target="_blank" class="btn btn-sm btn-action btn-action-view" title="View Document">
                            <i class="fa-regular fa-file-pdf"></i>
                        </a>
                    `;
                }

                // Status badge
                const statusLower = leave.status.toLowerCase();
                const statusBadge = `
                    <span class="status-badge ${statusLower}">
                        ${leave.status}
                    </span>
                `;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${leave.leaveType}</strong></td>
                    <td>${fromD}</td>
                    <td>${toD}</td>
                    <td class="text-truncate" style="max-width: 200px;" title="${leave.reason}">${leave.reason}</td>
                    <td>${docHtml}</td>
                    <td><small class="text-muted">${appliedDate}</small></td>
                    <td>${statusBadge}</td>
                `;
                recentLeavesBody.appendChild(row);
            });
        } catch (error) {
            console.error("Dashboard error:", error);
            recentLeavesBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">Error loading data. Please refresh the page.</td>
                </tr>
            `;
        }
    }

    loadDashboardData();

    async function handleBatchUpdate(event) {
        event.preventDefault();
        if (!studentBatchInput) return;

        const newBatch = studentBatchInput.value.trim();
        if (!newBatch) {
            batchAlertBox.className = "alert alert-danger";
            batchAlertBox.innerText = "Please enter a valid batch.";
            return;
        }

        try {
            const res = await fetch(`/api/auth/students/${studentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ batch: newBatch })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not update batch.");

            localStorage.setItem("batch", newBatch);
            document.getElementById("userBatchDisplay").innerText = `Batch: ${newBatch}`;
            batchAlertBox.className = "alert alert-success";
            batchAlertBox.innerText = "Batch updated successfully.";
            setTimeout(() => {
                batchAlertBox.className = "alert d-none";
            }, 3000);
        } catch (error) {
            console.error("Batch update error:", error);
            batchAlertBox.className = "alert alert-danger";
            batchAlertBox.innerText = error.message;
        }
    }

    const batchUpdateForm = document.getElementById("batchUpdateForm");
    if (batchUpdateForm) {
        batchUpdateForm.addEventListener('submit', handleBatchUpdate);
    }

    // 3. CSV Export trigger
    document.getElementById("downloadCsvBtn").addEventListener("click", () => {
        window.location.href = `/api/leaves/export/student/${studentId}`;
    });

    // 4. Logout trigger
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
});
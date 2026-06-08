document.addEventListener("DOMContentLoaded", () => {
    // 1. Session check (Route guard)
    const role = localStorage.getItem("role");
    const studentId = localStorage.getItem("studentId");
    const username = localStorage.getItem("username");

    if (role !== "student" || !studentId) {
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    // Populate user name in navbar
    document.getElementById("userNameDisplay").innerText = username || "Trainee";

    // 2. Fetch and render history
    const historyLeavesBody = document.getElementById("historyLeavesBody");
    const filterType = document.getElementById("filterType");
    const filterStatus = document.getElementById("filterStatus");
    const sortOrder = document.getElementById("sortOrder");

    let allLeaves = [];

    async function loadHistory() {
        try {
            const res = await fetch(`/api/leaves/student/${studentId}`);
            if (!res.ok) throw new Error("Failed to load leave history.");

            allLeaves = await res.json();
            applyFiltersAndSort();
        } catch (error) {
            console.error("History loading error:", error);
            historyLeavesBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-danger">Error loading history records. Please refresh the page.</td>
                </tr>
            `;
        }
    }

    function renderTable(leaves) {
        historyLeavesBody.innerHTML = "";

        if (leaves.length === 0) {
            historyLeavesBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">No matching leave records found.</td>
                </tr>
            `;
            return;
        }

        leaves.forEach(leave => {
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

            const canWithdraw = !leave.viewed;
            const withdrawButton = canWithdraw ? `
                <button class="btn btn-sm btn-outline-danger withdraw-btn" data-id="${leave._id}">
                    Withdraw
                </button>
            ` : `<span class="text-muted small">${leave.viewed ? 'Reviewed' : ''}</span>`;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${leave.leaveType}</strong></td>
                <td>${fromD}</td>
                <td>${toD}</td>
                <td class="text-truncate" style="max-width: 250px;" title="${leave.reason}">${leave.reason}</td>
                <td>${docHtml}</td>
                <td><small class="text-muted">${appliedDate}</small></td>
                <td>${statusBadge}</td>
                <td>${withdrawButton}</td>
            `;
            historyLeavesBody.appendChild(row);
        });

        historyLeavesBody.querySelectorAll('.withdraw-btn').forEach(btn => {
            btn.addEventListener('click', () => handleWithdrawLeave(btn.dataset.id));
        });
    }

    function applyFiltersAndSort() {
        let filtered = [...allLeaves];

        // Type filter
        const typeVal = filterType.value;
        if (typeVal !== "All") {
            filtered = filtered.filter(x => x.leaveType === typeVal);
        }

        // Status filter
        const statusVal = filterStatus.value;
        if (statusVal !== "All") {
            filtered = filtered.filter(x => x.status === statusVal);
        }

        // Date sorting
        const orderVal = sortOrder.value;
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return orderVal === "newest" ? dateB - dateA : dateA - dateB;
        });

        renderTable(filtered);
    }

    async function handleWithdrawLeave(id) {
        if (!confirm("Withdraw this leave request?")) return;
        try {
            const res = await fetch(`/api/leaves/withdraw/${id}`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not withdraw leave request.");

            await loadHistory();
        } catch (error) {
            console.error("Withdraw error:", error);
            alert(error.message || "Unable to withdraw request.");
        }
    }

    // Add filter change event listeners
    filterType.addEventListener("change", applyFiltersAndSort);
    filterStatus.addEventListener("change", applyFiltersAndSort);
    sortOrder.addEventListener("change", applyFiltersAndSort);

    // Initial load
    loadHistory();

    // 3. Download CSV trigger
    document.getElementById("downloadCsvBtn").addEventListener("click", () => {
        window.location.href = `/api/leaves/export/student/${studentId}`;
    });

    // 4. Logout trigger
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
});

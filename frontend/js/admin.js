document.addEventListener("DOMContentLoaded", () => {
    // 1. Route guard check
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    const allowedAdminEmails = [
        "udayasathvikachiiti@gmail.com",
        "rishi2006h@gmail.com"
    ];

    if (role !== "mentor" && role !== "administrator") {
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    const mentorLink = document.querySelector('a[href="manage-mentors.html"]');
    if (mentorLink && role !== "administrator") {
        mentorLink.closest('li').remove();
    }

    // Populate navbar user info
    document.getElementById("userNameDisplay").innerText = username || "Mentor";

    // Global cache of all requests
    let allLeaves = [];
    let allStudents = [];

    // 2. Fetch and initialize dashboard or manage lists
    async function loadData() {
        try {
            const res = await fetch("/api/leaves/all");
            if (!res.ok) throw new Error("Failed to load leaves.");

            allLeaves = await res.json();

            if (document.getElementById("studentListBody")) {
                await loadStudents();
            }

            // Determine which page we are on and hydrate accordingly
            if (document.getElementById("recentAdminLeavesBody")) {
                hydrateDashboard();
            } else if (document.getElementById("masterLeavesBody")) {
                hydrateManageLeaves();
            }
        } catch (error) {
            console.error("Data load error:", error);
            showError("Could not fetch database records. Please try again later.");
        }
    }

    // Helper to display errors
    function showError(msg) {
        const actionAlert = document.getElementById("actionAlertBox");
        if (actionAlert) {
            actionAlert.className = "alert alert-danger";
            actionAlert.innerText = msg;
        } else {
            alert(msg);
        }
    }

    // Helper to display success alerts
    function showSuccess(msg) {
        const actionAlert = document.getElementById("actionAlertBox");
        if (actionAlert) {
            actionAlert.className = "alert alert-success";
            actionAlert.innerText = msg;
            setTimeout(() => {
                actionAlert.className = "alert d-none";
            }, 3000);
        }
    }

    // ==========================================
    // MENTOR DASHBOARD HYDRATION
    // ==========================================
    function hydrateDashboard() {
        // Stats Cards
        document.getElementById("total").innerText = allLeaves.length;
        document.getElementById("pending").innerText = allLeaves.filter(x => x.status === "Pending").length;
        document.getElementById("approved").innerText = allLeaves.filter(x => x.status === "Approved").length;
        document.getElementById("rejected").innerText = allLeaves.filter(x => x.status === "Rejected").length;

        // Unviewed recent count badge
        const unviewedCount = allLeaves.filter(x => !x.viewed).length;
        document.getElementById("recentCountBadge").innerText = `${unviewedCount} Unviewed`;
        if (unviewedCount > 0) {
            document.getElementById("recentCountBadge").className = "badge bg-primary";
        } else {
            document.getElementById("recentCountBadge").className = "badge bg-light text-dark";
        }

        // Hydrate Recent Submissions Table (limit 5)
        const recentBody = document.getElementById("recentAdminLeavesBody");
        recentBody.innerHTML = "";

        const recents = allLeaves.slice(0, 5);
        if (recents.length === 0) {
            recentBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">No leave requests found.</td>
                </tr>
            `;
        } else {
            recents.forEach(leave => {
                const fromD = new Date(leave.fromDate).toLocaleDateString(undefined, { dateStyle: 'short' });
                const toD = new Date(leave.toDate).toLocaleDateString(undefined, { dateStyle: 'short' });
                const statusLower = leave.status.toLowerCase();

                let actionHtml = ``;
                if (leave.status === "Pending") {
                    actionHtml = `
                        <div class="d-flex justify-content-end gap-1">
                            <button class="btn btn-action btn-action-approve approve-btn" data-id="${leave._id}" title="Approve Request">
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <button class="btn btn-action btn-action-reject reject-btn" data-id="${leave._id}" title="Reject Request">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    `;
                } else {
                    actionHtml = `<span class="text-muted small">Reviewed</span>`;
                }

                const row = document.createElement("tr");
                // Bold student name if unviewed
                const nameStyle = leave.viewed ? "" : "font-weight: 700; color: var(--primary);";
                row.innerHTML = `
                    <td style="${nameStyle}">${leave.studentName}</td>
                    <td><span class="badge bg-light text-dark">${leave.batch}</span></td>
                    <td><strong>${leave.leaveType}</strong></td>
                    <td><small>${fromD} - ${toD}</small></td>
                    <td><span class="status-badge ${statusLower}">${leave.status}</span></td>
                    <td>${actionHtml}</td>
                `;
                recentBody.appendChild(row);
            });

            // Wire up quick actions
            recentBody.querySelectorAll(".approve-btn").forEach(btn => {
                btn.addEventListener("click", () => handleStatusChange(btn.dataset.id, "approve"));
            });
            recentBody.querySelectorAll(".reject-btn").forEach(btn => {
                btn.addEventListener("click", () => handleStatusChange(btn.dataset.id, "reject"));
            });
        }

        // Hydrate Batch-wise Leaves
        const batchSummaryList = document.getElementById("batchSummaryList");
        batchSummaryList.innerHTML = "";

        // Calculate batches stats
        const batches = {};
        allLeaves.forEach(leave => {
            if (!batches[leave.batch]) {
                batches[leave.batch] = { total: 0, pending: 0 };
            }
            batches[leave.batch].total += 1;
            if (leave.status === "Pending") {
                batches[leave.batch].pending += 1;
            }
        });

        const batchNames = Object.keys(batches).sort();
        if (batchNames.length === 0) {
            batchSummaryList.innerHTML = `<div class="text-center py-3 text-muted">No batches active.</div>`;
        } else {
            batchNames.forEach(name => {
                const stats = batches[name];
                const item = document.createElement("div");
                item.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom";
                item.innerHTML = `
                    <div>
                        <h6 class="fw-semibold mb-0">${name}</h6>
                        <small class="text-muted">${stats.total} request(s) submitted</small>
                    </div>
                    <div>
                        ${stats.pending > 0 ? `<span class="badge bg-warning text-dark me-1">${stats.pending} pending</span>` : ""}
                        <span class="badge bg-light text-dark">${stats.total} total</span>
                    </div>
                `;
                batchSummaryList.appendChild(item);
            });
        }
    }


    // ==========================================
    // MANAGE LEAVES HYDRATION & FILTERING
    // ==========================================
    let activeBatchFilter = "All";
    let activeStatusFilter = "All";
    let activeSearchQuery = "";
    let activeSortOrder = "newest";

    function hydrateManageLeaves() {
        // Populate Batch dropdown (if not already populated except "All")
        const filterBatch = document.getElementById("filterBatch");
        
        // Find unique batches
        const uniqueBatches = [...new Set(allLeaves.map(x => x.batch))].sort();
        
        // Keep selected batch value
        const previousSelection = filterBatch.value;
        filterBatch.innerHTML = `<option value="All">All Batches</option>`;
        
        uniqueBatches.forEach(batch => {
            const opt = document.createElement("option");
            opt.value = batch;
            opt.innerText = batch;
            filterBatch.appendChild(opt);
        });

        // Restore selection if it existed
        if (uniqueBatches.includes(previousSelection)) {
            filterBatch.value = previousSelection;
        }

        // Render master list
        applyFiltersAndSort();
    }

    function applyFiltersAndSort() {
        const searchInput = document.getElementById("searchStudentName");
        const filterBatch = document.getElementById("filterBatch");
        const filterStatus = document.getElementById("filterStatus");
        const sortOrder = document.getElementById("sortOrder");
        const downloadBatchBtn = document.getElementById("downloadBatchCsvBtn");

        activeSearchQuery = searchInput.value.toLowerCase().trim();
        activeBatchFilter = filterBatch.value;
        activeStatusFilter = filterStatus.value;
        activeSortOrder = sortOrder.value;

        // Enable/Disable Batch download report button
        if (activeBatchFilter !== "All") {
            downloadBatchBtn.disabled = false;
        } else {
            downloadBatchBtn.disabled = true;
        }

        let filtered = [...allLeaves];

        // Search Filter
        if (activeSearchQuery !== "") {
            filtered = filtered.filter(x => x.studentName.toLowerCase().includes(activeSearchQuery));
        }

        // Batch Filter
        if (activeBatchFilter !== "All") {
            filtered = filtered.filter(x => x.batch === activeBatchFilter);
        }

        // Status Filter
        if (activeStatusFilter !== "All") {
            filtered = filtered.filter(x => x.status === activeStatusFilter);
        }

        // Sort Order
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return activeSortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        renderMasterTable(filtered);
    }

    function renderMasterTable(leaves) {
        const masterBody = document.getElementById("masterLeavesBody");
        masterBody.innerHTML = "";

        if (leaves.length === 0) {
            masterBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4 text-muted">No applications found matching your criteria.</td>
                </tr>
            `;
            return;
        }

        leaves.forEach(leave => {
            const appliedDate = new Date(leave.createdAt).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const fromD = new Date(leave.fromDate).toLocaleDateString(undefined, { dateStyle: 'short' });
            const toD = new Date(leave.toDate).toLocaleDateString(undefined, { dateStyle: 'short' });
            const statusLower = leave.status.toLowerCase();

            // Document link
            let docHtml = `<span class="text-muted">None</span>`;
            if (leave.document) {
                docHtml = `
                    <a href="/uploads/${leave.document}" target="_blank" class="btn btn-sm btn-action btn-action-view" title="View Document">
                        <i class="fa-regular fa-file-pdf"></i>
                    </a>
                `;
            }

            // Viewed dot
            const viewedDot = leave.viewed 
                ? `<span class="view-dot-empty" title="Viewed"></span>` 
                : `<span class="view-dot" title="New / Unviewed"></span>`;

            // Action elements
            let actionHtml = ``;
            // Show Approve & Reject if Pending
            let approveRejectBtns = "";
            if (leave.status === "Pending") {
                approveRejectBtns = `
                    <button class="btn btn-action btn-action-approve approve-btn" data-id="${leave._id}" title="Approve">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn btn-action btn-action-reject reject-btn" data-id="${leave._id}" title="Reject">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `;
            }

            const deleteButton = leave.status === "Approved" ? `
                <button class="btn btn-action btn-action-delete delete-leave-btn" data-id="${leave._id}" title="Delete Approved Leave">
                    <i class="fa-solid fa-trash"></i>
                </button>
            ` : "";

            // Toggle viewed eye icon
            const eyeIcon = leave.viewed ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
            const eyeTitle = leave.viewed ? "Mark as Unviewed" : "Mark as Viewed";

            actionHtml = `
                <div class="d-flex justify-content-end gap-1">
                    ${approveRejectBtns}
                    ${deleteButton}
                    <button class="btn btn-action btn-light toggle-viewed-btn" data-id="${leave._id}" title="${eyeTitle}">
                        <i class="${eyeIcon}"></i>
                    </button>
                </div>
            `;

            const row = document.createElement("tr");
            const rowStyle = leave.viewed ? "" : "font-weight: 500; background-color: #f8fafc;";
            
            row.innerHTML = `
                <td class="text-center">${viewedDot}</td>
                <td style="${rowStyle}">${leave.studentName}</td>
                <td><span class="badge bg-light text-dark">${leave.batch}</span></td>
                <td><strong>${leave.leaveType}</strong></td>
                <td><small>${fromD} - ${toD}</small></td>
                <td class="text-truncate" style="max-width: 150px;" title="${leave.reason}">${leave.reason}</td>
                <td>${docHtml}</td>
                <td><small class="text-muted">${appliedDate}</small></td>
                <td><span class="status-badge ${statusLower}">${leave.status}</span></td>
                <td>${actionHtml}</td>
            `;
            masterBody.appendChild(row);
        });

        // Wire up action buttons
        masterBody.querySelectorAll(".approve-btn").forEach(btn => {
            btn.addEventListener("click", () => handleStatusChange(btn.dataset.id, "approve"));
        });
        masterBody.querySelectorAll(".reject-btn").forEach(btn => {
            btn.addEventListener("click", () => handleStatusChange(btn.dataset.id, "reject"));
        });
        masterBody.querySelectorAll(".toggle-viewed-btn").forEach(btn => {
            btn.addEventListener("click", () => handleToggleViewed(btn.dataset.id));
        });
        masterBody.querySelectorAll(".delete-leave-btn").forEach(btn => {
            btn.addEventListener("click", () => handleDeleteLeave(btn.dataset.id));
        });
    }

    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    async function handleStatusChange(id, action) {
        try {
            const url = `/api/leaves/${action}/${id}`;
            const res = await fetch(url, { method: "PUT" });
            if (!res.ok) throw new Error(`Failed to ${action} leave request.`);

            showSuccess(`Request has been ${action === "approve" ? "Approved" : "Rejected"} successfully.`);
            
            // Reload all data from backend
            await loadData();
        } catch (error) {
            console.error("Action error:", error);
            showError(error.message);
        }
    }

    async function handleToggleViewed(id) {
        try {
            const url = `/api/leaves/toggle-viewed/${id}`;
            const res = await fetch(url, { method: "PUT" });
            if (!res.ok) throw new Error(`Failed to toggle viewed status.`);

            // Reload all data
            await loadData();
        } catch (error) {
            console.error("View toggle error:", error);
            showError(error.message);
        }
    }

    async function handleDeleteLeave(id) {
        if (!confirm("Remove this approved leave record permanently?")) return;
        try {
            const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not delete leave record.");

            showSuccess("Approved leave record deleted successfully.");
            await loadData();
        } catch (error) {
            console.error("Delete leave error:", error);
            showError(error.message);
        }
    }

    async function loadStudents() {
        try {
            const res = await fetch("/api/auth/students");
            if (!res.ok) throw new Error("Failed to load student records.");
            allStudents = await res.json();
            renderStudentList();
        } catch (error) {
            console.error("Student load error:", error);
            showError(error.message);
        }
    }

    function renderStudentList() {
        const studentBody = document.getElementById("studentListBody");
        if (!studentBody) return;

        studentBody.innerHTML = "";

        if (allStudents.length === 0) {
            studentBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">No student records found.</td>
                </tr>
            `;
            return;
        }

        allStudents.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.username}</td>
                <td>${student.email}</td>
                <td>${student.batch || "-"}</td>
                <td>${student.leaveCount ?? 0}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-danger delete-student-btn" data-id="${student._id}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            studentBody.appendChild(row);
        });

        studentBody.querySelectorAll(".delete-student-btn").forEach(btn => {
            btn.addEventListener("click", () => handleDeleteStudent(btn.dataset.id));
        });
    }

    async function handleAddLeave(event) {
        event.preventDefault();
        const nameInput = document.getElementById("newStudentName");
        const emailInput = document.getElementById("newStudentEmail");
        const batchInput = document.getElementById("newStudentBatch");
        const leaveTypeInput = document.getElementById("newLeaveType");
        const fromDateInput = document.getElementById("newLeaveFromDate");
        const toDateInput = document.getElementById("newLeaveToDate");
        const reasonInput = document.getElementById("newLeaveReason");

        const payload = {
            studentEmail: emailInput.value.trim(),
            studentName: nameInput.value.trim(),
            batch: batchInput.value.trim(),
            leaveType: leaveTypeInput.value,
            fromDate: fromDateInput.value,
            toDate: toDateInput.value,
            reason: reasonInput.value.trim()
        };

        try {
            const res = await fetch("/api/leaves/admin/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not add leave request.");

            showSuccess("Leave request added and approved successfully.");
            nameInput.value = "";
            emailInput.value = "";
            batchInput.value = "";
            leaveTypeInput.value = "Personal Leave";
            fromDateInput.value = "";
            toDateInput.value = "";
            reasonInput.value = "";
            await loadData();
        } catch (error) {
            console.error("Create leave error:", error);
            showError(error.message);
        }
    }

    async function handleDeleteStudent(studentId) {
        if (!confirm("Delete this student and all their leave records?")) return;
        try {
            const res = await fetch(`/api/auth/students/${studentId}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not delete student.");

            showSuccess("Student record deleted successfully.");
            await loadData();
        } catch (error) {
            console.error("Delete student error:", error);
            showError(error.message);
        }
    }

    // ==========================================
    // REGISTRATION OF EVENT LISTENERS
    // ==========================================
    if (document.getElementById("masterLeavesBody")) {
        const searchInput = document.getElementById("searchStudentName");
        const filterBatch = document.getElementById("filterBatch");
        const filterStatus = document.getElementById("filterStatus");
        const sortOrder = document.getElementById("sortOrder");

        searchInput.addEventListener("input", applyFiltersAndSort);
        filterBatch.addEventListener("change", applyFiltersAndSort);
        filterStatus.addEventListener("change", applyFiltersAndSort);
        sortOrder.addEventListener("change", applyFiltersAndSort);

        // Download triggers
        document.getElementById("downloadAllCsvBtn").addEventListener("click", () => {
            window.location.href = "/api/leaves/export/all";
        });

        document.getElementById("downloadBatchCsvBtn").addEventListener("click", () => {
            const batchVal = filterBatch.value;
            if (batchVal !== "All") {
                window.location.href = `/api/leaves/export/batch/${encodeURIComponent(batchVal)}`;
            }
        });

        const addLeaveForm = document.getElementById("addLeaveForm");
        if (addLeaveForm) {
            addLeaveForm.addEventListener("submit", handleAddLeave);
        }
    }

    // Logout action
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    // Start load
    loadData();
});

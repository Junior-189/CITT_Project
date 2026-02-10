// src/Pages/Funding.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';

/**
 * Funding page:
 * - Innovators: submit funding apps
 * - Admins: review/approve/reject applications
 * - Investors: browse approved projects and pledge
 * - Exports: CSV (Excel) + printable "PDF" via print-to-PDF
 *
 * Notes:
 * - Now uses backend API (PostgreSQL) for all operations
 * - Form submissions call POST /api/admin/funding
 * - File uploads: Strategy TBD (Firebase Storage or backend)
 * - Investor pledges call POST /api/admin/funding/:id/pledge (when endpoint exists)
 */

const Funding = () => {
  const { profile, role, getAuthenticatedAxios } = useAuth();
  const userRole = role || "innovator"; // 'admin' | 'investor' | 'innovator'
  const canReviewApplications = ["admin", "superAdmin", "ipManager"].includes(role);
  const [activeTab, setActiveTab] = useState("overview");

  // Form state
  const [form, setForm] = useState({
    projectId: "", // optionally link to a project
    title: "",
    amountRequested: "",
    grantType: "research",
    justification: "",
    budgetFile: null,
    supportingFiles: [],
  });

  // Data
  const [applications, setApplications] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // admin filters / selection
  const [selectedApp, setSelectedApp] = useState(null);

  // expandable details state
  const [expandedApp, setExpandedApp] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({
    projectId: "",
    title: "",
    amountRequested: "",
    grantType: "",
    justification: "",
  });

  // fetch projects so we can select a valid integer project_id
  useEffect(() => {
    const fetchProjects = async () => {
      if (!profile?.id) {
        setMyProjects([]);
        return;
      }

      try {
        setProjectsLoading(true);
        const api = getAuthenticatedAxios();
        const response = await api.get('/api/admin/projects', {
          params: { limit: 1000, page: 1 }
        });
        setMyProjects(response.data.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setMyProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [profile?.id]);

  // fetch applications from backend API
  useEffect(() => {
    const fetchApplications = async () => {
      if (!profile?.id) {
        setApplications([]);
        return;
      }

      try {
        setLoading(true);
        const api = getAuthenticatedAxios();

        // Build query params based on role
        const params = {
          limit: 100,
          page: 1
        };

        // Investors see only approved applications
        if (userRole === "investor") {
          params.approval_status = 'approved';
          params.funding_status = 'approved';
        }

        const response = await api.get('/api/admin/funding', { params });
        setApplications(response.data.funding || []);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [profile?.id, userRole]);

  // Note: Investments are now stored in PostgreSQL backend
  // This state is kept for UI compatibility but typically fetched via API if needed
  // For now, we calculate pledges from the applications data or a separate endpoint

  // handle form change
  const handleChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file") {
      if (name === "budgetFile") {
        setForm((s) => ({ ...s, budgetFile: files[0] }));
      } else if (name === "supportingFiles") {
        setForm((s) => ({ ...s, supportingFiles: Array.from(files) }));
      }
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  // upload helper - file storage strategy TBD
  // For now, this is a placeholder. Backend endpoint POST /api/admin/funding/:id/upload can be implemented
  // to handle file uploads via multipart/form-data

  // submit application to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile?.id) {
      alert("You must be logged in to submit an application.");
      return;
    }
    
    if (!form.title || !form.amountRequested || !form.justification) {
      alert("Please fill in all required fields: title, amount, and justification.");
      return;
    }

    try {
      setLoading(true);
      const api = getAuthenticatedAxios();

      const amount = Number(form.amountRequested);
      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid funding amount.");
        return;
      }

      const projectIdValue = String(form.projectId || "").trim();
      let projectId = null;
      if (projectIdValue) {
        if (!/^\d+$/.test(projectIdValue)) {
          alert("Invalid project selected. Please choose a project from the list.");
          return;
        }
        projectId = Number(projectIdValue);
      }

      // Prepare payload for backend
      // Note: Field mapping - frontend 'justification' → backend 'description'
      const payload = {
        title: form.title,
        description: form.justification,
        amount,
        currency: 'TZS',
        grant_type: form.grantType,
        project_id: projectId
      };

      // Submit to backend
      await api.post('/api/admin/funding', payload);

      alert(`Application "${form.title}" submitted successfully!`);
      
      // Clear form
      setForm({
        projectId: "",
        title: "",
        amountRequested: "",
        grantType: "research",
        justification: "",
        budgetFile: null,
        supportingFiles: [],
      });
      
      // Refresh applications list
      setTimeout(() => {
        const fetchApplications = async () => {
          const api = getAuthenticatedAxios();
          const response = await api.get('/api/admin/funding', {
            params: { limit: 100, page: 1 }
          });
          setApplications(response.data.funding || []);
        };
        fetchApplications();
      }, 500);
      
      setActiveTab("applications");
    } catch (err) {
      console.error("Error submitting application:", err);
      alert(err.response?.data?.error || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // ADMIN: approve application via backend API
  const handleApprove = async (app) => {
    if (!profile || !canReviewApplications) {
      alert("Only reviewers (Admin / IP Manager) can approve applications.");
      return;
    }

    try {
      setLoading(true);
      const api = getAuthenticatedAxios();

      const response = await api.put(`/api/admin/funding/${app.id}/approve`, {
        comments: "",
        amount_approved: Number(app.amount || 0)
      });

      const updatedFunding = response.data.funding || {};

      // Update local state with backend response
      setApplications(prev =>
        prev.map(a =>
          a.id === app.id
            ? {
                ...a,
                approval_status: 'approved',
                funding_status: 'approved',
                amount_approved: updatedFunding.amount_approved || app.amount,
                approved_by: updatedFunding.approved_by,
                approved_by_name: profile?.name || a.approved_by_name,
                approved_at: updatedFunding.approved_at || new Date().toISOString()
              }
            : a
        )
      );

      alert("Application approved successfully.");
    } catch (err) {
      console.error("Error approving application:", err);
      alert(err.response?.data?.error || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  // ADMIN: reject application via backend API
  const handleRejectApplication = async (app, reason) => {
    if (!profile || !canReviewApplications) {
      alert("Only reviewers (Admin / IP Manager) can reject applications.");
      return;
    }

    if (!reason || reason.trim() === "") {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      
      await api.put(`/api/admin/funding/${app.id}/reject`, {
        reason: reason
      });

      // Update local state
      setApplications(prev =>
        prev.map(a =>
          a.id === app.id
            ? { ...a, approval_status: 'rejected', rejection_reason: reason }
            : a
        )
      );

      alert("Application rejected successfully.");
    } catch (err) {
      console.error("Error rejecting application:", err);
      alert(err.response?.data?.error || "Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  // INVESTOR: pledge investment via backend API
  const handlePledge = async (appId, amount, note = "") => {
    if (!profile?.id) {
      alert("Please log in to pledge.");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid pledge amount.");
      return;
    }

    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      
      // Note: Backend endpoint for pledges may need to be created
      // For now, this shows the expected flow
      const response = await api.post(`/api/admin/funding/${appId}/pledge`, {
        amount: parseFloat(amount),
        note: note
      });

      alert("Thank you! Your pledge has been recorded.");
    } catch (err) {
      console.error("Error pledging:", err);
      // Check if endpoint doesn't exist yet
      if (err.response?.status === 404) {
        alert("Pledge feature coming soon!");
      } else {
        alert(err.response?.data?.error || "Failed to pledge");
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded view for application details
  const handleToggleDetails = (appId) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
      setEditingApp(null);
    } else {
      setExpandedApp(appId);
      setEditingApp(null);
    }
  };

  // Start editing an application
  const handleStartEdit = (app) => {
    setEditingApp(app.id);
    setEditForm({
      projectId: app.project_id ? String(app.project_id) : "",
      title: app.title,
      amountRequested: app.amount,
      grantType: app.grant_type,
      justification: app.description,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingApp(null);
    setEditForm({
      projectId: "",
      title: "",
      amountRequested: "",
      grantType: "",
      justification: "",
    });
  };

  // Save edited application
  const handleSaveEdit = async (appId) => {
    if (!editForm.title || !editForm.amountRequested || !editForm.justification) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const api = getAuthenticatedAxios();

      const amount = Number(editForm.amountRequested);
      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid funding amount.");
        return;
      }

      const projectIdValue = String(editForm.projectId || "").trim();
      let projectId = null;
      if (projectIdValue) {
        if (!/^\d+$/.test(projectIdValue)) {
          alert("Invalid project selected. Please choose a project from the list.");
          return;
        }
        projectId = Number(projectIdValue);
      }

      const currentApp = applications.find(a => Number(a.id) === Number(appId));

      await api.put(`/api/admin/funding/${appId}`, {
        title: editForm.title,
        description: editForm.justification,
        amount,
        grant_type: editForm.grantType,
        project_id: projectId
      });

      // Refresh applications list
      const response = await api.get('/api/admin/funding', {
        params: { limit: 100, page: 1 }
      });
      setApplications(response.data.funding || []);

      if (currentApp?.approval_status === 'rejected') {
        alert("Application updated and resubmitted for review!");
      } else {
        alert("Application updated successfully!");
      }
      setEditingApp(null);
    } catch (err) {
      console.error("Error updating application:", err);
      alert(err.response?.data?.error || "Failed to update application");
    } finally {
      setLoading(false);
    }
  };

  // generate CSV (Excel-friendly)
  const downloadCSV = (rows = []) => {
    if (!rows || rows.length === 0) {
      alert("No data to export.");
      return;
    }
    const header = Object.keys(rows[0]);
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((h) => {
            // basic CSV escaping
            const v = r[h] === undefined || r[h] === null ? "" : String(r[h]).replace(/"/g, '""');
            return `"${v}"`;
          })
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funding_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // printable report (user can Save as PDF from print dialog)
  const printReport = (rows = []) => {
    if (!rows || rows.length === 0) {
      alert("No data to print.");
      return;
    }
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("Popup blocked. Please allow popups for this site to print reports.");
      return;
    }
    const headerRow = Object.keys(rows[0]);

    // Calculate summary stats from rows
    const totalRows = rows.length;
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const html = `
      <html>
      <head>
        <title>CITT Funding Report</title>
        <style>
          body { font-family: system-ui, Arial, sans-serif; padding: 30px; color: #222; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0d9488; padding-bottom: 15px; }
          .header h1 { margin: 0 0 5px 0; font-size: 22px; color: #0d9488; }
          .header h2 { margin: 0 0 10px 0; font-size: 18px; color: #334155; font-weight: normal; }
          .meta { font-size: 12px; color: #64748b; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; color: #334155; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CITT - Centre for Innovation &amp; Technology Transfer</h1>
          <h2>Funding Report</h2>
          <div class="meta">
            Generated on: ${reportDate} &nbsp;|&nbsp; Total Records: ${totalRows} &nbsp;|&nbsp;
            Generated by: ${profile?.name || 'System User'}
          </div>
        </div>
        <table>
          <thead>
            <tr>${headerRow.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((r) => `<tr>${headerRow.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>This report was generated from the CITT Funding Management System. &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

	  // helpers for UI
	  const isAdmin = ["admin", "superAdmin"].includes(role);
	  const isReviewer = canReviewApplications;
	  const isInvestor = role === "investor";
	  const isInnovator = role === "innovator";

  return (
    <main className="flex-1 px-8 md:px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Funding & Investment Management</h1>
          <p className="text-slate-600">
            Submit funding applications, track approvals & disbursements, and manage investor pledges.
          </p>
        </div>

        {/* tabs */}
	        <div className="flex gap-2 mb-6 border-b border-slate-200">
	          <Tab name="overview" activeTab={activeTab} setActiveTab={setActiveTab}>Overview</Tab>
	          <Tab name="apply" activeTab={activeTab} setActiveTab={setActiveTab}>Apply for Funding</Tab>
	          <Tab name="applications" activeTab={activeTab} setActiveTab={setActiveTab}>{isReviewer ? "Applications" : "My Applications"}</Tab>
	          <Tab name="investors" activeTab={activeTab} setActiveTab={setActiveTab}>Investor Portal</Tab>
	          <Tab name="reports" activeTab={activeTab} setActiveTab={setActiveTab}>Financial Reports</Tab>
	        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FeatureCard icon={<i className="fa-solid fa-coins" />} title="Submit Funding Applications" description="Innovators can submit funding or grant applications for their projects, including required forms, budgets, and justification documents.">
              <button onClick={() => setActiveTab("apply")} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Start Application</button>
            </FeatureCard>

            <FeatureCard icon={<i className="fa-solid fa-check-circle" />} title="Application Review & Approval" description="Track approval status and disbursement of funds. View fund release schedules and utilization reports.">
              <button onClick={() => setActiveTab("applications")} className="bg-teal-600 text-white px-6 py-2 rounded-lg">View Status</button>
            </FeatureCard>

            <FeatureCard icon={<i className="fa-solid fa-chart-bar" />} title="Investor Interface" description="Investors can review approved projects and pledge investments. System records commitments and triggers follow-up actions.">
              <button onClick={() => setActiveTab("investors")} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Browse Projects</button>
            </FeatureCard>

            <FeatureCard icon={<i className="fa-solid fa-chart-line" />} title="Financial Reports" description="Generate financial reports (income, expenses, budgets) for projects and CITT. Export to Excel or PDF.">
              <button onClick={() => setActiveTab("reports")} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Generate Report</button>
            </FeatureCard>
          </div>
        )}

        {activeTab === "apply" && (
          <div className="bg-white rounded-xl p-8 shadow-md max-w-4xl mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Submit Funding Application</h2>
            {!profile?.id && <div className="mb-4 text-red-600">Please log in to submit an application.</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
	              <div>
	                <label className="block text-slate-700 font-semibold mb-2">Project (optional)</label>
	                <select
	                  name="projectId"
	                  value={form.projectId}
	                  onChange={handleChange}
	                  className="w-full px-4 py-2 border rounded"
	                  disabled={projectsLoading}
	                >
	                  <option value="">{projectsLoading ? "Loading projects..." : "No linked project"}</option>
	                  {myProjects.map((p) => (
	                    <option key={p.id} value={String(p.id)}>
	                      {p.title} (ID: {p.id})
	                    </option>
	                  ))}
	                </select>
	                <p className="mt-1 text-xs text-slate-500">
	                  Choose a project from the list (IDs are numbers). This prevents the database error:{" "}
	                  <code>invalid input syntax for type integer</code>.
	                </p>
	              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Title</label>
                <input name="title" value={form.title} onChange={handleChange} required className="w-full px-4 py-2 border rounded" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Funding Amount Requested (TZS)</label>
                  <input name="amountRequested" value={form.amountRequested} onChange={handleChange} required type="number" className="w-full px-4 py-2 border rounded" />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Grant Type</label>
                  <select name="grantType" value={form.grantType} onChange={handleChange} className="w-full px-4 py-2 border rounded">
                    <option value="research">Research Grant</option>
                    <option value="startup">Startup Funding</option>
                    <option value="innovation">Innovation Grant</option>
                    <option value="development">Development Fund</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Project Justification</label>
                <textarea name="justification" value={form.justification} onChange={handleChange} rows={5} className="w-full px-4 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Upload Budget Document (PDF/XLSX)</label>
                <input name="budgetFile" type="file" onChange={handleChange} accept=".pdf,.xlsx,.xls,.docx" className="px-2 py border rounded" />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Upload Supporting Documents (multiple)</label>
                <input name="supportingFiles" type="file" onChange={handleChange} accept=".pdf,.jpg,.png,.xlsx,.docx" multiple className="px-2 py border rounded" />
              </div>

              <div className="flex gap-4">
                <button disabled={!profile?.id || loading} type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg">{loading ? "Submitting..." : "Submit Application"}</button>
                <button type="button" onClick={() => {
                  setForm({
                    projectId: "",
                    title: "",
                    amountRequested: "",
                    grantType: "research",
                    justification: "",
                    budgetFile: null,
                    supportingFiles: [],
                  });
                }} className="bg-slate-200 px-6 py-2 rounded-lg">Reset</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "applications" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Funding Applications</h2>
            {loading && <p>Loading...</p>}
            {!loading && applications.length === 0 && <p className="text-slate-600">No applications found.</p>}

            <div className="grid gap-4">
              {applications.map((app) => {
                const isOwner = Number(app.user_id) === Number(profile?.id);
                const canEditApplication = isOwner && ['pending', 'rejected'].includes(app.approval_status);
                const editLabel = app.approval_status === 'rejected' ? 'Edit & Resubmit' : 'Edit Application';

                return (
                <div key={app.id} className="bg-white rounded-xl p-6 shadow-md">
	                  <div className="flex justify-between items-start mb-3">
	                    <div>
	                      <h3 className="text-xl font-bold text-slate-800">{app.title}</h3>
	                      <p className="text-slate-600 text-sm">
	                        ID: {app.id}
	                        {app.user_name ? ` • By: ${app.user_name}` : ""}
	                        {app.approval_status ? ` • Approval: ${app.approval_status}` : ""}
	                        {app.funding_status ? ` • Funding: ${app.funding_status}` : app.status ? ` • Status: ${app.status}` : ""}
	                      </p>
	                    </div>
	                    <div className="text-right">
	                      <p className="text-slate-600">
	                        Requested: <strong>{Number(app.amount || 0).toLocaleString()} {app.currency || "TZS"}</strong>
	                      </p>
	                    </div>
	                  </div>

	                  <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
	                    <div>
	                      <p className="font-semibold">Grant Type</p>
	                      <p>{app.grant_type || "—"}</p>
	                    </div>
	                    <div>
	                      <p className="font-semibold">Submitted</p>
	                      <p>{app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}</p>
	                    </div>
	                    <div>
	                      <p className="font-semibold">Files</p>
	                      <div className="space-y-1">
	                        <span className="text-slate-400">Uploads not enabled yet</span>
	                      </div>
	                    </div>
	                  </div>

	                  <p className="mt-4 text-slate-700">{app.description || "—"}</p>

	                  <div className="mt-4 flex gap-3 flex-wrap">
	                    {isReviewer && app.approval_status === "pending" && (
	                      <>
	                        <button onClick={() => handleApprove(app)} className="bg-blue-600 text-white px-4 py-2 rounded">Approve</button>

	                        <button onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) {
                            handleRejectApplication(app, reason);
                          }
                        }} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
                      </>
                    )}

                    {isInvestor && app.approval_status === "approved" && (
                      <button onClick={async () => {
                        const amount = prompt("Enter pledge amount (TZS)");
                        if (!amount) return;
                        await handlePledge(app.id, amount, "");
                      }} className="bg-teal-600 text-white px-4 py-2 rounded">Pledge</button>
                    )}

                    {/* View/Edit details button */}
                    <button
                      onClick={() => handleToggleDetails(app.id)}
                      className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      {expandedApp === app.id ? '▼' : '▶'}
                      {expandedApp === app.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Expandable Details Section */}
                  {expandedApp === app.id && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      {editingApp === app.id ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <h4 className="text-lg font-bold text-slate-800 mb-4">Edit Application</h4>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Project (optional)</label>
                            <select
                              value={editForm.projectId}
                              onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
                              className="w-full px-4 py-2 border rounded"
                              disabled={projectsLoading}
                            >
                              <option value="">{projectsLoading ? "Loading projects..." : "No linked project"}</option>
                              {myProjects.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                  {p.title} (ID: {p.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Title</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              className="w-full px-4 py-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Amount Requested (TZS)</label>
                            <input
                              type="number"
                              value={editForm.amountRequested}
                              onChange={(e) => setEditForm({...editForm, amountRequested: e.target.value})}
                              className="w-full px-4 py-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Grant Type</label>
                            <select
                              value={editForm.grantType}
                              onChange={(e) => setEditForm({...editForm, grantType: e.target.value})}
                              className="w-full px-4 py-2 border rounded"
                            >
                              <option value="research">Research Grant</option>
                              <option value="startup">Startup Funding</option>
                              <option value="innovation">Innovation Grant</option>
                              <option value="development">Development Fund</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-2">Project Justification</label>
                            <textarea
                              value={editForm.justification}
                              onChange={(e) => setEditForm({...editForm, justification: e.target.value})}
                              rows={5}
                              className="w-full px-4 py-2 border rounded"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveEdit(app.id)}
                              disabled={loading}
                              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                            >
                              {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Details */
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Application ID</p>
                              <p className="text-slate-800">{app.id}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Status</p>
                              <p className="text-slate-800">{app.approval_status || app.status}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Submitted By</p>
                              <p className="text-slate-800">{app.user_name || "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Submitted On</p>
                              <p className="text-slate-800">{app.created_at ? new Date(app.created_at).toLocaleString() : "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Funding Status</p>
                              <p className="text-slate-800">{app.funding_status || "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Project ID</p>
                              <p className="text-slate-800">{app.project_id || "Not linked"}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Full Description</p>
                            <p className="text-slate-800 whitespace-pre-wrap">{app.description || "—"}</p>
                          </div>

                          {app.rejection_reason && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
                              <p className="text-red-800">{app.rejection_reason}</p>
                            </div>
                          )}

                          {/* Edit button for owner if pending */}
                          {canEditApplication && (
                            <button
                              onClick={() => handleStartEdit(app)}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                              {editLabel}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        )}

        {activeTab === "investors" && (() => {
          const approvedApps = applications.filter(a => a.approval_status === "approved" || a.funding_status === "approved");
          return (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Investor Portal - Approved Projects</h2>
            <p className="text-slate-600 mb-6">
              Browse all projects approved by Admin and IP Manager with their estimated approved funds.
            </p>

            {approvedApps.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <p className="text-slate-600 text-lg">No approved projects available for investment yet.</p>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-teal-600">
                    <p className="text-sm text-slate-600">Approved Projects</p>
                    <p className="text-2xl font-bold text-slate-800">{approvedApps.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-600">
                    <p className="text-sm text-slate-600">Total Requested</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {approvedApps.reduce((s, a) => s + Number(a.amount || 0), 0).toLocaleString()} TZS
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-600">
                    <p className="text-sm text-slate-600">Total Approved Funds</p>
                    <p className="text-2xl font-bold text-green-600">
                      {approvedApps.reduce((s, a) => s + Number(a.amount_approved || a.amount || 0), 0).toLocaleString()} TZS
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {approvedApps.map(app => (
                    <div key={app.id} className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{app.title}</h3>
                          {app.project_title && (
                            <p className="text-sm text-teal-600 font-medium mt-1">
                              Project: {app.project_title}
                            </p>
                          )}
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                            {app.grant_type || "General"}
                          </span>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </div>

                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">{app.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-slate-500">Amount Requested</p>
                          <p className="text-lg font-bold text-blue-600">
                            {Number(app.amount || 0).toLocaleString()} {app.currency || "TZS"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Estimated Funds Approved</p>
                          <p className="text-lg font-bold text-green-600">
                            {Number(app.amount_approved || app.amount || 0).toLocaleString()} {app.currency || "TZS"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 mb-4 space-y-1">
                        {app.approved_by_name && (
                          <p>Approved by: <strong className="text-slate-700">{app.approved_by_name}</strong></p>
                        )}
                        {app.approved_at && (
                          <p>Approved on: <strong className="text-slate-700">{new Date(app.approved_at).toLocaleDateString()}</strong></p>
                        )}
                        <p>Funding Status: <strong className="text-slate-700">{app.funding_status || 'approved'}</strong></p>
                      </div>

                      <button onClick={() => {
                        const amt = prompt("Enter pledge amount (TZS)");
                        if (!amt) return;
                        handlePledge(app.id, amt, "");
                      }} className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition font-medium">
                        Pledge Investment
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          );
        })()}

        {activeTab === "reports" && (() => {
          // Build scoped data based on dropdown at generation time
          const buildReportRows = () => {
            const scope = document.getElementById("reportScope")?.value || "all";
            let filtered = applications;
            if (scope === "my") {
              filtered = applications.filter(a => Number(a.user_id) === Number(profile?.id));
            } else if (scope === "approved") {
              filtered = applications.filter(a => a.approval_status === "approved");
            }

            return filtered.map(a => ({
              "ID": a.id,
              "Title": a.title,
              "Grant Type": a.grant_type || "—",
              "Project": a.project_title || (a.project_id ? `Project #${a.project_id}` : "N/A"),
              "Amount Requested (TZS)": Number(a.amount || 0).toLocaleString(),
              "Amount Approved (TZS)": Number(a.amount_approved || 0).toLocaleString(),
              "Approval Status": a.approval_status || "pending",
              "Funding Status": a.funding_status || a.status || "—",
              "Approved By": a.approved_by_name || "—",
              "Approved Date": a.approved_at ? new Date(a.approved_at).toLocaleDateString() : "—",
              "Submitted Date": a.created_at ? new Date(a.created_at).toLocaleDateString() : "—",
            }));
          };

          // Build raw numeric rows for CSV (no formatting)
          const buildCSVRows = () => {
            const scope = document.getElementById("reportScope")?.value || "all";
            let filtered = applications;
            if (scope === "my") {
              filtered = applications.filter(a => Number(a.user_id) === Number(profile?.id));
            } else if (scope === "approved") {
              filtered = applications.filter(a => a.approval_status === "approved");
            }

            return filtered.map(a => ({
              "ID": a.id,
              "Title": a.title,
              "Grant Type": a.grant_type || "",
              "Project": a.project_title || "",
              "Amount Requested": Number(a.amount || 0),
              "Amount Approved": Number(a.amount_approved || 0),
              "Currency": a.currency || "TZS",
              "Approval Status": a.approval_status || "pending",
              "Funding Status": a.funding_status || a.status || "",
              "Approved By": a.approved_by_name || "",
              "Approved Date": a.approved_at ? new Date(a.approved_at).toLocaleDateString() : "",
              "Submitted Date": a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
            }));
          };

          return (
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Generate Financial Reports</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-2">Report Scope</label>
                <select className="w-full px-4 py-2 border rounded" id="reportScope">
                  <option value="all">All Projects</option>
                  <option value="my">My Projects Only</option>
                  <option value="approved">Approved Projects Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Export Format</label>
                <select id="reportFormat" className="w-full px-4 py-2 border rounded">
                  <option value="csv">Excel (CSV)</option>
                  <option value="pdf">PDF (Print)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <button onClick={() => {
                const fmt = document.getElementById("reportFormat").value;
                if (fmt === "csv") {
                  downloadCSV(buildCSVRows());
                } else {
                  printReport(buildReportRows());
                }
              }} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-medium">
                Generate Report
              </button>

              <button onClick={() => {
                const scope = document.getElementById("reportScope")?.value || "all";
                let filtered = applications;
                if (scope === "my") {
                  filtered = applications.filter(a => Number(a.user_id) === Number(profile?.id));
                } else if (scope === "approved") {
                  filtered = applications.filter(a => a.approval_status === "approved");
                }
                const totalRequested = filtered.reduce((s, a) => s + Number(a.amount || 0), 0);
                const totalApproved = filtered.reduce((s, a) => s + Number(a.amount_approved || 0), 0);
                const approved = filtered.filter(a => a.approval_status === "approved").length;
                const pending = filtered.filter(a => a.approval_status === "pending").length;
                const rejected = filtered.filter(a => a.approval_status === "rejected").length;
                alert(
                  `Report Summary (${scope === "my" ? "My Projects" : scope === "approved" ? "Approved Only" : "All Projects"}):\n\n` +
                  `Total Applications: ${filtered.length}\n` +
                  `Approved: ${approved} | Pending: ${pending} | Rejected: ${rejected}\n` +
                  `Total Requested: ${totalRequested.toLocaleString()} TZS\n` +
                  `Total Approved: ${totalApproved.toLocaleString()} TZS`
                );
              }} className="bg-slate-200 px-6 py-2 rounded-lg hover:bg-slate-300 transition font-medium">
                Preview Summary
              </button>
            </div>

            {/* Report preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-700">Report Data Preview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left px-3 py-2">Title</th>
                      <th className="text-left px-3 py-2">Grant Type</th>
                      <th className="text-right px-3 py-2">Requested (TZS)</th>
                      <th className="text-right px-3 py-2">Approved (TZS)</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-500">No data available</td></tr>
                    ) : (
                      applications.slice(0, 10).map(a => (
                        <tr key={a.id} className="border-t hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-800">{a.title}</td>
                          <td className="px-3 py-2 text-slate-600">{a.grant_type || "—"}</td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium">{Number(a.amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-green-600 font-medium">{Number(a.amount_approved || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                              a.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>{a.approval_status}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{a.approved_by_name || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {applications.length > 10 && (
                  <div className="text-center py-2 text-sm text-slate-500 border-t">
                    Showing 10 of {applications.length} entries. Generate full report for complete data.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              <p><strong>Note:</strong> CSV exports are Excel-friendly and include all numeric data for calculations. Use Print &rarr; Save as PDF from the browser dialog to get a printable PDF report.</p>
            </div>
          </div>
          );
        })()}
      </div>
    </main>
  );
};

export default Funding;

/* ---------- small internal helper components ---------- */

function Tab({ name, children, activeTab, setActiveTab }) {
  const active = activeTab === name;
  return (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-6 py-3 font-semibold transition-colors ${active ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-600 hover:text-slate-800"}`}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon, emoji, title, description, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600">
      <div className="flex items-start gap-4">
        <span className="text-4xl">
          {icon ? icon : emoji}
        </span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-4">{description}</p>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

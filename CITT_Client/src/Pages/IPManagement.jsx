import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const MILESTONE_STAGES = {
  "1": "Stage 1 - Idea Generation",
  "2": "Stage 2 - Concept Development",
  "3": "Stage 3 - Prototype Development",
  "4": "Stage 4 - Testing & Validation",
  "5": "Stage 5 - IP & Documentation",
  "6": "Stage 6 - Funding & Investment",
  "7": "Stage 7 - Deployment / Implementation",
  "8": "Stage 8 - Monitoring & Evaluation",
  "9": "Stage 9 - Scaling & Commercialization",
};

const IPManagement = () => {
  const { user, role } = useContext(AuthContext);
  const userRole = role || (user && user.role) || "innovator";
  const isAdmin = ["admin", "superAdmin", "ipManager"].includes(userRole);

  const [activeTab, setActiveTab] = useState("overview");

  const [form, setForm] = useState({
    ipType: "",
    title: "",
    inventors: "",
    abstract: "",
    field: "",
    milestone_stage: "",
    priorArt: "",
    projectId: "",
    files: [],
    identificationNumbers: {
      patentNumber: "",
      applicationNumber: "",
      trademarkRegNumber: "",
      trademarkClassification: "",
      copyrightRegNumber: "",
      copyrightType: "",
      designRegNumber: "",
      designClassification: "",
    },
  });

  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [statusHistory, setStatusHistory] = useState({});

  useEffect(() => {
    const fetchIPs = async () => {
      setLoading(true);
      try {
        if (!user) { setIps([]); setLoading(false); return; }
        const endpoint = isAdmin ? '/api/ipmanager/ip-records' : '/api/ipmanager/my-ips';
        const res = await api.get(endpoint);
        setIps(isAdmin ? (res.data.ipRecords || []) : (res.data.ips || []));
      } catch (err) {
        console.error("fetchIPs:", err);
      }
      setLoading(false);
    };
    fetchIPs();
  }, [user, isAdmin]);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const res = await api.get('/api/ipmanager/licenses');
        setLicenses(res.data.licenses || []);
      } catch (err) {
        console.error("fetchLicenses:", err);
      }
    };
    fetchLicenses();
  }, []);

  const ipsForCommercialization = ips.filter(ip =>
    ip.status === "Patent Granted" ||
    ip.status === "Granted" ||
    ip.status === "Published" ||
    ip.approval_status === "approved"
  );

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm((s) => ({ ...s, files: Array.from(files) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleIdNumberChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      identificationNumbers: { ...s.identificationNumbers, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to submit IP applications.");
    if (!form.ipType || !form.title || !form.inventors) return alert("Fill required fields.");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('ip_type', form.ipType);
      fd.append('title', form.title);
      fd.append('inventors', form.inventors);
      fd.append('abstract', form.abstract);
      fd.append('field', form.field);
      fd.append('milestone_stage', form.milestone_stage);
      fd.append('prior_art', form.priorArt);
      if (form.projectId) fd.append('project_id', form.projectId);
      fd.append('patent_number', form.identificationNumbers.patentNumber || '');
      fd.append('application_number', form.identificationNumbers.applicationNumber || '');
      fd.append('trademark_reg_number', form.identificationNumbers.trademarkRegNumber || '');
      fd.append('trademark_classification', form.identificationNumbers.trademarkClassification || '');
      fd.append('copyright_reg_number', form.identificationNumbers.copyrightRegNumber || '');
      fd.append('copyright_type', form.identificationNumbers.copyrightType || '');
      fd.append('design_reg_number', form.identificationNumbers.designRegNumber || '');
      fd.append('design_classification', form.identificationNumbers.designClassification || '');
      (form.files || []).forEach(f => fd.append('files', f));

      await api.post('/api/ipmanager/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Refresh
      const res = await api.get('/api/ipmanager/my-ips');
      setIps(res.data.ips || []);
      setForm({
        ipType: "", title: "", inventors: "", abstract: "", field: "", milestone_stage: "",
        priorArt: "", projectId: "", files: [],
        identificationNumbers: { patentNumber: "", applicationNumber: "", trademarkRegNumber: "", trademarkClassification: "", copyrightRegNumber: "", copyrightType: "", designRegNumber: "", designClassification: "" },
      });
      setActiveTab("myip");
      alert("IP application submitted successfully.");
    } catch (err) {
      console.error("submit IP:", err);
      alert("Failed to submit IP application.");
    }
    setLoading(false);
  };

  const adminApprove = async (ip) => {
    if (!isAdmin) return alert("Admin only.");
    try {
      await api.put(`/api/ipmanager/ip-records/${ip.id}/approve`, {});
      const endpoint = isAdmin ? '/api/ipmanager/ip-records' : '/api/ipmanager/my-ips';
      const res = await api.get(endpoint);
      setIps(isAdmin ? (res.data.ipRecords || []) : (res.data.ips || []));
      alert("Approved successfully.");
    } catch (err) {
      console.error("adminApprove:", err);
    }
  };

  const adminReject = async (ip) => {
    if (!isAdmin) return alert("Admin only.");
    const reason = prompt("Enter rejection reason");
    if (!reason) return;
    try {
      await api.put(`/api/ipmanager/ip-records/${ip.id}/reject`, { reason });
      const endpoint = isAdmin ? '/api/ipmanager/ip-records' : '/api/ipmanager/my-ips';
      const res = await api.get(endpoint);
      setIps(isAdmin ? (res.data.ipRecords || []) : (res.data.ips || []));
      alert("Rejected.");
    } catch (err) {
      console.error("adminReject:", err);
    }
  };

  const createLicense = async (payload) => {
    try {
      await api.post('/api/ipmanager/licenses', payload);
      const res = await api.get('/api/ipmanager/licenses');
      setLicenses(res.data.licenses || []);
      alert("License created.");
    } catch (err) {
      console.error("createLicense:", err);
      alert("Failed to create license.");
    }
  };

  const recordRoyalty = async (licenseId, amount, note = "") => {
    try {
      await api.post(`/api/ipmanager/licenses/${licenseId}/royalty`, { amount: Number(amount), note });
      alert("Royalty recorded.");
    } catch (err) {
      console.error("recordRoyalty:", err);
    }
  };

  const getIdNumberDisplay = (ip) => {
    const parts = [];
    if (ip.patent_number) parts.push(`Patent: ${ip.patent_number}`);
    if (ip.application_number) parts.push(`App: ${ip.application_number}`);
    if (ip.trademark_reg_number) parts.push(`TM: ${ip.trademark_reg_number}`);
    if (ip.copyright_reg_number) parts.push(`CR: ${ip.copyright_reg_number}`);
    if (ip.design_reg_number) parts.push(`Design: ${ip.design_reg_number}`);
    // legacy nested object fallback
    const ids = ip.identificationNumbers || {};
    if (!parts.length && ids.patentNumber) parts.push(`Patent: ${ids.patentNumber}`);
    if (!parts.length && ids.trademarkRegNumber) parts.push(`TM: ${ids.trademarkRegNumber}`);
    if (!parts.length && ids.copyrightRegNumber) parts.push(`CR: ${ids.copyrightRegNumber}`);
    if (!parts.length && ids.designRegNumber) parts.push(`Design: ${ids.designRegNumber}`);
    return parts.join(" | ");
  };

  const filteredIPs = ips.filter((ip) => {
    if (filterType && ip.ip_type !== filterType) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (ip.title || '').toLowerCase().includes(q) ||
      (ip.inventors || '').toLowerCase().includes(q) ||
      (ip.field || '').toLowerCase().includes(q) ||
      (ip.patent_number || '').toLowerCase().includes(q) ||
      (ip.ip_type || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (val) => {
    if (!val) return "";
    return new Date(val).toLocaleDateString();
  };

  const countsV1 = {
    total: ips.length,
    pending: ips.filter(p => p.approval_status === 'pending').length,
    underReview: ips.filter(p => p.status === 'Under Examination').length,
    approved: ips.filter(p => ['Patent Granted','Granted','Published'].includes(p.status) || p.approval_status === 'approved').length,
    rejected: ips.filter(p => p.approval_status === 'rejected').length,
  };

  const statusColors = (status) => {
    if (status === 'Patent Granted' || status === 'Granted' || status === 'Published') return 'text-teal-700';
    if (status === 'Submitted') return 'text-slate-700';
    if (status === 'Under Examination') return 'text-slate-600';
    if (status === 'Rejected') return 'text-slate-500';
    return 'text-slate-700';
  };

  const getDocUrl = (doc) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base}${doc.file_url}`;
  };

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Intellectual Property Management</h1>
          <p className="text-slate-600 dark:text-slate-400">Submit, track, and commercialize IP -- patents, trademarks, designs, copyrights.</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 flex-wrap">
          {[
            { key: "overview", label: "Overview" },
            { key: "submit", label: "Submit IP Application" },
            { key: "myip", label: "My IP Portfolio & Status Tracking" },
            { key: "commercialization", label: "Commercialization" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.key ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-l-4 border-teal-600">
                <h3 className="font-bold text-slate-800 text-lg">Submit New IP</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Submit new patent, trademark, design or copyright applications.</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("submit")} className="bg-teal-600 text-white px-4 py-2 rounded-lg">New Application</button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-l-4 border-slate-500">
                <h3 className="font-bold text-slate-800 text-lg">IP Portfolio &amp; Status</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">View your IP portfolio and track application statuses.</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("myip")} className="bg-slate-600 text-white px-4 py-2 rounded-lg">View Portfolio</button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-l-4 border-teal-500">
                <h3 className="font-bold text-slate-800 text-lg">Commercialization</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Create licensing agreements, track royalties and milestones.</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("commercialization")} className="bg-teal-500 text-white px-4 py-2 rounded-lg">Manage Licenses</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Total</h4>
                <p className="text-3xl font-bold">{countsV1.total}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Pending</h4>
                <p className="text-3xl font-bold">{countsV1.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Approved</h4>
                <p className="text-3xl font-bold">{countsV1.approved}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Rejected</h4>
                <p className="text-3xl font-bold">{countsV1.rejected}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Form */}
        {activeTab === "submit" && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md max-w-4xl mb-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Submit New IP Application</h2>
            {!user && <div className="mb-4 text-red-600">Please log in to submit IP applications.</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">IP Type</label>
                <select name="ipType" value={form.ipType} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                  <option value="">Select IP type</option>
                  <option value="patent">Patent</option>
                  <option value="trademark">Trademark</option>
                  <option value="design">Industrial Design</option>
                  <option value="copyright">Copyright</option>
                </select>
              </div>

              {form.ipType && (
                <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs uppercase">{form.ipType}</span>
                    Identification Numbers
                  </h4>

                  {form.ipType === "patent" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Patent Number</label>
                        <input name="patentNumber" value={form.identificationNumbers.patentNumber} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., TZ/P/2024/000123" />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Application Number</label>
                        <input name="applicationNumber" value={form.identificationNumbers.applicationNumber} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., AP/P/2024/000456" />
                      </div>
                    </div>
                  )}

                  {form.ipType === "trademark" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Trademark Registration Number</label>
                        <input name="trademarkRegNumber" value={form.identificationNumbers.trademarkRegNumber} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., TM/2024/001234" />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Nice Classification (Class)</label>
                        <input name="trademarkClassification" value={form.identificationNumbers.trademarkClassification} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., Class 9, Class 42" />
                      </div>
                    </div>
                  )}

                  {form.ipType === "copyright" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Copyright Registration Number</label>
                        <input name="copyrightRegNumber" value={form.identificationNumbers.copyrightRegNumber} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., CR/2024/005678" />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Copyright Type</label>
                        <select name="copyrightType" value={form.identificationNumbers.copyrightType} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                          <option value="">Select type</option>
                          <option value="literary">Literary Work</option>
                          <option value="artistic">Artistic Work</option>
                          <option value="musical">Musical Work</option>
                          <option value="software">Software / Code</option>
                          <option value="audiovisual">Audiovisual Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {form.ipType === "design" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Design Registration Number</label>
                        <input name="designRegNumber" value={form.identificationNumbers.designRegNumber} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., ID/2024/000789" />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-1">Locarno Classification</label>
                        <input name="designClassification" value={form.identificationNumbers.designClassification} onChange={handleIdNumberChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., 14-01" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">IP Title / Name</label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="Title or name" required />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Inventor(s) / Creator(s)</label>
                <input name="inventors" value={form.inventors} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="Comma-separated names" required />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Abstract / Description</label>
                <textarea name="abstract" value={form.abstract} onChange={handleChange} rows="5" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="Abstract or detailed description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Field of Application</label>
                  <input name="field" value={form.field} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., Healthcare" />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Milestone Stage</label>
                  <select name="milestone_stage" value={form.milestone_stage} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                    <option value="">Select Milestone Stage</option>
                    {Object.entries(MILESTONE_STAGES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Project ID (optional)</label>
                  <input name="projectId" value={form.projectId} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="Link to project (ID)" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Upload Documentation (drafts, drawings)</label>
                <input name="files" type="file" multiple onChange={handleChange} accept=".pdf,.doc,.docx,.png,.jpg" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-2">Prior Art / References</label>
                <textarea name="priorArt" value={form.priorArt} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="List prior art or references" />
              </div>

              <div className="flex gap-4">
                <button disabled={!user || loading} type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg">{loading ? "Submitting..." : "Submit Application"}</button>
                <button type="button" onClick={() => {
                  setForm({ ipType: "", title: "", inventors: "", abstract: "", field: "", milestone_stage: "", priorArt: "", projectId: "", files: [],
                    identificationNumbers: { patentNumber: "", applicationNumber: "", trademarkRegNumber: "", trademarkClassification: "", copyrightRegNumber: "", copyrightType: "", designRegNumber: "", designClassification: "" } });
                }} className="bg-slate-200 px-6 py-2 rounded-lg">Reset</button>
              </div>
            </form>
          </div>
        )}

        {/* My IP Portfolio */}
        {activeTab === "myip" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IP by title, inventors or field" className="px-4 py-2 border rounded w-96" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="">All Types</option>
                  <option value="patent">Patent</option>
                  <option value="trademark">Trademark</option>
                  <option value="design">Design</option>
                  <option value="copyright">Copyright</option>
                </select>
              </div>
              <div>
                <button onClick={() => setActiveTab("submit")} className="bg-teal-600 text-white px-4 py-2 rounded-lg">New Application</button>
              </div>
            </div>

            {loading && <p className="text-slate-600 dark:text-slate-400">Loading...</p>}
            {!loading && filteredIPs.length === 0 && <p className="text-slate-600 dark:text-slate-400">No IP records found.</p>}

            <div className="grid gap-4">
              {filteredIPs.map((ip) => {
                const idDisplay = getIdNumberDisplay(ip);
                return (
                <div key={ip.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100">{ip.ip_type}</span>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{ip.title}</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">Inventors: {ip.inventors}</p>
                      <p className={`text-slate-500 dark:text-slate-400 text-sm ${statusColors(ip.status)}`}>
                        Status: <strong>{ip.status || ip.approval_status}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Submitted: {formatDate(ip.created_at)}</p>
                      {ip.patent_number && <p className="text-sm text-slate-600 dark:text-slate-400">Patent No: {ip.patent_number}</p>}
                    </div>
                  </div>

                  {idDisplay && (
                    <div className="mb-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Identification Numbers</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{idDisplay}</p>
                    </div>
                  )}

                  <p className="text-slate-700 dark:text-slate-200 mb-3">{ip.abstract}</p>

                  {ip.field && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Field: {ip.field} {ip.milestone_stage ? `Stage: ${ip.milestone_stage}` : ""}</p>}

                  {/* Documents */}
                  {ip.documents && ip.documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Documents</p>
                      {ip.documents.map((doc) => (
                        <a key={doc.id} href={getDocUrl(doc)} target="_blank" rel="noreferrer"
                          className="text-teal-600 underline text-sm block">{doc.file_name}</a>
                      ))}
                    </div>
                  )}

                  {ip.files && ip.files.length > 0 && !ip.documents && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Documents</p>
                      {ip.files.map((f, idx) => (
                        <a key={idx} href={f.url} target="_blank" rel="noreferrer"
                          className="text-teal-600 underline text-sm block">{f.name || f.url}</a>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    {isAdmin && (
                      <>
                        {ip.approval_status === 'pending' && (
                          <>
                            <button onClick={() => adminApprove(ip)} className="bg-teal-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                            <button onClick={() => adminReject(ip)} className="bg-slate-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>

            {/* Status Summary */}
            {filteredIPs.length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Status Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-teal-50 border border-teal-200 dark:border-teal-800 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-teal-700">Approved / Granted</p>
                    <p className="text-3xl font-bold text-teal-800 mt-1">{countsV1.approved}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{countsV1.pending}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Under Review</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{countsV1.underReview}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total IPs</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{countsV1.total}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commercialization */}
        {activeTab === "commercialization" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Commercialization &amp; Licensing</h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Eligible IPs for Licensing</h3>
              {ipsForCommercialization.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center shadow-md">
                  <p className="text-slate-600 dark:text-slate-400 text-lg">No Eligible IPs for Licensing</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {ipsForCommercialization.map((ip) => (
                    <div key={ip.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-teal-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{ip.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Type: {ip.ip_type} - Status: {ip.status}</p>
                        </div>
                        <button onClick={() => {
                          const licensee = prompt("Licensee name");
                          const royalty = prompt("Royalty % (number)");
                          if (!licensee || !royalty) return;
                          createLicense({ ip_id: ip.id, ipTitle: ip.title, licensee, royalty_rate: Number(royalty) });
                        }} className="bg-teal-600 text-white px-3 py-1 rounded text-sm">Create License</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Existing Licenses</h3>
              <div className="grid gap-4">
                {licenses.length === 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center shadow-md">
                    <p className="text-slate-600 dark:text-slate-400 text-lg">No Existing Licenses</p>
                  </div>
                )}
                {licenses.map((lic) => (
                  <div key={lic.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{lic.ip_title || lic.ipTitle || lic.ip_id}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Licensee: {lic.licensee}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Royalty: {lic.royalty_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{formatDate(lic.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-3">
                      <button onClick={() => {
                        const amount = prompt("Enter royalty amount (TZS)");
                        const note = prompt("Note (optional)");
                        if (amount) recordRoyalty(lic.id, amount, note || "");
                      }} className="bg-teal-600 text-white px-3 py-1 rounded">Record Royalty</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default IPManagement;

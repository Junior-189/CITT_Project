// src/Pages/IPManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const IPManagement = () => {
  const { user, role } = useContext(AuthContext);
  const userRole = role || (user && user.role) || "innovator";
  const isAdmin = ["admin", "superAdmin", "ipManager"].includes(userRole);

  const [activeTab, setActiveTab] = useState("overview");

  // form
  const [form, setForm] = useState({
    ipType: "",
    title: "",
    inventors: "",
    abstract: "",
    field: "",
    trl: "",
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
  const [notifications, setNotifications] = useState([]);
  const [licenses, setLicenses] = useState([]);

  useEffect(() => {
    const fetchIPs = async () => {
      setLoading(true);
      try {
        let q;
        if (!user) {
          setIps([]);
          setLoading(false);
          return;
        }

        if (isAdmin) {
          q = query(collection(db, "ips"), orderBy("createdAt", "desc"));
        } else {
          q = query(collection(db, "ips"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
        }

        const snap = await getDocs(q);
        setIps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("fetchIPs:", err);
      }
      setLoading(false);
    };

    fetchIPs();
  }, [user, userRole, isAdmin]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const snap = await getDocs(query(collection(db, "ipNotifications"), orderBy("createdAt", "desc")));
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("fetchNotifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const snap = await getDocs(query(collection(db, "licenses"), orderBy("createdAt", "desc")));
        setLicenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("fetchLicenses:", err);
      }
    };

    fetchLicenses();
  }, []);

  const ipsForTracking = ips.map(ip => ({
    ...ip,
    relatedNotifications: notifications.filter(n => n.ipId === ip.id)
  }));

  const ipsForCommercialization = ips.filter(ip =>
    ip.status === "Patent Granted" ||
    ip.status === "Granted" ||
    ip.status === "Published"
  );

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm((s) => ({ ...s, files: Array.from(files) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  // Handle identification number change
  const handleIdNumberChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      identificationNumbers: { ...s.identificationNumbers, [name]: value },
    }));
  };

  // Upload helper
  const uploadFiles = async (ipId, fileList) => {
    if (!fileList || fileList.length === 0) return [];
    const out = [];
    for (const file of fileList) {
      const storageRef = ref(storage, `ips/${ipId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      out.push({ name: file.name, url });
    }
    return out;
  };

  // Submit IP application
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to submit IP applications.");
    if (!form.ipType || !form.title || !form.inventors) return alert("Fill required fields.");

    setLoading(true);
    try {
      // Build identification numbers based on IP type
      const idNumbers = {};
      if (form.ipType === "patent") {
        idNumbers.patentNumber = form.identificationNumbers.patentNumber || "";
        idNumbers.applicationNumber = form.identificationNumbers.applicationNumber || "";
      } else if (form.ipType === "trademark") {
        idNumbers.trademarkRegNumber = form.identificationNumbers.trademarkRegNumber || "";
        idNumbers.trademarkClassification = form.identificationNumbers.trademarkClassification || "";
      } else if (form.ipType === "copyright") {
        idNumbers.copyrightRegNumber = form.identificationNumbers.copyrightRegNumber || "";
        idNumbers.copyrightType = form.identificationNumbers.copyrightType || "";
      } else if (form.ipType === "design") {
        idNumbers.designRegNumber = form.identificationNumbers.designRegNumber || "";
        idNumbers.designClassification = form.identificationNumbers.designClassification || "";
      }

      const docRef = await addDoc(collection(db, "ips"), {
        uid: user.uid,
        ipType: form.ipType,
        title: form.title,
        inventors: form.inventors,
        abstract: form.abstract,
        field: form.field,
        trl: form.trl,
        priorArt: form.priorArt,
        projectId: form.projectId || null,
        identificationNumbers: idNumbers,
        status: "Submitted",
        metadata: {},
        files: [],
        createdAt: serverTimestamp(),
      });

      const fileUrls = await uploadFiles(docRef.id, form.files);
      if (fileUrls.length) {
        await updateDoc(doc(db, "ips", docRef.id), { files: fileUrls });
      }

      // Refresh local list
      const snap = await getDocs(query(collection(db, "ips"), where("uid", "==", user.uid), orderBy("createdAt", "desc")));
      setIps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Reset form
      setForm({
        ipType: "",
        title: "",
        inventors: "",
        abstract: "",
        field: "",
        trl: "",
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

      setActiveTab("myip");
      alert("IP application submitted successfully.");
    } catch (err) {
      console.error("submit IP:", err);
      alert("Failed to submit IP application.");
    }
    setLoading(false);
  };

  // Admin: update status / add patent number
  const adminUpdateStatus = async (ip, updates = {}) => {
    if (!isAdmin) return alert("Admin only.");
    try {
      await updateDoc(doc(db, "ips", ip.id), {
        ...updates,
        lastUpdatedAt: serverTimestamp(),
      });
      setIps((p) => p.map((x) => (x.id === ip.id ? { ...x, ...updates } : x)));

      // Add notification for status change
      if (updates.status) {
        await addDoc(collection(db, "ipNotifications"), {
          ipId: ip.id,
          message: `Status changed to "${updates.status}" for IP: ${ip.title}`,
          createdAt: serverTimestamp(),
        });

        // Refresh notifications
        const snap = await getDocs(query(collection(db, "ipNotifications"), orderBy("createdAt", "desc")));
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
      alert("Updated successfully.");
    } catch (err) {
      console.error("adminUpdateStatus:", err);
    }
  };

  // Create license (commercialization)
  const createLicense = async (payload) => {
    if (!isAdmin && (!user || user.uid !== payload.ownerUid)) return alert("Not allowed.");
    try {
      await addDoc(collection(db, "licenses"), {
        ...payload,
        createdAt: serverTimestamp(),
      });

      // Refresh licenses
      const snap = await getDocs(query(collection(db, "licenses"), orderBy("createdAt", "desc")));
      setLicenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      alert("License created.");
    } catch (err) {
      console.error("createLicense:", err);
      alert("Failed to create license.");
    }
  };

  // Record royalty payment for a license
  const recordRoyalty = async (licenseId, amount, note = "") => {
    try {
      await addDoc(collection(db, "royalties"), {
        licenseId,
        amount: Number(amount),
        note,
        recordedBy: user ? user.uid : "system",
        createdAt: serverTimestamp(),
      });
      alert("Royalty recorded.");
    } catch (err) {
      console.error("recordRoyalty:", err);
    }
  };

  // Helper to get display string for identification numbers
  const getIdNumberDisplay = (ip) => {
    const ids = ip.identificationNumbers || {};
    const parts = [];
    if (ids.patentNumber) parts.push(`Patent: ${ids.patentNumber}`);
    if (ids.applicationNumber) parts.push(`App: ${ids.applicationNumber}`);
    if (ids.trademarkRegNumber) parts.push(`TM: ${ids.trademarkRegNumber}`);
    if (ids.copyrightRegNumber) parts.push(`CR: ${ids.copyrightRegNumber}`);
    if (ids.designRegNumber) parts.push(`Design: ${ids.designRegNumber}`);
    // Also check legacy patentNo field
    if (!parts.length && ip.patentNo) parts.push(`Patent: ${ip.patentNo}`);
    return parts.join(" | ");
  };

  // Search / filter for My IP Portfolio - fixed: both search AND filterType work together
  const filteredIPs = ips.filter((ip) => {
    // Apply type filter first
    if (filterType && ip.ipType !== filterType) {
      return false;
    }

    // Apply search filter
    const q = search.trim().toLowerCase();
    if (q) {
      const ids = ip.identificationNumbers || {};
      const idString = Object.values(ids).join(" ").toLowerCase();
      return (
        ip.title.toLowerCase().includes(q) ||
        (ip.inventors || "").toLowerCase().includes(q) ||
        (ip.field || "").toLowerCase().includes(q) ||
        (ip.patentNo || "").toLowerCase().includes(q) ||
        idString.includes(q)
      );
    }

    return true;
  });

  // External IP provider sync stub
  const syncWithExternalIPProviders = async (ip) => {
    if (!ip) return;
    try {
      const fakeStatus = ["Under Examination", "Published", "Patent Granted"][Math.floor(Math.random() * 3)];
      await updateDoc(doc(db, "ips", ip.id), { status: fakeStatus, lastSyncedAt: serverTimestamp() });
      setIps((p) => p.map((x) => (x.id === ip.id ? { ...x, status: fakeStatus } : x)));

      await addDoc(collection(db, "ipNotifications"), {
        ipId: ip.id,
        message: `External sync set status "${fakeStatus}" for ${ip.title}`,
        createdAt: serverTimestamp(),
      });

      // Refresh notifications
      const snap = await getDocs(query(collection(db, "ipNotifications"), orderBy("createdAt", "desc")));
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      alert(`Synced (simulated). Status: ${fakeStatus}`);
    } catch (err) {
      console.error("syncWithExternalIPProviders:", err);
      alert("External sync failed (see console).");
    }
  };

  // UI helpers: dashboard counts
  const counts = {
    Submitted: ips.filter((p) => p.status === "Submitted").length,
    UnderExamination: ips.filter((p) => p.status === "Under Examination").length,
    Published: ips.filter((p) => p.status === "Published").length,
    Granted: ips.filter((p) => p.status === "Patent Granted" || p.status === "Granted").length,
  };

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Intellectual Property Management</h1>
          <p className="text-slate-600">Submit, track, and commercialize IP — patents, trademarks, designs, copyrights.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 flex-wrap">
          {[
            { key: "overview", label: "Overview" },
            { key: "submit", label: "Submit IP Application" },
            { key: "myip", label: "My IP Portfolio" },
            { key: "tracking", label: "Status Tracking" },
            { key: "integration", label: "External Integration" },
            { key: "commercialization", label: "Commercialization" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.key ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-600 hover:text-slate-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600">
                <h3 className="font-bold text-slate-800 text-lg">Submit New IP</h3>
                <p className="text-slate-600 mt-2">Submit new patent, trademark, design or copyright applications — files, metadata and project linkage.</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("submit")} className="bg-teal-600 text-white px-4 py-2 rounded-lg">New Application</button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-600">
                <h3 className="font-bold text-slate-800 text-lg">External Integration</h3>
                <p className="text-slate-600 mt-2">Sync IP statuses with external registries (WIPO/ARIPO/BRELA).</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("integration")} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Manage Sync</button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-600">
                <h3 className="font-bold text-slate-800 text-lg">Commercialization</h3>
                <p className="text-slate-600 mt-2">Create licensing agreements, track royalties and milestones.</p>
                <div className="mt-4">
                  <button onClick={() => setActiveTab("commercialization")} className="bg-green-600 text-white px-4 py-2 rounded-lg">Manage Licenses</button>
                </div>
              </div>
            </div>

            {/* Status Counts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Submitted</h4>
                <p className="text-3xl font-bold">{counts.Submitted}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Under Examination</h4>
                <p className="text-3xl font-bold">{counts.UnderExamination}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Published</h4>
                <p className="text-3xl font-bold">{counts.Published}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white shadow-md">
                <h4 className="text-lg font-semibold mb-2">Granted</h4>
                <p className="text-3xl font-bold">{counts.Granted}</p>
              </div>
            </div>

            {/* IP Types Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-slate-800 text-lg mb-4">IP Portfolio by Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["patent", "trademark", "copyright", "design"].map(type => {
                  const count = ips.filter(ip => ip.ipType === type).length;
                  const colors = {
                    patent: "bg-blue-50 text-blue-700 border-blue-200",
                    trademark: "bg-purple-50 text-purple-700 border-purple-200",
                    copyright: "bg-orange-50 text-orange-700 border-orange-200",
                    design: "bg-teal-50 text-teal-700 border-teal-200",
                  };
                  return (
                    <div key={type} className={`rounded-lg p-4 border ${colors[type]}`}>
                      <p className="text-sm font-semibold capitalize">{type}s</p>
                      <p className="text-2xl font-bold mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Submit IP Application */}
        {activeTab === "submit" && (
          <div className="bg-white rounded-xl p-8 shadow-md max-w-4xl mb-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Submit New IP Application</h2>
            {!user && <div className="mb-4 text-red-600">Please log in to submit IP applications.</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-2">IP Type</label>
                <select name="ipType" value={form.ipType} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Select IP type</option>
                  <option value="patent">Patent</option>
                  <option value="trademark">Trademark</option>
                  <option value="design">Industrial Design</option>
                  <option value="copyright">Copyright</option>
                </select>
              </div>

              {/* Expandable Identification Numbers Section */}
              {form.ipType && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 transition-all">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs uppercase">{form.ipType}</span>
                    Identification Numbers
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Enter existing registration or application numbers if available. These help with filtering and tracking.
                  </p>

                  {form.ipType === "patent" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Patent Number</label>
                        <input name="patentNumber" value={form.identificationNumbers.patentNumber} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., TZ/P/2024/000123" />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Application Number</label>
                        <input name="applicationNumber" value={form.identificationNumbers.applicationNumber} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., AP/P/2024/000456" />
                      </div>
                    </div>
                  )}

                  {form.ipType === "trademark" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Trademark Registration Number</label>
                        <input name="trademarkRegNumber" value={form.identificationNumbers.trademarkRegNumber} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., TM/2024/001234" />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Nice Classification (Class)</label>
                        <input name="trademarkClassification" value={form.identificationNumbers.trademarkClassification} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., Class 9, Class 42" />
                      </div>
                    </div>
                  )}

                  {form.ipType === "copyright" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Copyright Registration Number</label>
                        <input name="copyrightRegNumber" value={form.identificationNumbers.copyrightRegNumber} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., CR/2024/005678" />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Copyright Type</label>
                        <select name="copyrightType" value={form.identificationNumbers.copyrightType} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg">
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
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Design Registration Number</label>
                        <input name="designRegNumber" value={form.identificationNumbers.designRegNumber} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., ID/2024/000789" />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-1">Locarno Classification</label>
                        <input name="designClassification" value={form.identificationNumbers.designClassification} onChange={handleIdNumberChange}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., 14-01" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-2">IP Title / Name</label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Title or name" required />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Inventor(s) / Creator(s)</label>
                <input name="inventors" value={form.inventors} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Comma-separated names" required />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Abstract / Description</label>
                <textarea name="abstract" value={form.abstract} onChange={handleChange} rows="5" className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Abstract or detailed description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Field of Application</label>
                  <input name="field" value={form.field} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g., Healthcare" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Technology Readiness Level</label>
                  <select name="trl" value={form.trl} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                    <option value="">Select TRL</option>
                    <option value="1">TRL 1</option>
                    <option value="2">TRL 2</option>
                    <option value="3">TRL 3</option>
                    <option value="4">TRL 4</option>
                    <option value="5">TRL 5</option>
                    <option value="6">TRL 6</option>
                    <option value="7">TRL 7</option>
                    <option value="8">TRL 8</option>
                    <option value="9">TRL 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Project ID (optional)</label>
                  <input name="projectId" value={form.projectId} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Link to project (ID)" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Upload Documentation (drafts, drawings)</label>
                <input name="files" type="file" multiple onChange={handleChange} accept=".pdf,.doc,.docx,.png,.jpg" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                <p className="text-sm text-slate-500 mt-1">Upload patent drafts, technical drawings, or other supporting documents.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Prior Art / References</label>
                <textarea name="priorArt" value={form.priorArt} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="List prior art or references" />
              </div>

              <div className="flex gap-4">
                <button disabled={!user || loading} type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg">{loading ? "Submitting..." : "Submit Application"}</button>
                <button type="button" onClick={() => {
                  setForm({ ipType: "", title: "", inventors: "", abstract: "", field: "", trl: "", priorArt: "", projectId: "", files: [] });
                }} className="bg-slate-200 px-6 py-2 rounded-lg">Reset</button>
              </div>
            </form>
          </div>
        )}

        {/* My IP Portfolio - BASE DATA */}
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

            {loading && <p className="text-slate-600">Loading...</p>}
            {!loading && filteredIPs.length === 0 && <p className="text-slate-600">No IP records found.</p>}

            <div className="grid gap-4">
              {filteredIPs.map((ip) => {
                const idDisplay = getIdNumberDisplay(ip);
                return (
                <div key={ip.id} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ip.ipType === 'patent' ? 'bg-blue-100 text-blue-800' :
                          ip.ipType === 'trademark' ? 'bg-purple-100 text-purple-800' :
                          ip.ipType === 'copyright' ? 'bg-orange-100 text-orange-800' :
                          ip.ipType === 'design' ? 'bg-teal-100 text-teal-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>{ip.ipType}</span>
                        <h3 className="text-xl font-bold text-slate-800">{ip.title}</h3>
                      </div>
                      <p className="text-slate-600">Inventors: {ip.inventors}</p>
                      <p className="text-slate-500 text-sm">
                        Project: {ip.projectId || "—"} • Status: <strong className={
                          ip.status === 'Submitted' ? 'text-yellow-700' :
                          ip.status === 'Under Examination' ? 'text-blue-700' :
                          ip.status === 'Published' ? 'text-purple-700' :
                          (ip.status === 'Patent Granted' || ip.status === 'Granted') ? 'text-green-700' :
                          'text-slate-700'
                        }>{ip.status}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Submitted: {ip.createdAt ? new Date(ip.createdAt.seconds * 1000).toLocaleDateString() : "—"}</p>
                      {ip.patentNo && <p className="text-sm text-slate-600">Patent No: {ip.patentNo}</p>}
                    </div>
                  </div>

                  {/* Identification Numbers Display */}
                  {idDisplay && (
                    <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Identification Numbers</p>
                      <p className="text-sm text-slate-700 font-medium">{idDisplay}</p>
                    </div>
                  )}

                  <p className="text-slate-700 mb-3">{ip.abstract}</p>

                  {ip.field && <p className="text-xs text-slate-500 mb-3">Field: {ip.field} {ip.trl ? `• TRL: ${ip.trl}` : ""}</p>}

                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) { alert("Popup blocked."); return; }
                      w.document.write(`<pre style="font-family:monospace;margin:20px">${JSON.stringify(ip, null, 2)}</pre>`);
                      w.document.close();
                    }} className="text-teal-600 underline text-sm">View Details</button>

                    {isAdmin && (
                      <>
                        <button onClick={async () => {
                          const newStatus = prompt("Enter new status (e.g., Under Examination, Published, Patent Granted)", ip.status || "Under Examination");
                          if (newStatus) await adminUpdateStatus(ip, { status: newStatus });
                        }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Update Status</button>

                        <button onClick={async () => {
                          const patentNo = prompt("Enter patent/registration number (if any)", ip.patentNo || "");
                          if (patentNo) await adminUpdateStatus(ip, { patentNo, status: "Patent Granted" });
                        }} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Set Patent No</button>

                        <button onClick={() => syncWithExternalIPProviders(ip)} className="bg-amber-500 text-white px-3 py-1 rounded text-sm">Sync External</button>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Status Tracking - DERIVED FROM MY IP PORTFOLIO */}
        {activeTab === "tracking" && (() => {
          const approvedIPs = ipsForTracking.filter(ip =>
            ip.status === "Patent Granted" || ip.status === "Granted" || ip.status === "Published"
          );
          const pendingIPs = ipsForTracking.filter(ip =>
            ip.status === "Submitted" || ip.status === "Under Examination"
          );
          const otherIPs = ipsForTracking.filter(ip =>
            !["Patent Granted", "Granted", "Published", "Submitted", "Under Examination"].includes(ip.status)
          );

          const renderIPCard = (ip, borderColor) => (
            <div key={ip.id} className={`bg-white rounded-lg p-5 shadow-md border-l-4 ${borderColor}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-slate-800">{ip.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      ip.ipType === 'patent' ? 'bg-blue-100 text-blue-800' :
                      ip.ipType === 'trademark' ? 'bg-purple-100 text-purple-800' :
                      ip.ipType === 'copyright' ? 'bg-orange-100 text-orange-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>{ip.ipType}</span>
                  </div>
                  <p className="text-sm text-slate-600">Inventors: {ip.inventors}</p>
                  {ip.patentNo && <p className="text-xs text-slate-500 mt-1">Registration No: {ip.patentNo}</p>}
                  {ip.identificationNumbers && (() => {
                    const ids = ip.identificationNumbers;
                    const parts = [];
                    if (ids.patentNumber) parts.push(`Patent: ${ids.patentNumber}`);
                    if (ids.trademarkRegNumber) parts.push(`TM: ${ids.trademarkRegNumber}`);
                    if (ids.copyrightRegNumber) parts.push(`CR: ${ids.copyrightRegNumber}`);
                    if (ids.designRegNumber) parts.push(`Design: ${ids.designRegNumber}`);
                    return parts.length > 0 ? <p className="text-xs text-slate-500 mt-1">{parts.join(" | ")}</p> : null;
                  })()}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ip.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                    ip.status === 'Under Examination' ? 'bg-blue-100 text-blue-800' :
                    ip.status === 'Published' ? 'bg-purple-100 text-purple-800' :
                    ip.status === 'Patent Granted' || ip.status === 'Granted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ip.status}
                  </span>
                  {ip.createdAt && (
                    <p className="text-xs text-slate-500 mt-2">{new Date(ip.createdAt.seconds * 1000).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {ip.relatedNotifications && ip.relatedNotifications.length > 0 && (
                <div className="mt-3 bg-slate-50 p-3 rounded">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Recent Updates ({ip.relatedNotifications.length})</p>
                  {ip.relatedNotifications.slice(0, 3).map((notif) => (
                    <p key={notif.id} className="text-xs text-slate-600">- {notif.message}</p>
                  ))}
                </div>
              )}
            </div>
          );

          return (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">IP Status Tracking</h2>
            <p className="text-slate-600 mb-6">Track the approval status of all your IP applications.</p>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-green-700">Approved / Granted</p>
                <p className="text-3xl font-bold text-green-800 mt-1">{approvedIPs.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-yellow-700">Pending (Submitted)</p>
                <p className="text-3xl font-bold text-yellow-800 mt-1">{pendingIPs.filter(ip => ip.status === "Submitted").length}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-blue-700">Under Examination</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">{pendingIPs.filter(ip => ip.status === "Under Examination").length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">Total IPs</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{ipsForTracking.length}</p>
              </div>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-700">Recent Notifications</h3>
                <div className="grid gap-2">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="bg-gray-50 px-4 py-3 rounded-lg border-l-4 border-teal-600">
                      <p className="text-slate-800 text-sm font-medium">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ipsForTracking.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <p className="text-slate-500 text-lg">No IPs in your portfolio yet.</p>
                <button onClick={() => setActiveTab("submit")} className="mt-3 text-teal-600 underline">Submit an IP Application</button>
              </div>
            ) : (
              <>
                {/* Approved / Granted IPs */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3 text-green-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                    Approved / Granted IPs ({approvedIPs.length})
                  </h3>
                  {approvedIPs.length === 0 ? (
                    <p className="text-slate-500 text-sm ml-5">No approved or granted IPs yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {approvedIPs.map(ip => renderIPCard(ip, "border-green-500"))}
                    </div>
                  )}
                </div>

                {/* Pending IPs */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3 text-yellow-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                    Pending IPs ({pendingIPs.length})
                  </h3>
                  {pendingIPs.length === 0 ? (
                    <p className="text-slate-500 text-sm ml-5">No pending IPs.</p>
                  ) : (
                    <div className="grid gap-3">
                      {pendingIPs.map(ip => renderIPCard(ip, ip.status === "Under Examination" ? "border-blue-500" : "border-yellow-500"))}
                    </div>
                  )}
                </div>

                {/* Other IPs (if any with non-standard statuses) */}
                {otherIPs.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3 text-slate-700 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
                      Other ({otherIPs.length})
                    </h3>
                    <div className="grid gap-3">
                      {otherIPs.map(ip => renderIPCard(ip, "border-slate-400"))}
                    </div>
                  </div>
                )}
              </>
            )}

            {isAdmin && ips.length > 0 && (
              <div className="mt-6">
                <button onClick={async () => {
                  if (!window.confirm("Sync all IPs with external registries?")) return;
                  setLoading(true);
                  for (const ip of ips) await syncWithExternalIPProviders(ip);
                  setLoading(false);
                }} disabled={loading} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                  {loading ? "Syncing..." : "Sync All with External Registries (Admin)"}
                </button>
              </div>
            )}
          </div>
          );
        })()}

        {/* External Integration */}
        {activeTab === "integration" && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">External Integration</h2>
            <p className="text-slate-600 mb-6">Sync your IP statuses with external registries like WIPO, ARIPO, and BRELA.</p>

            {/* Integration Status Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-600">
                <h4 className="font-bold text-slate-800">WIPO</h4>
                <p className="text-sm text-slate-600 mt-1">World Intellectual Property Organization</p>
                <p className="text-xs text-slate-500 mt-2">International patent and trademark filings</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Available</span>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-purple-600">
                <h4 className="font-bold text-slate-800">ARIPO</h4>
                <p className="text-sm text-slate-600 mt-1">African Regional IP Organization</p>
                <p className="text-xs text-slate-500 mt-2">Regional patent and design registrations</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Available</span>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-teal-600">
                <h4 className="font-bold text-slate-800">BRELA</h4>
                <p className="text-sm text-slate-600 mt-1">Business Registrations and Licensing Agency</p>
                <p className="text-xs text-slate-500 mt-2">Tanzania local IP registrations</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Available</span>
              </div>
            </div>

            {/* IPs to sync */}
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Your IP Records ({ips.length})</h3>
                {isAdmin && ips.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Sync all ${ips.length} IP records with external registries?`)) return;
                      setLoading(true);
                      try {
                        for (const ip of ips) {
                          await syncWithExternalIPProviders(ip);
                        }
                      } catch (err) {
                        console.error("Bulk sync error:", err);
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    {loading ? "Syncing..." : "Sync All Records"}
                  </button>
                )}
              </div>

              {ips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No IP records to sync. Submit an IP application first.</p>
                  <button onClick={() => setActiveTab("submit")} className="mt-3 text-teal-600 underline">Submit IP Application</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-3 py-2 font-semibold text-slate-700">Title</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-700">Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-700">Status</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-700">Last Synced</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ips.map(ip => (
                        <tr key={ip.id} className="border-t hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-800 font-medium">{ip.title}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              ip.ipType === 'patent' ? 'bg-blue-100 text-blue-800' :
                              ip.ipType === 'trademark' ? 'bg-purple-100 text-purple-800' :
                              ip.ipType === 'copyright' ? 'bg-orange-100 text-orange-800' :
                              'bg-teal-100 text-teal-800'
                            }`}>{ip.ipType}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              ip.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                              ip.status === 'Under Examination' ? 'bg-blue-100 text-blue-800' :
                              ip.status === 'Published' ? 'bg-purple-100 text-purple-800' :
                              (ip.status === 'Patent Granted' || ip.status === 'Granted') ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>{ip.status}</span>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {ip.lastSyncedAt ? new Date(ip.lastSyncedAt.seconds * 1000).toLocaleString() : "Never"}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => syncWithExternalIPProviders(ip)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                            >
                              Sync Now
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sync Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-bold text-blue-800 mb-2">How External Sync Works</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc ml-4">
                <li>The system queries WIPO, ARIPO, and BRELA databases for status updates on your IP filings.</li>
                <li>Status changes (e.g., "Under Examination" to "Published" or "Granted") are automatically reflected.</li>
                <li>Notifications are generated for each status change so you can track progress.</li>
                <li>Admins can trigger bulk sync for all records. Individual users can sync their own records.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Commercialization */}
        {activeTab === "commercialization" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Commercialization & Licensing</h2>

            {/* Eligible IPs for Licensing */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Eligible IPs for Licensing</h3>
              {ipsForCommercialization.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-md">
                  <p className="text-slate-600 text-lg">No Eligible IPs Application</p>
                </div>
              ) : null}
              <div className="grid gap-3">
                {ipsForCommercialization.map((ip) => (
                  <div key={ip.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800">{ip.title}</h4>
                        <p className="text-sm text-slate-600">Type: {ip.ipType} • Status: {ip.status}</p>
                        {ip.patentNo && <p className="text-xs text-slate-500">Patent No: {ip.patentNo}</p>}
                      </div>
                      <button onClick={() => {
                        const licensee = prompt("Licensee name");
                        const royalty = prompt("Royalty % (number)");
                        if (!licensee || !royalty) return;
                        createLicense({
                          ipId: ip.id,
                          ipTitle: ip.title,
                          licensee,
                          royaltyRate: Number(royalty),
                          ownerUid: user?.uid || null
                        });
                      }} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Create License</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Licenses */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Existing Licenses</h3>
              <div className="grid gap-4">
                {licenses.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-md">
                    <p className="text-slate-600 text-lg">No Existing Licences</p>
                  </div>
                )}
                {licenses.map((lic) => (
                  <div key={lic.id} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{lic.ipTitle || lic.ipId}</h3>
                        <p className="text-slate-600 text-sm">Licensee: {lic.licensee}</p>
                        <p className="text-slate-600 text-sm">Royalty: {lic.royaltyRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{lic.createdAt ? new Date(lic.createdAt.seconds * 1000).toLocaleDateString() : ""}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-3">
                      <button onClick={() => {
                        const amount = prompt("Enter royalty amount (TZS)");
                        const note = prompt("Note (optional)");
                        if (amount) recordRoyalty(lic.id, amount, note || "");
                      }} className="bg-teal-600 text-white px-3 py-1 rounded">Record Royalty</button>

                      <button onClick={() => {
                        const w = window.open("", "_blank");
                        w.document.write(`<pre style="font-family:monospace;margin:20px">${JSON.stringify(lic,null,2)}</pre>`);
                        w.document.close();
                      }} className="text-slate-700 underline">View</button>
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

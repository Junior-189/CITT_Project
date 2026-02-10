import React, { useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProfileForm = () => {
  const { saveProfile, setShowProfileForm } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    university: "",
    college: "",
    category: "student",
    yearOfStudy: "",
    role: "innovator",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Set a timeout to warn user if it's taking too long
    const timeoutId = setTimeout(() => {
      setError('Save is taking longer than expected. Please check your internet connection.');
    }, 8000);

    try {
      await saveProfile(formData);
      clearTimeout(timeoutId);
      // Close the modal
      setShowProfileForm(false);
      // Redirect to home page after profile completion
      navigate('/');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Failed to save profile:", err);
      const errorMessage = err.message || 'Failed to save profile. Please try again.';
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white text-slate-800 rounded-xl p-8 shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-center text-slate-700">
          Complete Your Profile
        </h2>
        <p className="text-center text-slate-600 text-sm mb-6">
          Please provide additional details to complete your profile setup.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
            <input name="fullName" value={formData.fullName} placeholder="Full Name" onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Phone *</label>
            <input name="phone" value={formData.phone} placeholder="Phone or Email" onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">University *</label>
            <input name="university" value={formData.university} placeholder="University" onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">College *</label>
            <input name="college" value={formData.college} placeholder="College" onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {formData.category === "student" && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Year of Study</label>
              <input name="yearOfStudy" value={formData.yearOfStudy} placeholder="Year of Study" onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Role *</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="innovator">Innovator/Researcher</option>
              <option value="ipManager">IP Manager</option>
              <option value="fundingManager">Funding Manager</option>
              <option value="administrator">Administrator/Committee</option>
              <option value="technicalCommittee">Technical Committee</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-2 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : 'Save Profile'}
            </button>
            <button 
              type="button"
              onClick={() => setShowProfileForm(false)}
              className="flex-1 bg-slate-300 text-slate-800 py-2 rounded hover:bg-slate-400 font-semibold transition-colors"
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminGallery = () => {
  const { getAuthenticatedAxios } = useAuth();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_name: "",
    image: null,
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get("/api/gallery");
      setImages(response.data.images || []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      setError("Failed to load gallery images.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.image) {
      setError("Please select an image to upload.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }

    setUploading(true);
    try {
      const api = getAuthenticatedAxios();
      const data = new FormData();
      data.append("image", formData.image);
      data.append("title", formData.title.trim());
      if (formData.description.trim()) {
        data.append("description", formData.description.trim());
      }
      if (formData.event_name.trim()) {
        data.append("event_name", formData.event_name.trim());
      }

      await api.post("/api/gallery", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Image uploaded successfully!");
      setFormData({ title: "", description: "", event_name: "", image: null });
      setPreview(null);
      // Reset file input
      const fileInput = document.getElementById("gallery-file-input");
      if (fileInput) fileInput.value = "";
      fetchImages();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.error || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId, imageTitle) => {
    if (!window.confirm(`Delete "${imageTitle}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/gallery/${imageId}`);
      setSuccess("Image deleted successfully!");
      fetchImages();
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.response?.data?.error || "Failed to delete image.");
    }
  };

  const dismissAlert = () => {
    setError("");
    setSuccess("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-800">
            Gallery Management
          </h1>
          <p className="text-slate-600">
            Upload and manage photos from events, workshops, and exhibitions.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-start">
              <p className="text-red-700">{error}</p>
              <button
                onClick={dismissAlert}
                className="text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex justify-between items-start">
              <p className="text-green-700">{success}</p>
              <button
                onClick={dismissAlert}
                className="text-green-500 hover:text-green-700"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Upload New Image
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Innovation Hackathon 2025 Opening"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Innovation Week 2025"
                  value={formData.event_name}
                  onChange={(e) =>
                    setFormData({ ...formData, event_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Description
              </label>
              <textarea
                placeholder="Brief description of the photo"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Image *
              </label>
              <input
                id="gallery-file-input"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Accepted formats: JPEG, PNG, GIF, WebP. Max size: 10MB.
              </p>
            </div>

            {/* Image Preview */}
            {preview && (
              <div className="relative w-48">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-48 h-36 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setFormData({ ...formData, image: null });
                    const fileInput =
                      document.getElementById("gallery-file-input");
                    if (fileInput) fileInput.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:bg-slate-400 font-medium"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: "",
                    description: "",
                    event_name: "",
                    image: null,
                  });
                  setPreview(null);
                  const fileInput =
                    document.getElementById("gallery-file-input");
                  if (fileInput) fileInput.value = "";
                }}
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 font-medium"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Gallery Images List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">
              All Gallery Images
            </h2>
            <span className="text-slate-500 text-sm">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">
                No gallery images yet. Upload your first image above.
              </p>
            </div>
          )}

          {!loading && images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${img.image_url}`}
                      alt={img.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {img.event_name && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {img.event_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800">
                      {img.title}
                    </h3>
                    {img.description && (
                      <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                        {img.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-slate-400 text-xs">
                        {formatDate(img.created_at)}
                        {img.uploaded_by_name &&
                          ` by ${img.uploaded_by_name}`}
                      </span>
                      <button
                        onClick={() => handleDelete(img.id, img.title)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminGallery;

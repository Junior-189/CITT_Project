import { useState, useEffect } from "react";
import axios from "axios";
import { X, Image as ImageIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/gallery`);
      setImages(response.data.images || []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      setError("Failed to load gallery images.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600 text-lg">Loading gallery...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800">Gallery</h1>
          <p className="text-slate-600 mt-2">
            Photos and highlights from CITT events, workshops, and exhibitions.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && images.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No photos yet
            </h3>
            <p className="text-slate-500">
              Gallery photos from events will appear here once uploaded.
            </p>
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setSelectedImage(img)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={`${API_BASE_URL}${img.image_url}`}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {img.title}
                  </h3>
                  {img.description && (
                    <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                      {img.description}
                    </p>
                  )}
                  <p className="text-slate-400 text-xs mt-2">
                    {formatDate(img.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              <img
                src={`${API_BASE_URL}${selectedImage.image_url}`}
                alt={selectedImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />

              <div className="mt-4 text-white">
                <h3 className="text-xl font-bold">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-gray-300 mt-1">
                    {selectedImage.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  {selectedImage.event_name && (
                    <span>Event: {selectedImage.event_name}</span>
                  )}
                  <span>{formatDate(selectedImage.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Gallery;

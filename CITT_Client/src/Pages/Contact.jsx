import { useState } from 'react';
import { MapPin, Mail, Phone, Globe, Upload, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDirectorPhotos } from '../hooks/useDirectorPhotos';

const DIRECTORS = [
  { title: 'DII Director', dept: 'Department of Innovations & Incubation', key: 'dii' },
  { title: 'DEBM Director', dept: 'Dept. of Entrepreneurship & Business Management', key: 'debm' },
  { title: 'RTP Director', dept: 'Rural Technology Promotion', key: 'rtp' },
];

const Contact = () => {
  const { role, getAuthenticatedAxios, profile } = useAuth();
  const { photos: hookPhotos } = useDirectorPhotos();
  const [uploadedPhotos, setUploadedPhotos] = useState({});
  const isAdminUser = !!profile && ['admin', 'superAdmin', 'transferTechnologyOfficer'].includes(role);

  // Merge hook-fetched photos with any locally uploaded photos (uploads take precedence)
  const directorPhotos = { ...hookPhotos, ...uploadedPhotos };

  const handleDirectorPhotoUpload = async (code, file) => {
    if (!file) return;
    try {
      const api = getAuthenticatedAxios();
      const form = new FormData();
      form.append('photo', file);
      const res = await api.post(`/api/workspace/director-photo/${code}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedPhotos(p => ({ ...p, [code]: res.data.photo_url }));
    } catch (e) { console.error('Photo upload failed:', e); }
  };

  return (
    <main className="bg-gray-50 text-slate-800">
      {/* Hero */}
      <section className="bg-teal-700 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Contact CITT</h1>
        <p className="text-teal-100 max-w-xl mx-auto text-base">
          Reach out to the Centre for Innovation and Technology Transfer at Mbeya University of Science and Technology.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: <MapPin className="w-6 h-6 text-teal-600" />, title: 'Address', content: 'Mbeya University of Science and Technology, Mbeya, Tanzania' },
          { icon: <Mail className="w-6 h-6 text-teal-600" />, title: 'Email', content: <a href="mailto:citt@mustnet.ac.tz" className="text-teal-600 hover:underline">citt@mustnet.ac.tz</a> },
          { icon: <Phone className="w-6 h-6 text-teal-600" />, title: 'Phone', content: <a href="tel:+255252957544" className="text-teal-600 hover:underline">+255 25 295 7544</a> },
          { icon: <Globe className="w-6 h-6 text-teal-600" />, title: 'Website', content: <a href="https://www.must.ac.tz" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">www.must.ac.tz</a> },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="flex justify-center mb-3">{card.icon}</div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{card.title}</p>
            <p className="text-sm text-slate-700 font-medium">{card.content}</p>
          </div>
        ))}
      </section>

      {/* Directors Section */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">Our Directors</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Leadership of the Centre for Innovation and Technology Transfer</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIRECTORS.map(d => {
              const photoUrl = directorPhotos[d.key.toUpperCase()];
              return (
                <div key={d.key} className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                  <div className="relative mx-auto mb-4 w-24 h-24">
                    {photoUrl ? (
                      <img src={photoUrl} alt={d.title} className="w-24 h-24 rounded-full object-cover border-4 border-teal-100" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-teal-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800">{d.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">{d.dept}</p>
                  <p className="text-xs text-slate-400 italic mb-3">Directors can update their photo from their workspace profile.</p>
                  {isAdminUser && (
                    <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => handleDirectorPhotoUpload(d.key.toUpperCase(), e.target.files[0])} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Find Us */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Find Us</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-100 h-64 flex flex-col items-center justify-center gap-3">
            <MapPin className="w-10 h-10 text-gray-400" />
            <p className="text-gray-500 text-sm">Mbeya University of Science and Technology</p>
            <a
              href="https://maps.google.com/?q=Mbeya+University+of+Science+and+Technology"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              View on Google Maps
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;

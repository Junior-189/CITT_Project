import { useState } from 'react';
import { MapPin, Mail, Phone, Globe, Upload, User, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDirectorPhotos } from '../hooks/useDirectorPhotos';
import api from '../services/api';

const DIRECTORS = [
  { title: 'DII Director', dept: 'Department of Innovations & Incubation', key: 'dii' },
  { title: 'DEBM Director', dept: 'Dept. of Entrepreneurship & Business Management', key: 'debm' },
  { title: 'RTP Director', dept: 'Rural Technology Promotion', key: 'rtp' },
];

const SOCIAL_LINKS = [
  { label: 'Email', href: 'mailto:citt@mustnet.ac.tz', icon: Mail },
  { label: 'Phone', href: 'tel:+255252957544', icon: Phone },
  { label: 'Website', href: 'https://www.must.ac.tz', icon: Globe },
];

const Contact = () => {
  const { role, getAuthenticatedAxios, profile } = useAuth();
  const { photos: hookPhotos } = useDirectorPhotos();
  const [uploadedPhotos, setUploadedPhotos] = useState({});
  const isAdminUser = !!profile && ['admin', 'superAdmin'].includes(role);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState({ loading: false, success: '', error: '' });

  const directorPhotos = { ...hookPhotos, ...uploadedPhotos };

  const handleDirectorPhotoUpload = async (code, file) => {
    if (!file) return;
    try {
      const apiAxios = getAuthenticatedAxios();
      const formData = new FormData();
      formData.append('photo', file);
      const res = await apiAxios.post(`/api/workspace/director-photo/${code}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedPhotos(p => ({ ...p, [code]: res.data.photo_url }));
    } catch (e) { console.error('Photo upload failed:', e); }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setFormStatus({ loading: false, success: '', error: 'All fields are required.' });
      return;
    }
    if (form.message.length < 10) {
      setFormStatus({ loading: false, success: '', error: 'Message must be at least 10 characters.' });
      return;
    }
    setFormStatus({ loading: true, success: '', error: '' });
    try {
      await api.post('/api/contact', form);
      setFormStatus({ loading: false, success: 'Your message has been received. We will get back to you soon.', error: '' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setFormStatus({ loading: false, success: '', error: err.response?.data?.error || 'Failed to send message. Please try again.' });
    }
  };

  return (
    <main className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Hero */}
      {!isAdminUser && (
      <section className="bg-teal-700 dark:bg-slate-800 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Contact CITT</h1>
        <p className="text-teal-100 max-w-xl mx-auto text-base">
          Reach out to the Centre for Innovation and Technology Transfer at Mbeya University of Science and Technology.
        </p>
      </section>
      )}

      {/* Contact Info Cards */}
      {!isAdminUser && (
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: <MapPin className="w-6 h-6 text-teal-600" />, title: 'Address', content: 'Mbeya University of Science and Technology, Mbeya, Tanzania' },
          { icon: <Mail className="w-6 h-6 text-teal-600" />, title: 'Email', content: <a href="mailto:citt@mustnet.ac.tz" className="text-teal-600 dark:text-teal-400 hover:underline">citt@mustnet.ac.tz</a> },
          { icon: <Phone className="w-6 h-6 text-teal-600" />, title: 'Phone', content: <a href="tel:+255252957544" className="text-teal-600 dark:text-teal-400 hover:underline">+255 25 295 7544</a> },
          { icon: <Globe className="w-6 h-6 text-teal-600" />, title: 'Website', content: <a href="https://www.must.ac.tz" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">www.must.ac.tz</a> },
        ].map(card => (
          <div key={card.title} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
            <div className="flex justify-center mb-3">{card.icon}</div>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">{card.title}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{card.content}</p>
          </div>
        ))}
      </section>
      )}

      {/* Contact Form + Map side by side */}
      {!isAdminUser && (
      <section className="max-w-5xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Send Us a Message</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Fill out the form below and we will get back to you.</p>

          {formStatus.success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">{formStatus.success}</p>
            </div>
          )}
          {formStatus.error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{formStatus.error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="your.email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject *</label>
              <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="What is this about?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Message *</label>
              <textarea rows="4" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Write your message here (min 10 characters)" />
            </div>
            <button type="submit" disabled={formStatus.loading}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
              {formStatus.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
            </button>
          </form>
        </div>

        {/* Map + Social Links */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm flex-1">
            <iframe
              title="CITT Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.543368556886!2d33.432!3d-8.904!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwNTQnMTQuNCJTIDMzwrAyNSc1NS4yIkU!5e0!3m2!1sen!2stz!4v1"
              className="w-full h-full min-h-[300px] border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Connect With Us</h3>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    title={link.label}>
                    <Icon className="w-4 h-4" /> {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Directors Section */}
      <section className="bg-white dark:bg-slate-800 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Our Directors</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-8">Leadership of the Centre for Innovation and Technology Transfer</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIRECTORS.map(d => {
              const photoUrl = directorPhotos[d.key.toUpperCase()];
              return (
                <div key={d.key} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 text-center border border-gray-100 dark:border-slate-700">
                  <div className="relative mx-auto mb-4 w-24 h-24">
                    {photoUrl ? (
                      <img src={photoUrl} alt={d.title} className="w-24 h-24 rounded-full object-cover border-4 border-teal-100 dark:border-teal-800" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                        <User className="w-10 h-10 text-teal-400 dark:text-teal-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{d.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3">{d.dept}</p>

                  {isAdminUser && (
                    <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-800/40 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-semibold transition-colors">
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
    </main>
  );
};

export default Contact;

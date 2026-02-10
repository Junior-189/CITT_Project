import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGlobal } from '../services/api';

const Hero = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('Please enter a search keyword');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      const results = await searchGlobal(keyword);
      setSearchResults(results);
      
      if (results.total === 0) {
        setError('No results found for your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchResults(null);
    setError('');
  };

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-teal-700 text-white rounded-xl p-10 text-center mb-10 min-h-[60vh] flex flex-col justify-center">
        <h2 className="text-4xl font-bold mb-2.5">
          Welcome to the Centre for Innovation & Technology Transfer System
        </h2>
        <p className="text-slate-100 mb-5">
          Promoting innovation, research, and technology advancement at Mbeya University of Science and Technology.
        </p>
        <form onSubmit={handleSearch} className="flex justify-center gap-2.5">
          <input
            type="text"
            placeholder="Type programme keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="px-2.5 py-2.5 rounded-md w-96 text-black border-2 border-white focus:border-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-teal-600 text-white border-none rounded-md cursor-pointer hover:bg-teal-700 disabled:bg-teal-800 transition-colors font-semibold"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {/* Search Results Section */}
      {searchResults && (
        <section className="mb-10 bg-slate-50 rounded-xl p-8 border-l-4 border-teal-600">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Search Results {searchResults.total > 0 && <span className="text-teal-600">({searchResults.total} found)</span>}
            </h3>
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-slate-300 text-slate-800 rounded-md hover:bg-slate-400 transition-colors font-semibold"
            >
              Clear Search
            </button>
          </div>

          {/* Events Results */}
          {searchResults.events && searchResults.events.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-teal-600 pb-2">
                📅 Events ({searchResults.events.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-teal-600 transition-all cursor-pointer"
                    onClick={() => navigate(`/events?id=${event.id}`)}
                  >
                    <h5 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">{event.title}</h5>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{event.category}</span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                    {event.start_date && (
                      <p className="text-xs text-slate-500 mt-2">
                        🗓️ {new Date(event.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {searchResults.users && searchResults.users.length > 0 && (
            <div>
              <h4 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-teal-600 pb-2">
                👥 Users ({searchResults.users.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-teal-600 transition-all cursor-pointer"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <h5 className="font-bold text-slate-800 text-lg mb-2">{user.name}</h5>
                    <p className="text-sm text-slate-600 mb-2">📧 {user.email}</p>
                    {user.phone && <p className="text-sm text-slate-600 mb-2">📱 {user.phone}</p>}
                    <p className="text-xs text-slate-500">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchResults.total === 0 && (
            <div className="text-center py-8">
              <p className="text-lg text-slate-600">
                No results found for "<strong>{keyword}</strong>"
              </p>
              <p className="text-sm text-slate-500 mt-2">Try searching for different keywords</p>
            </div>
          )}
        </section>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-10 bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Cards Grid Section */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {/* Register Your Innovation */}
        <div
          onClick={() => navigate('/login')}
          className="bg-white rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
        >
          <h3 className="text-slate-800 font-bold text-xl mb-2.5">
            Register Your Innovation
          </h3>
          <p className="text-slate-700">
            Submit details of your research or startup idea for funding and collaboration opportunities.
          </p>
        </div>

        {/* Funding Opportunities */}
        <div
          onClick={() => navigate('/funding')}
          className="bg-white rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
        >
          <h3 className="text-slate-800 font-bold text-xl mb-2.5">
            Funding Opportunities
          </h3>
          <p className="text-slate-700">
            Explore available grants, sponsorships, and investments for innovators and research projects.
          </p>
        </div>

        {/* Intellectual Property */}
        <div
          onClick={() => navigate('/ip')}
          className="bg-white rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
        >
          <h3 className="text-slate-800 font-bold text-xl mb-2.5">
            Intellectual Property
          </h3>
          <p className="text-slate-700">
            Protect your innovation by registering patents, trademarks, and copyrights through ITTMS.
          </p>
        </div>

        {/* Events & Exhibitions */}
        <div
          onClick={() => navigate('/events')}
          className="bg-white rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
        >
          <h3 className="text-slate-800 font-bold text-xl mb-2.5">
            Events & Exhibitions
          </h3>
          <p className="text-slate-700">
            Stay informed about innovation challenges, exhibitions, and university-wide tech events.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Hero;

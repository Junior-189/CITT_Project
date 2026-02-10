import { Link } from 'react-router-dom';
import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext';

const CTA = () => {
  const { user, profile } = useContext(AuthContext);

  // Only show CTA when user is NOT logged in
  if (user || profile) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-slate-800 to-teal-700 text-white py-16 px-5 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-5">
          Ready to Start Your Innovation Journey?
        </h2>
        <p className="text-xl mb-8 opacity-95">
          Join MUST's Centre for Innovation and Technology Transfer today and transform your ideas into reality
        </p>
        <div className="flex justify-center gap-5 flex-wrap">
          <Link 
            to="/register" 
            className="px-9 py-4 rounded-full no-underline font-semibold text-lg transition-all duration-300 inline-block bg-white text-slate-800 hover:transform hover:-translate-y-1 hover:shadow-2xl"
          >
            Register Now
          </Link>
          <Link 
            to="https://must.ac.tz/academics/centres/centre-for-innovation-and-technology-transfer" 
            className="px-9 py-4 rounded-full no-underline font-semibold text-lg transition-all duration-300 inline-block bg-transparent text-white border-2 border-white hover:bg-white hover:text-slate-800"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CTA
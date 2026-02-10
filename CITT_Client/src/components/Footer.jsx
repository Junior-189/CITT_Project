import React from "react";
import { Link } from "react-router-dom"; // ✅ Import Link

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Footer Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-10 mb-8">
          {/* About ITTMS */}
          <div>
            <h3 className="text-xl font-bold mb-5 text-teal-400">
              About ITTMS
            </h3>
            <p className="text-white opacity-80 leading-relaxed">
              The Innovation and Technology Transfer Management System supports
              MUST's Centre for Innovation and Technology Transfer in managing
              innovations, research projects, IP, startups, and funding.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-5 text-teal-400">
              Quick Links
            </h3>
            <ul className="list-none">
              <li className="mb-2.5">
                <Link
                  to="/about"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  About CITT
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/innovation-programs"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Innovation Programs
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/startup-incubation"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Startup Incubation
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/funding"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Funding Opportunities
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/success-stories"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xl font-bold mb-5 text-teal-400">Resources</h3>
            <ul className="list-none">
              <li className="mb-2.5">
                <Link
                  to="https://must.ac.tz/storage/01J8MTRJ75VQMXRPY5GGGAH4SS.pdf"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Project Guidelines
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/ip"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  IP Registration
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="https://must.ac.tz/academics/centres/centre-for-innovation-and-technology-transfer/department/department-of-innovations-and-incubation"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Mentor Network
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/reports"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Reports & Analytics
                </Link>
              </li>
              <li className="mb-2.5">
                <Link
                  to="/documentation"
                  className="text-white no-underline transition-colors opacity-80 hover:text-teal-400 hover:opacity-100"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-xl font-bold mb-5 text-teal-400">
              Contact Us
            </h3>
            <ul className="list-none">
              <li className="mb-2.5 text-white opacity-80">
                📍 Mbeya University of Science and Technology
              </li>
              <li className="mb-2.5 text-white opacity-80">
                📧 citt@must.ac.tz
              </li>
              <li className="mb-2.5 text-white opacity-80">☎️ +255 25 295 7544</li>
              <li className="mb-2.5 text-white opacity-80">
                🌐{" "}
                <a
                  href="https://www.must.ac.tz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 transition-colors"
                >
                  www.must.ac.tz
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="text-center pt-5 border-t border-white border-opacity-10 opacity-70">
          <p>
            &copy; {new Date().getFullYear()} Mbeya University of Science and Technology. All rights
            reserved. | Centre For Innovation and Technology Transfer
            (CITT)
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

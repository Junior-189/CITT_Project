import React from 'react'

const About = () => {
  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-slate-800">
          Centre for Innovation and Technology Transfer Management System
        </h1>

        {/* Main Card Section */}
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-md mb-8">
          {/* Introduction */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-6 text-teal-700">
              Innovation and Technology Transfer Management System (ITTMS)
            </h2>
            <p className="text-lg leading-relaxed mb-4 text-slate-700 font-semibold">
              Mbeya University of Science and Technology
            </p>
            <p className="text-base leading-relaxed text-slate-600">
              The Centre for Innovation and Technology Transfer (CITT) was established to facilitate transformation of research and innovations into commercial products and services, serving as a solid foundation for generating, incubating and transferring technological innovations and traditional knowledge practices.
            </p>
          </div>

          {/* Vision and Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-teal-50 border-l-4 border-teal-600 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-teal-700">Vision</h3>
              <p className="text-slate-700">
                To become the leading centre for innovation and technology transfer in science and technology.
              </p>
            </div>
            <div className="bg-teal-50 border-l-4 border-teal-600 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-teal-700">Mission</h3>
              <p className="text-slate-700">
                To develop, implement and monitor innovation and technology transfer programmes while facilitating training, mentoring, and commercialization of innovations.
              </p>
            </div>
          </div>

          {/* Purpose Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">
              Purpose of ITTMS
            </h3>
            <p className="text-base leading-relaxed mb-4 text-slate-600">
              The Innovation and Technology Transfer Management System (ITTMS) supports MUST's Centre for Innovation and Technology Transfer (CITT) in efficiently managing innovations, research projects, intellectual property (IP), startups, and funding applications. The ITTMS serves as a centralized platform for innovators, entrepreneurs, mentors, investors, and administrators to collaborate, share information, and track progress.
            </p>
            <p className="text-base leading-relaxed mb-4 text-slate-600">
              By integrating project management, IP registration, and funding workflows, the system ensures that ideas can advance from conception to commercialization in a coordinated way. In line with global technology transfer objectives, the ITTMS helps move innovations from the lab to society and the marketplace.
            </p>
            <p className="text-base leading-relaxed text-slate-600">
              The system facilitates the protection, promotion and commercialization of technological developments and intellectual property within the university community, streamlining patent and licensing processes, organizing startup incubation, and linking funding opportunities to maximize innovation impact.
            </p>
          </div>

          {/* Policy Objectives */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">
              Key Objectives
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-teal-600 font-bold mt-1">•</span>
                <p className="text-slate-600">Provide guidelines, procedures, and standards for incubation, innovations, entrepreneurship, and technology transfer activities</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 font-bold mt-1">•</span>
                <p className="text-slate-600">Outline key roles for MUST and stakeholders in ideation, incubation and technology transfer of inventions and innovations</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 font-bold mt-1">•</span>
                <p className="text-slate-600">Ensure ownership, protection, fairness, equity, transparency and sustainable innovation development</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 font-bold mt-1">•</span>
                <p className="text-slate-600">Establish rational and equitable mechanisms for innovation ethics and intellectual property rights</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 font-bold mt-1">•</span>
                <p className="text-slate-600">Support and disseminate technologies tailored to address the distinctive needs of rural communities</p>
              </li>
            </ul>
          </div>
        </div>

        {/* CITT Departments */}
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-md mb-8">
          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            CITT Organizational Structure
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Department 1 */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border-l-4 border-teal-600">
              <h4 className="text-xl font-bold mb-3 text-teal-800">
                🔬 Incubation & Innovation
              </h4>
              <ul className="text-sm text-slate-700 space-y-2">
                <li>• Training and mentoring of inventors</li>
                <li>• Innovation programme management</li>
                <li>• Technology transfer coordination</li>
                <li>• Database maintenance</li>
                <li>• Performance evaluation</li>
              </ul>
            </div>

            {/* Department 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-l-4 border-blue-600">
              <h4 className="text-xl font-bold mb-3 text-blue-800">
                💼 Entrepreneurship & Business
              </h4>
              <ul className="text-sm text-slate-700 space-y-2">
                <li>• Business plan development</li>
                <li>• Marketing and advertising</li>
                <li>• Financial advisory services</li>
                <li>• IPR awareness promotion</li>
                <li>• Investment attraction</li>
              </ul>
            </div>

            {/* Department 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-l-4 border-green-600">
              <h4 className="text-xl font-bold mb-3 text-green-800">
                🌾 Rural Technology Park
              </h4>
              <ul className="text-sm text-slate-700 space-y-2">
                <li>• Rural community training</li>
                <li>• Agribusiness and agriculture tech</li>
                <li>• Renewable energy solutions</li>
                <li>• Incubation for rural startups</li>
                <li>• Technical support services</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-md">
          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            Core Functions & Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💡</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                Innovation Management
              </h4>
              <p className="text-sm text-slate-600">
                Centralized platform for managing research projects and innovations from conception to commercialization.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">⚖️</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                IP Protection
              </h4>
              <p className="text-sm text-slate-600">
                Streamlined patent and licensing processes to protect and promote intellectual property rights.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💰</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                Funding Integration
              </h4>
              <p className="text-sm text-slate-600">
                Connect innovators with funding opportunities and track progress throughout the development cycle.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🎓</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                Training & Mentoring
              </h4>
              <p className="text-sm text-slate-600">
                Comprehensive training programmes through incubation, seminars, workshops, and boot camps.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🤝</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                Technology Transfer
              </h4>
              <p className="text-sm text-slate-600">
                Facilitate sharing and commercialization of valuable technologies with the community.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🌍</div>
              <h4 className="text-xl font-bold mb-3 text-slate-800">
                Rural Development
              </h4>
              <p className="text-sm text-slate-600">
                Support sustainable rural technology ecosystem and promote grassroots innovation.
              </p>
            </div>
          </div>
        </div>

        {/* Innovation Ecosystem */}
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8 md:p-12 shadow-md mt-8">
          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            Innovation Ecosystem
          </h2>
          <p className="text-base leading-relaxed mb-6 text-slate-700">
            MUST CITT fosters a collaborative environment where various participants, encompassing academia, industry and communities, work together harmoniously. The innovation ecosystem includes:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-bold text-lg mb-3 text-teal-700">Stakeholders</h4>
              <ul className="space-y-2 text-slate-600">
                <li>• Innovators and Inventors</li>
                <li>• Students and Faculty</li>
                <li>• Entrepreneurs and Startups</li>
                <li>• Investors and Financiers</li>
                <li>• Industry Partners</li>
                <li>• Government Agencies</li>
                <li>• Rural Communities</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h4 className="font-bold text-lg mb-3 text-teal-700">Services Provided</h4>
              <ul className="space-y-2 text-slate-600">
                <li>• Idea Generation Support</li>
                <li>• Business Plan Development</li>
                <li>• IP Registration and Protection</li>
                <li>• Incubation Services</li>
                <li>• Access to Funding</li>
                <li>• Marketing and Commercialization</li>
                <li>• Research and Consultancy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Policy Compliance */}
        <div className="bg-slate-100 rounded-xl p-6 mt-8 border-l-4 border-slate-600">
          <p className="text-sm text-slate-600">
            <strong>Policy Framework:</strong> The Innovation and Technology Transfer activities at MUST are guided by the official MUST Innovation and Technology Transfer Policy (March 2024), approved by the University Council, ensuring transparency, fairness, and ethical practices in all innovation endeavors.
          </p>
        </div>
      </div>
    </main>
  )
}

export default About
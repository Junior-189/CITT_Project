import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, ChevronRight, ArrowRight } from 'lucide-react';

const DEPT_ROUTE_MAP = {
  DII:  '/dii/workspace',
  DEBM: '/debm/workspace',
  RTP:  '/rtp/workspace',
};

const DEPT_DIRECTOR_ROLE = {
  DII:  'diiDirector',
  DEBM: 'debmDirector',
  RTP:  'rtpDirector',
};

const DEPT_COLORS = {
  DII: {
    bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-600',
    badge: 'bg-teal-100 text-teal-800', btn: 'bg-teal-600 hover:bg-teal-700',
    dot: 'bg-teal-500', title: 'text-teal-700', ring: 'ring-teal-300',
  },
  DEBM: {
    bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-100 text-blue-800', btn: 'bg-blue-600 hover:bg-blue-700',
    dot: 'bg-blue-500', title: 'text-blue-700', ring: 'ring-blue-300',
  },
  RTP: {
    bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600',
    badge: 'bg-green-100 text-green-800', btn: 'bg-green-600 hover:bg-green-700',
    dot: 'bg-green-500', title: 'text-green-700', ring: 'ring-green-300',
  },
};

const DepartmentCard = ({ dept, isSelected, onClick, isDirector }) => {
  const c = DEPT_COLORS[dept.code] || DEPT_COLORS.DII;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-8 shadow-sm border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center hover:shadow-lg
        ${isSelected ? `${c.border} ring-4 ${c.ring} shadow-md` : 'border-gray-100 hover:border-gray-200'}
        ${isDirector ? 'hover:-translate-y-1' : ''}`}
    >
      <div className={`w-24 h-24 rounded-full ${c.icon} flex items-center justify-center mb-5`}>
        <Users className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{dept.short_name} Director</h3>
      <p className="text-sm text-slate-500 leading-snug max-w-[160px]">{dept.name}</p>
      {dept.director && (
        <div className="mt-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.badge}`}>
            {dept.director.name}
          </span>
        </div>
      )}
      {isDirector && (
        <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${c.title}`}>
          Enter Workspace <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

const Departments = () => {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/departments`);
        const data = await res.json();
        setDepartments(data.departments || []);
      } catch (e) {
        console.error('Failed to load departments:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const isDirectorOfDept = (dept) =>
    profile && (
      role === DEPT_DIRECTOR_ROLE[dept.code] ||
      ['admin', 'superAdmin', 'transferTechnologyOfficer'].includes(role)
    );

  const handleCardClick = (dept) => {
    if (isDirectorOfDept(dept)) {
      navigate(DEPT_ROUTE_MAP[dept.code]);
      return;
    }
    setSelectedDept(selectedDept?.id === dept.id ? null : dept);
  };

  return (
    <main className="flex-1 bg-gray-50 overflow-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 via-teal-800 to-teal-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-teal-300 text-sm font-semibold uppercase tracking-widest mb-2">CITT</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Our Departments</h1>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto">
            The Centre for Innovation and Technology Transfer operates through three specialized departments,
            each driving innovation in their respective domains.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">

        {/* Director banner */}
        {profile && ['diiDirector', 'debmDirector', 'rtpDirector'].includes(role) && (
          <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-sm text-teal-700 font-medium">
              Click your department card below to access your Director workspace.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : (
          <>
            {/* 3 Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {departments.map(dept => (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  isSelected={selectedDept?.id === dept.id}
                  onClick={() => handleCardClick(dept)}
                  isDirector={isDirectorOfDept(dept)}
                />
              ))}
            </div>

            {/* Detail panel for non-directors */}
            {selectedDept && (
              <div className={`rounded-2xl border-2 p-6 md:p-8 mb-8 ${DEPT_COLORS[selectedDept.code]?.bg} ${DEPT_COLORS[selectedDept.code]?.border}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${DEPT_COLORS[selectedDept.code]?.title}`}>
                      {selectedDept.name}
                    </h2>
                    <p className="text-slate-600 mt-1 text-sm">{selectedDept.description}</p>
                  </div>
                  <button onClick={() => setSelectedDept(null)} className="text-gray-400 hover:text-gray-600 p-1 ml-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                  Functions & Responsibilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDept.functions?.map(fn => (
                    <div key={fn.id} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <span className={`w-6 h-6 rounded-full ${DEPT_COLORS[selectedDept.code]?.icon} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {fn.order_num}
                      </span>
                      <p className="text-sm text-slate-700 leading-snug">{fn.description}</p>
                    </div>
                  ))}
                </div>

                {selectedDept.director && (
                  <div className="mt-5 p-4 bg-white rounded-xl">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Current Director</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedDept.director.name}</p>
                    <p className="text-sm text-slate-500">{selectedDept.director.email}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Departments;

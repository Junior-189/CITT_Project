import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, ChevronRight, ArrowRight, X } from 'lucide-react';

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
    bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/30', icon: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400', btn: 'bg-teal-600 hover:bg-teal-700',
    dot: 'bg-teal-500', title: 'text-teal-700 dark:text-teal-400', ring: 'ring-teal-300 dark:ring-teal-500/30',
  },
  DEBM: {
    bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700',
    dot: 'bg-blue-500', title: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-300 dark:ring-blue-500/30',
  },
  RTP: {
    bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30', icon: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400', btn: 'bg-green-600 hover:bg-green-700',
    dot: 'bg-green-500', title: 'text-green-700 dark:text-green-400', ring: 'ring-green-300 dark:ring-green-500/30',
  },
};

const DepartmentCard = ({ dept, isSelected, onClick, isDirector }) => {
  const c = DEPT_COLORS[dept.code] || DEPT_COLORS.DII;
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center hover:shadow-lg
        ${isSelected ? `${c.border} ring-4 ${c.ring} shadow-md` : 'border-gray-100 dark:border-slate-700 hover:border-gray-200'}
        ${isDirector ? 'hover:-translate-y-1' : ''}`}
    >
      <div className={`w-24 h-24 rounded-full ${c.icon} flex items-center justify-center mb-5`}>
        <Users className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{dept.short_name} Director</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug max-w-[160px]">{dept.name}</p>
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
  const { profile, role, getAuthenticatedAxios } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/departments');
      setDepartments(res.data.departments || []);
    } catch {
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

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
    <main className="flex-1 bg-gray-50 dark:bg-slate-900 overflow-auto">
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
          <div className="mb-8 p-4 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
              Click your department card below to access your Director workspace.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={fetchDepartments} className="text-red-600 dark:text-red-400 hover:underline">Retry</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : departments.length === 0 && !error ? (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">No departments found.</p>
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
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{selectedDept.description}</p>
                  </div>
                  <button onClick={() => setSelectedDept(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 ml-4 flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Functions & Responsibilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDept.functions?.map(fn => (
                    <div key={fn.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg">
                      <span className={`w-6 h-6 rounded-full ${DEPT_COLORS[selectedDept.code]?.icon} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {fn.order_num}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{fn.description}</p>
                    </div>
                  ))}
                </div>

                {selectedDept.director && (
                  <div className="mt-5 p-4 bg-white dark:bg-slate-700 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide mb-1">Current Director</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedDept.director.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDept.director.email}</p>
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

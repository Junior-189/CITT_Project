export const getRoleBadgeClass = (role) => {
  const map = {
    superAdmin:                'bg-slate-800 text-white',
    admin:                     'bg-teal-700 text-white',
    transferTechnologyOfficer: 'bg-teal-600 text-white',
    ipManager:                 'bg-blue-700 text-white',
    diiDirector:               'bg-teal-500 text-white',
    debmDirector:              'bg-blue-600 text-white',
    rtpDirector:               'bg-teal-800 text-white',
    mentor:                    'bg-blue-500 text-white',
    technicalCommittee:        'bg-slate-600 text-white',
    coordinator:               'bg-blue-400 text-white',
    innovator:                 'bg-slate-500 text-white',
  };
  return map[role] || 'bg-slate-400 text-white';
};

export const getRoleDotClass = (role) => {
  const map = {
    superAdmin:                'bg-slate-800',
    admin:                     'bg-teal-700',
    transferTechnologyOfficer: 'bg-teal-600',
    ipManager:                 'bg-blue-700',
    diiDirector:               'bg-teal-500',
    debmDirector:              'bg-blue-600',
    rtpDirector:               'bg-teal-800',
    mentor:                    'bg-blue-500',
    technicalCommittee:        'bg-slate-600',
    coordinator:               'bg-blue-400',
    innovator:                 'bg-slate-500',
  };
  return map[role] || 'bg-slate-400';
};

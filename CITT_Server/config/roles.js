const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  TRANSFER_TECHNOLOGY_OFFICER: 'transferTechnologyOfficer',
  IP_MANAGER: 'ipManager',
  DII_DIRECTOR: 'diiDirector',
  DEBM_DIRECTOR: 'debmDirector',
  RTP_DIRECTOR: 'rtpDirector',
  MENTOR: 'mentor',
  TECHNICAL_COMMITTEE: 'technicalCommittee',
  COORDINATOR: 'coordinator',
  INNOVATOR: 'innovator',
};

const ROLE_HIERARCHY = {
  innovator: 1, coordinator: 2, mentor: 3, technicalCommittee: 3,
  ipManager: 4, diiDirector: 5, debmDirector: 5, rtpDirector: 5,
  transferTechnologyOfficer: 6, admin: 7, superAdmin: 8,
};

const ROLE_NAMES = {
  superAdmin: 'Super Administrator', admin: 'Administrator',
  transferTechnologyOfficer: 'Transfer Technology Officer', ipManager: 'IP Manager',
  diiDirector: 'DII Director', debmDirector: 'DEBM Director', rtpDirector: 'RTP Director',
  mentor: 'Mentor', technicalCommittee: 'Technical Committee',
  coordinator: 'Coordinator', innovator: 'Innovator',
};

const ADMIN_ROLES = ['superAdmin','admin','transferTechnologyOfficer'];
const REVIEWER_ROLES = ['superAdmin','admin','transferTechnologyOfficer','diiDirector','debmDirector','rtpDirector','mentor','technicalCommittee','coordinator','ipManager'];
const PROJECT_APPROVAL_ROLES = ['superAdmin','admin','transferTechnologyOfficer','diiDirector'];

const isValidRole = (role) => Object.values(ROLES).includes(role);
const hasHigherAuthority = (a, b) => (ROLE_HIERARCHY[a]||0) > (ROLE_HIERARCHY[b]||0);
const hasEqualOrHigherAuthority = (a, b) => (ROLE_HIERARCHY[a]||0) >= (ROLE_HIERARCHY[b]||0);
const getManageableRoles = (role) => Object.keys(ROLE_HIERARCHY).filter(r => ROLE_HIERARCHY[r] < (ROLE_HIERARCHY[role]||0));
const getRolesByHierarchy = () => Object.keys(ROLE_HIERARCHY).sort((a,b) => ROLE_HIERARCHY[b]-ROLE_HIERARCHY[a]);
const canPromoteToRole = (userRole) => userRole === ROLES.SUPER_ADMIN;
const isAdminRole = (role) => ADMIN_ROLES.includes(role);
const isReviewerRole = (role) => REVIEWER_ROLES.includes(role);
const canApproveProject = (role) => PROJECT_APPROVAL_ROLES.includes(role);

module.exports = {
  ROLES, ROLE_HIERARCHY, ROLE_NAMES, ADMIN_ROLES, REVIEWER_ROLES, PROJECT_APPROVAL_ROLES,
  isValidRole, hasHigherAuthority, hasEqualOrHigherAuthority, getManageableRoles,
  getRolesByHierarchy, canPromoteToRole, isAdminRole, isReviewerRole, canApproveProject,
};

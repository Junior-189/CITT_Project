/**
 * Role Configuration
 * Purpose: Define role constants and hierarchy for the CITT system
 */

/**
 * System Roles
 * These are the 4 main user roles in the system
 */
const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  IP_MANAGER: 'ipManager',
  INNOVATOR: 'innovator'
};

/**
 * Role Hierarchy (from highest to lowest authority)
 * Higher index = higher authority
 */
const ROLE_HIERARCHY = {
  [ROLES.INNOVATOR]: 1,      // Lowest authority
  [ROLES.IP_MANAGER]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4     // Highest authority
};

/**
 * Role Display Names (for UI)
 */
const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.IP_MANAGER]: 'IP Manager',
  [ROLES.INNOVATOR]: 'Innovator'
};

/**
 * Role Descriptions (for UI/documentation)
 */
const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Full system access with ability to manage users, roles, and system settings',
  [ROLES.ADMIN]: 'Manage users, approve projects/funding/IP applications, view analytics',
  [ROLES.IP_MANAGER]: 'Manage IP records and approve IP applications',
  [ROLES.INNOVATOR]: 'Submit projects, apply for funding, and manage own submissions'
};

/**
 * Check if role exists
 * @param {string} role - Role to check
 * @returns {boolean} True if role exists
 */
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Check if roleA has higher authority than roleB
 * @param {string} roleA - First role
 * @param {string} roleB - Second role
 * @returns {boolean} True if roleA > roleB
 */
const hasHigherAuthority = (roleA, roleB) => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

/**
 * Check if roleA has equal or higher authority than roleB
 * @param {string} roleA - First role
 * @param {string} roleB - Second role
 * @returns {boolean} True if roleA >= roleB
 */
const hasEqualOrHigherAuthority = (roleA, roleB) => {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
};

/**
 * Get all roles that a given role can manage
 * (i.e., roles with lower authority)
 * @param {string} role - The role
 * @returns {Array<string>} Array of manageable roles
 */
const getManageableRoles = (role) => {
  const roleLevel = ROLE_HIERARCHY[role];

  return Object.keys(ROLE_HIERARCHY).filter(
    r => ROLE_HIERARCHY[r] < roleLevel
  );
};

/**
 * Get all roles sorted by hierarchy (highest to lowest)
 * @returns {Array<string>} Sorted array of roles
 */
const getRolesByHierarchy = () => {
  return Object.keys(ROLE_HIERARCHY).sort(
    (a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]
  );
};

/**
 * Check if user can promote/demote to a specific role
 * Only superAdmin can promote users
 * @param {string} userRole - Current user's role
 * @param {string} targetRole - Role being assigned
 * @returns {boolean} True if promotion is allowed
 */
const canPromoteToRole = (userRole, targetRole) => {
  // Only superAdmin can change roles
  return userRole === ROLES.SUPER_ADMIN;
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  isValidRole,
  hasHigherAuthority,
  hasEqualOrHigherAuthority,
  getManageableRoles,
  getRolesByHierarchy,
  canPromoteToRole
};

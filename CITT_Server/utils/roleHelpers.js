const { ROLES, REVIEWER_ROLES, PROJECT_APPROVAL_ROLES } = require('../config/roles');

const isAdmin = (role) => [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TRANSFER_TECHNOLOGY_OFFICER].includes(role);

const isReviewer = (role) => REVIEWER_ROLES.includes(role);

const canApproveProjects = (role) => PROJECT_APPROVAL_ROLES.includes(role);

module.exports = {
  isAdmin,
  isReviewer,
  canApproveProjects,
};

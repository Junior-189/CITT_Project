const { ROLES } = require('../config/roles');

const isAdmin = (role) => [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

const isReviewer = (role) => [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.IP_MANAGER].includes(role);

module.exports = {
  isAdmin,
  isReviewer,
};

/**
 * Permissions Configuration
 * Purpose: Helper functions for working with permissions
 */

const pool = require('./database');
const { ROLES } = require('./roles');

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<boolean>} True if permission exists
 */
const hasPermission = async (role, resource, action) => {
  // SuperAdmin has all permissions
  if (role === ROLES.SUPER_ADMIN) {
    return true;
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM role_permissions
       WHERE role = $1 AND resource = $2 AND action = $3`,
      [role, resource, action]
    );

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Promise<Array>} Array of permission objects
 */
const getRolePermissions = async (role) => {
  try {
    const result = await pool.query(
      `SELECT resource, action, description
       FROM role_permissions
       WHERE role = $1
       ORDER BY resource, action`,
      [role]
    );

    return result.rows;
  } catch (error) {
    console.error('Get permissions error:', error);
    return [];
  }
};

/**
 * Get all permissions grouped by resource
 * @param {string} role - User role
 * @returns {Promise<Object>} Object with resources as keys
 */
const getRolePermissionsByResource = async (role) => {
  try {
    const permissions = await getRolePermissions(role);
    const grouped = {};

    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push({
        action: perm.action,
        description: perm.description
      });
    });

    return grouped;
  } catch (error) {
    console.error('Get grouped permissions error:', error);
    return {};
  }
};

/**
 * Check if role can perform action on any resource
 * @param {string} role - User role
 * @param {string} action - Action name (e.g., 'approve', 'delete')
 * @returns {Promise<boolean>} True if role has this action for any resource
 */
const canPerformAction = async (role, action) => {
  if (role === ROLES.SUPER_ADMIN) {
    return true;
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM role_permissions
       WHERE role = $1 AND action = $2`,
      [role, action]
    );

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Action check error:', error);
    return false;
  }
};

/**
 * Get list of resources a role can access
 * @param {string} role - User role
 * @returns {Promise<Array>} Array of resource names
 */
const getAccessibleResources = async (role) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT resource FROM role_permissions
       WHERE role = $1
       ORDER BY resource`,
      [role]
    );

    return result.rows.map(row => row.resource);
  } catch (error) {
    console.error('Get resources error:', error);
    return [];
  }
};

/**
 * Permission constants for common actions
 * Use these instead of hardcoding strings
 */
const PERMISSIONS = {
  // User management
  USERS: {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    PROMOTE: 'promote',
    DEMOTE: 'demote'
  },

  // Project management
  PROJECTS: {
    READ: 'read',
    READ_OWN: 'read_own',
    CREATE: 'create',
    UPDATE: 'update',
    UPDATE_OWN: 'update_own',
    DELETE: 'delete',
    DELETE_OWN: 'delete_own',
    APPROVE: 'approve',
    REJECT: 'reject'
  },

  // Funding management
  FUNDING: {
    READ: 'read',
    READ_OWN: 'read_own',
    CREATE: 'create',
    UPDATE: 'update',
    UPDATE_OWN: 'update_own',
    DELETE: 'delete',
    DELETE_OWN: 'delete_own',
    APPROVE: 'approve',
    REJECT: 'reject'
  },

  // IP Management
  IP_MANAGEMENT: {
    READ: 'read',
    READ_OWN: 'read_own',
    CREATE: 'create',
    UPDATE: 'update',
    UPDATE_OWN: 'update_own',
    DELETE: 'delete',
    DELETE_OWN: 'delete_own',
    APPROVE: 'approve',
    REJECT: 'reject'
  },

  // Events
  EVENTS: {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage'
  },

  // System
  SYSTEM: {
    SETTINGS: 'settings',
    ANALYTICS: 'view',
    REPORTS: 'generate',
    AUDIT: 'view'
  }
};

/**
 * Resource names (use these for consistency)
 */
const RESOURCES = {
  USERS: 'users',
  PROJECTS: 'projects',
  FUNDING: 'funding',
  IP_MANAGEMENT: 'ip_management',
  EVENTS: 'events',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  AUDIT: 'audit',
  SYSTEM: 'system',
  ALL: '*'
};

module.exports = {
  hasPermission,
  getRolePermissions,
  getRolePermissionsByResource,
  canPerformAction,
  getAccessibleResources,
  PERMISSIONS,
  RESOURCES
};

const pool = require('../config/database');
const projectRepository = require('../repositories/projectRepository');
const { createNotification, notifyAdmins } = require('../utils/notifications');
const logger = require('../config/logger');

const projectService = {
  getProjects: async (options) => {
    return projectRepository.findAll(options);
  },

  getProject: async (id) => {
    const project = await projectRepository.findById(id);
    if (!project) throw { status: 404, message: 'Project not found' };
    return project;
  },

  createProject: async (projectData) => {
    const project = await projectRepository.createDynamic(projectData);

    notifyAdmins(
      'New Project Submission',
      `New project "${projectData.title}" submitted by user #${projectData.userId}`,
      'info',
      '/admin/projects'
    );

    logger.info('Project created', { title: projectData.title, userId: projectData.userId });
    return project;
  },

  updateProject: async (id, updates, userId, userRole) => {
    const { isAdmin } = require('../utils/roleHelpers');
    const project = await projectRepository.findById(id);
    if (!project) throw { status: 404, message: 'Project not found' };

    const isOwner = project.user_id === userId;
    const adminUser = isAdmin(userRole);

    if (isOwner && !['pending', 'rejected'].includes(project.approval_status)) {
      throw { status: 403, message: `You can only edit projects that are pending or rejected. Current status: ${project.approval_status}` };
    }
    if (!isOwner && !adminUser) {
      throw { status: 403, message: 'Permission denied' };
    }

    return projectRepository.update(id, updates);
  },

  approveProject: async (id, approvedBy, comments) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const project = await projectRepository.approve(id, approvedBy, client);
      if (!project) {
        await client.query('ROLLBACK');
        throw { status: 404, message: 'Project not found' };
      }

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, read, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [project.user_id, 'Project Approved',
         `Your project "${project.title}" has been approved.${comments ? ` Comments: ${comments}` : ''}`,
         'success', '/my-projects']
      );

      await client.query('COMMIT');
      logger.info('Project approved', { projectId: id, approvedBy });
      return { project, comments };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  rejectProject: async (id, approvedBy, reason) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const project = await projectRepository.reject(id, approvedBy, reason, client);
      if (!project) {
        await client.query('ROLLBACK');
        throw { status: 404, message: 'Project not found' };
      }

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, read, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [project.user_id, 'Project Rejected',
         `Your project "${project.title}" has been rejected. Reason: ${reason}`,
         'warning', '/my-projects']
      );

      await client.query('COMMIT');
      logger.info('Project rejected', { projectId: id, reason });
      return { project };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  resubmitProject: async (id, userId, userRole) => {
    const { isAdmin } = require('../utils/roleHelpers');
    const project = await projectRepository.findById(id);
    if (!project) throw { status: 404, message: 'Project not found' };

    const isOwner = project.user_id === userId;
    const adminUser = isAdmin(userRole);
    if (!isOwner && !adminUser) throw { status: 403, message: 'Permission denied' };
    if (project.approval_status !== 'rejected') {
      throw { status: 400, message: 'Only rejected projects can be resubmitted' };
    }

    return projectRepository.resubmit(id);
  },

  deleteProject: async (id) => {
    const result = await projectRepository.delete(id);
    if (!result) throw { status: 404, message: 'Project not found' };
    return result;
  },

  assignReviewer: async (projectId, userId, role) => {
    const assignment = await projectRepository.assignReviewer(projectId, userId, role);

    await createNotification(
      userId,
      'New Project Assignment',
      `You have been assigned as ${role} to a project. Check your workspace for details.`,
      'info',
      '/workspace'
    );

    return assignment;
  },
};

module.exports = projectService;

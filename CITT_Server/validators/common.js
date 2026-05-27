const { z } = require('zod');

const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().nullable(),
  university: z.string().max(255).optional().nullable(),
  college: z.string().max(255).optional().nullable(),
  year_of_study: z.string().max(50).optional().nullable(),
  campus: z.string().max(255).optional().nullable(),
  profile_complete: z.boolean().optional(),
});

const userRoleChangeSchema = z.object({
  role: z.enum([
    'superAdmin', 'admin', 'transferTechnologyOfficer',
    'diiDirector', 'debmDirector', 'rtpDirector',
    'ipManager', 'mentor', 'technicalCommittee',
    'coordinator', 'innovator',
  ]),
});

const userCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum([
    'admin', 'transferTechnologyOfficer',
    'diiDirector', 'debmDirector', 'rtpDirector',
    'ipManager', 'mentor', 'technicalCommittee',
    'coordinator', 'innovator',
  ]),
  phone: z.string().max(20).optional().nullable(),
  university: z.string().max(255).optional().nullable(),
  campus: z.string().max(255).optional().nullable(),
});

const userApproveSchema = z.object({}).passthrough();
const userRejectSchema = z.object({
  reason: z.string().optional(),
});

const galleryUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  event_name: z.string().max(255).optional().nullable(),
});

const departmentComplaintSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  category: z.string().max(100).optional(),
});

const departmentTrainingSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().max(255).optional(),
  max_participants: z.number().int().positive().optional(),
});

const searchQuerySchema = z.object({
  keyword: z.string().min(1, 'Search keyword is required').max(255),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = {
  userUpdateSchema,
  userRoleChangeSchema,
  userCreateSchema,
  userApproveSchema,
  userRejectSchema,
  galleryUploadSchema,
  departmentComplaintSchema,
  departmentTrainingSchema,
  searchQuerySchema,
  paginationQuerySchema,
};

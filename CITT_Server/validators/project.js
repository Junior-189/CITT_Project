const { z } = require('zod');

const projectCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required').max(100),
  institution: z.string().max(255).optional().nullable(),
  funding_needed: z.number().min(0).optional().nullable(),
  problem_statement: z.string().optional().nullable(),
  project_status: z.enum(['submitted', 'on_progress', 'completed']).optional(),
});

const projectUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  category: z.string().max(100).optional(),
  institution: z.string().max(255).optional().nullable(),
  funding_needed: z.number().min(0).optional().nullable(),
  problem_statement: z.string().optional().nullable(),
  project_status: z.enum(['submitted', 'on_progress', 'completed']).optional(),
});

const projectApproveSchema = z.object({
  comments: z.string().optional(),
});

const projectRejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

const projectAssignSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(['mentor', 'technicalCommittee', 'coordinator']),
});

const milestoneSubmitSchema = z.object({
  description: z.string().min(5).optional(),
  comments: z.string().optional(),
});

const milestoneApproveSchema = z.object({
  comments: z.string().optional(),
});

const milestoneRejectSchema = z.object({
  reason: z.string().min(5),
});

const milestoneCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
});

module.exports = {
  projectCreateSchema,
  projectUpdateSchema,
  projectApproveSchema,
  projectRejectSchema,
  projectAssignSchema,
  milestoneSubmitSchema,
  milestoneApproveSchema,
  milestoneRejectSchema,
  milestoneCommentSchema,
};

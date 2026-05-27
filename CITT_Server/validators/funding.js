const { z } = require('zod');

const fundingCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().max(10).optional(),
  project_id: z.number().int().positive().optional().nullable(),
  grant_type: z.string().max(50).optional(),
});

const fundingUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  project_id: z.number().int().positive().optional().nullable(),
  grant_type: z.string().max(50).optional(),
});

const fundingApproveSchema = z.object({
  comments: z.string().optional(),
  amount_approved: z.number().positive().optional(),
});

const fundingRejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

const fundingPledgeSchema = z.object({
  amount: z.number().positive('Pledge amount must be positive'),
  note: z.string().optional().nullable(),
});

module.exports = {
  fundingCreateSchema,
  fundingUpdateSchema,
  fundingApproveSchema,
  fundingRejectSchema,
  fundingPledgeSchema,
};

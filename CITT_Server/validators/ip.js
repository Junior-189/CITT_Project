const { z } = require('zod');

const ipCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional().nullable(),
  ip_type: z.enum(['patent', 'trademark', 'copyright', 'trade_secret', 'industrial_design', 'other']),
  inventors: z.string().min(1, 'At least one inventor is required'),
  filing_date: z.string().optional().nullable(),
  status: z.string().max(50).optional(),
});

const ipUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  ip_type: z.enum(['patent', 'trademark', 'copyright', 'trade_secret', 'industrial_design', 'other']).optional(),
  inventors: z.string().optional(),
  filing_date: z.string().optional().nullable(),
  status: z.string().max(50).optional(),
});

const ipApproveSchema = z.object({
  comments: z.string().optional(),
});

const ipRejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

module.exports = {
  ipCreateSchema,
  ipUpdateSchema,
  ipApproveSchema,
  ipRejectSchema,
};

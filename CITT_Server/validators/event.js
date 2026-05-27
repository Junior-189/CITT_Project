const { z } = require('zod');

const eventCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional().nullable(),
  event_date: z.string().min(1, 'Event date is required'),
  location: z.string().max(255).optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  category: z.string().max(100).optional(),
  type: z.enum(['hackathon', 'workshop', 'challenge', 'exhibition', 'seminar', 'conference']).optional(),
});

const eventUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  event_date: z.string().optional(),
  location: z.string().max(255).optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  category: z.string().max(100).optional(),
  type: z.enum(['hackathon', 'workshop', 'challenge', 'exhibition', 'seminar', 'conference']).optional(),
});

const eventSubmissionSchema = z.object({
  team_name: z.string().min(1, 'Team name is required').max(255),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  members: z.string().optional(),
});

const eventFeedbackSchema = z.object({
  feedback: z.string().min(1, 'Feedback is required'),
  rating: z.number().int().min(1).max(5).optional(),
  status: z.enum(['approved', 'rejected', 'pending']).optional(),
});

const eventPublishSchema = z.object({
  published: z.boolean(),
});

module.exports = {
  eventCreateSchema,
  eventUpdateSchema,
  eventSubmissionSchema,
  eventFeedbackSchema,
  eventPublishSchema,
};

const { body, validationResult } = require('express-validator')

const SCHEDULE_BLOCK_TYPES = ['CLASS', 'STUDY', 'PERSONAL', 'ATHLETIC']
const EVENT_TYPES = ['PRACTICE', 'GAME', 'TRAVEL', 'FILM', 'MEETING']

/**
 * Middleware that runs after a validation chain and returns 400 if errors exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
]

const validateRegister = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  validate,
]

const validateScheduleBlock = [
  body('title').optional().isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer').trim(),
  body('type').isIn(SCHEDULE_BLOCK_TYPES).withMessage(`Type must be one of: ${SCHEDULE_BLOCK_TYPES.join(', ')}`),
  body('start').isISO8601().withMessage('start must be a valid ISO 8601 date'),
  body('end')
    .isISO8601().withMessage('end must be a valid ISO 8601 date')
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.start)) {
        throw new Error('end must be after start')
      }
      return true
    }),
  validate,
]

const validateEvent = [
  body('title').isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer').notEmpty().trim(),
  body('type').isIn(EVENT_TYPES).withMessage(`Type must be one of: ${EVENT_TYPES.join(', ')}`),
  body('start').isISO8601().withMessage('start must be a valid ISO 8601 date'),
  body('end')
    .isISO8601().withMessage('end must be a valid ISO 8601 date')
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.start)) {
        throw new Error('end must be after start')
      }
      return true
    }),
  body('teamId').notEmpty().withMessage('teamId is required'),
  validate,
]

const validateConflictCheck = [
  body('teamId').notEmpty().withMessage('teamId is required'),
  body('start').isISO8601().withMessage('start must be a valid ISO 8601 date'),
  body('end')
    .isISO8601().withMessage('end must be a valid ISO 8601 date')
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.start)) {
        throw new Error('end must be after start')
      }
      return true
    }),
  validate,
]

module.exports = {
  validate,
  validateLogin,
  validateRegister,
  validateScheduleBlock,
  validateEvent,
  validateConflictCheck,
}

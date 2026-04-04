/**
 * FERPA Serializer Middleware
 *
 * Strips sensitive block titles/details for coach-role requests.
 * Coaches only see "BUSY" for CLASS, STUDY, and PERSONAL blocks.
 * ATHLETIC blocks remain visible with full details.
 *
 * Wrap the response by intercepting res.json()
 */

const PROTECTED_BLOCK_TYPES = new Set(['CLASS', 'STUDY', 'PERSONAL'])

/**
 * Redact a single schedule block for coach visibility
 */
function redactBlockForCoach(block) {
  if (PROTECTED_BLOCK_TYPES.has(block.type)) {
    return {
      id: block.id,
      userId: block.userId,
      title: 'BUSY',
      start: block.start,
      end: block.end,
      type: block.type,
      isHardBlock: block.isHardBlock,
      visibility: 'BUSY',
      source: block.source,
      // Strip all other details
    }
  }
  return block
}

/**
 * Recursively redact blocks in a response payload
 */
function redactPayload(data, isCoach) {
  if (!isCoach) return data

  if (Array.isArray(data)) {
    return data.map((item) => redactPayload(item, isCoach))
  }

  if (data && typeof data === 'object') {
    // If this looks like a ScheduleBlock (has .type that's a block type)
    if (PROTECTED_BLOCK_TYPES.has(data.type) && data.start && data.end) {
      return redactBlockForCoach(data)
    }

    // Recurse into nested objects
    const result = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'scheduleBlocks' && Array.isArray(value)) {
        result[key] = value.map((block) =>
          PROTECTED_BLOCK_TYPES.has(block.type) ? redactBlockForCoach(block) : block
        )
      } else {
        result[key] = redactPayload(value, isCoach)
      }
    }
    return result
  }

  return data
}

/**
 * Express middleware that intercepts res.json to apply FERPA redaction
 */
function ferpaSerializer(req, res, next) {
  const isCoach = req.user?.role === 'COACH'

  if (!isCoach) {
    return next()
  }

  const originalJson = res.json.bind(res)
  res.json = function (data) {
    const redacted = redactPayload(data, true)
    return originalJson(redacted)
  }

  next()
}

module.exports = { ferpaSerializer, redactBlockForCoach, redactPayload }

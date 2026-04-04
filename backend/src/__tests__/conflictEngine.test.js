/**
 * Unit tests for conflict detection logic.
 *
 * These tests focus on the overlap algorithm and CARA hour calculations
 * WITHOUT hitting the database (pure logic).
 */

// ─── Overlap logic (extracted from conflictEngine.js) ─────────────────────────
/**
 * Returns true if [aStart, aEnd) overlaps with [bStart, bEnd).
 * Standard interval overlap: a.start < b.end AND a.end > b.start
 */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart)
}

// ─── CARA weekly hours calculation ────────────────────────────────────────────
function projectCARAHours(currentHours, eventStart, eventEnd) {
  const eventHours = (new Date(eventEnd) - new Date(eventStart)) / (1000 * 60 * 60)
  return currentHours + eventHours
}

const D1_WEEKLY_LIMIT = 20

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Overlap detection', () => {
  it('no conflict when blocks do not overlap (block before event)', () => {
    // Block: 8am–10am, Event: 11am–1pm
    expect(overlaps('2024-01-01T08:00:00Z', '2024-01-01T10:00:00Z',
                    '2024-01-01T11:00:00Z', '2024-01-01T13:00:00Z')).toBe(false)
  })

  it('no conflict when blocks do not overlap (block after event)', () => {
    // Block: 2pm–4pm, Event: 9am–11am
    expect(overlaps('2024-01-01T14:00:00Z', '2024-01-01T16:00:00Z',
                    '2024-01-01T09:00:00Z', '2024-01-01T11:00:00Z')).toBe(false)
  })

  it('detects overlap: block starts before event and ends during it', () => {
    // Block: 9am–11am, Event: 10am–12pm → overlap 10am–11am
    expect(overlaps('2024-01-01T09:00:00Z', '2024-01-01T11:00:00Z',
                    '2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z')).toBe(true)
  })

  it('detects overlap: block completely contains event', () => {
    // Block: 8am–6pm, Event: 10am–12pm
    expect(overlaps('2024-01-01T08:00:00Z', '2024-01-01T18:00:00Z',
                    '2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z')).toBe(true)
  })

  it('detects overlap: event completely contains block', () => {
    // Block: 10am–11am, Event: 9am–1pm
    expect(overlaps('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z',
                    '2024-01-01T09:00:00Z', '2024-01-01T13:00:00Z')).toBe(true)
  })

  it('edge case: block ends exactly when event starts (no overlap)', () => {
    // Block: 8am–10am, Event: 10am–12pm → adjacent, NOT overlapping
    expect(overlaps('2024-01-01T08:00:00Z', '2024-01-01T10:00:00Z',
                    '2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z')).toBe(false)
  })

  it('edge case: block starts exactly when event ends (no overlap)', () => {
    // Block: 12pm–2pm, Event: 10am–12pm → adjacent, NOT overlapping
    expect(overlaps('2024-01-01T12:00:00Z', '2024-01-01T14:00:00Z',
                    '2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z')).toBe(false)
  })
})

describe('CARA weekly limit (D1: 20 hrs/week)', () => {
  it('CARA: athlete at 18h + 3h event = violation', () => {
    const projected = projectCARAHours(18,
      '2024-01-01T09:00:00Z',
      '2024-01-01T12:00:00Z' // 3 hours
    )
    expect(projected).toBe(21)
    expect(projected > D1_WEEKLY_LIMIT).toBe(true)
  })

  it('CARA: athlete at 16h + 3h event = no violation', () => {
    const projected = projectCARAHours(16,
      '2024-01-01T09:00:00Z',
      '2024-01-01T12:00:00Z' // 3 hours
    )
    expect(projected).toBe(19)
    expect(projected > D1_WEEKLY_LIMIT).toBe(false)
  })

  it('CARA: athlete at exactly 20h + 1h event = violation', () => {
    const projected = projectCARAHours(20,
      '2024-01-01T09:00:00Z',
      '2024-01-01T10:00:00Z' // 1 hour
    )
    expect(projected).toBe(21)
    expect(projected > D1_WEEKLY_LIMIT).toBe(true)
  })

  it('CARA: athlete at 17h + 3h event = exactly at limit (no violation)', () => {
    const projected = projectCARAHours(17,
      '2024-01-01T09:00:00Z',
      '2024-01-01T12:00:00Z' // 3 hours
    )
    expect(projected).toBe(20)
    expect(projected > D1_WEEKLY_LIMIT).toBe(false)
  })

  it('CARA: computes fractional hours correctly', () => {
    const projected = projectCARAHours(19.5,
      '2024-01-01T09:00:00Z',
      '2024-01-01T10:30:00Z' // 1.5 hours
    )
    expect(projected).toBe(21)
    expect(projected > D1_WEEKLY_LIMIT).toBe(true)
  })
})

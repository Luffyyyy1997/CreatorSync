/**
 * Unit tests for frontend validators.
 */
import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateContent,
  validateTitle,
  validatePlatforms,
  validateScheduledAt,
  validateTopic,
  validatePostForm,
} from '../utils/validators.js'

describe('validateEmail', () => {
  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull()
  })
  it('returns error for empty email', () => {
    expect(validateEmail('')).toBeTruthy()
  })
  it('returns error for invalid email format', () => {
    expect(validateEmail('not-an-email')).toBeTruthy()
  })
})

describe('validatePassword', () => {
  it('returns null for valid password', () => {
    expect(validatePassword('password123')).toBeNull()
  })
  it('returns error for short password', () => {
    expect(validatePassword('abc')).toBeTruthy()
  })
  it('returns error for empty password', () => {
    expect(validatePassword('')).toBeTruthy()
  })
})

describe('validateContent', () => {
  it('returns null for valid content', () => {
    expect(validateContent('Hello world!')).toBeNull()
  })
  it('returns error for empty content', () => {
    expect(validateContent('')).toBeTruthy()
  })
  it('returns error for content over 2200 chars', () => {
    expect(validateContent('x'.repeat(2201))).toBeTruthy()
  })
})

describe('validatePlatforms', () => {
  it('returns null for at least one platform', () => {
    expect(validatePlatforms(['twitter'])).toBeNull()
  })
  it('returns error for empty array', () => {
    expect(validatePlatforms([])).toBeTruthy()
  })
  it('returns error for null', () => {
    expect(validatePlatforms(null)).toBeTruthy()
  })
})

describe('validateScheduledAt', () => {
  it('returns null for null input (optional field)', () => {
    expect(validateScheduledAt(null)).toBeNull()
  })
  it('returns error for past date', () => {
    expect(validateScheduledAt('2020-01-01T00:00')).toBeTruthy()
  })
  it('returns null for future date', () => {
    const future = new Date(Date.now() + 3600000).toISOString()
    expect(validateScheduledAt(future)).toBeNull()
  })
})

describe('validatePostForm', () => {
  it('returns empty errors for valid form', () => {
    const result = validatePostForm({
      title: 'My Post',
      content: 'Some content here',
      platforms: ['twitter'],
      status: 'draft',
    })
    expect(result).toEqual({})
  })

  it('returns errors for empty title and content', () => {
    const result = validatePostForm({
      title: '',
      content: '',
      platforms: ['twitter'],
      status: 'draft',
    })
    expect(result.title).toBeTruthy()
    expect(result.content).toBeTruthy()
  })

  it('requires scheduledAt when status is scheduled', () => {
    const result = validatePostForm({
      title: 'Test',
      content: 'Content',
      platforms: ['twitter'],
      status: 'scheduled',
      scheduledAt: null,
    })
    expect(result.scheduledAt).toBeTruthy()
  })
})

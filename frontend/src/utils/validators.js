/**
 * Frontend input validation helpers.
 * All functions return an error string if invalid, or null if valid.
 */

/** Validate email format. */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim())) return 'Please enter a valid email address.'
  return null
}

/** Validate password length. */
export function validatePassword(password) {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

/** Validate display name. */
export function validateDisplayName(name) {
  if (!name || !name.trim()) return 'Display name is required.'
  return null
}

/** Validate post content. */
export function validateContent(content) {
  if (!content || !content.trim()) return 'Content is required.'
  if (content.length > 2200) return `Content is too long (${content.length}/2200 characters).`
  return null
}

/** Validate post title. */
export function validateTitle(title) {
  if (!title || !title.trim()) return 'Title is required.'
  return null
}

/** Validate that at least one platform is selected. */
export function validatePlatforms(platforms) {
  if (!platforms || platforms.length === 0) return 'Select at least one platform.'
  return null
}

/** Validate that scheduled_at is in the future. */
export function validateScheduledAt(scheduledAt) {
  if (!scheduledAt) return null  // optional field
  const date = new Date(scheduledAt)
  if (isNaN(date.getTime())) return 'Please enter a valid date and time.'
  if (date <= new Date()) return 'Scheduled time must be in the future.'
  return null
}

/** Validate topic for AI features. */
export function validateTopic(topic) {
  if (!topic || !topic.trim()) return 'Topic is required.'
  if (topic.length > 300) return 'Topic is too long (max 300 characters).'
  return null
}

/**
 * Run all validators for a post form.
 * Returns an object of { fieldName: errorString } for any invalid fields.
 */
export function validatePostForm({ title, content, platforms, scheduledAt, status }) {
  const errors = {}
  const titleErr = validateTitle(title)
  if (titleErr) errors.title = titleErr

  const contentErr = validateContent(content)
  if (contentErr) errors.content = contentErr

  const platformsErr = validatePlatforms(platforms)
  if (platformsErr) errors.platforms = platformsErr

  if (status === 'scheduled') {
    const dateErr = validateScheduledAt(scheduledAt)
    if (dateErr) errors.scheduledAt = dateErr
    if (!scheduledAt) errors.scheduledAt = 'Scheduled time is required when status is "Scheduled".'
  }

  return errors
}

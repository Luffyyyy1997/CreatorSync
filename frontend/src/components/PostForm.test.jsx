/**
 * Tests for the PostForm component.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PostForm from '../components/PostForm.jsx'

// Mock the AI API so PostForm doesn't hit a real server
vi.mock('../api/aiApi.js', () => ({
  aiApi: {
    ideas: vi.fn(),
    caption: vi.fn(),
    hashtags: vi.fn(),
  },
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

function renderPostForm(props = {}) {
  return render(
    <MemoryRouter>
      <PostForm onSubmit={vi.fn()} {...props} />
    </MemoryRouter>
  )
}

describe('PostForm', () => {
  it('renders all required fields', () => {
    renderPostForm()
    expect(screen.getByPlaceholderText(/internal label/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/write your post content/i)).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const onSubmit = vi.fn()
    renderPostForm({ onSubmit })

    fireEvent.click(screen.getByRole('button', { name: /save post/i }))

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = vi.fn()
    renderPostForm({ onSubmit })

    fireEvent.change(screen.getByPlaceholderText(/internal label/i), {
      target: { value: 'Test Title' },
    })
    fireEvent.change(screen.getByPlaceholderText(/write your post content/i), {
      target: { value: 'Test content here' },
    })
    // Select Twitter platform
    fireEvent.click(screen.getByText('Twitter'))

    fireEvent.click(screen.getByRole('button', { name: /save post/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test content here',
          platforms: ['twitter'],
        })
      )
    })
  })

  it('shows scheduled_at field when status is Scheduled', async () => {
    renderPostForm()
    // Initially, scheduled_at should not be visible
    expect(screen.queryByLabelText(/scheduled at/i)).not.toBeInTheDocument()

    // Change status to Scheduled
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'scheduled' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/scheduled at/i)).toBeInTheDocument()
    })
  })

  it('pre-fills form with initialData', () => {
    renderPostForm({
      initialData: { title: 'Existing Post', content: 'Existing content', platforms: ['instagram'] },
    })
    expect(screen.getByDisplayValue('Existing Post')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument()
  })
})

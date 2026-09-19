/** Animated loading spinner. size prop: 'sm' | 'md' | 'lg' */
export default function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-gray-300 border-t-brand-500 animate-spin ${sizes[size]}`}
    />
  )
}

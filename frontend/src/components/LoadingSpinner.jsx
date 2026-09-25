/** Animated loading spinner with branded gradient. size: 'sm' | 'md' | 'lg' */
export default function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  const borders = {
    sm: 'border-2',
    md: 'border-[3px]',
    lg: 'border-4',
  }
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full animate-spin ${sizes[size]} ${borders[size]}`}
      style={{
        borderColor: 'transparent',
        borderTopColor: '#7c3aed',
        borderRightColor: '#4f46e5',
        background: 'transparent',
      }}
    />
  )
}

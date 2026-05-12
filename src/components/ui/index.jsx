// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-3 border-gray-200 border-t-blue-600`}
        style={{ borderWidth: 3 }} />
    </div>
  )
}

// Stars
export function Stars({ rating = 0, count, size = 'sm' }) {
  const sz = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${sz}`}>
        {[1,2,3,4,5].map(n => (
          <span key={n} className={n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  )
}

// Empty state
export function Empty({ icon = '📭', title, sub, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      {title && <h3 className="text-lg font-bold text-gray-600 mb-2">{title}</h3>}
      {sub   && <p className="text-sm text-gray-400 mb-6">{sub}</p>}
      {action}
    </div>
  )
}

// LoadingPage
export function LoadingPage() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

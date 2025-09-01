interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`}></div>
  )
}

interface LoadingCardProps {
  title?: string
  message?: string
}

export function LoadingCard({ title = 'Cargando...', message }: LoadingCardProps) {
  return (
    <div className='flex flex-col items-center justify-center p-8 space-y-4'>
      <LoadingSpinner size='lg' />
      <div className='text-center'>
        <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
        {message && <p className='text-gray-600 mt-1'>{message}</p>}
      </div>
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='h-8 bg-gray-200 rounded w-48'></div>
      <div className='space-y-3'>
        {[1, 2, 3].map(i => (
          <div key={i} className='h-16 bg-gray-200 rounded'></div>
        ))}
      </div>
    </div>
  )
}

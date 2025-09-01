interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const defaultIcon = (
    <svg className='w-12 h-12 text-gray-400 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
    </svg>
  )

  return (
    <div className='text-center py-12'>
      {icon || defaultIcon}
      <h3 className='text-lg font-medium text-gray-900 mt-4 mb-2'>{title}</h3>
      <p className='text-gray-600 mb-6'>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

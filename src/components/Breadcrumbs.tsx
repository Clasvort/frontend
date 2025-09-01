import { Link, useLocation } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs() {
  const location = useLocation()
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/' }
    ]
    
    if (segments[0] === 'projects') {
      breadcrumbs.push({ label: 'Proyectos', href: '/projects' })
      
      if (segments[1]) {
        // En vista de detalle de proyecto
        breadcrumbs.push({ label: 'Detalle del Proyecto' })
      }
    } else if (segments[0] === 'users') {
      breadcrumbs.push({ label: 'Usuarios', href: '/users' })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  if (breadcrumbs.length <= 1) return null
  
  return (
    <nav className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className='flex items-center'>
          {index > 0 && (
            <svg className='w-4 h-4 mx-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          )}
          {crumb.href ? (
            <Link to={crumb.href} className='hover:text-blue-600 transition-colors'>
              {crumb.label}
            </Link>
          ) : (
            <span className='text-gray-900 font-medium'>{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

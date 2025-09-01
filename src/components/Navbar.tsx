import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Proyectos', href: '/projects', icon: '📁' },
    ...(role === 'admin' || role === 'manager' 
      ? [{ name: 'Usuarios', href: '/users', icon: '👥' }] 
      : []
    ),
  ]

  return (
    <nav className='bg-white shadow border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-8'>
            <Link to='/' className='flex items-center space-x-2'>
              <span className='text-xl font-bold text-blue-600'>ProjectManager</span>
            </Link>
            
            <div className='hidden md:flex items-center space-x-4'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className='mr-2'>{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='text-sm text-gray-600'>
              Rol: <span className='font-medium capitalize'>{role}</span>
            </div>
            <button
              onClick={handleLogout}
              className='bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors'
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className='md:hidden bg-gray-50 border-t'>
        <div className='px-2 pt-2 pb-3 space-y-1'>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className='mr-2'>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

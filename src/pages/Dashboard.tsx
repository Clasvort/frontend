import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'

interface DashboardStats {
  activeProjects: number
  assignedTasks: number
  completedTasks: number
  totalUsers: number
}

interface RecentActivity {
  id: string
  type: 'project' | 'task' | 'user'
  message: string
  timestamp: string
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    assignedTasks: 0,
    completedTasks: 0,
    totalUsers: 0
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [assignedTasks, setAssignedTasks] = useState<any[]>([])
  const [notifications, setNotifications] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { role } = useAuthStore()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener proyectos activos
        const projectsResponse = await api.get('/projects')
        
        // Manejar diferentes estructuras de respuesta para proyectos
        const projectsData = Array.isArray(projectsResponse.data) ? projectsResponse.data : 
                           Array.isArray(projectsResponse.data?.items) ? projectsResponse.data.items : 
                           Array.isArray(projectsResponse.data?.projects) ? projectsResponse.data.projects : []
        
        setRecentProjects(projectsData)

        // Obtener todas las tareas de todos los proyectos
        let allTasks: any[] = []
        if (projectsData.length > 0) {
          for (const project of projectsData) {
            try {
              const tasksResponse = await api.get(`/projects/${project.id}/tasks`)
              
              // Manejar diferentes estructuras de respuesta para tareas
              const tasksData = Array.isArray(tasksResponse.data) ? tasksResponse.data :
                              Array.isArray(tasksResponse.data?.items) ? tasksResponse.data.items :
                              Array.isArray(tasksResponse.data?.tasks) ? tasksResponse.data.tasks : []
              
              // Agregar información del proyecto a cada tarea
              const tasksWithProject = tasksData.map((task: any) => ({
                ...task,
                projectName: project.name,
                projectId: project.id
              }))
              
              allTasks = [...allTasks, ...tasksWithProject]
            } catch (taskError) {
              console.error(`Error fetching tasks for project ${project.id}:`, taskError)
            }
          }
        }

        setAssignedTasks(allTasks)

        // Obtener usuarios si es admin
        if (role === 'admin') {
          try {
            const usersResponse = await api.get('/users')
            const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : 
                            Array.isArray(usersResponse.data?.items) ? usersResponse.data.items : 
                            Array.isArray(usersResponse.data?.users) ? usersResponse.data.users : []
            
            setStats(prevStats => ({
              ...prevStats,
              totalUsers: usersData.length
            }))
          } catch (userError) {
            console.error('Error fetching users:', userError)
          }
        }

        // Calcular estadísticas basadas en los datos obtenidos
        const activeProjects = projectsData.filter((project: any) => 
          project.status !== 'completed' && project.status !== 'cancelled'
        ).length

        const completedTasks = allTasks.filter((task: any) => task.status === 'done').length
        const assignedToUser = allTasks.length // Por ahora todas las tareas

        setStats(prevStats => ({
          ...prevStats,
          activeProjects,
          assignedTasks: assignedToUser,
          completedTasks
        }))

        // Las notificaciones las dejamos vacías por ahora si no hay endpoint
        // const notificationsResponse = await api.get('/notifications/recent?limit=5')
        // setNotifications(notificationsResponse.data.items || [])
        setNotifications([])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Error al cargar los datos del dashboard. Verifica que el backend esté ejecutándose.')
        // Establecer valores por defecto en caso de error
        setRecentProjects([])
        setAssignedTasks([])
        setNotifications([])
        setStats({
          activeProjects: 0,
          assignedTasks: 0,
          completedTasks: 0,
          totalUsers: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className='p-6 space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-48 mb-6'></div>
          <div className='grid gap-4 grid-cols-1 md:grid-cols-4 mb-6'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='h-24 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <div className='text-sm text-gray-600'>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
          <div className='flex items-center space-x-2'>
            <svg className='w-5 h-5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <p className='text-red-800 text-sm'>{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              window.location.reload()
            }}
            className='mt-2 text-red-600 hover:text-red-800 text-sm font-medium'
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Métricas básicas */}
      <div className='grid gap-4 grid-cols-1 md:grid-cols-4'>
        <div className='bg-white p-6 rounded-xl shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Proyectos Activos</p>
              <p className='text-3xl font-bold text-blue-600'>{stats.activeProjects}</p>
            </div>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-xl shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tareas Asignadas</p>
              <p className='text-3xl font-bold text-orange-600'>{stats.assignedTasks}</p>
            </div>
            <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-xl shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tareas Completadas</p>
              <p className='text-3xl font-bold text-green-600'>{stats.completedTasks}</p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
          </div>
        </div>

        {role === 'admin' && (
          <div className='bg-white p-6 rounded-xl shadow border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Usuarios</p>
                <p className='text-3xl font-bold text-purple-600'>{stats.totalUsers}</p>
              </div>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='grid gap-6 grid-cols-1 lg:grid-cols-2'>
        {/* Resumen de proyectos activos */}
        <div className='bg-white rounded-xl shadow border'>
          <div className='p-6 border-b'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>Proyectos Activos</h2>
              <Link to='/projects' className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                Ver todos →
              </Link>
            </div>
          </div>
          <div className='p-6 space-y-3'>
            {recentProjects.length > 0 ? (
              recentProjects.slice(0, 4).map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className='block p-3 rounded-lg border hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <h3 className='font-medium'>{project.name}</h3>
                      <p className='text-sm text-gray-600 line-clamp-2'>
                        {project.description || 'Sin descripción'}
                      </p>
                      {project.endDate && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Fecha límite: {new Date(project.endDate).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <div className='text-right'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status || 'active'}
                      </span>
                      {project.priority && (
                        <p className={`text-xs mt-1 ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className='text-gray-500 text-center py-4'>No hay proyectos activos</p>
            )}
            {recentProjects.length > 4 && (
              <div className='text-center pt-3 border-t'>
                <Link to='/projects' className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                  Ver todos los proyectos →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tareas asignadas al usuario */}
        <div className='bg-white rounded-xl shadow border'>
          <div className='p-6 border-b'>
            <h2 className='text-xl font-semibold'>Mis Tareas</h2>
          </div>
          <div className='p-6 space-y-3'>
            {assignedTasks.length > 0 ? (
              assignedTasks.slice(0, 5).map(task => (
                <Link
                  key={task.id}
                  to={`/projects/${task.projectId}`}
                  className='block p-3 rounded-lg border hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <h3 className='font-medium'>{task.title}</h3>
                      <p className='text-sm text-gray-600'>
                        {task.projectName || task.project?.name || 'Proyecto sin nombre'}
                      </p>
                      {task.dueDate && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'normal'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status || 'todo'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className='text-gray-500 text-center py-4'>No tienes tareas asignadas</p>
            )}
            {assignedTasks.length > 5 && (
              <div className='text-center pt-3 border-t'>
                <Link to='/projects' className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                  Ver todos los proyectos →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificaciones recientes */}
      {notifications.length > 0 && (
        <div className='bg-white rounded-xl shadow border'>
          <div className='p-6 border-b'>
            <h2 className='text-xl font-semibold'>Notificaciones Recientes</h2>
          </div>
          <div className='p-6 space-y-3'>
            {notifications.map(notification => (
              <div key={notification.id} className='flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm'>{notification.message}</p>
                  <p className='text-xs text-gray-500'>
                    {new Date(notification.timestamp).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enlaces rápidos */}
      <div className='grid gap-4 grid-cols-1 md:grid-cols-3'>
        <Link
          to='/projects'
          className='bg-white p-6 rounded-xl shadow border hover:shadow-lg transition-shadow'
        >
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
              </svg>
            </div>
            <div>
              <h3 className='font-semibold'>Gestión de Proyectos</h3>
              <p className='text-sm text-gray-600'>Ver y administrar proyectos</p>
            </div>
          </div>
        </Link>

        {(role === 'admin' || role === 'manager') && (
          <Link
            to='/users'
            className='bg-white p-6 rounded-xl shadow border hover:shadow-lg transition-shadow'
          >
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold'>Gestión de Usuarios</h3>
                <p className='text-sm text-gray-600'>Administrar equipo</p>
              </div>
            </div>
          </Link>
        )}

        <div className='bg-white p-6 rounded-xl shadow border'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4' />
              </svg>
            </div>
            <div>
              <h3 className='font-semibold'>Reportes</h3>
              <p className='text-sm text-gray-600'>Métricas y análisis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'
import { showToast, confirmAction } from '../lib/notifications'
import { Breadcrumbs } from '../components/Breadcrumbs'

interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'on_hold' | 'completed'
  priority: 'low' | 'medium' | 'high'
  startDate: string
  endDate?: string
  assignedUsers: any[]
  tasksCount?: number
  completedTasksCount?: number
}

interface CreateProjectForm {
  name: string
  description: string
  status: string
  priority: string
  startDate: string
  endDate: string
  managerId: string,
  developersIds: string[]
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [newProject, setNewProject] = useState<CreateProjectForm>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    managerId: '',
    developersIds: []
  })

  const { role } = useAuthStore()
  const canCreateProject = role === 'admin' || role === 'manager'

  // Búsqueda en tiempo real con useMemo
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = filters.status === 'all' || project.status === filters.status
      const matchesPriority = filters.priority === 'all' || project.priority === filters.priority
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [projects, filters, searchQuery])

  useEffect(() => {
    fetchProjects()
    if (canCreateProject) {
      fetchUsers()
    }
  }, [filters])

  // Debounce para la búsqueda en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.priority !== 'all') {
        params.append('priority', filters.priority)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      const { data } = await api.get(`/projects${params.toString() ? `?${params.toString()}` : ''}`)
      
      // Intentar diferentes estructuras de respuesta del backend
      const projectsArray = data.items || data.projects || data || []
      
      setProjects(projectsArray)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
    setLoading(false)
  }
}

const fetchUsers = async () => {
  try {
    const { data } = await api.get('/users')
    setUsers(data.items || [])
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const { data } = await api.post('/projects', newProject)
    setProjects([data, ...projects])
    setShowCreateForm(false)
    setNewProject({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      managerId: '',
      developersIds: []
    })
    showToast.success('Proyecto creado correctamente')
  } catch (error) {
    console.error('Error creating project:', error)
    showToast.error('Error al crear el proyecto')
  }
}

const handleDeleteProject = async (projectId: string, projectName: string) => {
  confirmAction(
    `¿Estás seguro de que quieres eliminar el proyecto "${projectName}"? Esta acción eliminará también todas las tareas asociadas al proyecto.`,
    async () => {
      try {
        await api.delete(`/projects/${projectId}`)
        setProjects(projects.filter(project => project.id !== projectId))
        showToast.success('Proyecto eliminado correctamente')
      } catch (error) {
        console.error('Error deleting project:', error)
        showToast.error('Error al eliminar el proyecto')
      }
    }
  )
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planning': return 'bg-blue-100 text-blue-800'
    case 'active': return 'bg-green-100 text-green-800'
    case 'on_hold': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
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

const calculateProgress = (project: Project) => {
  if (!project.tasksCount || project.tasksCount === 0) return 0
  return Math.round((project.completedTasksCount || 0) / project.tasksCount * 100)
}

if (loading) {
  return (
    <div className='p-6'>
      <div className='animate-pulse space-y-4'>
        <div className='h-8 bg-gray-200 rounded w-48'></div>
        <div className='grid gap-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-24 bg-gray-200 rounded'></div>
          ))}
        </div>
      </div>
    </div>
  )
}

return (
  <div className='p-6 space-y-6'>
    <Breadcrumbs />

    {/* Header */}
    <div className='flex items-center justify-between'>
      <div>
        <h1 className='text-3xl font-bold'>Gestión de Proyectos</h1>
        <p className='text-gray-600'>Lista de proyectos con filtros y gestión</p>
      </div>
      {canCreateProject && (
        <button
          onClick={() => setShowCreateForm(true)}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span>Nuevo Proyecto</span>
        </button>
      )}
    </div>

    {/* Filtros */}
    <div className='bg-white p-4 rounded-xl shadow border'>
      <div className='grid gap-4 grid-cols-1 md:grid-cols-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Buscar</label>
          <input
            type='text'
            placeholder='Buscar proyectos...'
            className='w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Estado</label>
          <select
            className='w-full border rounded-lg px-3 py-2'
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value='all'>Todos los estados</option>
            <option value='planning'>Planificación</option>
            <option value='active'>Activo</option>
            <option value='on_hold'>En pausa</option>
            <option value='completed'>Completado</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Prioridad</label>
          <select
            className='w-full border rounded-lg px-3 py-2'
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value='all'>Todas las prioridades</option>
            <option value='low'>Baja</option>
            <option value='medium'>Media</option>
            <option value='high'>Alta</option>
          </select>
        </div>
        <div className='flex items-end'>
          <button
            onClick={() => {
              setFilters({ status: 'all', priority: 'all', search: '' })
              setSearchQuery('')
            }}
            className='w-full border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50'
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    {/* Lista de proyectos */}
    <div className='grid gap-4'>
      {filteredProjects.length > 0 ? (
        filteredProjects.map(project => (
          <div
            key={project.id}
            className='bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow relative'
          >
            {/* Botón de eliminar (solo para admin/manager) */}
            {canCreateProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteProject(project.id, project.name)
                }}
                className='absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors z-10'
                title='Eliminar proyecto'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                </svg>
              </button>
            )}

            {/* Contenido del proyecto (clickeable para navegar) */}
            <Link
              to={`/projects/${project.id}`}
              className='block'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1 pr-12'> {/* Agregar padding-right para espacio del botón */}
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3 className='text-lg font-semibold'>{project.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                  <p className='text-gray-600 mb-3'>{project.description}</p>

                  <div className='flex items-center space-x-6 text-sm text-gray-500'>
                    <div className='flex items-center space-x-1'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2H8z' />
                      </svg>
                      <span>Inicio: {new Date(project.startDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    {project.endDate && (
                      <div className='flex items-center space-x-1'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2H8z' />
                        </svg>
                        <span>Fin: {new Date(project.endDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    <div className='flex items-center space-x-1'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' />
                      </svg>
                      <span>{project.assignedUsers?.length || 0} desarrolladores</span>
                    </div>
                  </div>
                </div>

                <div className='text-right min-w-32'>
                  {project.tasksCount && project.tasksCount > 0 && (
                    <div className='mb-2'>
                      <div className='text-sm text-gray-600 mb-1'>
                        Progreso: {calculateProgress(project)}%
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full'
                          style={{ width: `${calculateProgress(project)}%` }}
                        ></div>
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {project.completedTasksCount || 0} / {project.tasksCount} tareas
                      </div>
                    </div>
                  )}
                  <div className='flex -space-x-2'>
                    {project.assignedUsers?.slice(0, 3).map((user, index) => (
                      <div
                        key={user.id}
                        className='w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium'
                        title={user.name}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(project.assignedUsers?.length || 0) > 3 && (
                      <div className='w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600'>
                        +{(project.assignedUsers?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))
      ) : (
        <div className='text-center py-12'>
          <svg className='w-12 h-12 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
          </svg>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No hay proyectos</h3>
          <p className='text-gray-600'>No se encontraron proyectos con los filtros aplicados.</p>
        </div>
      )}
    </div>

    {/* Modal para crear proyecto */}
    {showCreateForm && (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
        <div className='bg-white rounded-xl max-w-2xl w-full max-h-90vh overflow-y-auto'>
          <div className='p-6 border-b'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>Crear Nuevo Proyecto</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateProject} className='p-6 space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nombre del proyecto *
              </label>
              <input
                type='text'
                required
                className='w-full border rounded-lg px-3 py-2'
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Descripción
              </label>
              <textarea
                className='w-full border rounded-lg px-3 py-2 rows-3'
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              ></textarea>
            </div>

            <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Estado</label>
                <select
                  className='w-full border rounded-lg px-3 py-2'
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                >
                  <option value='planning'>por hacer</option>
                  <option value='in_progress'>en progreso</option>
                  <option value='completed'>completado</option>
                  <option value='canceled'>cancelado</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Prioridad</label>
                <select
                  className='w-full border rounded-lg px-3 py-2'
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                >
                  <option value='low'>Baja</option>
                  <option value='medium'>Media</option>
                  <option value='high'>Alta</option>
                </select>
              </div>
            </div>

            <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fecha de inicio *
                </label>
                <input
                  type='date'
                  required
                  className='w-full border rounded-lg px-3 py-2'
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fecha de fin
                </label>
                <input
                  type='date'
                  className='w-full border rounded-lg px-3 py-2'
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Asignar desarrolladores
              </label>
              <div className='border rounded-lg p-3 max-h-32 overflow-y-auto'>
                {users.map(user => (
                  <label key={user.id} className='flex items-center space-x-2 py-1'>
                    <input
                      type='checkbox'
                      checked={newProject.developersIds.includes(user.id)}
                      onChange={(e) => {
                        const userIds = e.target.checked
                          ? [...newProject.developersIds, user.id]
                          : newProject.developersIds.filter(id => id !== user.id)
                        setNewProject({ ...newProject, developersIds: userIds })
                      }}
                    />
                    <span className='text-sm'>{user.name} - {user.role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className='flex space-x-3 pt-4'>
              <button
                type='submit'
                className='flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
              >
                Crear Proyecto
              </button>
              <button
                type='button'
                onClick={() => setShowCreateForm(false)}
                className='flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50'
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)
}

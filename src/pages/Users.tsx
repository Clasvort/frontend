import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'
import { showToast, confirmAction } from '../lib/notifications'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'developer'
  createdAt: string
  projects?: any[]
  isActive?: boolean
}

interface CreateUserForm {
  name: string
  email: string
  password: string
  role: string
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filters, setFilters] = useState({
    role: 'all',
    search: ''
  })
  const [newUser, setNewUser] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'developer'
  })
  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    projectIds: [] as string[]
  })

  const { role: currentUserRole } = useAuthStore()
  const canManageUsers = currentUserRole === 'admin' || currentUserRole === 'manager'

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers()
      fetchProjects()
    }
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.role !== 'all') params.append('role', filters.role)
      if (filters.search) params.append('search', filters.search)
      
      const { data } = await api.get(`/users?${params.toString()}`)
      
      // Asegurar que siempre sea un array
      const usersData = Array.isArray(data) ? data : 
                       Array.isArray(data?.items) ? data.items : 
                       Array.isArray(data?.users) ? data.users : []
      
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast.error('Error al cargar los usuarios')
      setUsers([]) // Establecer array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const { data } = await api.get('/projects')
      
      // Asegurar que siempre sea un array
      const projectsData = Array.isArray(data) ? data : 
                          Array.isArray(data?.items) ? data.items : 
                          Array.isArray(data?.projects) ? data.projects : []
      
      setProjects(projectsData)
    } catch (error) {
      console.error('Error fetching projects:', error)
      showToast.error('Error al cargar los proyectos')
      setProjects([]) // Establecer array vacío en caso de error
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/users', newUser)
      setUsers([data, ...users])
      setShowCreateForm(false)
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'developer'
      })
      showToast.success('Usuario creado correctamente')
    } catch (error) {
      console.error('Error creating user:', error)
      showToast.error('Error al crear el usuario')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    confirmAction(
      `¿Estás seguro de que quieres eliminar al usuario "${userName}"?`,
      async () => {
        try {
          await api.delete(`/users/${userId}`)
          setUsers(users.filter(user => user.id !== userId))
          showToast.success('Usuario eliminado correctamente')
        } catch (error) {
          console.error('Error deleting user:', error)
          showToast.error('Error al eliminar el usuario')
        }
      }
    )
  }

  const handleAssignToProjects = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/users/assign-projects', assignmentData)
      // Actualizar la lista de usuarios
      fetchUsers()
      setShowAssignModal(false)
      setAssignmentData({ userId: '', projectIds: [] })
      showToast.success('Usuario asignado a proyectos correctamente')
    } catch (error) {
      console.error('Error assigning user to projects:', error)
      showToast.error('Error al asignar usuario a proyectos')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'developer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesRole = filters.role === 'all' || user.role === filters.role
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesRole && matchesSearch
  }) : []

  if (!canManageUsers) {
    return (
      <div className='p-6 text-center'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
          <svg className='w-12 h-12 text-yellow-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.759 0L3.732 16c-.77.833.192 2.5 1.732 2.5z' />
          </svg>
          <h3 className='text-lg font-medium text-yellow-800 mb-2'>Acceso Restringido</h3>
          <p className='text-yellow-700'>Solo los administradores y managers pueden gestionar usuarios.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-48'></div>
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Gestión de Usuarios</h1>
          <p className='text-gray-600'>Lista de desarrolladores y asignación a proyectos</p>
        </div>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className='bg-white p-4 rounded-xl shadow border'>
        <div className='grid gap-4 grid-cols-1 md:grid-cols-3'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Buscar</label>
            <input
              type='text'
              placeholder='Buscar por nombre o email...'
              className='w-full border rounded-lg px-3 py-2'
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Rol</label>
            <select
              className='w-full border rounded-lg px-3 py-2'
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value='all'>Todos los roles</option>
              <option value='admin'>Administrador</option>
              <option value='manager'>Manager</option>
              <option value='developer'>Developer</option>
            </select>
          </div>
          <div className='flex items-end'>
            <button
              onClick={() => setFilters({ role: 'all', search: '' })}
              className='w-full border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50'
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className='bg-white rounded-xl shadow border'>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead className='bg-gray-50 border-b'>
              <tr>
                <th className='text-left p-4 font-medium text-gray-900'>Usuario</th>
                <th className='text-left p-4 font-medium text-gray-900'>Rol</th>
                <th className='text-left p-4 font-medium text-gray-900'>Proyectos</th>
                <th className='text-left p-4 font-medium text-gray-900'>Registro</th>
                <th className='text-left p-4 font-medium text-gray-900'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className='hover:bg-gray-50'>
                    <td className='p-4'>
                      <div>
                        <div className='font-medium text-gray-900'>{user.name}</div>
                        <div className='text-sm text-gray-600'>{user.email}</div>
                      </div>
                    </td>
                    <td className='p-4'>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className='p-4'>
                      <div className='text-sm text-gray-600'>
                        {user.projects?.length || 0} proyecto(s)
                      </div>
                    </td>
                    <td className='p-4'>
                      <div className='text-sm text-gray-600'>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setAssignmentData({ userId: user.id, projectIds: user.projects?.map(p => p.id) || [] })
                            setShowAssignModal(true)
                          }}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                        >
                          Asignar
                        </button>
                        {currentUserRole === 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className='text-red-600 hover:text-red-800 text-sm font-medium'
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='p-8 text-center text-gray-500'>
                    No se encontraron usuarios con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear usuario */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-xl max-w-md w-full'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>Crear Nuevo Usuario</h2>
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
            
            <form onSubmit={handleCreateUser} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nombre completo *
                </label>
                <input
                  type='text'
                  required
                  className='w-full border rounded-lg px-3 py-2'
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email *
                </label>
                <input
                  type='email'
                  required
                  className='w-full border rounded-lg px-3 py-2'
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Contraseña *
                </label>
                <input
                  type='password'
                  required
                  minLength={6}
                  className='w-full border rounded-lg px-3 py-2'
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Rol</label>
                <select
                  className='w-full border rounded-lg px-3 py-2'
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value='developer'>Developer</option>
                  <option value='manager'>Manager</option>
                  {currentUserRole === 'admin' && <option value='admin'>Admin</option>}
                </select>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  type='submit'
                  className='flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
                >
                  Crear Usuario
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

      {/* Modal para asignar a proyectos */}
      {showAssignModal && selectedUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-xl max-w-lg w-full'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                  Asignar {selectedUser.name} a Proyectos
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAssignToProjects} className='p-6'>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Seleccionar proyectos:
                </label>
                <div className='border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2'>
                  {loadingProjects ? (
                    <div className='text-center py-4'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
                      <p className='text-sm text-gray-500 mt-2'>Cargando proyectos...</p>
                    </div>
                  ) : projects.length > 0 ? (
                    projects.map(project => (
                      <label key={project.id} className='flex items-center space-x-2'>
                        <input
                          type='checkbox'
                          checked={assignmentData.projectIds.includes(project.id)}
                          onChange={(e) => {
                            const projectIds = e.target.checked
                              ? [...assignmentData.projectIds, project.id]
                              : assignmentData.projectIds.filter(id => id !== project.id)
                            setAssignmentData({ ...assignmentData, projectIds })
                          }}
                        />
                        <span className='text-sm'>{project.name}</span>
                        <span className='text-xs text-gray-500'>({project.status || 'N/A'})</span>
                      </label>
                    ))
                  ) : (
                    <div className='text-center py-4'>
                      <p className='text-sm text-gray-500'>No hay proyectos disponibles</p>
                      <button
                        type='button'
                        onClick={fetchProjects}
                        className='text-blue-600 hover:text-blue-800 text-xs mt-1'
                      >
                        Recargar proyectos
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex space-x-3'>
                <button
                  type='submit'
                  className='flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
                >
                  Asignar
                </button>
                <button
                  type='button'
                  onClick={() => setShowAssignModal(false)}
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

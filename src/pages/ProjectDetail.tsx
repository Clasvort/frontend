import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'
import { showToast, confirmAction } from '../lib/notifications'
import { Breadcrumbs } from '../components/Breadcrumbs'

const columns = ['todo', 'in_progress', 'review', 'done'] as const
const columnNames = {
  todo: 'TODO',
  in_progress: 'EN PROGRESO', 
  review: 'REVIEW',
  done: 'DONE'
}

interface Task {
  id: string
  title: string
  description: string
  status: typeof columns[number]
  priority: 'low' | 'medium' | 'high'
  assignedUser?: {
    id: string
    name: string
  }
  dueDate?: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  startDate: string
  endDate?: string
  assignedUsers: any[]
  tasks: Task[]
}

interface CreateTaskForm {
  title: string
  description: string
  status: string
  priority: string
  assignedTo: string | null
  estimatedHours: number
  actualHours: number
  dueDate: string
}

export function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<typeof columns[number]>('todo')
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board')
  const [taskFilters, setTaskFilters] = useState({
    priority: 'all',
    assignee: 'all',
    search: ''
  })
  const [newTask, setNewTask] = useState<CreateTaskForm>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: null,
    estimatedHours: 0,
    actualHours: 0,
    dueDate: ''
  })

  const { role } = useAuthStore()
  const canManageTasks = role === 'admin' || role === 'manager'

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchUsers()
    }
  }, [id])


  const fetchProject = async () => {
    try {
      // Obtener información del proyecto
      const { data: projectData } = await api.get(`/projects/${id}`)
      setProject(projectData)
      
      // Obtener tareas del proyecto
      const { data: tasksData } = await api.get(`/projects/${id}/tasks`)
      
      // Manejar diferentes estructuras de respuesta
      const tasksArray = tasksData.items || tasksData.tasks || tasksData || []
      
      setTasks(tasksArray)
    } catch (error) {
      console.error('Error fetching project:', error)
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const taskData = {
        ...newTask,
        projectId: id,
        status: selectedColumn
      }
      const { data } = await api.post(`projects/${id}/tasks`, taskData)
      setTasks([...tasks, data])
      setShowCreateTask(false)
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignedTo: '',
        estimatedHours: 0,
        actualHours: 0,
        dueDate: ''
      })
      showToast.success('Tarea creada correctamente')
    } catch (error) {
      console.error('Error creating task:', error)
      showToast.error('Error al crear la tarea')
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: typeof columns[number]) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
      showToast.success('Tarea actualizada correctamente')
    } catch (error) {
      console.error('Error updating task:', error)
      showToast.error('Error al actualizar la tarea')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Si no hay destino, no hacer nada
    if (!destination) return

    // Si la posición no cambió, no hacer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const newStatus = destination.droppableId as typeof columns[number]
    await handleTaskStatusChange(draggableId, newStatus)
  }

  const handleDeleteTask = async (taskId: string) => {
    confirmAction(
      '¿Estás seguro de que quieres eliminar esta tarea?',
      async () => {
        try {
          await api.delete(`/tasks/${taskId}`)
          setTasks(tasks.filter(task => task.id !== taskId))
          showToast.success('Tarea eliminada correctamente')
        } catch (error) {
          console.error('Error deleting task:', error)
          showToast.error('Error al eliminar la tarea')
        }
      }
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100'
      case 'in_progress': return 'bg-blue-100'
      case 'review': return 'bg-yellow-100'
      case 'done': return 'bg-green-100'
      default: return 'bg-gray-100'
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = taskFilters.priority === 'all' || task.priority === taskFilters.priority
    const matchesAssignee = taskFilters.assignee === 'all' || task.assignedUser?.id === taskFilters.assignee
    const matchesSearch = !taskFilters.search || 
      task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(taskFilters.search.toLowerCase())
    
    return matchesPriority && matchesAssignee && matchesSearch
  })

  const grouped = columns.map(status => {
    const items = filteredTasks.filter(task => task.status === status)
    return {
      status,
      name: columnNames[status],
      items
    }
  })


  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'done').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const review = tasks.filter(t => t.status === 'review').length
    
    return { total, completed, inProgress, review }
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-64'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='h-64 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='p-6 text-center'>
        <h1 className='text-2xl font-semibold text-gray-900'>Proyecto no encontrado</h1>
        <Link to='/projects' className='text-blue-600 hover:underline'>
          Volver a proyectos
        </Link>
      </div>
    )
  }

  const stats = getTaskStats()

  return (
    <div className='p-6 space-y-6'>
      <Breadcrumbs />
      
      {/* Header del proyecto */}
      <div className='bg-white rounded-xl shadow border p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <div className='flex items-center space-x-2 mb-2'>
              <Link to='/projects' className='text-blue-600 hover:underline text-sm'>
                ← Proyectos
              </Link>
            </div>
            <h1 className='text-3xl font-bold'>{project.name}</h1>
            <p className='text-gray-600 mt-2'>{project.description}</p>
          </div>
          
          <div className='flex items-center space-x-3'>
            <div className='text-right'>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)} border`}>
                {project.status}
              </span>
            </div>
            {canManageTasks && (
              <button
                onClick={() => setShowCreateTask(true)}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                <span>Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {/* Estadísticas del proyecto */}
        <div className='grid gap-4 grid-cols-1 md:grid-cols-4'>
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-gray-800'>{stats.total}</div>
            <div className='text-sm text-gray-600'>Total de tareas</div>
          </div>
          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-blue-800'>{stats.inProgress}</div>
            <div className='text-sm text-blue-600'>En progreso</div>
          </div>
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-yellow-800'>{stats.review}</div>
            <div className='text-sm text-yellow-600'>En revisión</div>
          </div>
          <div className='bg-green-50 p-4 rounded-lg'>
            <div className='text-2xl font-bold text-green-800'>{stats.completed}</div>
            <div className='text-sm text-green-600'>Completadas</div>
          </div>
        </div>

        {/* Progreso */}
        {stats.total > 0 && (
          <div className='mt-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>Progreso del proyecto</span>
              <span className='text-sm text-gray-600'>
                {Math.round((stats.completed / stats.total) * 100)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-3'>
              <div
                className='bg-green-600 h-3 rounded-full transition-all duration-300'
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros y vista */}
      <div className='bg-white rounded-xl shadow border p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'board' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Board Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Vista Calendario
            </button>
          </div>
        </div>

        <div className='grid gap-4 grid-cols-1 md:grid-cols-4'>
          <input
            type='text'
            placeholder='Buscar tareas...'
            className='border rounded-lg px-3 py-2'
            value={taskFilters.search}
            onChange={(e) => setTaskFilters({ ...taskFilters, search: e.target.value })}
          />
          <select
            className='border rounded-lg px-3 py-2'
            value={taskFilters.priority}
            onChange={(e) => setTaskFilters({ ...taskFilters, priority: e.target.value })}
          >
            <option value='all'>Todas las prioridades</option>
            <option value='low'>Baja</option>
            <option value='medium'>Media</option>
            <option value='high'>Alta</option>
          </select>
          <select
            className='border rounded-lg px-3 py-2'
            value={taskFilters.assignee}
            onChange={(e) => setTaskFilters({ ...taskFilters, assignee: e.target.value })}
          >
            <option value='all'>Todos los asignados</option>
            {project.assignedUsers?.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <button
            onClick={() => setTaskFilters({ priority: 'all', assignee: 'all', search: '' })}
            className='border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50'
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Board Kanban */}
      {viewMode === 'board' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {grouped.map(column => (
              <div key={column.status} className={`rounded-xl border-2 ${getStatusColor(column.status)}`}>
                <div className='p-4 border-b bg-white rounded-t-xl'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-semibold text-gray-800'>{column.name}</h3>
                    <span className='bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600'>
                      {column.items.length}
                    </span>
                  </div>
                </div>
                
                <Droppable droppableId={column.status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-4 space-y-3 min-h-96 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {column.items.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!canManageTasks}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg shadow border-l-4 hover:shadow-md transition-all duration-200 ${
                                getPriorityColor(task.priority)
                              } ${
                                snapshot.isDragging ? 'rotate-3 shadow-lg transform scale-105' : ''
                              }`}
                            >
                              <div className='flex items-start justify-between mb-2'>
                                <h4 className='font-medium text-gray-900'>{task.title}</h4>
                                {canManageTasks && (
                                  <div className='flex items-center space-x-1'>
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value as any)}
                                      className='text-xs border rounded px-1 py-0.5'
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {columns.map(status => (
                                        <option key={status} value={status}>
                                          {columnNames[status]}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteTask(task.id)
                                      }}
                                      className='text-red-500 hover:text-red-700 text-xs p-1'
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {task.description && (
                                <p className='text-sm text-gray-600 mb-3'>{task.description}</p>
                              )}
                              
                              <div className='flex items-center justify-between'>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                
                                {task.assignedUser && (
                                  <div className='flex items-center space-x-2'>
                                    <div className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium'>
                                      {task.assignedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className='text-xs text-gray-600'>{task.assignedUser.name}</span>
                                  </div>
                                )}
                              </div>
                              
                              {task.dueDate && (
                                <div className='mt-2 text-xs text-gray-500'>
                                  Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {canManageTasks && (
                        <button
                          onClick={() => {
                            setSelectedColumn(column.status)
                            setShowCreateTask(true)
                          }}
                          className='w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors'
                        >
                          + Agregar tarea
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Vista Calendario */}
      {viewMode === 'calendar' && (
        <div className='bg-white rounded-xl shadow border p-6'>
          <h3 className='text-lg font-semibold mb-4'>Vista Calendario de Tareas</h3>
          <div className='space-y-3'>
            {filteredTasks
              .filter(task => task.dueDate)
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .map(task => (
                <div key={task.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div>
                    <h4 className='font-medium'>{task.title}</h4>
                    <p className='text-sm text-gray-600'>
                      Vence: {new Date(task.dueDate!).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} border`}>
                      {columnNames[task.status]}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal para crear tarea */}
      {showCreateTask && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-xl max-w-lg w-full'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                  Crear Nueva Tarea - {columnNames[selectedColumn]}
                </h2>
                <button
                  onClick={() => setShowCreateTask(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateTask} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Título de la tarea *
                </label>
                <input
                  type='text'
                  required
                  className='w-full border rounded-lg px-3 py-2'
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Descripción
                </label>
                <textarea
                  className='w-full border rounded-lg px-3 py-2 rows-3'
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                ></textarea>
              </div>

              <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Estado</label>
                  <select
                    className='w-full border rounded-lg px-3 py-2'
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value='todo'>TODO</option>
                    <option value='in_progress'>En Progreso</option>
                    <option value='review'>Review</option>
                    <option value='done'>Done</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Prioridad</label>
                  <select
                    className='w-full border rounded-lg px-3 py-2'
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
                    Asignar a
                  </label>
                  <select
                    className='w-full border rounded-lg px-3 py-2'
                    value={newTask.assignedTo || ''}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  >
                    <option value=''>Sin asignar</option>
                    {project.assignedUsers?.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Horas estimadas
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='0.5'
                    className='w-full border rounded-lg px-3 py-2'
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    placeholder='Ej: 8.5'
                  />
                </div>
              </div>

              <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Horas trabajadas
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='0.5'
                    className='w-full border rounded-lg px-3 py-2'
                    value={newTask.actualHours}
                    onChange={(e) => setNewTask({ ...newTask, actualHours: Number(e.target.value) })}
                    placeholder='Ej: 6.0'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fecha de vencimiento
                </label>
                <input
                  type='date'
                  className='w-full border rounded-lg px-3 py-2'
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  type='submit'
                  className='flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
                >
                  Crear Tarea
                </button>
                <button
                  type='button'
                  onClick={() => setShowCreateTask(false)}
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

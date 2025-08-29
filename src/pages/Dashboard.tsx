import { Link } from 'react-router-dom'
export function Dashboard(){
  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-2xl font-semibold'>Dashboard</h1>
      <div className='grid gap-4 grid-cols-1 md:grid-cols-3'>
        <Link to='/projects' className='border rounded p-4 hover:bg-gray-50'>Proyectos</Link>
        <Link to='/users' className='border rounded p-4 hover:bg-gray-50'>Usuarios</Link>
      </div>
    </div>)
}

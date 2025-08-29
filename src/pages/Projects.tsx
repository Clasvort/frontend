import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export function Projects(){
  const [items,setItems] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects'); setItems(data.items || []) })() },[])
  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-semibold'>Proyectos</h1>
      </div>
      <div className='grid gap-3'>
        {items.map(p=> (
          <Link key={p.id} to={`/projects/${p.id}`} className='border rounded p-3 hover:bg-gray-50'>
            <div className='font-medium'>{p.name}</div>
            <div className='text-sm text-gray-600'>{p.status} • {p.priority}</div>
          </Link>
        ))}
      </div>
    </div>)
}

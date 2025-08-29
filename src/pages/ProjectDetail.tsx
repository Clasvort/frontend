import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'

const columns = ['todo','in_progress','review','done'] as const

export function ProjectDetail(){
  const { id } = useParams()
  const [project,setProject]=useState<any>(null)
  const [tasks,setTasks]=useState<any[]>([])
  useEffect(()=>{ (async()=>{ const { data } = await api.get(`/projects/${id}`); setProject(data); setTasks(data.tasks || []) })() },[id])
  const grouped = columns.map(c=>({ status:c, items: tasks.filter(t=>t.status===c) }))
  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-2xl font-semibold'>{project?.name}</h1>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {grouped.map(col=> (
          <div key={col.status} className='bg-gray-50 rounded p-3'>
            <div className='font-medium mb-2 uppercase text-sm'>{col.status.replace('_',' ')}</div>
            <div className='space-y-2'>
              {col.items.map(t=> (
                <div key={t.id} className='bg-white p-2 rounded shadow-sm border'>
                  <div className='text-sm font-medium'>{t.title}</div>
                  <div className='text-xs text-gray-600'>{t.priority}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>)
}

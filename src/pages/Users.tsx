import { useEffect, useState } from 'react'
import api from '../lib/api'

export function Users(){
  const [items,setItems] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/users'); setItems(data) })() },[])
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Usuarios</h1>
      <div className='overflow-auto'>
        <table className='min-w-full border'>
          <thead>
            <tr className='bg-gray-50'>
              <th className='text-left p-2 border'>Nombre</th>
              <th className='text-left p-2 border'>Email</th>
              <th className='text-left p-2 border'>Rol</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u=> (
              <tr key={u.id}>
                <td className='p-2 border'>{u.name}</td>
                <td className='p-2 border'>{u.email}</td>
                <td className='p-2 border'>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>)
}

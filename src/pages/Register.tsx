import { useState } from 'react'
import api from '../lib/api'
import { useNavigate, Link } from 'react-router-dom'

export function Register(){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [role,setRole]=useState<'admin'|'manager'|'developer'>('developer')
  const [error,setError]=useState<string|null>(null)
  const navigate = useNavigate()
  const onSubmit = async (e:any)=>{
    e.preventDefault(); setError(null)
    try{
      await api.post('/auth/register',{ name,email,password,role })
      navigate('/login')
    }catch(err:any){ setError(err?.response?.data?.message || 'Error register') }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <form onSubmit={onSubmit} className='bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-3'>
        <h1 className='text-xl font-semibold'>Crear cuenta</h1>
        <input className='w-full border p-2 rounded' placeholder='Nombre' value={name} onChange={e=>setName(e.target.value)} />
        <input className='w-full border p-2 rounded' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
        <input className='w-full border p-2 rounded' type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} />
        <select className='w-full border p-2 rounded' value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value='developer'>Developer</option>
          <option value='manager'>Manager</option>
          <option value='admin'>Admin</option>
        </select>
        {error && <p className='text-red-600 text-sm'>{error}</p>}
        <button className='w-full bg-black text-white p-2 rounded'>Registrar</button>
        <p className='text-sm text-center'>¿Ya tienes cuenta? <Link to='/login' className='underline'>Inicia sesión</Link></p>
      </form>
    </div>)
}

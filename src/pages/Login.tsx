import { useState } from 'react'
import api from '../lib/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string|null>(null)
  const navigate = useNavigate()
  const setAuth = useAuthStore(s=>s.setAuth)
  const onSubmit = async (e:any)=>{
    e.preventDefault(); setError(null)
    try{
      const { data } = await api.post('/auth/login',{ email,password })
      const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
      setAuth(data.accessToken, payload.role)
      navigate('/')
    }catch(err:any){ setError(err?.response?.data?.message || 'Error login') }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <form onSubmit={onSubmit} className='bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-3'>
        <h1 className='text-xl font-semibold'>Iniciar sesión</h1>
        <input className='w-full border p-2 rounded' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
        <input className='w-full border p-2 rounded' type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p className='text-red-600 text-sm'>{error}</p>}
        <button className='w-full bg-black text-white p-2 rounded'>Entrar</button>
        <p className='text-sm text-center'>¿No tienes cuenta? <Link to='/register' className='underline'>Regístrate</Link></p>
      </form>
    </div>)
}

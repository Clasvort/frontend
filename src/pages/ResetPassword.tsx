import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido')
    }
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/reset-password', { 
        token, 
        password 
      })
      
      // Redirigir al login con mensaje de éxito
      navigate('/login?message=Contraseña restablecida exitosamente')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='bg-white p-6 rounded-xl shadow w-full max-w-sm text-center space-y-4'>
          <h1 className='text-xl font-semibold text-red-600'>Token inválido</h1>
          <p className='text-gray-600'>El enlace de recuperación no es válido o ha expirado</p>
          <Link 
            to='/forgot-password' 
            className='inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800'
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-4'>
        <div className='text-center'>
          <h1 className='text-xl font-semibold'>Restablecer contraseña</h1>
          <p className='text-gray-600 text-sm mt-2'>
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form onSubmit={onSubmit} className='space-y-3'>
          <input 
            className='w-full border p-2 rounded' 
            type='password'
            placeholder='Nueva contraseña' 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <input 
            className='w-full border p-2 rounded' 
            type='password'
            placeholder='Confirmar contraseña' 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          
          {error && <p className='text-red-600 text-sm'>{error}</p>}
          
          <button 
            className='w-full bg-black text-white p-2 rounded disabled:bg-gray-400'
            disabled={isLoading}
          >
            {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className='text-center'>
          <Link to='/login' className='text-sm text-blue-600 hover:underline'>
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import api from '../lib/api'
import { Link } from 'react-router-dom'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setMessage('Se ha enviado un enlace de recuperación a tu email')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al enviar el email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-4'>
        <div className='text-center'>
          <h1 className='text-xl font-semibold'>Recuperar contraseña</h1>
          <p className='text-gray-600 text-sm mt-2'>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={onSubmit} className='space-y-3'>
          <input 
            className='w-full border p-2 rounded' 
            type='email'
            placeholder='Email' 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required
          />
          
          {error && <p className='text-red-600 text-sm'>{error}</p>}
          {message && <p className='text-green-600 text-sm'>{message}</p>}
          
          <button 
            className='w-full bg-black text-white p-2 rounded disabled:bg-gray-400'
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className='text-center space-y-2'>
          <p className='text-sm'>
            <Link to='/login' className='text-blue-600 hover:underline'>
              Volver al login
            </Link>
          </p>
          <p className='text-sm'>
            ¿No tienes cuenta?{' '}
            <Link to='/register' className='text-blue-600 hover:underline'>
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

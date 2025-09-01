import { useState } from 'react'
import api from '../lib/api'
import { useNavigate, Link } from 'react-router-dom'
import { showToast } from '../lib/notifications'

interface RegisterFormData {
  name: string
  email: string
  password: string
  role?: 'admin' | 'manager' | 'developer'
}

interface ValidationErrors {
  name?: string
  email?: string
  password?: string
  general?: string
}

export function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'developer'
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Validaciones del cliente que coinciden con el backend
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validación del nombre
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      newErrors.name = 'El nombre es requerido'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    } else if (trimmedName.length > 100) {
      newErrors.name = 'El nombre no debe exceder 100 caracteres'
    }

    // Validación del email
    const emailLower = formData.email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailLower) {
      newErrors.email = 'El email es requerido'
    } else if (!emailRegex.test(emailLower)) {
      newErrors.email = 'Formato de email inválido'
    }

    // Validación de la contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (formData.password.length > 50) {
      newErrors.password = 'La contraseña no debe exceder 50 caracteres'
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = 'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Preparar datos según el DTO del backend
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        ...(formData.role && { role: formData.role })
      }

      await api.post('/auth/register', registerData)
      
      showToast.success('Cuenta creada exitosamente. Puedes iniciar sesión ahora.')
      navigate('/login')
    } catch (err: any) {
      console.error('Registration error:', err)
      
      if (err?.response?.data?.message) {
        // Si el backend devuelve errores específicos
        if (Array.isArray(err.response.data.message)) {
          // Múltiples errores de validación
          const backendErrors: ValidationErrors = {}
          err.response.data.message.forEach((msg: string) => {
            if (msg.toLowerCase().includes('email')) {
              backendErrors.email = msg
            } else if (msg.toLowerCase().includes('password')) {
              backendErrors.password = msg
            } else if (msg.toLowerCase().includes('name')) {
              backendErrors.name = msg
            } else {
              backendErrors.general = msg
            }
          })
          setErrors(backendErrors)
        } else {
          // Error general del backend
          setErrors({ general: err.response.data.message })
        }
      } else {
        setErrors({ general: 'Error al crear la cuenta. Inténtalo de nuevo.' })
      }
      
      showToast.error('Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return { strength: 0, label: '' }

    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    }

    strength = Object.values(checks).filter(Boolean).length

    const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300',
      checks
    }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Crear nueva cuenta
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            O{' '}
            <Link to='/login' className='font-medium text-blue-600 hover:text-blue-500'>
              inicia sesión si ya tienes cuenta
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={onSubmit}>
          <div className='space-y-4'>
            {/* Campo Nombre */}
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Nombre completo *
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder='Tu nombre completo'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                maxLength={100}
              />
              {errors.name && (
                <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Correo electrónico *
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder='tu@email.com'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Contraseña *
              </label>
              <div className='mt-1 relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  required
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder='Contraseña segura'
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  maxLength={50}
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' />
                    </svg>
                  ) : (
                    <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  )}
                </button>
              </div>

              {/* Indicador de fortaleza de contraseña */}
              {formData.password && (
                <div className='mt-2'>
                  <div className='flex items-center space-x-2'>
                    <div className='flex-1 bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className='text-xs text-gray-600'>{passwordStrength.label}</span>
                  </div>
                  
                  <div className='mt-2 text-xs text-gray-600'>
                    <p>La contraseña debe contener:</p>
                    <ul className='ml-4 space-y-1'>
                      <li className={passwordStrength.checks && passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Al menos 8 caracteres
                      </li>
                      <li className={passwordStrength.checks && passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Una letra minúscula
                      </li>
                      <li className={passwordStrength.checks && passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Una letra mayúscula
                      </li>
                      <li className={passwordStrength.checks && passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Un número
                      </li>
                      <li className={passwordStrength.checks && passwordStrength.checks.special ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Un carácter especial (@$!%*?&)
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
              )}
            </div>

            {/* Campo Rol (opcional) */}
            <div>
              <label htmlFor='role' className='block text-sm font-medium text-gray-700'>
                Rol
              </label>
              <select
                id='role'
                name='role'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <option value='developer'>Developer</option>
                <option value='manager'>Manager</option>
                <option value='admin'>Admin</option>
              </select>
            </div>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Error al crear la cuenta
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>
                    <p>{errors.general}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors duration-200`}
            >
              {isLoading ? (
                <div className='flex items-center'>
                  <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Creando cuenta...
                </div>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </div>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              ¿Ya tienes cuenta?{' '}
              <Link to='/login' className='font-medium text-blue-600 hover:text-blue-500'>
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

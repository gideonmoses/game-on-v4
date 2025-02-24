'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase-config'

interface RegisterFormData {
  email: string
  password: string
  displayName: string
  phoneNumber: string
  jerseyNumber: string
  dateOfBirth: string
}

interface ValidationErrors {
  email?: string[]
  password?: string[]
  displayName?: string[]
  phoneNumber?: string[]
  jerseyNumber?: string[]
  dateOfBirth?: string[]
  form?: string[]
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    jerseyNumber: '',
    dateOfBirth: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // First validate with backend before creating Firebase user
      const validateResponse = await fetch('/api/auth/register/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const validateData = await validateResponse.json()

      if (!validateResponse.ok) {
        if (validateResponse.status === 400 && validateData.details) {
          setErrors(validateData.details.fields || {})
          if (validateData.details.form?.length) {
            toast.error(validateData.details.form[0])
          }
          return
        }
        throw new Error(validateData.error || 'Validation failed')
      }

      // If validation passes, create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      )

      try {
        // Then create user profile in our backend
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            uid: userCredential.user.uid,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // If backend fails, delete the Firebase user
          await userCredential.user.delete()
          throw new Error(data.error || 'Registration failed')
        }

        // Sign out the user after successful registration
        await signOut(auth)
        
        toast.success('Registration successful! Please wait for approval.')
        router.replace('/pending-approval?from=register')

      } catch (error) {
        // If anything fails after Firebase user creation, clean up
        await userCredential.user.delete()
        throw error
      }

    } catch (error: unknown) {
      console.error('Registration error:', error)
      
      if (error instanceof Error && 'code' in error) {
        // Handle Firebase Auth errors
        switch (error.code) {
          case 'auth/email-already-in-use':
            setErrors({ email: ['Email already registered'] })
            break
          case 'auth/invalid-email':
            setErrors({ email: ['Invalid email format'] })
            break
          case 'auth/weak-password':
            setErrors({ password: ['Password is too weak'] })
            break
          default:
            setErrors({ form: ['Registration failed. Please try again.'] })
            toast.error('Registration failed. Please try again.')
        }
      } else {
        setErrors({ form: ['An unexpected error occurred'] })
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Join our team and start playing
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                required
                minLength={2}
                className={`mt-1 block w-full rounded-md border ${
                  errors.displayName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-500">{errors.displayName.join(', ')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Must be at least 2 characters</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.join(', ')}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`mt-1 block w-full rounded-md border ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.join(', ')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                pattern="^[89][0-9]{7}$"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.join(', ')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Singapore phone number (8 digits starting with 8 or 9)</p>
            </div>

            <div>
              <label htmlFor="jerseyNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jersey Number
              </label>
              <input
                id="jerseyNumber"
                name="jerseyNumber"
                type="text"
                value={formData.jerseyNumber}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${
                  errors.jerseyNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.jerseyNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.jerseyNumber.join(', ')}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.join(', ')}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
} 
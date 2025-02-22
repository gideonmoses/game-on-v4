'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { CreateUserData } from '@/types/user'

interface ValidationErrors {
  [key: string]: string
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    jerseyNumber: '',
    phoneNumber: '',
    dateOfBirth: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          // Handle validation errors
          const validationErrors: ValidationErrors = {}
          if (data.details.fields) {
            Object.entries(data.details.fields).forEach(([field, messages]) => {
              validationErrors[field] = Array.isArray(messages) ? messages[0] : messages
            })
            setErrors(validationErrors)
            throw new Error('Please fix the validation errors')
          }
        }
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('Account created successfully! Waiting for approval.')
      window.location.href = '/pending-approval?from=register'
    } catch (error: unknown) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
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
                <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.jerseyNumber}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
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
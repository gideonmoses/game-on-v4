'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { SelectField } from '@/components/ui/SelectField'
import { InputField } from '@/components/ui/InputField'
import type { UserDocument, UserRole, UserStatus, UpdateUserData } from '@/types/user'

interface ValidationErrors {
  [key: string]: string[]
}

const roleOptions = [
  { value: 'Player', label: 'Player' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Selector', label: 'Selector' },
  { value: 'Admin', label: 'Admin' }
]

const statusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' }
]

export default function EditUserPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<UpdateUserData>({
    displayName: '',
    roles: [],
    userStatus: 'pending'
  })

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        toast.error('User ID is required')
        router.push('/admin/users')
        return
      }

      try {
        setIsFetching(true)
        const response = await fetch(`/api/admin/users?id=${userId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user')
        }

        const userData = data.user as UserDocument
        console.log('Fetched user data:', userData) // For debugging
        setFormData({
          displayName: userData.displayName || '',
          roles: userData.roles || [],
          userStatus: userData.userStatus || 'pending'
        })
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user')
        router.push('/admin/users')
      } finally {
        setIsFetching(false)
      }
    }

    fetchUser()
  }, [userId, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const handleRolesChange = (selectedOptions: { value: string; label: string }[]) => {
    const roles = selectedOptions.map(option => option.value as UserRole)
    setFormData(prev => ({ ...prev, roles }))
    if (errors.roles) {
      const newErrors = { ...errors }
      delete newErrors.roles
      setErrors(newErrors)
    }
  }

  const handleStatusChange = (option: { value: string; label: string } | null) => {
    if (option) {
      setFormData(prev => ({ ...prev, userStatus: option.value as UserStatus }))
      if (errors.userStatus) {
        const newErrors = { ...errors }
        delete newErrors.userStatus
        setErrors(newErrors)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          roles: formData.roles,
          userStatus: formData.userStatus
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          setErrors(data.details.fieldErrors)
          return
        }
        throw new Error(data.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      router.push('/admin/users')

    } catch (error) {
      console.error('Update user error:', error)
      toast.error('Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="mt-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href="/admin/users"
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          title="Back to Users"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit User
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update user details and permissions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            <InputField
              label="Display Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              error={errors.displayName?.[0]}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Roles
              </label>
              <SelectField
                isMulti
                name="roles"
                value={formData.roles.map(role => ({ value: role, label: role }))}
                onChange={handleRolesChange}
                options={roleOptions}
                error={errors.roles?.[0]}
              />
            </div>

            <SelectField
              label="Status"
              name="userStatus"
              value={statusOptions.find(option => option.value === formData.userStatus)}
              onChange={handleStatusChange}
              options={statusOptions}
              error={errors.userStatus?.[0]}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  )
} 
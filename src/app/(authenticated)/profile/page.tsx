'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/firebase-config'
import { toast } from 'react-hot-toast'
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface UserProfile {
  displayName: string
  email: string
  phoneNumber: string
  jerseyNumber: string
  dateOfBirth: string
  roles: string[]
  // Add other profile fields as needed
}

interface ValidationErrors {
  [key: string]: string[]
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto animate-pulse">
      {/* Header Section */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        {/* Avatar and Name Section */}
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="ml-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`personal-${i}`}>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>

          {/* Team Info */}
          <div className="space-y-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`stat-${i}`} className="text-center">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [errors, setErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return

      try {
        const response = await fetch(`/api/auth/profile?email=${user.email}&uid=${user.uid}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile')
        }

        setProfile(data.user)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user?.email, user?.uid])

  const handleEdit = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      phoneNumber: profile?.phoneNumber || '',
      jerseyNumber: profile?.jerseyNumber || '',
      dateOfBirth: profile?.dateOfBirth || ''
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditForm({})
    setErrors({})
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          email: profile?.email,
          uid: user?.uid
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          setErrors(data.details.fieldErrors)
          return
        }
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setIsEditing(false)
      setEditForm({})
      toast.success('Profile updated successfully')

    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update profile')
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile not found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Unable to load profile information
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <XMarkIcon className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        {/* Avatar and Name Section */}
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {profile.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile.displayName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {profile.roles?.join(', ')}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email (Non-editable)
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Display Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="displayName"
                    value={editForm.displayName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayName[0]}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-white">{profile.displayName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Phone Number
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber[0]}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-white">{profile.phoneNumber}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date of Birth
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editForm.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth[0]}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Team Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Jersey Number
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="jerseyNumber"
                    value={editForm.jerseyNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  {errors.jerseyNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.jerseyNumber[0]}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-white">#{profile.jerseyNumber}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Roles (Non-editable)
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {profile.roles?.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Player Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Add stats here */}
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Games</p>
          </div>
          {/* Add more stats */}
        </div>
      </div>
    </div>
  )
} 
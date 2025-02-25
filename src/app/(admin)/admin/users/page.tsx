'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  Users,
  UserPlus,
  User,
  Settings,
  ClipboardCheck,
  Mail,
  ArrowLeft,
  Pencil
} from 'lucide-react'
import type { UserRole, UserDocument } from '@/types/user'

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'Admin':
      return <Settings className="h-5 w-5 text-purple-500" />
    case 'Selector':
      return <ClipboardCheck className="h-5 w-5 text-blue-500" />
    case 'Manager':
      return <Users className="h-5 w-5 text-green-500" />
    case 'Player':
      return <User className="h-5 w-5 text-gray-500" />
    default:
      return <User className="h-5 w-5 text-gray-500" />
  }
}

const getRoleStyles = (role: UserRole) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400'
    case 'Selector':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
    case 'Manager':
      return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
    case 'Player':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
  }
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch users')
        }

        setUsers(data.users)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleEdit = (userId: string) => {
    router.push(`/admin/users/edit?id=${userId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Back to Admin"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Users
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage user accounts and roles
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div 
            key={user.id} 
            className="bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.displayName}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(user.id)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="Edit User"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {user.roles.map((role, index) => (
                  <span 
                    key={index}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${getRoleStyles(role)}`}
                  >
                    {getRoleIcon(role)}
                    {role}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${user.userStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' :
                    user.userStatus === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'}`}
                >
                  {user.userStatus}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
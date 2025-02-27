import { 
  Home, 
  User, 
  Settings, 
  Users, 
  CreditCard, 
  ClipboardList 
} from 'lucide-react'
import { iconStyles } from '@/styles/iconStyles'
import type { LucideIcon } from 'lucide-react'

interface NavigationItem {
  href: string
  icon: LucideIcon
  label: string
  iconStyle: {
    container: string
    default: string
  }
  matchPattern: (pathname: string) => boolean
  roles?: string[]
}

const navigationConfig: NavigationItem[] = [
  {
    href: '/dashboard',
    icon: ClipboardList,
    label: 'Home',
    iconStyle: {
      container: 'bg-blue-100 dark:bg-blue-900/30',
      default: 'text-blue-600 dark:text-blue-400'
    },
    matchPattern: (path) => path === '/dashboard'
  },
  {
    href: '/selector-home',
    icon: Users,
    label: 'Select',
    iconStyle: {
      container: 'bg-amber-100 dark:bg-amber-900/30',
      default: 'text-amber-600 dark:text-amber-400'
    },
    matchPattern: (path) => path.startsWith('/selector-home') || path.startsWith('/select-team'),
    roles: ['Selector']
  },
  {
    href: '/admin',
    icon: Settings,
    label: 'Admin',
    iconStyle: {
      container: 'bg-purple-100 dark:bg-purple-900/30',
      default: 'text-purple-600 dark:text-purple-400'
    },
    matchPattern: (path) => path.startsWith('/admin'),
    roles: ['Admin']
  },
  {
    href: '/payments',
    icon: CreditCard,
    label: 'Payment',
    iconStyle: {
      container: 'bg-green-100 dark:bg-green-900/30',
      default: 'text-green-600 dark:text-green-400'
    },
    matchPattern: (path) => path.startsWith('/payments'),
    roles: ['Player']
  }
]

export const getNavigationItems = (userRoles: string[]) => {
  return navigationConfig.filter(item => {
    if (!item.roles) return true
    return item.roles.some(role => userRoles.includes(role))
  })
} 
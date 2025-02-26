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
  iconStyle: { default: string; container: string }
  matchPattern: (pathname: string) => boolean
  roles?: string[] 
}

const allNavigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Home',
    iconStyle: iconStyles.home,
    matchPattern: (path) => path === '/dashboard'
  },
  {
    href: '/profile',
    icon: User,
    label: 'Profile',
    iconStyle: iconStyles.user,
    matchPattern: (path) => path === '/profile'
  },
  {
    href: '/admin',
    icon: Settings,
    label: 'Admin',
    iconStyle: iconStyles.settings,
    matchPattern: (path) => path.startsWith('/admin'),
    roles: ['Admin']
  },
  {
    href: '/selector-home',
    icon: Users,
    label: 'Select',
    iconStyle: iconStyles.selector,
    matchPattern: (path) => path.startsWith('/selector-home') || path.startsWith('/select-team'),
    roles: ['Admin', 'Selector']
  },
  {
    href: '/manager/payments',
    icon: ClipboardList,
    label: 'Manage',
    iconStyle: iconStyles.selector,
    matchPattern: (path) => path.startsWith('/manager'),
    roles: ['Manager']
  },
  {
    href: '/payments',
    icon: CreditCard,
    label: 'Payment',
    iconStyle: iconStyles.selector,
    matchPattern: (path) => path.startsWith('/payments'),
    roles: ['Player']
  }
]

export function getNavigationItems(userRoles: string[]): NavigationItem[] {
  return allNavigationItems.filter(item => 
    !item.roles || item.roles.some(role => userRoles.includes(role))
  )
} 
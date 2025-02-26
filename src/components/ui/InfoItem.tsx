import { ReactNode } from 'react'

interface InfoItemProps {
  icon: ReactNode
  label: string
  value: string
  iconStyle?: string
}

export function InfoItem({ icon, label, value, iconStyle }: InfoItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className={`flex-shrink-0 ${iconStyle || ''}`}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
} 
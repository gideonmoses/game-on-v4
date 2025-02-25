'use client'

interface InputFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  icon?: React.ReactNode
  className?: string
}

export function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  icon,
  className = ''
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="appearance-none block w-full bg-white dark:bg-gray-800/50 
            border border-gray-300 dark:border-gray-600/50 
            rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            hover:border-blue-400 dark:hover:bg-gray-700/50 transition-colors
            shadow-sm
            [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:dark:filter 
            [&::-webkit-calendar-picker-indicator]:dark:invert"
          required={required}
        />
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
} 
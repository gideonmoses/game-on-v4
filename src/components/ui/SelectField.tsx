'use client'

import Select, { StylesConfig } from 'react-select'

interface SelectFieldProps {
  label: string
  name: string
  value: { value: string; label: string }
  onChange: (option: { value: string; label: string } | null) => void
  options: { value: string; label: string }[]
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

const customStyles: StylesConfig<{ value: string; label: string }, false> = {
  control: (base) => ({
    ...base,
    backgroundColor: 'white',
    borderColor: 'rgb(209 213 219)', // gray-300
    borderRadius: '0.5rem',
    padding: '0.25rem',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '&:hover': {
      borderColor: '#60A5FA', // blue-400
    },
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: 'rgba(31, 41, 55, 0.5)',
      borderColor: 'rgba(75, 85, 99, 0.5)',
      '&:hover': {
        backgroundColor: 'rgba(55, 65, 81, 0.5)',
      },
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#3B82F6'
      : state.isFocused 
        ? '#EFF6FF'
        : 'white',
    color: state.isSelected ? 'white' : 'rgb(17 24 39)',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#3B82F6',
    },
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: state.isSelected 
        ? '#3B82F6'
        : state.isFocused 
          ? 'rgba(55, 65, 81, 0.5)'
          : 'rgba(31, 41, 55, 0.5)',
      color: state.isSelected ? 'white' : '#E5E7EB',
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: 'rgba(31, 41, 55, 0.95)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'rgb(17 24 39)',
    '@media (prefers-color-scheme: dark)': {
      color: '#E5E7EB',
    },
  }),
  input: (base) => ({
    ...base,
    color: 'rgb(17 24 39)',
    '@media (prefers-color-scheme: dark)': {
      color: '#E5E7EB',
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'rgb(156 163 175)',
    '&:hover': {
      color: 'rgb(107 114 128)',
    },
    '@media (prefers-color-scheme: dark)': {
      color: '#9CA3AF',
      '&:hover': {
        color: '#E5E7EB',
      },
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'rgb(229 231 235)',
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: 'rgba(75, 85, 99, 0.5)',
    },
  }),
}

export function SelectField({ 
  label, 
  name, 
  value, 
  onChange, 
  options,
  error,
  required,
  icon
}: SelectFieldProps) {
  return (
    <div className="flex items-center">
      {icon && (
        <div className="mr-2">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Select<{ value: string; label: string }, false>
          name={name}
          value={value}
          onChange={(newValue) => onChange(newValue as { value: string; label: string } | null)}
          options={options}
          styles={customStyles}
          isSearchable={false}
          className="react-select-container"
          classNamePrefix="react-select"
          required={required}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
} 
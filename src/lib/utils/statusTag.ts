export const getStatusTag = (status: string) => {
  const statusStyles = {
    'voting': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'team-selected': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'team-announced': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  }[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'

  const statusText = {
    'voting': 'Voting Open',
    'team-selected': 'Team Selected',
    'team-announced': 'Team Announced'
  }[status] || status

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles}`}>
      {statusText}
    </span>
  )
} 
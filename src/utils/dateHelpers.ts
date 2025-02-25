export function getTournamentStatus(startDate: string, endDate: string): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return 'upcoming'
  } else if (now > end) {
    return 'completed'
  } else {
    return 'ongoing'
  }
} 
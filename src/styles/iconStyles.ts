export const iconStyles = {
  // Navigation & Actions
  back: {
    default: 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
    container: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  add: {
    default: 'text-white',
    container: 'bg-blue-600 hover:bg-blue-700'
  },
  edit: {
    default: 'text-emerald-600 dark:text-emerald-400',
    container: 'bg-emerald-50 dark:bg-emerald-900/20'
  },

  // Time & Date
  calendar: {
    default: 'text-orange-600 dark:text-orange-400',
    container: 'bg-orange-50 dark:bg-orange-900/20'
  },
  clock: {
    default: 'text-blue-600 dark:text-blue-400',
    container: 'bg-blue-50 dark:bg-blue-900/20'
  },
  deadline: {
    default: 'text-red-600 dark:text-red-400',
    container: 'bg-red-50 dark:bg-red-900/20'
  },

  // Location & Organization
  location: {
    default: 'text-purple-600 dark:text-purple-400',
    container: 'bg-purple-50 dark:bg-purple-900/20'
  },
  trophy: {
    default: 'text-amber-600 dark:text-amber-400',
    container: 'bg-amber-50 dark:bg-amber-900/20'
  },
  tag: {
    default: 'text-teal-600 dark:text-teal-400',
    container: 'bg-teal-50 dark:bg-teal-900/20'
  },

  // Voting
  check: {
    default: 'text-green-600 dark:text-green-400',
    container: 'bg-green-50 dark:bg-green-900/20'
  },
  cross: {
    default: 'text-red-600 dark:text-red-400',
    container: 'bg-red-50 dark:bg-red-900/20'
  },
  question: {
    default: 'text-amber-600 dark:text-amber-400',
    container: 'bg-amber-50 dark:bg-amber-900/20'
  },

  home: {
    container: 'bg-blue-100 dark:bg-blue-900/20',
    default: 'text-blue-600 dark:text-blue-400'
  },
  user: {
    container: 'bg-purple-100 dark:bg-purple-900/20',
    default: 'text-purple-600 dark:text-purple-400'
  },
  settings: {
    container: 'bg-green-100 dark:bg-green-900/20',
    default: 'text-green-600 dark:text-green-400'
  },

  selector: {
    container: 'bg-indigo-100 dark:bg-indigo-900/20',
    default: 'text-indigo-600 dark:text-indigo-400'
  },

  // Add select-team specific styles
  selectTeam: {
    back: {
      default: 'text-gray-600 dark:text-gray-400',
      container: `
        border-2 border-gray-300 dark:border-gray-600
        hover:border-gray-400 dark:hover:border-gray-500
        hover:bg-gray-50/50 dark:hover:bg-gray-400/10
        transition-all duration-200
      `
    },
    save: {
      default: 'text-blue-400 dark:text-blue-300',
      container: `
        border-2 border-blue-400 dark:border-blue-300 
        bg-blue-400/10 dark:bg-blue-400/10 
        shadow-[0_0_12px_rgba(96,165,250,0.2)] dark:shadow-[0_0_12px_rgba(147,197,253,0.3)]
        hover:bg-blue-400/20 dark:hover:bg-blue-400/20
        transition-all duration-200
      `
    },
    publish: {
      default: 'text-emerald-400 dark:text-emerald-300',
      container: `
        border-2 border-emerald-400 dark:border-emerald-300 
        bg-emerald-400/10 dark:bg-emerald-400/10 
        shadow-[0_0_12px_rgba(52,211,153,0.2)] dark:shadow-[0_0_12px_rgba(110,231,183,0.3)]
        hover:bg-emerald-400/20 dark:hover:bg-emerald-400/20
        transition-all duration-200
      `
    },
    unpublish: {
      default: 'text-rose-400 dark:text-rose-300',
      container: `
        border-2 border-rose-400 dark:border-rose-300 
        bg-rose-400/10 dark:bg-rose-400/10 
        shadow-[0_0_12px_rgba(251,113,133,0.2)] dark:shadow-[0_0_12px_rgba(253,164,175,0.3)]
        hover:bg-rose-400/20 dark:hover:bg-rose-400/20
        transition-all duration-200
      `
    },
    player: {
      selected: {
        default: 'text-emerald-400 dark:text-emerald-300',
        container: `
          border-2 border-emerald-400 dark:border-emerald-300 
          bg-emerald-400/10 dark:bg-emerald-400/10 
          shadow-[0_0_12px_rgba(52,211,153,0.2)] dark:shadow-[0_0_12px_rgba(110,231,183,0.3)]
          hover:bg-emerald-400/20 dark:hover:bg-emerald-400/20
          rounded-full
          transition-all duration-200
        `
      },
      unselected: {
        default: 'text-gray-600 dark:text-gray-400',
        container: `
          border-2 border-gray-300 dark:border-gray-600
          hover:border-emerald-400 dark:hover:border-emerald-300
          hover:text-emerald-400 dark:hover:text-emerald-300
          hover:bg-emerald-50/50 dark:hover:bg-emerald-400/10
          rounded-full
          transition-all duration-200
        `
      }
    },
    tab: {
      default: {
        active: 'text-amber-100',
        inactive: 'text-gray-500 dark:text-gray-400'
      },
      container: {
        active: 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30 dark:shadow-amber-400/30',
        inactive: 'border-2 border-gray-200/30 dark:border-gray-700/30 hover:border-gray-300/50 dark:hover:border-gray-600/50'
      }
    },
    export: {
      default: 'text-indigo-400 dark:text-indigo-300',
      container: `
        border-2 border-indigo-400 dark:border-indigo-300 
        bg-indigo-400/10 dark:bg-indigo-400/10 
        shadow-[0_0_12px_rgba(129,140,248,0.2)] dark:shadow-[0_0_12px_rgba(165,180,252,0.3)]
        hover:bg-indigo-400/20 dark:hover:bg-indigo-400/20
        transition-all duration-200
      `
    }
  }
} 
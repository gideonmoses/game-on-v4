'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRight } from 'lucide-react'

interface CarouselProps {
  items: {
    id: string
    title: string
    description?: string
    bgColor?: string // Temporary, will be replaced with images later
  }[]
}

export function Carousel({ items }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % items.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(timer)
  }, [items.length])

  const goToNext = () => {
    setCurrentIndex((current) => (current + 1) % items.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((current) => (current - 1 + items.length) % items.length)
  }

  return (
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden">
      {/* Carousel content */}
      <div 
        className="h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        <div className="absolute top-0 left-0 w-full h-full flex">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`w-full h-full flex-shrink-0 ${item.bgColor || 'bg-gray-200'}`}
              style={{ transform: `translateX(${index * 100}%)` }}
            >
              <div className="h-full flex flex-col justify-center items-center text-center p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-800"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-800"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  )
} 
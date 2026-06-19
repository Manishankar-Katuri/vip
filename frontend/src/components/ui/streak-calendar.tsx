import * as React from 'react'
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns'

import { cn } from '@/lib/utils'

export type StreakPeriod = {
  periodStart: string
  periodEnd: string
}

type StreakCalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  streak: StreakPeriod[]
  view?: 'week'
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

function StreakCalendar({ className, streak, startOfWeek: weekStartsOn = 1, ...props }: StreakCalendarProps) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  return (
    <div className={cn('grid grid-cols-7 gap-2', className)} aria-label="Posting streak week" {...props}>
      {days.map((day) => {
        const active = streak.some((period) => {
          const start = parseISO(period.periodStart)
          const end = parseISO(period.periodEnd)
          return day >= start && day <= end
        })
        return (
          <div key={day.toISOString()} className="grid gap-1 text-center">
            <span className="text-muted-foreground text-xs font-medium">{format(day, 'EEE')}</span>
            <span
              className={cn(
                'mx-auto grid h-9 w-9 place-items-center rounded-md border text-sm font-semibold',
                active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500',
                isSameDay(day, today) && 'ring-2 ring-indigo-200',
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { StreakCalendar }


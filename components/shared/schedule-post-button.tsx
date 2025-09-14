'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Button } from '../ui/shadcn-button'
import { format, addMinutes, setHours, setMinutes } from 'date-fns'
import { cn } from '@/lib/utils'

interface SchedulePostButtonProps {
  onSchedule: (date: Date) => void
  scheduledDate: Date | undefined
  className?: string
}

const SchedulePostButton = ({ onSchedule, scheduledDate, className }: SchedulePostButtonProps) => {
  const [date, setDate] = useState<Date | undefined>(scheduledDate)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<string>("12")
  const [selectedMinute, setSelectedMinute] = useState<string>("00")
  const [selectedAmPm, setSelectedAmPm] = useState<string>("PM")
  
  // Generate hours, minutes for select options
  const hours = Array.from({ length: 12 }, (_, i) => String((i + 1)).padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
  
  // Initialize time selectors when date changes
  useEffect(() => {
    if (date) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      
      setSelectedHour(String(hours % 12 || 12).padStart(2, '0'))
      setSelectedMinute(String(Math.floor(minutes / 5) * 5).padStart(2, '0'))
      setSelectedAmPm(hours >= 12 ? "PM" : "AM")
    } else {
      // Default to current time + 30 minutes, rounded to nearest 5
      const now = new Date()
      const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5
      const defaultDate = addMinutes(now, roundedMinutes - now.getMinutes() + 30)
      
      setSelectedHour(String(defaultDate.getHours() % 12 || 12).padStart(2, '0'))
      setSelectedMinute(String(Math.floor(defaultDate.getMinutes() / 5) * 5).padStart(2, '0'))
      setSelectedAmPm(defaultDate.getHours() >= 12 ? "PM" : "AM")
    }
  }, [date])
  
  const applyTimeToDate = (selectedDate: Date): Date => {
    if (!selectedDate) return selectedDate
    
    let hours = parseInt(selectedHour)
    const minutes = parseInt(selectedMinute)
    
    // Convert to 24-hour format
    if (selectedAmPm === "PM" && hours < 12) {
      hours += 12
    } else if (selectedAmPm === "AM" && hours === 12) {
      hours = 0
    }
    
    let newDate = new Date(selectedDate)
    newDate = setHours(newDate, hours)
    newDate = setMinutes(newDate, minutes)
    
    // Ensure date is at least 5 minutes in the future
    const now = new Date()
    const minScheduleTime = addMinutes(now, 5)
    
    if (newDate < minScheduleTime) {
      return minScheduleTime
    }
    
    return newDate
  }
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    setDate(selectedDate)
  }
  
  const handleSchedule = () => {
    if (!date) return
    
    const dateWithTime = applyTimeToDate(date)
    onSchedule(dateWithTime)
    setIsOpen(false)
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={scheduledDate ? "default" : "outline"} 
            size="sm" 
            className={cn(
              "flex items-center gap-2 transition-all",
              scheduledDate ? 'bg-sky-500/20 text-sky-500 border-sky-500 hover:bg-sky-500/30' : 'text-neutral-400 hover:text-white'
            )}
          >
            <Calendar size={16} />
            {scheduledDate ? (
              <span>Scheduled: {format(scheduledDate, 'MMM d, h:mm a')}</span>
            ) : (
              <span>Schedule</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-black border border-neutral-800 shadow-lg rounded-lg" align="start" sideOffset={5}>
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <Calendar size={18} className="text-sky-500" />
              <span>Schedule your post</span>
            </h3>
            <p className="text-neutral-400 text-sm mt-1">Your post will be published automatically at the specified time.</p>
          </div>
          
          <div className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="bg-black text-white rounded-md border border-neutral-800"
              classNames={{
                day_selected: "bg-sky-500 text-white hover:bg-sky-600",
                day_today: "bg-neutral-800 text-white",
                day: "hover:bg-neutral-800"
              }}
            />
          </div>
          
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-sky-500" />
              <span className="text-sm font-medium text-white">Set time</span>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="relative">
                <select 
                  value={selectedHour} 
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-[70px] h-9 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
              
              <span className="text-neutral-400">:</span>
              
              <div className="relative">
                <select 
                  value={selectedMinute} 
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-[70px] h-9 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select 
                  value={selectedAmPm} 
                  onChange={(e) => setSelectedAmPm(e.target.value)}
                  className="w-[70px] h-9 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-neutral-800 flex justify-between">
            {scheduledDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDate(undefined)
                  onSchedule(new Date(0)) // Use epoch time to indicate removal
                  setIsOpen(false)
                }}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                Remove
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="border-neutral-700 hover:bg-neutral-800"
              >
                Cancel
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSchedule}
                className="bg-sky-500 hover:bg-sky-600 text-white"
                disabled={!date}
              >
                Schedule
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default SchedulePostButton
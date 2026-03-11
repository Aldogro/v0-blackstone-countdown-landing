"use client"

import { useState, useEffect } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownUnitProps {
  value: number
  label: string
  prevValue: number
}

function CountdownUnit({ value, label, prevValue }: CountdownUnitProps) {
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true)
      const timer = setTimeout(() => setIsFlipping(false), 300)
      return () => clearTimeout(timer)
    }
  }, [value, prevValue])

  const formattedValue = value.toString().padStart(2, "0")

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`
            flex items-center justify-center
            w-20 h-24 sm:w-28 sm:h-32 md:w-36 md:h-44
            bg-card rounded-lg border border-border
            shadow-2xl shadow-background/50
            transition-transform duration-300 ease-out
            ${isFlipping ? "scale-95" : "scale-100"}
          `}
        >
          <span
            className={`
              text-4xl sm:text-5xl md:text-7xl font-light tracking-tight text-foreground
              transition-all duration-300
              ${isFlipping ? "opacity-70 blur-[1px]" : "opacity-100 blur-0"}
            `}
          >
            {formattedValue}
          </span>
        </div>
        <div
          className={`
            absolute inset-0 bg-foreground/5 rounded-lg
            transition-opacity duration-300
            ${isFlipping ? "opacity-100" : "opacity-0"}
          `}
        />
      </div>
      <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [prevTimeLeft, setPrevTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = (): TimeLeft => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    const updateTimer = () => {
      setPrevTimeLeft(timeLeft)
      setTimeLeft(calculateTimeLeft())
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [targetDate, timeLeft])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
        {[
          { value: 0, label: "Dias" },
          { value: 0, label: "Horas" },
          { value: 0, label: "Min" },
          { value: 0, label: "Seg" },
        ].map((item) => (
          <CountdownUnit
            key={item.label}
            value={item.value}
            label={item.label}
            prevValue={item.value}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
      <CountdownUnit value={timeLeft.days} label="Dias" prevValue={prevTimeLeft.days} />
      <div className="text-3xl sm:text-4xl md:text-5xl text-muted-foreground font-light self-start mt-6 sm:mt-8 md:mt-12">
        :
      </div>
      <CountdownUnit value={timeLeft.hours} label="Horas" prevValue={prevTimeLeft.hours} />
      <div className="text-3xl sm:text-4xl md:text-5xl text-muted-foreground font-light self-start mt-6 sm:mt-8 md:mt-12">
        :
      </div>
      <CountdownUnit value={timeLeft.minutes} label="Min" prevValue={prevTimeLeft.minutes} />
      <div className="text-3xl sm:text-4xl md:text-5xl text-muted-foreground font-light self-start mt-6 sm:mt-8 md:mt-12">
        :
      </div>
      <CountdownUnit value={timeLeft.seconds} label="Seg" prevValue={prevTimeLeft.seconds} />
    </div>
  )
}

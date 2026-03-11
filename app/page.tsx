import { Countdown } from "@/components/countdown"

export default function Home() {
  // Target date: May 1st, 2026 at midnight
  const targetDate = new Date("2026-05-01T00:00:00")

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://experienciablackstone.com/club-vacacional/img/country_village_left.png')`,
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16">
        {/* Header text */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-balance">
            Sólo falta...
          </h1>
        </div>

        {/* Countdown */}
        <Countdown targetDate={targetDate} />

        {/* Event name */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-balance">
            para Blackstone
          </h2>
          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-muted-foreground mt-8">
            1 de Mayo, 2026
          </p>
        </div>
      </div>


    </main>
  )
}

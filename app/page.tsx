import { Countdown } from "@/components/countdown"

export default function Home() {
  // Target date: May 1st, 2026 at midnight
  const targetDate = new Date("2026-05-01T00:00:00")

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16">
        {/* Header text */}
        <div className="text-center space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-muted-foreground">
            La espera termina pronto
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-balance">
            Falta
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

      {/* Subtle glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-foreground/[0.02] rounded-full blur-3xl pointer-events-none" />
    </main>
  )
}

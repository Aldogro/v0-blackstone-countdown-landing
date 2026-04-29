import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            Ya casi estás<br />
            en Blackstone!
          </h1>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-balance">
            <span className="text-primary">
              Y se viene el primer<br />Blackstone Padel Tournament (BPT)!
            </span>
          </h3>
        </div>
        <div className="text-center">
          <Button variant="outline" className="gap-2">
            <Link href="/partidos">
              Ver partidos
            </Link>
          </Button>
          <div className="w-16 h-1 bg-primary mx-auto my-4" />
          <Button variant="outline" className="gap-2">
            <Link href="/partidos">
              Ver Puntos BPT
            </Link>
          </Button>
        </div>
        <div className="text-center space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-muted-foreground mt-8">
            1 de Mayo, 2026
          </p>
        </div>
      </div>


    </main>
  )
}

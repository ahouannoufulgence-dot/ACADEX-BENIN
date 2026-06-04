import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">ACADEX</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Connexion</Link>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-8 h-11">
            <Link href="/dashboard">Démo Gratuite</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 min-h-screen">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/acadex-hero/1920/1080" 
            alt="Students collaborating" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>

        <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <Zap className="size-3 fill-primary" />
            L'excellence académique réinventée
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-foreground tracking-tight mb-8 leading-[1.1]">
            Bienvenue sur <span className="text-primary italic">ACADEX</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Apprendre aujourd'hui, réussir demain. La plateforme de gestion scolaire la plus performante du Bénin pour les établissements d'élite.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 h-14 text-lg font-semibold shadow-xl shadow-primary/20 group">
              <Link href="/dashboard" className="flex items-center gap-2">
                Accéder au tableau de bord
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full border-2 px-10 h-14 text-lg font-semibold hover:bg-muted transition-all">
              Découvrir nos solutions
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { icon: ShieldCheck, title: "Sécurisé", desc: "Données protégées par Firebase." },
            { icon: Sparkles, title: "Innovant", desc: "IA génératrice d'appréciations." },
            { icon: CheckCircle2, title: "Fiable", desc: "Utilisé par les meilleurs collèges." }
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-border/50 shadow-sm transition-all hover:shadow-md">
              <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <f.icon className="size-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-center">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
    </div>
  )
}

const Sparkles = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
)
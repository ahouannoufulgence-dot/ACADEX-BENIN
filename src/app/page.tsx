
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, UserPlus } from "lucide-react"

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
          <Link href="/login" className="text-sm font-black text-muted-foreground hover:text-primary transition-colors">Connexion</Link>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-8 h-11 font-bold">
            <Link href="/register">Essayer Gratuitement</Link>
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
            L'excellence académique au Bénin
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">
            Réussir aujourd'hui, <br />
            <span className="text-primary italic">Bâtir demain</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            La plateforme de gestion scolaire d'élite pour les collèges et lycées du Bénin. Simple, sécurisée et intelligente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="rounded-2xl bg-primary hover:bg-primary/90 px-12 h-16 text-xl font-black shadow-2xl shadow-primary/20 group">
              <Link href="/register" className="flex items-center gap-3">
                Démarrer l'aventure
                <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl border-2 px-12 h-16 text-xl font-black hover:bg-muted transition-all">
              <Link href="/login" className="flex items-center gap-3">
                <ShieldCheck className="size-6" /> Accès Sécurisé
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { icon: ShieldCheck, title: "Sécurité Totale", desc: "Audit permanent et protection des notes officielles." },
            { icon: Zap, title: "Analyse IA", desc: "Suivi prédictif des performances et bulletins automatiques." },
            { icon: CheckCircle2, title: "Système Bénin", desc: "Adapté aux séries A, C, D et coefficients officiels." }
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center p-10 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 duration-500">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <f.icon className="size-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-center font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
    </div>
  )
}

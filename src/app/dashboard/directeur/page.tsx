"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  UserCheck, 
  GraduationCap, 
  Sparkles, 
  BrainCircuit,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DirectorDashboard() {
  const stats = [
    { title: "Effectif Total", value: "0", change: "Élèves", icon: Users },
    { title: "Moyenne École", value: "0.0", change: "Global", icon: GraduationCap },
    { title: "Trésorerie", value: "0", sub: "FCFA", change: "Recouvrement", icon: CreditCard },
    { title: "Présence Profs", value: "0/0", change: "Pointage", icon: UserCheck },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Cockpit <span className="text-primary italic">Directeur</span></h1>
            <p className="text-muted-foreground font-medium">Pilotage stratégique de votre établissement.</p>
          </div>
          <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
            <Link href="/assistant">
              <Sparkles className="mr-2 size-5 fill-white" /> Cerveau ACADEX
            </Link>
          </Button>
        </div>

        <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-24 bg-primary/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl">
              <BrainCircuit className="size-12 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-3xl font-black italic">"Parlez à votre établissement."</h3>
              <p className="text-white/60 font-medium">Analysez les notes, les absences et la finance en langage naturel avec l'IA.</p>
            </div>
            <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
              <Link href="/assistant">Lancer l'Assistant</Link>
            </Button>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-amber-50 border-2 border-amber-200 flex items-center gap-4 rounded-[2rem]">
            <div className="size-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><AlertCircle /></div>
            <div className="flex-1">
              <h4 className="font-black text-amber-900 text-sm">Notes Manquantes</h4>
              <p className="text-xs text-amber-700 font-bold">Aucune alerte détectée pour le moment.</p>
            </div>
            <Button variant="ghost" className="text-amber-700 font-black text-xs">Vérifier</Button>
          </Card>
          <Card className="p-6 bg-emerald-50 border-2 border-emerald-200 flex items-center gap-4 rounded-[2rem]">
            <div className="size-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><CreditCard /></div>
            <div className="flex-1">
              <h4 className="font-black text-emerald-900 text-sm">Trésorerie</h4>
              <p className="text-xs text-emerald-700 font-bold">Tout est à jour.</p>
            </div>
            <Button variant="ghost" className="text-emerald-700 font-black text-xs">Détails</Button>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-7 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-muted rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <stat.icon className="size-7" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-xs font-black text-muted-foreground ml-1">{stat.sub}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

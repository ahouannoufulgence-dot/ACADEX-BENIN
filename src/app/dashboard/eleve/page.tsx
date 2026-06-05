"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  Trophy, 
  Clock, 
  Sparkles,
  TrendingUp,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function StudentDashboard() {
  const stats = [
    { title: "Ma Moyenne", value: "0.00", change: "Trimestre 1", icon: GraduationCap },
    { title: "Mon Rang", value: "---", change: "Classe", icon: Trophy },
    { title: "Absences", value: "0", change: "Heures", icon: Clock },
    { title: "Scolarité", value: "À jour", change: "Statut", icon: CreditCard },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Mon Cockpit <span className="text-primary italic">Élève</span></h1>
            <p className="text-muted-foreground font-medium">Suis ta réussite et ton agenda en temps réel.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg">ANNÉE 2024-2025</Badge>
        </div>

        <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20">
              <Sparkles className="size-14 text-primary fill-primary/20" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl font-black italic">"Vise l'excellence."</h3>
              <p className="text-white/60 font-medium">Consulte tes dernières notes et analyse ta progression avec ton assistant personnel.</p>
              <div className="pt-2">
                <Button asChild variant="secondary" className="rounded-2xl h-14 px-12 font-black text-lg shadow-2xl active:scale-95 transition-all">
                  <Link href="/eleves/profile">Voir mes notes</Link>
                </Button>
              </div>
            </div>
          </div>
          <Sparkles className="absolute -bottom-16 -right-16 size-64 text-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-8 rounded-[3rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all bg-white hover:-translate-y-1">
              <div className="flex items-center justify-between mb-8">
                <div className="p-4 bg-muted rounded-[1.5rem] text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <stat.icon className="size-8" />
                </div>
                <Badge variant="outline" className="font-black text-[9px] uppercase border-primary/20">{stat.change}</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-foreground">{stat.value}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
           <Link href="/agenda" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4">
              <div className="size-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Calendar className="size-8" /></div>
              <h4 className="font-black">Emploi du temps</h4>
           </Link>
           <Link href="/messagerie" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4">
              <div className="size-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><MessageSquare className="size-8" /></div>
              <h4 className="font-black">Messagerie</h4>
           </Link>
           <Link href="/statistiques" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4">
              <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><TrendingUp className="size-8" /></div>
              <h4 className="font-black">Ma Progression</h4>
           </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

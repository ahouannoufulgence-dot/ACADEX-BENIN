
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
  TrendingUp,
  ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  
  const { data: students } = useCollection(collection(db, "students"))
  const { data: teachers } = useCollection(collection(db, "teachers"))
  const { data: payments } = useCollection(collection(db, "payments"))
  const { data: presences } = useCollection(collection(db, "teacher_presence"))

  const stats = useMemo(() => {
    if (!mounted) return []
    
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    
    const today = new Date().toISOString().split('T')[0]
    const presentToday = presences?.filter((p: any) => p.date === today && p.status === "Présent").length || 0

    return [
      { title: "Effectif Total", value: totalStudents.toString(), label: "Élèves inscrits", icon: Users, color: "text-blue-600" },
      { title: "Corps Enseignant", value: totalTeachers.toString(), label: "Professeurs actifs", icon: GraduationCap, color: "text-emerald-600" },
      { title: "Trésorerie", value: totalRevenue.toLocaleString(), sub: "FCFA", label: "Recouvrement total", icon: CreditCard, color: "text-amber-600" },
      { title: "Présence Profs", value: `${presentToday}/${totalTeachers}`, label: "Pointage ce jour", icon: UserCheck, color: "text-primary" },
    ]
  }, [students, teachers, payments, presences, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Cockpit <span className="text-primary italic">Directeur</span></h1>
            <p className="text-muted-foreground font-medium">Pilotage en temps réel de votre établissement.</p>
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
              <h3 className="text-3xl font-black italic">"Zéro donnée fictive."</h3>
              <p className="text-white/60 font-medium">Les chiffres ci-dessous proviennent exclusivement de vos saisies réelles ({students?.length || 0} élèves enregistrés).</p>
            </div>
            <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
              <Link href="/eleves">Gérer les Élèves</Link>
            </Button>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-7 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all bg-white overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 bg-muted rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                  <stat.icon className="size-7" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-xs font-black text-muted-foreground ml-1">{stat.sub}</span>}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-2">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

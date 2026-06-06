
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
  ArrowUpRight,
  TrendingUp,
  AlertCircle
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
  
  // Mémorisation des références pour éviter les boucles infinies
  const studentsRef = useMemo(() => collection(db, "students"), [db])
  const teachersRef = useMemo(() => collection(db, "teachers"), [db])
  const paymentsRef = useMemo(() => collection(db, "payments"), [db])

  const { data: students } = useCollection(studentsRef)
  const { data: teachers } = useCollection(teachersRef)
  const { data: payments } = useCollection(paymentsRef)

  const stats = useMemo(() => {
    if (!mounted) return []
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    
    return [
      { title: "Effectif Global", value: (students?.length || 0).toString(), label: "Élèves inscrits", icon: Users, color: "text-blue-600" },
      { title: "Corps Enseignant", value: (teachers?.length || 0).toString(), label: "Professeurs actifs", icon: GraduationCap, color: "text-emerald-600" },
      { title: "Recouvrement", value: totalRevenue.toLocaleString(), sub: "FCFA", label: "Trésorerie réelle", icon: CreditCard, color: "text-amber-600" },
      { title: "Performance", value: "Audit", label: "Moyenne école", icon: TrendingUp, color: "text-primary" },
    ]
  }, [students, teachers, payments, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Cockpit <span className="text-primary italic">Directeur</span></h1>
            <p className="text-muted-foreground font-medium">Pilotage centralisé de votre établissement béninois.</p>
          </div>
          <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
            <Link href="/assistant">
              <Sparkles className="mr-2 size-5 fill-white" /> Demander à l'IA
            </Link>
          </Button>
        </div>

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

        <Card className="border-none shadow-xl bg-foreground text-white p-12 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-28 bg-primary/20 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
              <BrainCircuit className="size-14 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-3xl font-black italic">"Données réelles."</h3>
              <p className="text-xl text-white/60 font-medium leading-relaxed max-w-2xl">
                Toutes les statistiques affichées proviennent de vos saisies réelles. Gérez vos élèves et vos professeurs pour alimenter le dashboard.
              </p>
              <div className="pt-4 flex gap-4">
                 <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
                   <Link href="/eleves">Gérer les Élèves</Link>
                 </Button>
                 <Button asChild variant="outline" className="rounded-2xl h-14 px-10 font-black text-lg bg-transparent border-white/20 hover:bg-white/5">
                   <Link href="/personalisation">Branding École</Link>
                 </Button>
              </div>
            </div>
          </div>
          <Sparkles className="absolute -bottom-16 -right-16 size-64 text-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
        </Card>
      </div>
    </DashboardLayout>
  )
}

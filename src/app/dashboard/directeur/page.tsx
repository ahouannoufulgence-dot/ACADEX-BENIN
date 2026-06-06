
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  Sparkles, 
  BrainCircuit,
  ArrowUpRight,
  TrendingUp,
  Zap,
  UserCheck
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
  
  const studentsRef = useMemo(() => collection(db, "students"), [db])
  const teachersRef = useMemo(() => collection(db, "teachers"), [db])
  const idsRef = useMemo(() => collection(db, "registration_ids"), [db])

  const { data: students } = useCollection(studentsRef)
  const { data: teachers } = useCollection(teachersRef)
  const { data: ids } = useCollection(idsRef)

  const stats = useMemo(() => {
    if (!mounted) return []
    const unusedCount = ids?.filter((id: any) => id.status === "non utilisé").length || 0
    
    return [
      { title: "Élèves Inscrits", value: (students?.length || 0).toString(), label: "Profils complets", icon: Users, color: "text-primary" },
      { title: "Codes disponibles", value: unusedCount.toString(), label: "Prêts pour inscription", icon: Zap, color: "text-amber-600" },
      { title: "Équipe Enseignante", value: (teachers?.length || 0).toString(), label: "Professeurs actifs", icon: GraduationCap, color: "text-blue-600" },
      { title: "Performance", value: "Audit", label: "Données temps réel", icon: TrendingUp, color: "text-emerald-600" },
    ]
  }, [students, teachers, ids, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Cockpit <span className="text-primary italic">Directeur</span></h1>
            <p className="text-muted-foreground font-medium">Pilotage centralisé et automatisé de votre établissement.</p>
          </div>
          <div className="flex gap-3">
             <Button asChild variant="outline" className="border-2 rounded-2xl h-14 px-8 font-black bg-white">
               <Link href="/eleves/identifiants">
                 <Zap className="mr-2 size-5" /> Gérer Identifiants
               </Link>
             </Button>
             <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
               <Link href="/assistant">
                 <Sparkles className="mr-2 size-5 fill-white" /> Demander à l'IA
               </Link>
             </Button>
          </div>
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
              <h3 className="text-3xl font-black italic">"Inscriptions Automatisées."</h3>
              <p className="text-xl text-white/60 font-medium leading-relaxed max-w-2xl">
                Générez des matricules dans le module dédié et laissez les élèves s'inscrire eux-mêmes. Leurs profils apparaîtront ici instantanément.
              </p>
              <div className="pt-4 flex gap-4">
                 <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
                   <Link href="/eleves">Voir les Inscrits</Link>
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

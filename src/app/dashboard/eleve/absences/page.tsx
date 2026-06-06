
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Clock, ShieldCheck, UserX, CheckCircle2, History, Info } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export default function StudentAbsencesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const absencesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "absences"), where("studentId", "==", studentId), orderBy("date", "desc"))
  }, [db, studentId])

  const { data: absences, loading } = useCollection(absencesQuery)

  const stats = useMemo(() => {
    if (!absences) return { total: 0, justified: 0, unjustified: 0 }
    return {
      total: absences.length,
      justified: absences.filter((a: any) => a.justified).length,
      unjustified: absences.filter((a: any) => !a.justified).length
    }
  }, [absences])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mes <span className="text-primary italic">Absences</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Historique de ponctualité et justifications.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg">
            TAUX PRÉSENCE : 98%
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2 border-none shadow-sm">
            <div className="size-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mx-auto"><History className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Incidents</p>
            <p className="text-4xl font-black">{stats.total}</p>
          </Card>
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2 border-none shadow-sm">
            <div className="size-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><CheckCircle2 className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Justifiées</p>
            <p className="text-4xl font-black text-emerald-600">{stats.justified}</p>
          </Card>
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2 border-none shadow-sm border-l-[8px] border-red-500">
            <div className="size-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto"><UserX className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Non Justifiées</p>
            <p className="text-4xl font-black text-red-600">{stats.unjustified}</p>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
          <div className="p-8 border-b bg-muted/10">
            <h3 className="text-xl font-black flex items-center gap-3">
               <Clock className="text-primary" /> Journal de Ponctualité
            </h3>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-20 text-center font-bold text-muted-foreground animate-pulse">Chargement de ton historique...</div>
            ) : !absences || absences.length === 0 ? (
              <div className="p-24 text-center space-y-6">
                 <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30">
                   <ShieldCheck className="size-10 text-emerald-500" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black">Conduite exemplaire !</h3>
                   <p className="text-muted-foreground font-medium">Tu n'as aucune absence ou retard enregistré.</p>
                 </div>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {absences.map((abs: any, i) => (
                  <div key={i} className="p-8 flex items-center justify-between hover:bg-muted/5 transition-all">
                    <div className="flex items-center gap-8">
                       <div className="text-center">
                          <p className="text-xs font-black uppercase text-muted-foreground">{new Date(abs.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                          <p className="text-2xl font-black">{new Date(abs.date).getDate()}</p>
                       </div>
                       <div>
                         <h4 className="font-black text-lg">{abs.subject}</h4>
                         <p className="text-sm font-medium text-muted-foreground">{abs.reason || "Motif non précisé"}</p>
                       </div>
                    </div>
                    <Badge className={abs.justified ? "bg-emerald-500 text-white rounded-full px-6 font-black" : "bg-destructive text-white rounded-full px-6 font-black"}>
                      {abs.justified ? "JUSTIFIÉE" : "NON JUSTIFIÉE"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

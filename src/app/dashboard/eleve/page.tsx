
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
  MessageSquare,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"

export default function StudentDashboard() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setMounted(true)
  }, [])

  const { data: student } = useDoc(studentId ? doc(db, "students", studentId) : null)
  const { data: grades } = useCollection(studentId ? collection(db, "students", studentId, "grades") : null)
  const { data: payments } = useCollection(studentId ? query(collection(db, "payments"), where("studentId", "==", studentId)) : null)

  const stats = useMemo(() => {
    if (!mounted) return []
    
    // Calcul de la moyenne réelle
    const avg = grades?.length 
      ? (grades.reduce((acc, g: any) => acc + (g.average || 0), 0) / grades.length).toFixed(2)
      : "0.00"
    
    const totalPaid = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const paymentStatus = totalPaid > 0 ? "En règle" : "À régulariser"

    return [
      { title: "Ma Moyenne", value: avg, change: "Trimestre Actuel", icon: GraduationCap, color: "text-primary" },
      { title: "Mon Rang", value: "---", change: "Non calculé", icon: Trophy, color: "text-amber-500" },
      { title: "Absences", value: "0", change: "Heures justifiées", icon: Clock, color: "text-red-500" },
      { title: "Ma Scolarité", value: paymentStatus, change: `${totalPaid.toLocaleString()} FCFA versés`, icon: CreditCard, color: "text-emerald-600" },
    ]
  }, [grades, payments, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Mon Cockpit <span className="text-primary italic">Élève</span></h1>
            <p className="text-muted-foreground font-medium">Bienvenue, {student?.fullName || "élève"}. Suis ta réussite ici.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg uppercase">
            {student?.classId || "Classe"}
          </Badge>
        </div>

        <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20">
              <Sparkles className="size-14 text-primary fill-primary/20" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl font-black italic">"Tes efforts paient."</h3>
              <p className="text-white/60 font-medium">Consulte tes {grades?.length || 0} notes enregistrées et analyse ta progression avec l'IA.</p>
              <div className="pt-2">
                <Button asChild variant="secondary" className="rounded-2xl h-14 px-12 font-black text-lg shadow-2xl active:scale-95 transition-all">
                  <Link href="/eleves/profile">Mon Profil Complet</Link>
                </Button>
              </div>
            </div>
          </div>
          <Sparkles className="absolute -bottom-16 -right-16 size-64 text-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-8 rounded-[3rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all bg-white hover:-translate-y-1">
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 bg-muted rounded-[1.5rem] ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Link href="/agenda" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4 group">
              <div className="size-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar className="size-8" /></div>
              <h4 className="font-black">Emploi du temps</h4>
           </Link>
           <Link href="/messagerie" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4 group">
              <div className="size-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><MessageSquare className="size-8" /></div>
              <h4 className="font-black">Messagerie</h4>
           </Link>
           <Link href="/statistiques" className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center gap-4 group">
              <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp className="size-8" /></div>
              <h4 className="font-black">Ma Progression</h4>
           </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

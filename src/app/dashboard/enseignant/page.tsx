
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  Clock, 
  PenTool, 
  UserCheck, 
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useEffect, useState, useMemo } from "react"

export default function TeacherDashboard() {
  const db = useFirestore()
  const [teacherId, setTeacherId] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])

  useEffect(() => {
    setTeacherId(localStorage.getItem('acadex_user_id') || "")
    setTeacherClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  // Real data based on teacher's classes
  const studentsQuery = useMemo(() => {
    if (!db || teacherClasses.length === 0) return null
    return query(collection(db, "students"), where("classId", "in", teacherClasses))
  }, [db, teacherClasses])

  const { data: students } = useCollection(studentsQuery)
  const { data: presences } = useCollection(query(collection(db, "teacher_presence"), where("teacherId", "==", teacherId)))

  const stats = [
    { title: "Mes Classes", value: teacherClasses.length.toString(), change: "Attribuées", icon: Users },
    { title: "Mes Élèves", value: (students?.length || 0).toString(), change: "Total", icon: BookOpen },
    { title: "Notes à Saisir", value: "0", change: "Alertes", icon: PenTool },
    { title: "Mon Pointage", value: presences?.[0]?.status || "Non fait", change: "Aujourd'hui", icon: UserCheck },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Espace <span className="text-primary italic">Enseignant</span></h1>
            <p className="text-muted-foreground font-medium">Gestion de vos {teacherClasses.length} classes officielles.</p>
          </div>
          <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
            <Link href="/notes">
              <PenTool className="mr-2 size-5" /> Saisir les Notes
            </Link>
          </Button>
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
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           <Link href="/eleves" className="p-10 bg-white rounded-[3rem] shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 group">
              <div className="size-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="size-8" /></div>
              <h3 className="text-2xl font-black">Mes élèves ({students?.length || 0})</h3>
              <p className="text-muted-foreground font-medium">Liste, absences et comportements de vos classes.</p>
           </Link>
           <Link href="/assistant" className="p-10 bg-white rounded-[3rem] shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 group border-2 border-dashed border-primary/20">
              <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles className="size-8" /></div>
              <h3 className="text-2xl font-black text-primary">Assistant ACADEX</h3>
              <p className="text-muted-foreground font-medium">Aide pédagogique basée sur vos données réelles.</p>
           </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

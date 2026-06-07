
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  PenTool, 
  UserCheck, 
  Sparkles,
  BookOpen,
  Loader2,
  Calendar,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"

export default function TeacherDashboard() {
  const db = useFirestore()
  const [teacherId, setTeacherId] = useState("")
  const [teacherName, setTeacherName] = useState("Monsieur")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  const [teacherSubject, setTeacherSubject] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('acadex_user_id') || ""
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    const subject = localStorage.getItem('acadex_user_subject') || ""
    const name = localStorage.getItem('acadex_user_name') || "Monsieur"
    
    setTeacherId(id)
    setTeacherClasses(classes)
    setTeacherSubject(subject)
    setTeacherName(name)
    setMounted(true)
  }, [])

  // Requête mémorisée pour éviter les boucles
  const studentsQuery = useMemo(() => {
    if (!db || teacherClasses.length === 0) return null
    return query(collection(db, "students"), where("classId", "in", teacherClasses))
  }, [db, teacherClasses])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const stats = useMemo(() => {
    if (!mounted) return []
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    return [
      { title: "Mes Classes", value: teacherClasses.length.toString(), label: "Attribuées", icon: Users, color: "text-blue-600" },
      { title: "Mes Élèves", value: (students?.length || 0).toString(), label: "Effectif total", icon: BookOpen, color: "text-primary" },
      { title: "Notes Saisies", value: "0", label: "Ce trimestre", icon: PenTool, color: "text-amber-500" },
      { title: "Pointage", value: "---", label: today, icon: UserCheck, color: "text-emerald-600" },
    ]
  }, [students, teacherClasses, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Bonjour Monsieur <span className="text-primary italic">{teacherName}</span>,
            </h1>
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white border-none font-black px-4 py-1 uppercase">{teacherSubject}</Badge>
               <p className="text-muted-foreground font-medium">Gestion de vos {teacherClasses.length} classes officielles.</p>
            </div>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black relative z-10">
            <Link href="/notes">
              <PenTool className="mr-2 size-5" /> Saisir les Notes
            </Link>
          </Button>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-8 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between bg-white hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 bg-muted rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                  <stat.icon className="size-7" />
                </div>
                <Badge variant="outline" className="border-none text-[8px] font-black uppercase bg-muted/50">{stat.label}</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">
                    {loadingStudents && stat.title === "Mes Élèves" ? <Loader2 className="animate-spin size-5" /> : stat.value}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden p-10 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="size-20 bg-muted rounded-full flex items-center justify-center opacity-30">
                    <Calendar className="size-10" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black">Mon Emploi du Temps</h3>
                    <p className="text-muted-foreground font-medium max-w-sm">Consultez et modifiez votre programme hebdomadaire.</p>
                 </div>
                 <Button asChild variant="outline" className="rounded-xl font-black h-12 px-10 border-2">
                    <Link href="/disponibilites">Voir planning complet</Link>
                 </Button>
              </Card>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <Link href="/eleves" className="block">
                <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all group">
                   <div className="flex items-center justify-between mb-6">
                      <div className="size-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="size-7" />
                      </div>
                      <ArrowRight className="size-5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-all" />
                   </div>
                   <h3 className="text-xl font-black mb-2">Liste de mes élèves</h3>
                   <p className="text-sm font-medium text-muted-foreground">Accès aux fiches individuelles et carnets de notes.</p>
                </Card>
              </Link>

              <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <Sparkles className="size-6 text-primary animate-pulse" />
                  <h4 className="font-black text-lg">Assistant IA Enseignant</h4>
                </div>
                <p className="text-sm font-medium text-muted-foreground italic leading-relaxed mb-6">
                  "Utilisez l'IA pour générer automatiquement les observations de fin de trimestre."
                </p>
                <Button asChild className="w-full bg-white text-primary hover:bg-white/90 border border-primary/10 rounded-xl font-black h-11">
                  <Link href="/assistant">Ouvrir l'Assistant</Link>
                </Button>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

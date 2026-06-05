"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  ChevronRight,
  Loader2,
  Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where } from "firebase/firestore"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Directeur"
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    setUserRole(role)
    setUserClasses(classes)
  }, [])

  const isDirector = userRole.toLowerCase() === "directeur"

  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const ref = collection(db, 'students')
    
    if (!isDirector && userClasses.length > 0) {
      return query(ref, where("classId", "in", userClasses), orderBy("matricule", "asc"))
    }
    
    return query(ref, orderBy("matricule", "asc"))
  }, [db, userRole, userClasses, isDirector])

  const { data: students, loading } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage Élèves" : "Mes Classes"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Gestion centrale de tous les inscrits." 
                : `Périmètre : ${userClasses.join(', ')}.`}
            </p>
          </div>
          <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
            <Plus className="mr-2 size-5" /> Inscription
          </Button>
        </div>

        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher par nom ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-16 text-center bg-white rounded-[2.5rem] border-none shadow-sm">
              <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-black mb-2">Aucun élève</h3>
              <p className="text-muted-foreground italic font-medium">Ajustez votre recherche ou ajoutez un élève.</p>
            </Card>
          ) : (
            filteredStudents.map((student: any) => (
              <Link key={student.id} href={`/eleves/${student.id}`}>
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="size-16 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm">
                          <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">{(student.fullName || "??").substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{student.fullName || "Nouveau Compte"}</h3>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-full text-[10px]">{student.classId}</Badge>
                            <span className="text-xs font-bold text-muted-foreground tracking-widest">{student.matricule}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`font-black rounded-full px-4 border-2 ${student.status === "Actif" ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-amber-200 text-amber-600 bg-amber-50"}`}>
                          {student.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="size-12 rounded-2xl group-hover:text-primary bg-muted/20">
                          <ChevronRight className="size-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

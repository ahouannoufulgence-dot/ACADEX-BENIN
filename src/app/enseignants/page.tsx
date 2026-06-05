
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  UserSquare2, 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  Zap,
  FileDown,
  Users,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { data: teachers, loading } = useCollection(query(collection(db, "teachers"), orderBy("fullName", "asc")))

  const filteredTeachers = useMemo(() => {
    if (!teachers) return []
    return teachers.filter((t: any) => 
      (t.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [teachers, searchTerm])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Corps Enseignant</h1>
            <p className="text-muted-foreground mt-2 font-medium">Pilotage de votre équipe pédagogique réelle.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 bg-white font-black">
              <FileDown className="mr-2 size-5" /> Exporter Liste
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Plus className="mr-2 size-5" /> Nouvel Enseignant
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Professeurs", value: teachers?.length || 0, icon: UserSquare2 },
            { label: "Matières Actives", value: new Set(teachers?.map((t: any) => t.subject)).size, icon: BookOpen },
            { label: "Statut", value: "Audit OK", icon: ShieldCheck },
            { label: "Pointage", value: "Actif", icon: Zap },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-muted rounded-2xl text-primary"><stat.icon className="size-6" /></div>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
          <Input 
            placeholder="Chercher un enseignant..." 
            className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary size-10" /></div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center space-y-6">
               <div className="size-24 bg-muted rounded-full flex items-center justify-center">
                 <Users className="size-12 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black">Aucun enseignant inscrit</h3>
               <p className="text-muted-foreground max-w-sm mx-auto">Les comptes apparaîtront ici dès que les professeurs auront activé leur accès.</p>
            </div>
          ) : (
            <div className="divide-y divide-muted/30">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                   <div className="flex items-center gap-5">
                     <Avatar className="size-14 border-4 border-muted group-hover:border-primary/20 transition-all">
                       <AvatarImage src={`https://picsum.photos/seed/${teacher.id}/200/200`} />
                       <AvatarFallback className="font-black">{(teacher.fullName || "??").substring(0, 2)}</AvatarFallback>
                     </Avatar>
                     <div>
                       <h4 className="font-black text-lg">{teacher.fullName}</h4>
                       <div className="flex items-center gap-3">
                         <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">{teacher.subject}</Badge>
                         <span className="text-xs font-bold text-muted-foreground">ID: {teacher.id}</span>
                       </div>
                     </div>
                   </div>
                   <Button variant="ghost" size="icon" className="size-12 rounded-2xl"><ChevronRight /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Loader2,
  Users,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
  const db = useFirestore()

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const isTeacher = userRole === "Enseignant"
  const isDirector = userRole === "Directeur"

  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const baseCol = collection(db, "students")
    
    // Pour l'enseignant, on filtre par classe sélectionnée
    if (isTeacher && selectedClass) {
      return query(baseCol, where("academicYear", "==", activeYear), where("classId", "==", selectedClass))
    }
    
    // Si enseignant sans sélection, on ne charge rien
    if (isTeacher && !selectedClass) return null

    // Pour le directeur, vue globale totale par défaut (recherche directe)
    return query(baseCol, where("academicYear", "==", activeYear), orderBy("lastName", "asc"))
  }, [db, userRole, selectedClass, activeYear, isTeacher])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
            {isTeacher && !selectedClass ? "Mes Classes" : isDirector ? "Répertoire Élèves" : `Registre ${selectedClass}`}
          </h1>
          {isDirector && (
            <Button asChild className="bg-primary shadow-xl rounded-2xl h-12 md:h-14 px-8 font-black">
              <Link href="/eleves/identifiants"><Plus className="mr-2" /> Distribuer Codes</Link>
            </Button>
          )}
        </div>

        {/* VUE ENSEIGNANT : CARTES DE CLASSES */}
        {isTeacher && !selectedClass && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            {userClasses.sort().map(classId => (
              <Card key={classId} onClick={() => setSelectedClass(classId)} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group border-l-[12px] border-primary">
                <h3 className="text-4xl md:text-6xl font-black mb-4">{classId}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ouvrir le registre de classe</p>
              </Card>
            ))}
          </div>
        )}

        {/* VUE DIRECTEUR (DIRECTE) OU REGISTRE CLASSE ENSEIGNANT */}
        {(isDirector || (isTeacher && selectedClass)) && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4">
              {isTeacher && <Button variant="ghost" onClick={() => setSelectedClass(null)} className="font-black text-primary hover:bg-primary/5 rounded-xl">RETOUR AUX CLASSES</Button>}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input placeholder="Chercher un élève..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm font-bold" />
              </div>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden min-h-[400px]">
              {loadingStudents ? (
                <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin text-primary size-10 mx-auto" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-8 py-6 text-left">Élève</th>
                        <th className="px-8 py-6 text-left">Classe</th>
                        <th className="px-8 py-6 text-center">Statut</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                      {filteredStudents.map((s: any) => (
                        <tr key={s.id} className="hover:bg-muted/5 transition-all">
                          <td className="px-8 py-5">
                            <p className="font-black text-lg uppercase">{s.lastName} {s.firstName}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{s.matricule}</p>
                          </td>
                          <td className="px-8 py-5">
                            <Badge className="bg-primary text-white px-3">{s.classId}</Badge>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <Badge variant="outline" className="font-black border-emerald-100 text-emerald-600 bg-emerald-50">{s.status?.toUpperCase() || 'ACTIF'}</Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button asChild variant="ghost" size="icon" className="size-12 rounded-xl hover:bg-primary hover:text-white"><Link href={`/eleves/${s.id}`}><ChevronRight /></Link></Button>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={4} className="p-20 text-center text-muted-foreground italic font-medium">Aucun profil scellé ne correspond.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

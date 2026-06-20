"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Search, 
  Filter, 
  ChevronRight,
  Medal,
  FileDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useMemo, useState, useEffect } from "react"

export default function RankingPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      const { data } = await supabase.from('students').select('*')
      setStudents(data || [])
      setLoading(false)
    }
    fetchStudents()
  }, [])

  // Dans une version complète, les moyennes seraient pré-calculées
  // Pour le moment, on affiche un état propre sans mocks
  const topStudents = useMemo(() => {
    if (!students || students.length === 0) return []
    // On simule un tri par moyenne (si elle existe dans le profil)
    return [...students].sort((a: any, b: any) => (b.average || 0) - (a.average || 0)).slice(0, 50)
  }, [students])

  const handleExportPDF = () => {
    if (topStudents.length === 0) {
      toast({ title: "Aucune donnée", description: "Le palmarès est vide pour le moment." })
      return
    }
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("ACADEX - PALMARÈS DE L'EXCELLENCE", 105, 20, { align: "center" })

      autoTable(doc, {
        startY: 40,
        head: [['Rang', 'Élève', 'Classe', 'Moyenne Générale']],
        body: topStudents.map((s: any, i) => [i + 1, `${s.last_name} ${s.first_name}`, s.class_id, (s.average || "0.00") + "/20"]),
        headStyles: { fillColor: [20, 83, 45] }
      })

      doc.save("ACADEX_Classement_Elite.pdf")
      toast({ title: "Succès", description: "Le palmarès a été exporté au format PDF." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'exportation PDF.", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Classement Élite</h1>
            <p className="text-muted-foreground mt-2 font-medium">Les meilleurs talents de l'établissement Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <Filter className="mr-2 size-4" /> Filtrer par niveau
            </Button>
            <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <FileDown className="mr-2 size-5" /> Générer Palmarès PDF
            </Button>
          </div>
        </div>

        {topStudents.length === 0 && !loading ? (
          <Card className="p-20 text-center rounded-[3rem] border-4 border-dashed bg-white/50">
            <Trophy className="size-16 text-muted-foreground mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black">Palmarès en attente</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">Le classement sera généré automatiquement dès que les premières moyennes trimestrielles seront validées.</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-3">
              {topStudents.slice(0, 3).map((student: any, index) => (
                <Card key={student.id} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden transform hover:scale-105 transition-all duration-500 ${index === 0 ? 'bg-primary text-white' : 'bg-white'}`}>
                  <CardContent className="p-8 text-center relative">
                    <div className="absolute top-6 right-6">
                      {index === 0 ? <Medal className="size-10 text-amber-400" /> : index === 1 ? <Medal className="size-8 text-slate-300" /> : <Medal className="size-8 text-amber-600" />}
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="size-28 border-4 border-white/20 shadow-2xl">
                        <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} />
                        <AvatarFallback className="text-primary font-black text-2xl"> {student.last_name[0]} </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black">{student.last_name} {student.first_name}</h3>
                        <p className={`text-sm font-bold ${index === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>{student.class_id}</p>
                      </div>
                      <div className="mt-4 space-y-2 w-full">
                        <p className="text-4xl font-black">{student.average || "0.00"}</p>
                        <Badge className={`${index === 0 ? 'bg-white text-primary' : 'bg-primary'} font-black rounded-full px-4`}>
                          RANG : {index + 1}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-8">
                <CardTitle className="text-2xl font-black">Top 50 Acadex</CardTitle>
                <div className="relative w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                  <Input placeholder="Chercher un élève..." className="pl-12 h-12 bg-muted/50 border-none rounded-2xl font-bold" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                        <th className="px-8 py-5 text-left">Rang</th>
                        <th className="px-8 py-5 text-left">Élève</th>
                        <th className="px-8 py-5 text-left">Classe</th>
                        <th className="px-8 py-5 text-right">Moyenne</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {topStudents.map((student: any, i) => (
                        <tr key={student.id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-8 py-6">
                            <span className={`flex items-center justify-center size-10 rounded-2xl font-black text-sm ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-foreground'}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="size-12 shadow-sm border-2 border-white group-hover:border-primary/20 transition-all">
                                <AvatarFallback>{student.last_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-black text-foreground">{student.last_name} {student.first_name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-bold text-muted-foreground">{student.class_id}</td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-lg font-black text-primary">{student.average || "0.00"}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                              <ChevronRight className="size-5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

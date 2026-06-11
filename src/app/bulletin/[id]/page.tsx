
"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  FileDown, 
  ShieldCheck, 
  Printer, 
  Loader2, 
  Award,
  BookOpen,
  Scale,
  ClipboardCheck,
  Zap,
  Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useDoc, useCollection } from "@/firebase"
import { doc, query, collection, where, onSnapshot } from "firebase/firestore"
import { useState, useMemo, useEffect } from "react"
import { generateBulletinPDF, type BulletinData } from "@/lib/bulletin-generator"
import { cn } from "@/lib/utils"

export default function OfficialBulletinPage() {
  const { id } = useParams()
  const router = useRouter()
  const db = useFirestore()
  const [activeTerm, setActiveTerm] = useState("T1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolConfig, setSchoolConfig] = useState<any>(null)

  const studentRef = useMemo(() => doc(db, "students", id as string), [db, id])
  const { data: student, loading: loadingStudent } = useDoc(studentRef)

  const gradesQuery = useMemo(() => {
    if (!student) return null
    return query(collection(db, "grades"), where("studentId", "==", student.matricule))
  }, [db, student])

  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) setSchoolConfig(snap.data())
    })
    return () => unsub()
  }, [db])

  const bulletinData = useMemo(() => {
    if (!student || !grades || !schoolConfig) return null

    const termGrades = grades.filter(g => g.term === activeTerm)
    if (termGrades.length === 0) return null

    const subjectsMap: Record<string, any> = {}
    termGrades.forEach(g => {
      if (!subjectsMap[g.subject]) {
        subjectsMap[g.subject] = { 
          name: g.subject, 
          coef: g.coefficient || 1, 
          int1: undefined, int2: undefined, int3: undefined, 
          dev1: undefined, dev2: undefined
        }
      }
      subjectsMap[g.subject][g.type] = Number(g.value)
    })

    const gradesList = Object.values(subjectsMap).map((s: any) => {
      const ints = [s.int1, s.int2, s.int3].filter(v => v !== undefined)
      const avgInt = ints.length > 0 ? ints.reduce((a, b) => a + b, 0) / ints.length : 0
      
      const pillars = []
      if (ints.length > 0) pillars.push(avgInt)
      if (s.dev1 !== undefined) pillars.push(s.dev1)
      if (s.dev2 !== undefined) pillars.push(s.dev2)
      
      const avg = pillars.length > 0 ? pillars.reduce((a, b) => a + b, 0) / pillars.length : 0
      return {
        subject: s.name,
        coef: s.coef,
        int1: s.int1, int2: s.int2, int3: s.int3,
        dev1: s.dev1, dev2: s.dev2,
        avg: Number(avg.toFixed(2)),
        weighted: Number((avg * s.coef).toFixed(2)),
        rank: 1,
        appreciation: avg >= 16 ? "Excellent" : avg >= 14 ? "Très Bien" : avg >= 12 ? "Bien" : avg >= 10 ? "Passable" : "Insuffisant"
      }
    })

    const totalWeighted = gradesList.reduce((acc, g) => acc + g.weighted, 0)
    const totalCoef = gradesList.reduce((acc, g) => acc + g.coef, 0)
    const generalAvg = totalWeighted / totalCoef

    const getMention = (avg: number) => {
      if (avg >= 16) return 'TRÈS BIEN';
      if (avg >= 14) return 'BIEN';
      if (avg >= 12) return 'ASSEZ BIEN';
      if (avg >= 10) return 'PASSABLE';
      return 'INSUFFISANT';
    }

    return {
      schoolInfo: {
        name: schoolConfig.schoolName || "ACADEX",
        motto: schoolConfig.motto || "Excellence - Travail - Discipline",
        address: schoolConfig.address || "Cotonou, Bénin",
        phone: schoolConfig.phone || "+229 00 00 00 00",
        email: "contact@acadex.bj",
        academicYear: student.academicYear,
        primaryColor: schoolConfig.primaryColor || "#14532D"
      },
      student: {
        id: student.id,
        fullName: `${student.lastName} ${student.firstName}`,
        matricule: student.matricule,
        classId: student.classId,
        dob: student.dob || "---",
        sex: student.gender || "---",
        rank: 1,
        effectif: 30,
        principalTeacher: "M. DJOSSOU"
      },
      term: activeTerm === "T1" ? "1er Trimestre" : activeTerm === "T2" ? "2ème Trimestre" : "3ème Trimestre",
      grades: gradesList,
      discipline: {
        absencesJustified: 0,
        absencesUnjustified: 0,
        delays: 0,
        conductGrade: 18.5
      },
      summary: {
        totalWeighted,
        totalCoef,
        generalAvg,
        mention: getMention(generalAvg),
        decision: generalAvg >= 10 ? "Tableau d'honneur" : "Avertissement"
      }
    } as BulletinData
  }, [student, grades, schoolConfig, activeTerm])

  const handleDownload = async () => {
    if (!bulletinData) return
    setIsGenerating(true)
    await generateBulletinPDF(bulletinData)
    setIsGenerating(false)
  }

  if (loadingStudent || loadingGrades) return (
    <DashboardLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 opacity-20">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Scellage du document...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <Button variant="ghost" onClick={() => router.back()} className="rounded-xl h-10 px-3 -ml-3 hover:bg-primary/5 text-muted-foreground font-bold text-xs uppercase tracking-widest">
               <ChevronLeft className="mr-1 size-4" /> Retour
             </Button>
             <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Bulletin <span className="text-primary italic">Premium</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-white border-2 rounded-2xl h-12 md:h-14 p-1 flex items-center shadow-sm">
                {["T1", "T2", "T3"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setActiveTerm(t)}
                    className={cn(
                      "px-5 h-full rounded-xl font-black text-[10px] md:text-xs transition-all",
                      activeTerm === t ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
             </div>
             <Button onClick={handleDownload} disabled={isGenerating || !bulletinData} className="bg-primary hover:bg-primary/90 h-12 md:h-14 px-8 md:px-12 rounded-2xl font-black text-[10px] md:text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all">
                {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileDown className="mr-2 size-4" />} 
                {isGenerating ? "Génération..." : "Exporter PDF"}
             </Button>
          </div>
        </div>

        {!bulletinData ? (
          <Card className="p-20 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-30 flex flex-col items-center justify-center gap-6">
             <div className="size-20 bg-muted rounded-[2rem] flex items-center justify-center shadow-inner"><Zap className="size-10 text-muted-foreground" /></div>
             <div className="space-y-2">
               <h3 className="text-xl md:text-3xl font-black uppercase">Document Non Scellé</h3>
               <p className="text-xs md:text-lg font-medium max-w-sm mx-auto uppercase tracking-widest">Les notes du {activeTerm} ne sont pas encore complètes pour générer ce bulletin.</p>
             </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 md:gap-10">
            <Card className="lg:col-span-8 bg-white border-none shadow-2xl rounded-[1rem] md:rounded-[3rem] overflow-hidden relative border-t-[12px] border-primary">
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                  <h2 className="text-[120px] font-black rotate-[-35deg] uppercase">{bulletinData.schoolInfo.name}</h2>
               </div>

               <div className="p-6 md:p-14 space-y-10 md:space-y-14 relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8 pb-10 border-b-2 border-muted/50 border-dashed">
                     <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="size-20 md:size-24 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 font-black text-4xl">
                           {bulletinData.schoolInfo.name[0]}
                        </div>
                        <div>
                          <h2 className="font-black text-xl md:text-2xl text-primary uppercase tracking-tight">{bulletinData.schoolInfo.name}</h2>
                          <p className="text-[10px] md:text-xs font-bold text-muted-foreground italic">"{bulletinData.schoolInfo.motto}"</p>
                        </div>
                     </div>
                     <div className="text-center space-y-1">
                        <Badge className="bg-primary/5 text-primary border-primary/20 rounded-full px-5 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2">Enseignement Général</Badge>
                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase">{bulletinData.schoolInfo.address}</p>
                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase">{bulletinData.schoolInfo.phone}</p>
                     </div>
                     <div className="text-center md:text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Année Scolaire</p>
                        <p className="text-xl md:text-3xl font-black text-foreground tabular-nums">{bulletinData.schoolInfo.academicYear}</p>
                        <Badge className="bg-primary text-white font-black px-3 mt-2">{bulletinData.term}</Badge>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 bg-muted/20 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-muted/30">
                     <div className="space-y-4">
                        <div className="flex gap-4">
                           <div className="size-16 md:size-20 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                              <Info className="size-8 text-primary/30" />
                           </div>
                           <div className="space-y-1 min-w-0">
                              <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Élève certifié</p>
                              <h3 className="text-lg md:text-2xl font-black uppercase truncate">{bulletinData.student.fullName}</h3>
                              <p className="text-[10px] md:text-sm font-bold text-primary">{bulletinData.student.matricule}</p>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                           <p className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase mb-1">Classe</p>
                           <p className="text-sm md:text-lg font-black">{bulletinData.student.classId}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                           <p className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase mb-1">Moyenne Gén.</p>
                           <p className="text-sm md:text-lg font-black text-primary">{bulletinData.summary.generalAvg.toFixed(2)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-xs md:text-sm border-separate border-spacing-y-2">
                       <thead>
                          <tr className="text-left bg-primary text-white font-black uppercase text-[8px] md:text-[10px] tracking-widest">
                             <th className="p-4 rounded-l-xl">Matière</th>
                             <th className="p-4 text-center">Coef</th>
                             <th className="p-4 text-center">Moy/20</th>
                             <th className="p-4 text-right rounded-r-xl">Appréciation</th>
                          </tr>
                       </thead>
                       <tbody>
                          {bulletinData.grades.map((g, i) => (
                            <tr key={i} className="bg-[#F8FAFC] hover:bg-muted/30 transition-all group">
                               <td className="p-4 rounded-l-xl border-l-4 border-primary/20 group-hover:border-primary">
                                  <p className="font-black uppercase">{g.subject}</p>
                               </td>
                               <td className="p-4 text-center font-bold text-muted-foreground">{g.coef}</td>
                               <td className="p-4 text-center">
                                  <Badge className={cn("rounded-lg font-black text-xs md:text-base px-3 h-8 md:h-10 min-w-[50px] justify-center", g.avg >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                                     {g.avg.toFixed(2)}
                                  </Badge>
                               </td>
                               <td className="p-4 text-right rounded-r-xl font-bold italic text-muted-foreground/80">{g.appreciation}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 pt-10">
                     <div className="md:col-span-2 space-y-4">
                        <div className="p-6 md:p-8 bg-foreground text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
                           <div className="relative z-10 flex items-center justify-between">
                              <div>
                                 <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Moyenne Générale</p>
                                 <h2 className="text-4xl md:text-6xl font-black text-primary tabular-nums">{bulletinData.summary.generalAvg.toFixed(2)}</h2>
                                 <p className="text-[10px] md:text-lg font-bold text-white/60 mt-2">Mention : {bulletinData.summary.mention}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Rang Global</p>
                                 <h4 className="text-2xl md:text-4xl font-black">{bulletinData.student.rank}<span className="text-sm md:text-xl opacity-40 ml-1">/{bulletinData.student.effectif}</span></h4>
                              </div>
                           </div>
                           <Award className="absolute -bottom-10 -right-10 size-40 md:size-56 text-white/[0.03] group-hover:scale-110 transition-transform duration-1000" />
                        </div>
                     </div>
                     <Card className="p-6 md:p-8 border-2 border-dashed rounded-[2rem] flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-3">
                           <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary"><ShieldCheck className="size-6" /></div>
                           <p className="text-[10px] font-black uppercase tracking-widest">Certification</p>
                        </div>
                        <p className="text-[9px] md:text-xs font-bold text-muted-foreground leading-relaxed">Ce document est scellé numériquement. Scannez le QR Code officiel pour vérifier son authenticité sur le portail ACADEX.</p>
                     </Card>
                  </div>
               </div>
            </Card>

            <div className="lg:col-span-4 space-y-6 md:space-y-8">
               <Card className="p-8 rounded-[2.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                     <h3 className="text-lg md:text-2xl font-black uppercase flex items-center gap-3"><Zap className="text-primary size-5" /> Audit Brain IA</h3>
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/10 italic text-[10px] md:text-sm font-medium leading-relaxed text-white/80">
                        "L'élève maintient une trajectoire d'excellence. La mention {bulletinData.summary.mention} reflète un investissement soutenu."
                     </div>
                     <Button className="w-full h-12 md:h-14 bg-primary rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest">Demander Conseil IA</Button>
                  </div>
                  <ShieldCheck className="absolute -bottom-10 -left-10 size-32 opacity-[0.03]" />
               </Card>

               <Card className="p-8 rounded-[2.5rem] bg-white space-y-8 shadow-sm">
                  <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight flex items-center gap-3"><Scale className="text-primary size-5" /> Vie Scolaire</h3>
                  <div className="space-y-4">
                     {[
                        { label: "Absences Non Justif.", val: `${bulletinData.discipline.absencesUnjustified}H`, color: "text-red-600" },
                        { label: "Retards", val: `${bulletinData.discipline.delays}`, color: "text-amber-600" },
                        { label: "Note de Conduite", val: `${bulletinData.discipline.conductGrade}/20`, color: "text-emerald-600", bold: true }
                     ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-muted/20 rounded-xl border border-muted/50">
                           <span className="text-[9px] md:text-xs font-black uppercase text-muted-foreground">{item.label}</span>
                           <span className={cn("font-black text-sm md:text-lg", item.color)}>{item.val}</span>
                        </div>
                     ))}
                  </div>
               </Card>

               <div className="p-10 border-4 border-dashed rounded-[3rem] text-center opacity-30">
                  <Printer className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Impression laser recommandée</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

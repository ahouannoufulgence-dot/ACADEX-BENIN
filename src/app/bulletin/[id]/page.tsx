"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, FileDown, ShieldCheck, Printer, Loader2, 
  Award, Scale, Zap, Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useState, useMemo, useEffect } from "react"
import { generateBulletinPDF, type BulletinData } from "@/lib/bulletin-generator"
import { cn } from "@/lib/utils"

export default function OfficialBulletinPage() {
  const { id } = useParams()
  const router = useRouter()
  const [activeTerm, setActiveTerm] = useState("T1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [allClassGrades, setAllClassGrades] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)

      // 1. Charger l'élève
      const { data: studentData } = await supabase.from('students').select('*').eq('id', id).single()
      if (!studentData) { setLoading(false); return }
      setStudent(studentData)

      const activeYear = studentData.academic_year || localStorage.getItem('acadex_active_year') || "2026-2027"
      const matricule = studentData.matricule
      const classId = studentData.class_id

      // 2. Charger config école
      const { data: config } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
      if (config) setSchoolConfig(config)

      // 3. Charger notes de l'élève
      const { data: gradesData } = await supabase.from('grades').select('*')
        .eq('student_matricule', matricule)
        .eq('academic_year', activeYear)
      setGrades(gradesData || [])

      // 4. Charger tous les élèves de la classe (pour le rang)
      const { data: classMates } = await supabase.from('students').select('matricule')
        .eq('class_id', classId)
        .eq('academic_year', activeYear)
      setClassStudents(classMates || [])

      // 5. Charger toutes les notes de la classe (pour le rang)
      if (classMates && classMates.length > 0) {
        const matricules = classMates.map((s: any) => s.matricule)
        const { data: classGradesData } = await supabase.from('grades').select('*')
          .eq('academic_year', activeYear)
          .in('student_matricule', matricules)
        setAllClassGrades(classGradesData || [])
      }

      // 6. Charger absences
      const { data: absData } = await supabase.from('absences').select('*')
        .eq('student_matricule', matricule)
        .eq('academic_year', activeYear)
      setAbsences(absData || [])

      // 7. Charger sanctions
      const { data: sanData } = await supabase.from('sanctions').select('*')
        .eq('student_matricule', matricule)
        .eq('academic_year', activeYear)
      setSanctions(sanData || [])

      setLoading(false)
    }
    fetchAll()
  }, [id])

  // Calcul du rang dans la classe
  const rankData = useMemo(() => {
    if (!student || allClassGrades.length === 0) return { rank: 1, effectif: classStudents.length || 1 }

    const termGradesAll = allClassGrades.filter(g => g.term === activeTerm)
    const studentAverages: Record<string, number> = {}

    const matricules = [...new Set(termGradesAll.map((g: any) => g.student_matricule))]
    matricules.forEach(mat => {
      const sg = termGradesAll.filter((g: any) => g.student_matricule === mat)
      const subjects: Record<string, any> = {}
      sg.forEach((g: any) => {
        if (!subjects[g.subject]) subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 1 }
        if (g.type?.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
        if (g.type?.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
      })
      let totalW = 0, totalC = 0
      Object.values(subjects).forEach((s: any) => {
        const avgInt = s.ints.length > 0 ? s.ints.reduce((a: number, b: number) => a + b, 0) / s.ints.length : null
        const blocks = [...(avgInt !== null ? [avgInt] : []), ...s.devs]
        if (blocks.length > 0) {
          const avg = blocks.reduce((a: number, b: number) => a + b, 0) / blocks.length
          totalW += avg * s.coef
          totalC += s.coef
        }
      })
      studentAverages[mat as string] = totalC > 0 ? totalW / totalC : 0
    })

    const sorted = Object.entries(studentAverages).sort(([, a], [, b]) => b - a)
    const rank = sorted.findIndex(([mat]) => mat === student.matricule) + 1
    return { rank: rank > 0 ? rank : 1, effectif: classStudents.length || sorted.length }
  }, [student, allClassGrades, classStudents, activeTerm])

  // Stats discipline depuis vraies données
  const disciplineStats = useMemo(() => {
    const absNonJustif = absences.filter(a => a.statut === "Non justifiée").length
    const absJustif = absences.filter(a => a.statut === "Justifiée").length
    const retards = absences.filter(a => a.type === "Retard").length
    const totalPointsRetires = sanctions.reduce((acc, s) => acc + (Number(s.points_retranches) || 0), 0)
    const noteConduite = Math.max(0, Math.min(20, 20 - totalPointsRetires))
    return { absNonJustif, absJustif, retards, noteConduite }
  }, [absences, sanctions])

  const bulletinData = useMemo(() => {
    if (!student || !grades || !schoolConfig) return null

    const activeYear = student.academic_year || localStorage.getItem('acadex_active_year') || "2026-2027"
    const termGrades = grades.filter(g => g.term === activeTerm)
    if (termGrades.length === 0) return null

    const subjectsMap: Record<string, any> = {}
    termGrades.forEach(g => {
      if (!subjectsMap[g.subject]) {
        subjectsMap[g.subject] = { name: g.subject, coef: Number(g.coefficient) || 1, int1: undefined, int2: undefined, int3: undefined, dev1: undefined, dev2: undefined }
      }
      subjectsMap[g.subject][g.type] = Number(g.value)
    })

    const gradesList = Object.values(subjectsMap).map((s: any) => {
      const ints = [s.int1, s.int2, s.int3].filter(v => v !== undefined)
      const avgInt = ints.length > 0 ? ints.reduce((a: number, b: number) => a + b, 0) / ints.length : null
      const pillars = [...(avgInt !== null ? [avgInt] : []), ...(s.dev1 !== undefined ? [s.dev1] : []), ...(s.dev2 !== undefined ? [s.dev2] : [])]
      const avg = pillars.length > 0 ? pillars.reduce((a: number, b: number) => a + b, 0) / pillars.length : 0
      return {
        subject: s.name, coef: s.coef,
        int1: s.int1, int2: s.int2, int3: s.int3, dev1: s.dev1, dev2: s.dev2,
        avg: Number(avg.toFixed(2)),
        weighted: Number((avg * s.coef).toFixed(2)),
        rank: 1,
        appreciation: avg >= 16 ? "Excellent" : avg >= 14 ? "Très Bien" : avg >= 12 ? "Bien" : avg >= 10 ? "Passable" : "Insuffisant"
      }
    })

    let totalWeighted = gradesList.reduce((acc, g) => acc + g.weighted, 0)
    let totalCoef = gradesList.reduce((acc, g) => acc + g.coef, 0)
    totalWeighted += disciplineStats.noteConduite * 1
    totalCoef += 1
    const generalAvg = totalCoef > 0 ? totalWeighted / totalCoef : 0

    const getMention = (avg: number) => {
      if (avg >= 16) return 'TRÈS BIEN'
      if (avg >= 14) return 'BIEN'
      if (avg >= 12) return 'ASSEZ BIEN'
      if (avg >= 10) return 'PASSABLE'
      return 'INSUFFISANT'
    }

    return {
      schoolInfo: {
        name: schoolConfig.school_name || "ACADEX",
        motto: schoolConfig.motto || "Excellence - Travail - Discipline",
        address: schoolConfig.address || "Cotonou, Bénin",
        phone: schoolConfig.phone || "+229 00 00 00 00",
        email: schoolConfig.email || "",
        academicYear: activeYear,
        primaryColor: schoolConfig.primary_color || "#14532D"
      },
      student: {
        id: student.id,
        fullName: `${student.last_name} ${student.first_name}`,
        matricule: student.matricule,
        classId: student.class_id,
        dob: student.dob || "---",
        sex: student.gender || "---",
        rank: rankData.rank,
        effectif: rankData.effectif,
        principalTeacher: schoolConfig.principal_teacher || "---"
      },
      term: activeTerm === "T1" ? "1er Trimestre" : activeTerm === "T2" ? "2ème Trimestre" : "3ème Trimestre",
      grades: gradesList,
      discipline: {
        absencesJustified: disciplineStats.absJustif,
        absencesUnjustified: disciplineStats.absNonJustif,
        delays: disciplineStats.retards,
        conductGrade: disciplineStats.noteConduite
      },
      summary: {
        totalWeighted,
        totalCoef,
        generalAvg,
        mention: getMention(generalAvg),
        decision: generalAvg >= 10 ? "Admis" : "Avertissement"
      }
    } as BulletinData
  }, [student, grades, schoolConfig, activeTerm, rankData, disciplineStats])

  const handleDownload = async () => {
    if (!bulletinData) return
    setIsGenerating(true)
    await generateBulletinPDF(bulletinData)
    setIsGenerating(false)
  }

  if (loading) return (
    <DashboardLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 opacity-20">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Chargement du bulletin...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <Button variant="ghost" onClick={() => router.back()} className="rounded-xl h-10 px-3 -ml-3 hover:bg-primary/5 text-muted-foreground font-bold text-xs uppercase tracking-widest">
              <ChevronLeft className="mr-1 size-4" /> Retour
            </Button>
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Bulletin <span className="text-primary italic">Officiel</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border-2 rounded-2xl h-12 md:h-14 p-1 flex items-center shadow-sm">
              {["T1", "T2", "T3"].map(t => (
                <button key={t} onClick={() => setActiveTerm(t)}
                  className={cn("px-5 h-full rounded-xl font-black text-[10px] md:text-xs transition-all",
                    activeTerm === t ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted/50")}>
                  {t}
                </button>
              ))}
            </div>
            <Button onClick={handleDownload} disabled={isGenerating || !bulletinData}
              className="bg-primary hover:bg-primary/90 h-12 md:h-14 px-8 md:px-12 rounded-2xl font-black text-[10px] md:text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all">
              {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileDown className="mr-2 size-4" />}
              {isGenerating ? "Génération..." : "Exporter PDF"}
            </Button>
          </div>
        </div>

        {!bulletinData ? (
          <Card className="p-20 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-30 flex flex-col items-center justify-center gap-6">
            <div className="size-20 bg-muted rounded-[2rem] flex items-center justify-center shadow-inner">
              <Zap className="size-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-3xl font-black uppercase">Aucune note pour ce trimestre</h3>
              <p className="text-xs font-medium max-w-sm mx-auto uppercase tracking-widest text-muted-foreground">
                Les notes du {activeTerm} ne sont pas encore saisies pour cet élève.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 md:gap-10">
            
            {/* Bulletin principal */}
            <Card className="lg:col-span-8 bg-white border-none shadow-2xl rounded-[1rem] md:rounded-[3rem] overflow-hidden relative border-t-[12px] border-primary">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                <h2 className="text-[120px] font-black rotate-[-35deg] uppercase">{bulletinData.schoolInfo.name}</h2>
              </div>

              <div className="p-6 md:p-14 space-y-10 md:space-y-14 relative z-10">
                
                {/* En-tête école */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-10 border-b-2 border-muted/50 border-dashed">
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="size-20 md:size-24 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl font-black text-4xl">
                      {bulletinData.schoolInfo.name[0]}
                    </div>
                    <div>
                      <h2 className="font-black text-xl md:text-2xl text-primary uppercase">{bulletinData.schoolInfo.name}</h2>
                      <p className="text-[10px] font-bold text-muted-foreground italic">"{bulletinData.schoolInfo.motto}"</p>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{bulletinData.schoolInfo.address}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{bulletinData.schoolInfo.phone}</p>
                    {bulletinData.schoolInfo.email && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{bulletinData.schoolInfo.email}</p>
                    )}
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Année Scolaire</p>
                    <p className="text-xl md:text-3xl font-black tabular-nums">{bulletinData.schoolInfo.academicYear}</p>
                    <Badge className="bg-primary text-white font-black px-3 mt-2">{bulletinData.term}</Badge>
                  </div>
                </div>

                {/* Infos élève */}
                <div className="grid md:grid-cols-2 gap-6 bg-muted/20 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-muted/30">
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <div className="size-16 md:size-20 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                        <Info className="size-8 text-primary/30" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Élève</p>
                        <h3 className="text-lg md:text-2xl font-black uppercase truncate">{bulletinData.student.fullName}</h3>
                        <p className="text-[10px] font-bold text-primary">{bulletinData.student.matricule}</p>
                        {bulletinData.student.dob !== "---" && (
                          <p className="text-[9px] font-bold text-muted-foreground">Né(e) le : {bulletinData.student.dob}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                      <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Classe</p>
                      <p className="text-sm md:text-lg font-black">{bulletinData.student.classId}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                      <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Effectif</p>
                      <p className="text-sm md:text-lg font-black">{bulletinData.student.effectif} élèves</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                      <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Rang</p>
                      <p className="text-sm md:text-lg font-black text-primary">{bulletinData.student.rank}/{bulletinData.student.effectif}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-muted">
                      <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Prof. Principal</p>
                      <p className="text-xs font-black truncate">{bulletinData.student.principalTeacher}</p>
                    </div>
                  </div>
                </div>

                {/* Tableau des notes */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-xs md:text-sm border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left bg-primary text-white font-black uppercase text-[8px] md:text-[10px] tracking-widest">
                        <th className="p-4 rounded-l-xl">Matière</th>
                        <th className="p-4 text-center">Coef</th>
                        <th className="p-4 text-center">INT 1</th>
                        <th className="p-4 text-center">INT 2</th>
                        <th className="p-4 text-center">DEV 1</th>
                        <th className="p-4 text-center">DEV 2</th>
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
                          <td className="p-4 text-center font-bold">{g.int1 !== undefined ? Number(g.int1).toFixed(2) : "--"}</td>
                          <td className="p-4 text-center font-bold">{g.int2 !== undefined ? Number(g.int2).toFixed(2) : "--"}</td>
                          <td className="p-4 text-center font-bold">{g.dev1 !== undefined ? Number(g.dev1).toFixed(2) : "--"}</td>
                          <td className="p-4 text-center font-bold">{g.dev2 !== undefined ? Number(g.dev2).toFixed(2) : "--"}</td>
                          <td className="p-4 text-center">
                            <Badge className={cn("rounded-lg font-black text-xs px-3 h-8 min-w-[50px] justify-center",
                              g.avg >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                              {g.avg.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="p-4 text-right rounded-r-xl font-bold italic text-muted-foreground/80">{g.appreciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Résumé */}
                <div className="grid md:grid-cols-3 gap-6 pt-6">
                  <div className="md:col-span-2">
                    <div className="p-6 md:p-8 bg-foreground text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Moyenne Générale</p>
                          <h2 className="text-4xl md:text-6xl font-black text-primary tabular-nums">
                            {bulletinData.summary.generalAvg.toFixed(2)}
                          </h2>
                          <p className="text-[10px] md:text-lg font-bold text-white/60 mt-2">
                            Mention : {bulletinData.summary.mention}
                          </p>
                          <p className="text-[8px] font-black uppercase text-white/30 mt-1">
                            Décision : {bulletinData.summary.decision}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Rang</p>
                          <h4 className="text-2xl md:text-4xl font-black">
                            {bulletinData.student.rank}
                            <span className="text-sm opacity-40 ml-1">/{bulletinData.student.effectif}</span>
                          </h4>
                          <p className="text-[7px] font-bold text-white/30 uppercase mt-1">dans la classe</p>
                        </div>
                      </div>
                      <Award className="absolute -bottom-10 -right-10 size-40 text-white/[0.03]" />
                    </div>
                  </div>
                  <Card className="p-6 border-2 border-dashed rounded-[2rem] flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                        <ShieldCheck className="size-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Certification</p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground leading-relaxed">
                      Ce bulletin est généré automatiquement depuis les données certifiées ACADEX pour l'année {bulletinData.schoolInfo.academicYear}.
                    </p>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Panneau droit */}
            <div className="lg:col-span-4 space-y-6 md:space-y-8">
              
              {/* Vie scolaire — vraies données */}
              <Card className="p-8 rounded-[2.5rem] bg-white space-y-6 shadow-sm">
                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Scale className="text-primary size-5" /> Vie Scolaire
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Absences Non Justif.", val: `${bulletinData.discipline.absencesUnjustified}`, color: "text-red-600" },
                    { label: "Absences Justifiées", val: `${bulletinData.discipline.absencesJustified}`, color: "text-emerald-600" },
                    { label: "Retards", val: `${bulletinData.discipline.delays}`, color: "text-amber-600" },
                    { label: "Note de Conduite", val: `${bulletinData.discipline.conductGrade.toFixed(1)}/20`, color: bulletinData.discipline.conductGrade >= 14 ? "text-emerald-600" : bulletinData.discipline.conductGrade >= 10 ? "text-amber-600" : "text-red-600" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-muted/20 rounded-xl border border-muted/50">
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{item.label}</span>
                      <span className={cn("font-black text-sm md:text-lg", item.color)}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Audit IA */}
              <Card className="p-8 rounded-[2.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <h3 className="text-lg font-black uppercase flex items-center gap-3">
                    <Zap className="text-primary size-5" /> Audit Brain IA
                  </h3>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 italic text-[10px] md:text-sm font-medium leading-relaxed text-white/80">
                    "Moyenne de {bulletinData.summary.generalAvg.toFixed(2)}/20 — Mention {bulletinData.summary.mention}. 
                    Rang {bulletinData.student.rank}/{bulletinData.student.effectif} dans la classe {bulletinData.student.classId}."
                  </div>
                  <Button className="w-full h-12 bg-primary rounded-xl font-black text-[10px] uppercase tracking-widest"
                    onClick={() => router.push('/assistant')}>
                    Demander Conseil IA
                  </Button>
                </div>
                <ShieldCheck className="absolute -bottom-10 -left-10 size-32 opacity-[0.03]" />
              </Card>

              {/* Impression */}
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
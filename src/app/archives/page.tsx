"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Archive, 
  History, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertTriangle, 
  BarChart3,
  Loader2,
  Lock,
  ShieldAlert,
  ArrowLeftRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ComparateurAnnees({ archivedYears }: { archivedYears: string[] }) {
  const [yearA, setYearA] = useState(archivedYears[0] || "")
  const [yearB, setYearB] = useState(archivedYears[1] || "")
  const [dataA, setDataA] = useState<any>(null)
  const [dataB, setDataB] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchYearData = async (year: string) => {
    const [studRes, gradesRes, payRes] = await Promise.all([
      supabase.from('students').select('*').eq('academic_year', year).eq('status', 'Actif'),
      supabase.from('grades').select('*').eq('academic_year', year),
      supabase.from('payments').select('*').eq('academic_year', year)
    ])
    const students = studRes.data || []
    const grades = gradesRes.data || []
    const payments = payRes.data || []

    // Calcul moyenne générale
    const studentAvgs = students.map((s: any) => {
      const sGrades = grades.filter((g: any) => g.student_matricule === (s.student_matricule || s.matricule))
      const subjects: Record<string, any> = {}
      sGrades.forEach((g: any) => {
        if (!subjects[g.subject]) subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 2 }
        if (g.type?.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
        if (g.type?.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
      })
      let totalW = 0, totalC = 0
      Object.values(subjects).forEach((sub: any) => {
        const avgInt = sub.ints.length ? sub.ints.reduce((a: number, b: number) => a + b, 0) / sub.ints.length : null
        const blocks = [...(avgInt !== null ? [avgInt] : []), ...sub.devs]
        if (blocks.length) { totalW += (blocks.reduce((a: number, b: number) => a + b, 0) / blocks.length) * sub.coef; totalC += sub.coef }
      })
      return totalC > 0 ? totalW / totalC : 0
    })

    const avg = studentAvgs.length ? studentAvgs.reduce((a: number, b: number) => a + b, 0) / studentAvgs.length : 0
    const successRate = studentAvgs.length ? (studentAvgs.filter((a: number) => a >= 10).length / studentAvgs.length) * 100 : 0
    const totalRevenue = payments.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0)

    return { year, effectif: students.length, avg, successRate, totalRevenue, gradesCount: grades.length }
  }

  const handleCompare = async () => {
    if (!yearA || !yearB || yearA === yearB) {
      toast({ title: "Choisir deux années différentes", variant: "destructive" })
      return
    }
    setLoading(true)
    const [a, b] = await Promise.all([fetchYearData(yearA), fetchYearData(yearB)])
    setDataA(a)
    setDataB(b)
    setLoading(false)
  }

  const diff = (a: number, b: number) => {
    const d = a - b
    return { value: Math.abs(d).toFixed(2), up: d > 0, neutral: d === 0 }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-8 rounded-[1.8rem] bg-white border-none shadow-sm">
        <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Choisir les années à comparer</p>
        <div className="flex items-center gap-3 md:gap-6">
          <select value={yearA} onChange={e => setYearA(e.target.value)}
            className="flex-1 h-11 md:h-14 rounded-xl border-2 border-primary/20 font-black text-sm px-4 bg-white focus:outline-none focus:border-primary">
            {archivedYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <ArrowLeftRight className="size-4 text-primary" />
          </div>
          <select value={yearB} onChange={e => setYearB(e.target.value)}
            className="flex-1 h-11 md:h-14 rounded-xl border-2 border-primary/20 font-black text-sm px-4 bg-white focus:outline-none focus:border-primary">
            {archivedYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={handleCompare} disabled={loading} className="h-11 md:h-14 px-6 md:px-10 rounded-xl bg-primary font-black text-xs md:text-sm shadow-lg active:scale-95">
            {loading ? <Loader2 className="animate-spin size-4" /> : "Comparer"}
          </Button>
        </div>
      </Card>

      {dataA && dataB && (
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-primary text-white rounded-2xl text-center">
              <p className="font-black text-lg md:text-2xl">{dataA.year}</p>
              <p className="text-[8px] font-bold uppercase opacity-60">Année A</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-2xl text-center flex items-center justify-center">
              <p className="font-black text-xs uppercase text-muted-foreground">Différence</p>
            </div>
            <div className="p-4 bg-foreground text-white rounded-2xl text-center">
              <p className="font-black text-lg md:text-2xl">{dataB.year}</p>
              <p className="text-[8px] font-bold uppercase opacity-60">Année B</p>
            </div>
          </div>

          {/* Comparaisons */}
          {[
            { label: "Effectif total", a: dataA.effectif, b: dataB.effectif, suffix: " élèves", format: (v: number) => v.toString() },
            { label: "Moyenne générale", a: dataA.avg, b: dataB.avg, suffix: "/20", format: (v: number) => v.toFixed(2) },
            { label: "Taux de réussite", a: dataA.successRate, b: dataB.successRate, suffix: "%", format: (v: number) => v.toFixed(1) },
            { label: "Notes saisies", a: dataA.gradesCount, b: dataB.gradesCount, suffix: "", format: (v: number) => v.toString() },
            { label: "Recettes totales", a: dataA.totalRevenue, b: dataB.totalRevenue, suffix: " F", format: (v: number) => v.toLocaleString() },
          ].map((row, i) => {
            const d = diff(row.a, row.b)
            return (
              <Card key={i} className="p-4 md:p-6 rounded-[1.5rem] border-none shadow-sm bg-white">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">{row.label}</p>
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="text-center">
                    <p className="text-xl md:text-3xl font-black text-primary">{row.format(row.a)}<span className="text-xs opacity-40">{row.suffix}</span></p>
                  </div>
                  <div className="text-center">
                    {d.neutral ? (
                      <Badge className="bg-muted text-muted-foreground font-black text-[9px]">Identique</Badge>
                    ) : (
                      <Badge className={cn("font-black text-[9px]", d.up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {d.up ? "▲" : "▼"} {d.value}{row.suffix}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-3xl font-black text-foreground">{row.format(row.b)}<span className="text-xs opacity-40">{row.suffix}</span></p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!dataA && !dataB && (
        <Card className="p-16 text-center rounded-[2rem] border-4 border-dashed bg-white/50 opacity-40 space-y-4">
          <BarChart3 className="size-12 mx-auto text-muted-foreground" />
          <p className="font-black uppercase text-muted-foreground text-sm">Choisir deux années et cliquer Comparer</p>
        </Card>
      )}
    </div>
  )
}

export default function AcademicYearsPage() {
  const [activeTab, setActiveTab] = useState("annees")
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const [activeYear, setActiveYear] = useState("")

  const fetchConfig = async () => {
    const { data, error } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
    if (error) {
      toast({ title: "Erreur de chargement", description: "Impossible de récupérer la configuration de l'école.", variant: "destructive" })
      return
    }
    if (data) setSchoolConfig(data)
  }

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    fetchConfig()
  }, [])

  const handleCloseYear = async () => {
    if (!schoolConfig) return
    setLoading(true)
    try {
      const currentYear = schoolConfig.academic_year
      const parts = currentYear?.split('-').map(Number)

      if (!parts || parts.length !== 2 || parts.some((n: number) => isNaN(n))) {
        throw new Error("Format d'année académique invalide")
      }

      const [start, end] = parts
      const nextYear = `${start + 1}-${end + 1}`
      const currentArchives = Array.isArray(schoolConfig.academic_years) ? schoolConfig.academic_years : [currentYear]
      const newAvailableYears = currentArchives.includes(nextYear) ? currentArchives : [...currentArchives, nextYear]

      const { error } = await supabase.from('school_settings').update({
        academic_years: newAvailableYears,
        academic_year: nextYear,
      }).eq('id', 'main_config')

      if (error) throw error

      localStorage.setItem('acadex_active_year', nextYear)
      toast({ 
        title: "Année Clôturée", 
        description: `L'année ${currentYear} est désormais scellée dans l'histoire.` 
      })
      window.location.reload()
    } catch (e: any) {
      toast({ title: "Erreur de scellement", description: e?.message || "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchYear = async (year: string) => {
    if (year === activeYear) return
    setSwitching(year)
    try {
      localStorage.setItem('acadex_active_year', year)
      toast({ 
        title: "Année active changée", 
        description: `Vous consultez désormais l'année ${year}.` 
      })
      window.location.reload()
    } finally {
      setSwitching(null)
    }
  }

  const archivedYears: string[] = Array.isArray(schoolConfig?.academic_years)
    ? schoolConfig.academic_years
    : (schoolConfig?.academic_year ? [schoolConfig.academic_year] : [])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight uppercase">
              Univers <span className="text-primary italic">Temporels</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <History className="size-3 md:size-4 text-primary" />
              <span>Multi-Années Certifié Acadex</span>
            </div>
          </div>
          <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/20">
             <Lock className="size-3.5 md:size-6" /> ARCHIVES SCELLÉES
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.5rem] md:rounded-[2.5rem] h-13 md:h-20 p-1.5 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "annees", label: "Contrôle", icon: Calendar },
              { id: "comparaison", label: "Comparateur", icon: BarChart3 },
              { id: "audit", label: "Navigation", icon: ArrowLeftRight },
            ].map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-xl md:rounded-[2rem] font-black px-6 md:px-12 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2 shrink-0">
                <t.icon className="size-3.5 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="annees" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
             <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                <Card className="lg:col-span-8 p-7 md:p-20 rounded-[2.2rem] md:rounded-[4rem] bg-white border-none shadow-sm flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Zap className="size-64" /></div>
                   <div className="flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 relative z-10">
                      <div className="size-20 md:size-32 bg-primary/10 rounded-[2.2rem] md:rounded-[3rem] flex items-center justify-center text-primary shadow-inner">
                         <ShieldAlert className="size-8 md:size-16 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                         <h3 className="text-xl md:text-5xl font-black tracking-tight uppercase">Sceller l'Année {activeYear}</h3>
                         <p className="text-[9px] md:text-xl text-muted-foreground max-w-md mx-auto font-medium leading-relaxed uppercase tracking-widest opacity-60">
                           Action irréversible • Gel des notes et finances.
                         </p>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={loading} className="w-full md:w-auto bg-primary hover:bg-primary/90 rounded-2xl md:rounded-3xl h-14 md:h-24 px-10 md:px-16 font-black text-xs md:text-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                             {loading ? <Loader2 className="animate-spin mr-3 size-5 md:size-8" /> : <ShieldCheck className="mr-3 size-5 md:size-8" />}
                             Clôturer & Ouvrir la Suivante
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.2rem] md:rounded-[3.5rem] border-none shadow-2xl w-[95%] p-0 overflow-hidden">
                           <div className="p-6 md:p-10 bg-destructive text-white">
                             <AlertDialogTitle className="text-lg md:text-3xl font-black flex items-center gap-3">
                               <AlertTriangle className="size-6 md:size-10" /> Confirmation Critique
                             </AlertDialogTitle>
                             <p className="text-white/60 text-[8px] md:text-sm font-bold uppercase tracking-widest mt-1">Protocole de Scellement Acadex</p>
                           </div>
                           <div className="p-6 md:p-10 space-y-6 bg-white">
                             <AlertDialogDescription className="text-xs md:text-xl font-medium leading-relaxed text-foreground/80">
                               Êtes-vous certain de vouloir sceller définitivement l'année <b>{activeYear}</b> ? 
                               <br /><br />
                               Toutes les données seront verrouillées. Une nouvelle session sera initialisée.
                             </AlertDialogDescription>
                           </div>
                           <div className="p-6 md:p-10 bg-muted/20 flex gap-3">
                             <AlertDialogCancel className="flex-1 rounded-xl md:rounded-2xl h-12 md:h-16 font-bold border-2 text-[10px] md:text-sm">Annuler</AlertDialogCancel>
                             <AlertDialogAction onClick={handleCloseYear} className="flex-2 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl h-12 md:h-16 px-10 md:px-14 font-black text-[10px] md:text-lg">
                               Valider le Scellement
                             </AlertDialogAction>
                           </div>
                        </AlertDialogContent>
                      </AlertDialog>
                   </div>
                </Card>

                <div className="lg:col-span-4 space-y-6 md:space-y-10">
                   <Card className="p-6 md:p-12 rounded-[2.2rem] md:rounded-[3.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden group border-none h-fit">
                      <h4 className="text-base md:text-3xl font-black mb-8 md:mb-14 flex items-center gap-3 md:gap-5 uppercase tracking-tight">
                        <Clock className="text-primary size-4 md:size-8" /> Vault Temporel
                      </h4>
                      <div className="space-y-3 md:space-y-5 relative z-10">
                         {archivedYears.map((year: string) => (
                           <div key={year} className={cn(
                             "p-4 md:p-7 rounded-2xl md:rounded-[2rem] border-2 flex items-center justify-between transition-all", 
                             year === activeYear ? "bg-primary/20 border-primary shadow-lg scale-[1.02]" : "bg-white/5 border-white/10 opacity-60"
                           )}>
                              <span className="font-black text-xs md:text-2xl tabular-nums">{year}</span>
                              {year === activeYear ? <Badge className="bg-primary text-[7px] md:text-xs font-black px-3 py-1 rounded-full">ACTIVE</Badge> : <Badge variant="outline" className="text-white/40 border-white/20 text-[7px] md:text-xs font-bold px-3 py-1 rounded-full uppercase">SCELLÉE</Badge>}
                           </div>
                         ))}
                      </div>
                      <Archive className="absolute -bottom-10 -right-10 size-40 md:size-72 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                   </Card>

                   <Card className="p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white border-none shadow-sm group">
                      <div className="flex items-center gap-4 text-primary mb-5 md:mb-8">
                        <div className="size-8 md:size-12 bg-primary/5 rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform"><CheckCircle2 className="size-4 md:size-7" /></div>
                        <h4 className="font-black uppercase text-[8px] md:text-sm tracking-[0.2em]">Intégrité Acadex</h4>
                      </div>
                      <p className="text-[9px] md:text-sm font-medium text-muted-foreground leading-relaxed italic opacity-80">
                        "L'archivage multi-univers garantit que vos bulletins de 2026 restent inaltérables, même en 2035."
                      </p>
                   </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="comparaison" className="animate-in zoom-in-95 space-y-6 md:space-y-10">
            <ComparateurAnnees archivedYears={archivedYears} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 animate-in slide-in-from-bottom-4">
            <Card className="p-7 md:p-14 rounded-[2.2rem] md:rounded-[3.5rem] bg-white border-none shadow-sm">
              <div className="mb-8 md:mb-12 space-y-2">
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">Basculer d'univers</h3>
                <p className="text-muted-foreground text-xs md:text-base font-medium">
                  Sélectionnez une année scellée pour consulter ses données. L'application rechargera sur cet univers temporel.
                </p>
              </div>

              {archivedYears.length === 0 && (
                <p className="text-center text-muted-foreground py-10 font-medium">Aucune année archivée pour le moment.</p>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {archivedYears.map((year: string) => {
                  const isActive = year === activeYear
                  const isSwitching = switching === year
                  return (
                    <button
                      key={year}
                      disabled={isActive || switching !== null}
                      onClick={() => handleSwitchYear(year)}
                      className={cn(
                        "p-5 md:p-8 rounded-2xl md:rounded-[2rem] border-2 flex items-center justify-between transition-all text-left",
                        isActive 
                          ? "bg-primary/10 border-primary shadow-md cursor-default" 
                          : "bg-muted/10 border-transparent hover:border-primary/30 hover:bg-white cursor-pointer active:scale-95"
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn(
                          "size-9 md:size-12 rounded-xl flex items-center justify-center shrink-0",
                          isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {isSwitching ? <Loader2 className="size-4 md:size-5 animate-spin" /> : <Calendar className="size-4 md:size-5" />}
                        </div>
                        <div>
                          <p className="font-black text-sm md:text-xl tabular-nums">{year}</p>
                          <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {isActive ? "Univers actif" : "Cliquer pour basculer"}
                          </p>
                        </div>
                      </div>
                      {isActive && <Badge className="bg-primary text-white text-[7px] md:text-xs font-black px-3 py-1 rounded-full shrink-0">ACTIVE</Badge>}
                    </button>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

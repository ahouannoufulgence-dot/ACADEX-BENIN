"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Loader2, ShieldCheck, Download } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function ClassRegisterPage() {
  const { classId } = useParams()
  const cls = decodeURIComponent(classId as string)
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [subject, setSubject] = useState("")
  const [trimestre, setTrimestre] = useState("T1")
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [coefficient, setCoefficient] = useState(2)

  useEffect(() => {
    const year = localStorage.getItem("acadex_active_year") || "2026-2027"
    const sub = localStorage.getItem("acadex_user_subject") || ""
    setActiveYear(year)
    setSubject(sub)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !cls) return
    const fetch = async () => {
      setLoading(true)
      const [studRes, gradeRes] = await Promise.all([
        supabase.from("students").select("*").eq("class_id", cls).eq("academic_year", activeYear).eq("status", "Actif").order("last_name"),
        supabase.from("grades").select("*").eq("class_id", cls).eq("term", trimestre).eq("academic_year", activeYear)
      ])
      setStudents(studRes.data || [])
      setGrades(gradeRes.data || [])
      if ((gradeRes.data || []).length > 0) setCoefficient(gradeRes.data![0].coefficient || 2)
      setLoading(false)
    }
    fetch()
  }, [mounted, cls, activeYear, trimestre])

  const register = useMemo(() => {
    return students.map(s => {
      const sg = grades.filter(g => g.student_matricule === (s.student_matricule || s.matricule) && g.subject === subject)
      const get = (type: string) => sg.find(g => g.type === type)?.value ?? null
      const i1 = get("int1"), i2 = get("int2"), i3 = get("int3")
      const d1 = get("dev1"), d2 = get("dev2")
      const interros = [i1, i2, i3].filter(v => v !== null) as number[]
      const avgInt = interros.length ? interros.reduce((a, b) => a + b, 0) / interros.length : null
      const blocks = [...(avgInt !== null ? [avgInt] : []), ...(d1 !== null ? [d1] : []), ...(d2 !== null ? [d2] : [])]
      const moy = blocks.length ? blocks.reduce((a, b) => a + b, 0) / blocks.length : null
      const moyCoef = moy !== null ? moy * coefficient : null
      return { ...s, i1, i2, i3, d1, d2, moy, moyCoef }
    })
  }, [students, grades, subject, coefficient])

  const classAvg = useMemo(() => {
    const avgs = register.map(r => r.moy).filter(v => v !== null) as number[]
    return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null
  }, [register])

  const maxAvg = useMemo(() => {
    const avgs = register.map(r => r.moy).filter(v => v !== null) as number[]
    return avgs.length ? Math.max(...avgs) : null
  }, [register])

  const minAvg = useMemo(() => {
    const avgs = register.map(r => r.moy).filter(v => v !== null) as number[]
    return avgs.length ? Math.min(...avgs) : null
  }, [register])

  const fmt = (v: number | null) => v !== null ? v.toFixed(2) : "--"

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/enseignant" className="flex items-center gap-2 text-muted-foreground hover:text-primary font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 transition-all">
              <ChevronLeft className="size-4" /> Retour au dashboard
            </Link>
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tight">Registre <span className="text-primary italic">{cls}</span></h1>
            <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{subject} • {activeYear}</p>
          </div>
          <div className="flex items-center gap-3">
            {["T1","T2","T3"].map(t => (
              <button key={t} onClick={() => setTrimestre(t)}
                className={cn("h-10 md:h-12 px-5 md:px-8 rounded-xl font-black text-xs md:text-sm uppercase transition-all border-2",
                  trimestre === t ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30"
                )}>{t}</button>
            ))}
          </div>
        </div>

        {/* Stats résumé */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Effectif", value: students.length.toString(), color: "text-foreground", bg: "bg-white" },
            { label: "Moy. classe", value: fmt(classAvg), color: classAvg !== null && classAvg >= 10 ? "text-emerald-600" : "text-red-500", bg: "bg-white" },
            { label: "Meilleure", value: fmt(maxAvg), color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Plus faible", value: fmt(minAvg), color: "text-red-500", bg: "bg-red-50" },
          ].map(s => (
            <Card key={s.label} className={cn("p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm text-center", s.bg)}>
              <p className={cn("text-2xl md:text-4xl font-black", s.color)}>{s.value}</p>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Tableau registre */}
        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary size-10 opacity-30" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-primary text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-4 md:px-8 md:py-6 sticky left-0 z-10 bg-primary rounded-tl-[1.8rem] md:rounded-tl-[3rem]">Nom & Prénom</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">Sexe</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">Matricule</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">INT 1</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">INT 2</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">INT 3</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">DEV 1</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center">DEV 2</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center bg-white/10">MOY/20</th>
                    <th className="px-4 py-4 md:px-6 md:py-6 text-center bg-white/20 rounded-tr-[1.8rem] md:rounded-tr-[3rem]">MOY×{coefficient}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/10">
                  {register.map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-muted/5 transition-all group">
                      <td className="px-4 py-3 md:px-8 md:py-5 sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC] border-r border-muted/10">
                        <div className="min-w-[140px] md:min-w-[200px]">
                          <p className="font-black text-[10px] md:text-base uppercase">{s.last_name} {s.first_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                        <Badge className={cn("font-black text-[8px] md:text-[10px] px-2 py-0.5 rounded-lg", s.gender === "F" ? "bg-pink-50 text-pink-600" : "bg-blue-50 text-blue-600")}>
                          {s.gender || "--"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-mono text-[8px] md:text-xs font-bold text-muted-foreground">{s.student_matricule || s.matricule || "--"}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-black text-sm md:text-lg tabular-nums">{fmt(s.i1)}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-black text-sm md:text-lg tabular-nums">{fmt(s.i2)}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-black text-sm md:text-lg tabular-nums">{fmt(s.i3)}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-black text-sm md:text-lg tabular-nums">{fmt(s.d1)}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center font-black text-sm md:text-lg tabular-nums">{fmt(s.d2)}</td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                        <Badge className={cn("h-8 md:h-10 w-16 md:w-20 justify-center rounded-lg md:rounded-xl font-black text-xs md:text-base",
                          s.moy === null ? "bg-muted text-muted-foreground" : s.moy >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        )}>{fmt(s.moy)}</Badge>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-5 text-center">
                        <Badge className={cn("h-8 md:h-10 w-16 md:w-20 justify-center rounded-lg md:rounded-xl font-black text-xs md:text-base",
                          s.moyCoef === null ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary"
                        )}>{fmt(s.moyCoef)}</Badge>
                      </td>
                    </tr>
                  ))}
                  {register.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-20 font-black text-muted-foreground uppercase opacity-30">Aucun élève dans cette classe</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex justify-center pb-6">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-20">
            <ShieldCheck className="size-3" /> Registre scellé ACADEX • {activeYear}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

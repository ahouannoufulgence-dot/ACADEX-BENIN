"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  User, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Brain,
  Database,
  Search,
  Globe
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'bot', content: "Bienvenue dans l'espace de haute intelligence ACADEX. Je suis votre conseiller personnel, scellé aux registres de l'établissement. Ma vision est nourrie par vos données réelles pour vous offrir une analyse d'une précision absolue. Comment puis-je vous accompagner aujourd'hui ?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll performant vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, loading])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const userId = localStorage.getItem('acadex_user_id') || ""
      const userRole = localStorage.getItem('acadex_user_role') || "Élève"
      const activeYear = localStorage.getItem('acadex_active_year') || "2026-2027"


      let contextData: any = { academicYear: activeYear }
      
      if (userRole === 'Élève') {
        const [gradesRes, presencesRes, sanctionsRes, conductRes] = await Promise.all([
          supabase.from('grades').select('*').eq('student_matricule', userId).eq('academic_year', activeYear),
          supabase.from('presences').select('*').eq('student_matricule', userId).eq('academic_year', activeYear),
          supabase.from('sanctions').select('*').eq('student_matricule', userId).eq('academic_year', activeYear),
          supabase.from('conduct_config').select('*').eq('id', 'main').single()
        ])
        const grades = gradesRes.data || []
        const presences = presencesRes.data || []
        const sanctions = sanctionsRes.data || []
        const conductConfig = conductRes.data || { note_depart: 20 }
        const notesParMatiere: Record<string, any> = {}
        grades.forEach((g: any) => {
          const key = `${g.subject}_${g.term}`
          if (!notesParMatiere[key]) notesParMatiere[key] = { matiere: g.subject, trimestre: g.term, notes: {} }
          notesParMatiere[key].notes[g.type] = Number(g.value)
        })
        const totalPoints = sanctions.reduce((acc: number, s: any) => acc + Number(s.points_retranches || 0), 0)
        const noteConduite = Math.max(0, (conductConfig.note_depart || 20) - totalPoints)
        contextData = {
          nom: localStorage.getItem('acadex_user_name'),
          matricule: userId,
          notes: Object.values(notesParMatiere),
          absences: {
            total: presences.filter((p: any) => p.statut === 'Absent').length,
            justifiees: presences.filter((p: any) => p.statut === 'Absent' && p.justifiee).length,
            nonJustifiees: presences.filter((p: any) => p.statut === 'Absent' && !p.justifiee).length,
            retards: presences.filter((p: any) => p.statut === 'Retard').length
          },
          sanctions: sanctions.map((s: any) => ({ type: s.sanction, faute: s.type_faute, points: s.points_retranches })),
          noteConduite: noteConduite.toFixed(1)
        }
      } else if (userRole === 'Directeur') {
        const [studentsRes, gradesRes, paymentsRes, teachersRes, schedulesRes, expensesRes, settingsRes, lifeRes, sanctionsRes, presencesRes] = await Promise.all([
          supabase.from('students').select('*').eq('academic_year', activeYear),
          supabase.from('grades').select('*').eq('academic_year', activeYear),
          supabase.from('payments').select('*').eq('academic_year', activeYear),
          supabase.from('teachers').select('*'),
          supabase.from('schedules').select('*').eq('academic_year', activeYear),
          supabase.from('expenses').select('*').eq('academic_year', activeYear),
          supabase.from('school_settings').select('*'),
          supabase.from('student_life').select('*').eq('academic_year', activeYear),
          supabase.from('sanctions').select('*').eq('academic_year', activeYear),
          supabase.from('presences').select('*').eq('academic_year', activeYear)
        ])
        const students = studentsRes.data || []
        const grades = gradesRes.data || []
        const payments = paymentsRes.data || []
        const teachers = teachersRes.data || []
        const schedules = schedulesRes.data || []
        const expenses = expensesRes.data || []
        const settings = settingsRes.data || []
        const studentLife = lifeRes.data || []
        const sanctionsData = sanctionsRes.data || []
        const presencesData = presencesRes.data || []
        contextData = {
          eleves: students.map((s: any) => ({
            matricule: s.student_matricule || s.matricule,
            nom: s.last_name,
            prenom: s.first_name,
            classe: s.class_id,
            genre: s.gender,
            telephone: s.phone,
            villeNaissance: s.city_of_birth,
            dateNaissance: s.dob,
            nomParent: s.parent_name,
            prenomParent: s.parent_first_name,
            statut: s.status
          })),
          notes: grades.map((g: any) => ({
            matricule: g.student_matricule,
            matiere: g.subject,
            valeur: g.value,
            type: g.type,
            classe: g.class_id,
            trimestre: g.term,
            coefficient: g.coefficient
          })),
          enseignants: teachers.map((t: any) => ({
            code: t.official_id,
            nom: t.full_name,
            matiere: t.subject,
            classes: t.classes
          })),
          paiements: payments.map((p: any) => ({
            matricule: p.student_matricule,
            nom: p.student_name,
            montant: p.amount_paid,
            motif: p.note,
            classe: p.class_id
          })),
          depenses: expenses.map((e: any) => ({
            label: e.label,
            montant: e.amount,
            categorie: e.category,
            date: e.date
          })),
          vieScolaire: studentLife,
          sanctions: sanctionsData.map((s: any) => ({
            eleve: s.student_name,
            classe: s.class_id,
            faute: s.type_faute,
            sanction: s.sanction,
            points: s.points_retranches,
            trimestre: s.trimestre
          })),
          presences: presencesData.map((p: any) => ({
            eleve: p.student_name,
            classe: p.class_id,
            statut: p.statut,
            matiere: p.matiere,
            justifiee: p.justifiee,
            trimestre: p.trimestre
          })),
          emploiDuTemps: schedules,
          parametresEcole: settings
        }
      } else if (userRole === 'Enseignant') {
        const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
        const subject = localStorage.getItem('acadex_user_subject') || ""
        const subjectSecondaire = localStorage.getItem('acadex_user_subject_secondaire') || ""
        const [gradesRes, studentsRes, presencesRes, sanctionsRes] = await Promise.all([
          supabase.from('grades').select('*').eq('academic_year', activeYear).in('class_id', classes.length ? classes : ['']),
          supabase.from('students').select('*').eq('academic_year', activeYear).in('class_id', classes.length ? classes : ['']),
          supabase.from('presences').select('*').eq('academic_year', activeYear).in('class_id', classes.length ? classes : ['']),
          supabase.from('sanctions').select('*').eq('academic_year', activeYear).in('class_id', classes.length ? classes : [''])
        ])
        const myGrades = (gradesRes.data || []).filter((g: any) => g.subject === subject || (subjectSecondaire && g.subject === subjectSecondaire))
        const myStudents = studentsRes.data || []
        contextData = {
          matiere: subject,
          matiereSecondaire: subjectSecondaire || null,
          mesClasses: classes,
          eleves: myStudents.map((s: any) => ({
            matricule: s.student_matricule || s.matricule,
            nom: s.last_name,
            prenom: s.first_name,
            classe: s.class_id
          })),
          notes: myGrades.map((g: any) => ({
            matricule: g.student_matricule,
            matiere: g.subject,
            valeur: g.value,
            type: g.type,
            classe: g.class_id,
            trimestre: g.term,
            coefficient: g.coefficient
          })),
          presences: (presencesRes.data || []).map((p: any) => ({
            eleve: p.student_name,
            statut: p.statut,
            matiere: p.matiere,
            justifiee: p.justifiee,
            trimestre: p.trimestre
          })),
          sanctions: (sanctionsRes.data || []).map((s: any) => ({
            eleve: s.student_name,
            faute: s.type_faute,
            sanction: s.sanction,
            points: s.points_retranches
          }))
        }
      }
      const res = await askAcadexBrain({ question: userMsg, userRole: userRole as any, userId: userId, contextData })
      setMessages(prev => [...prev, { role: 'bot', content: res.answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Je rencontre une difficulté pour accéder aux registres scellés." }])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { label: "Bilan stratégique", icon: Database },
    { label: "Analyse réussites", icon: Sparkles },
    { label: "Trajectoire école", icon: Globe }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100svh-9rem)] md:h-[calc(100vh-9rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
        
        {/* Header Compact Premium */}
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <div className="size-10 md:size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl">
                 <Brain className="size-5 md:size-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black tracking-tight uppercase leading-none">
                  Brain <span className="text-primary italic">Intelligence</span>
                </h1>
                <p className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Calcul Temps Réel</p>
              </div>
           </div>
           <div className="flex gap-2">
             <Badge className="bg-primary/5 text-primary border-none font-black px-3 py-1 rounded-lg text-[8px] md:text-[10px] hidden sm:flex">
                <Database className="size-3 mr-2" /> FLUX SCELLÉS
             </Badge>
             <Badge className="bg-emerald-500 text-white border-none font-black px-3 py-1 rounded-lg text-[8px] md:text-[10px]">
                <ShieldCheck className="size-3 mr-2" /> AUDIT ACTIF
             </Badge>
           </div>
        </div>

        {/* Main Console */}
        <Card className="flex-1 border-none shadow-2xl bg-white rounded-[1.8rem] md:rounded-[3rem] flex flex-col overflow-hidden relative border-t-[8px] border-primary">
           {/* Messages - Zone de lecture optimisée */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 no-scrollbar scroll-smooth bg-[#F8FAFC]/30">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-start gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                   <div className={cn(
                     "size-8 md:size-12 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                     msg.role === 'user' ? "bg-muted text-foreground" : "bg-primary text-white"
                   )}>
                      {msg.role === 'user' ? <User className="size-4 md:size-6" /> : <Bot className="size-4 md:size-6" />}
                   </div>
                   <div className={cn(
                     "p-4 md:p-8 rounded-[1.4rem] md:rounded-[2.2rem] text-sm md:text-xl font-medium leading-relaxed max-w-[85%] md:max-w-[75%] shadow-sm",
                     msg.role === 'user' 
                       ? "bg-white text-foreground rounded-tr-none border border-muted" 
                       : "bg-primary/[0.03] text-foreground rounded-tl-none border border-primary/5"
                   )}>
                      {msg.content}
                      <div className={cn(
                        "mt-2 flex items-center gap-1.5 opacity-20",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}>
                        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] italic">Certifié ACADEX</p>
                      </div>
                   </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center gap-4 px-2 animate-pulse">
                   <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                     <Loader2 className="size-5 animate-spin text-primary" />
                   </div>
                   <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary">Interrogation du vault...</span>
                </div>
              )}
           </div>

           {/* Interaction Hub - Compact & Accessible */}
           <div className="p-4 md:p-8 bg-white border-t border-muted">
              <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                
                {/* Suggestions Horizontales */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {quickPrompts.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setInput(s.label)}
                      className="whitespace-nowrap px-4 py-2 bg-muted/30 rounded-xl border border-transparent hover:border-primary/20 hover:bg-white transition-all text-left flex items-center gap-2 group shrink-0"
                    >
                        <s.icon className="size-3 text-primary" />
                        <span className="text-[8px] md:text-xs font-black uppercase tracking-tight text-muted-foreground group-hover:text-primary">{s.label}</span>
                        <ChevronRight className="size-2.5 text-muted-foreground/30" />
                    </button>
                  ))}
                </div>

                {/* Input Magistral */}
                <form onSubmit={handleSend} className="relative">
                   <div className="flex items-center gap-3 bg-muted/20 p-2 md:p-3 pl-5 md:pl-8 rounded-2xl md:rounded-[2rem] border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner">
                      <Search className="size-4 md:size-5 text-primary/30" />
                      <Input 
                        placeholder="Interrogez le savoir collectif..." 
                        className="flex-1 border-none shadow-none focus-visible:ring-0 font-bold text-sm md:text-xl placeholder:text-muted-foreground/20 h-10 md:h-16 bg-transparent p-0"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        disabled={loading || !input.trim()} 
                        className="size-10 md:size-14 rounded-xl md:rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                         <Send className="size-4 md:size-6" />
                      </Button>
                   </div>
                </form>
              </div>
           </div>
        </Card>

        {/* Footer Discret */}
        <div className="flex items-center justify-center gap-6 py-1 opacity-40">
           <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest"><ShieldCheck className="size-2 text-emerald-500" /> Sécurité Scellée</div>
           <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest"><Zap className="size-2 text-amber-500" /> Temps Réel</div>
           <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest"><Globe className="size-2 text-blue-500" /> Réseau Acadex</div>
        </div>
      </div>
    </DashboardLayout>
  )
}

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
  Activity,
  Command,
  Globe,
  Database,
  Search,
  MessageSquareShare
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useFirestore } from "@/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const db = useFirestore()
  const [messages, setMessages] = useState<any[]>([
    { role: 'bot', content: "Bienvenue dans l'espace de haute intelligence ACADEX. Je suis votre conseiller personnel, scellé aux registres de l'établissement. Ma vision est nourrie par vos données réelles pour vous offrir une analyse d'une précision absolue. Comment puis-je vous accompagner dans votre quête d'excellence aujourd'hui ?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
        const [gradesSnap, lifeSnap] = await Promise.all([
               getDocs(query(collection(db, "grades"), where("studentId", "==", userId), where("academicYear", "==", activeYear))),
               getDocs(query(collection(db, "student_life"), where("studentId", "==", userId), where("academicYear", "==", activeYear)))
        ])
        
        const grades = gradesSnap.docs.map(d => d.data())
        const subjects: Record<string, number[]> = {}
        grades.forEach((g: any) => {
          if (!subjects[g.subject]) subjects[g.subject] = []
          subjects[g.subject].push(Number(g.value))
        })

        const averages: Record<string, number> = {}
        Object.entries(subjects).forEach(([sub, vals]) => {
          averages[sub] = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        })

        const totalAvg = Object.values(averages).length > 0 
          ? (Object.values(averages).reduce((a, b) => a + b, 0) / Object.values(averages).length).toFixed(2)
          : "0.00";

        contextData = {
          nom: localStorage.getItem('acadex_user_name'),
          moyennes: averages,
          moyenneGenerale: totalAvg,
          historiqueVieScolaire: lifeSnap.docs.map(d => ({ motif: d.data().motif, type: d.data().category, impact: d.data().pointsImpact }))
        }
      } else if (userRole === 'Directeur') {
        const [studentsSnap, gradesSnap, paymentsSnap] = await Promise.all([
          getDocs(query(collection(db, "students"), where("academicYear", "==", activeYear))),
          getDocs(query(collection(db, "grades"), where("academicYear", "==", activeYear))),
          getDocs(query(collection(db, "payments"), where("academicYear", "==", activeYear)))
        ])

        const students = studentsSnap.docs.map(d => d.data())
        const grades = gradesSnap.docs.map(d => d.data())
        const payments = paymentsSnap.docs.map(d => d.data())

        const promos: Record<string, { total: number, count: number }> = {}
        grades.forEach(g => {
          const p = g.classId?.split(' ')[0] || 'Inconnue'
          if (!promos[p]) promos[p] = { total: 0, count: 0 }
          promos[p].total += Number(g.value)
          promos[p].count++
        })

        const promoAvgs: Record<string, string> = {}
        Object.entries(promos).forEach(([name, data]) => {
          promoAvgs[name] = (data.total / data.count).toFixed(2)
        })

        contextData = {
          effectifTotal: students.length,
          moyennesParPromotion: promoAvgs,
          totalRecettes: payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0),
          tauxReussiteGlobalEstimation: (grades.filter(g => Number(g.value) >= 10).length / Math.max(1, grades.length) * 100).toFixed(1) + "%"
        }
      } else if (userRole === 'Enseignant') {
        const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
        const gradesSnap = await getDocs(query(collection(db, "grades"), where("subject", "==", localStorage.getItem('acadex_user_subject')), where("academicYear", "==", activeYear)))
        const myGrades = gradesSnap.docs.map(d => d.data()).filter(g => classes.includes(g.classId))

        contextData = {
          matiere: localStorage.getItem('acadex_user_subject'),
          mesClasses: classes,
          nombreNotesSaisies: myGrades.length,
          moyenneParClasse: classes.map((c: string) => {
            const cGrades = myGrades.filter(g => g.classId === c)
            const avg = cGrades.length ? (cGrades.reduce((acc, g) => acc + Number(g.value), 0) / cGrades.length).toFixed(2) : "0.00"
            return { classe: c, moyenne: avg }
          })
        }
      }
      
      const res = await askAcadexBrain({
        question: userMsg,
        userRole: userRole as any,
        userId: userId,
        contextData
      })

      setMessages(prev => [...prev, { role: 'bot', content: res.answer }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'bot', content: "Je rencontre une difficulté pour accéder aux registres scellés. Ma connexion à l'infrastructure centrale ACADEX est momentanément ralentie." }])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { label: "Bilan stratégique", icon: Database },
    { label: "Analyse des réussites", icon: Sparkles },
    { label: "Trajectoire de l'école", icon: Activity }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100svh-10rem)] md:h-[calc(100vh-10rem)] flex flex-col space-y-6 animate-in fade-in duration-700">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
           <div className="flex items-center gap-4">
              <div className="size-12 md:size-16 bg-primary rounded-[1.2rem] md:rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(20,83,45,0.3)] border-b-4 border-black/20">
                 <Brain className="size-6 md:size-9" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl md:text-4xl font-black tracking-tighter uppercase leading-none">
                  Brain <span className="text-primary italic">Intelligence</span>
                </h1>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Moteur Groq Llama 3.3 Scellé</p>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
             <Badge className="bg-white border-2 border-primary/10 text-primary font-black px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 text-[9px] md:text-xs">
                <Database className="size-3" /> FLUX RÉELS SYNCHRONISÉS
             </Badge>
             <Badge className="hidden md:flex bg-primary/5 text-primary border-none font-black px-4 py-2 rounded-xl text-[9px] md:text-xs">
                <ShieldCheck className="size-3 mr-2" /> AUDIT ACTIF
             </Badge>
           </div>
        </div>

        {/* Main Interface */}
        <Card className="flex-1 border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] bg-white rounded-[2.5rem] md:rounded-[4.5rem] flex flex-col overflow-hidden relative border-t-[12px] border-primary">
           <div className="absolute top-0 right-0 p-16 opacity-[0.01] pointer-events-none select-none">
              <Zap className="size-96" />
           </div>
           
           {/* Messages Display */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-16 space-y-10 md:space-y-16 no-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-start gap-4 md:gap-8 animate-in slide-in-from-bottom-6 duration-500", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                   <div className={cn(
                     "size-10 md:size-16 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg border-b-4",
                     msg.role === 'user' ? "bg-muted text-foreground border-black/10" : "bg-primary text-white border-black/20"
                   )}>
                      {msg.role === 'user' ? <User className="size-5 md:size-8" /> : <Bot className="size-5 md:size-8" />}
                   </div>
                   <div className={cn(
                     "p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] text-sm md:text-2xl font-medium leading-relaxed max-w-[90%] md:max-w-[82%] relative group transition-all shadow-sm",
                     msg.role === 'user' 
                       ? "bg-[#F8FAFC] text-foreground rounded-tr-none border border-muted" 
                       : "bg-primary/[0.03] text-foreground rounded-tl-none border border-primary/5 hover:bg-primary/[0.06]"
                   )}>
                      {msg.content}
                      {msg.role === 'bot' && (
                        <div className="absolute -top-3 -left-3 bg-white border border-primary/10 rounded-full p-2 shadow-sm">
                           <Sparkles className="size-4 text-primary animate-pulse" />
                        </div>
                      )}
                      <div className={cn(
                        "absolute -bottom-7 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity",
                        msg.role === 'user' ? "right-4" : "left-4"
                      )}>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest italic">Authentifié ACADEX System</p>
                      </div>
                   </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center gap-6 px-4 md:px-12 animate-pulse">
                   <div className="size-12 md:size-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                     <Loader2 className="size-6 md:size-10 animate-spin text-primary" />
                   </div>
                   <div className="space-y-2">
                     <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-primary">Le Cerveau interroge les archives...</span>
                     <div className="h-1.5 w-48 bg-primary/10 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-1/3 animate-infinite-loading" />
                     </div>
                   </div>
                </div>
              )}
           </div>

           {/* Interaction Center */}
           <div className="p-6 md:p-14 bg-[#F8FAFC]/50 backdrop-blur-xl border-t border-muted">
              <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
                
                {/* Shortcuts */}
                <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  {quickPrompts.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setInput(s.label)}
                      className="whitespace-nowrap px-6 py-4 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2.2rem] border-2 border-transparent hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all text-left flex items-center justify-between group shrink-0 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                           <div className="size-8 md:size-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><s.icon className="size-4 md:size-6" /></div>
                           <span className="text-[10px] md:text-lg font-black uppercase tracking-tight text-muted-foreground group-hover:text-primary">{s.label}</span>
                        </div>
                        <ChevronRight className="size-4 md:size-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                {/* Console Bar */}
                <form onSubmit={handleSend} className="relative group">
                   <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-[2.5rem] md:rounded-[4.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                   <div className="relative flex items-center gap-4 md:gap-8 bg-white p-3 md:p-5 pl-8 md:pl-16 rounded-[2.5rem] md:rounded-[4.5rem] shadow-2xl border border-primary/10 transition-all">
                      <Search className="size-5 md:size-8 text-primary/20" />
                      <Input 
                        placeholder="Interrogez le savoir collectif..." 
                        className="flex-1 border-none shadow-none focus-visible:ring-0 font-bold text-base md:text-3xl placeholder:text-muted-foreground/20 h-12 md:h-24 bg-transparent p-0"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        disabled={loading || !input.trim()} 
                        className="size-14 md:size-28 rounded-[1.8rem] md:rounded-[3rem] bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all group/btn border-b-8 border-black/20"
                      >
                         <Send className="size-6 md:size-12 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </Button>
                   </div>
                </form>
              </div>
           </div>
        </Card>

        {/* Console Integrity Footer */}
        <div className="flex items-center justify-center gap-8 px-4 py-2">
           <div className="flex items-center gap-2.5 text-[8px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">
             <ShieldCheck className="size-3.5 text-emerald-500" /> Sécurité Scellée
           </div>
           <div className="w-px h-4 bg-muted-foreground/20" />
           <div className="flex items-center gap-2.5 text-[8px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">
             <Zap className="size-3.5 text-amber-500" /> Calcul Temps Réel
           </div>
           <div className="w-px h-4 bg-muted-foreground/20" />
           <div className="flex items-center gap-2.5 text-[8px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">
             <Globe className="size-3.5 text-blue-500" /> Réseau Acadex
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes infinite-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-infinite-loading {
          animation: infinite-loading 2s infinite linear;
        }
      `}</style>
    </DashboardLayout>
  )
}

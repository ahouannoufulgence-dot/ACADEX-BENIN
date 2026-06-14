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
  Info,
  Brain,
  Activity,
  History,
  MessageCircle,
  Command
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useFirestore } from "@/firebase"
import { collection, query, where, getDocs, doc } from "firebase/firestore"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const db = useFirestore()
  const [messages, setMessages] = useState<any[]>([
    { role: 'bot', content: "Bonjour. Je suis le Cerveau ACADEX, votre intelligence centrale. Je suis connecté aux registres scellés de l'établissement pour vous apporter une vision claire et bienveillante. Comment puis-je vous éclairer aujourd'hui ?" }
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
      setMessages(prev => [...prev, { role: 'bot', content: "Je rencontre une difficulté pour accéder aux registres. Ma connexion à la base de données ACADEX semble ralentie." }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    { label: "Bilan global de l'école", icon: Zap },
    { label: "Analyse des moyennes", icon: Sparkles },
    { label: "Point sur la trésorerie", icon: Info }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100svh-12rem)] md:h-[calc(100vh-12rem)] flex flex-col space-y-4 md:space-y-6 animate-in fade-in duration-500">
        
        {/* Header Header */}
        <div className="flex items-center justify-between px-2 md:px-4">
           <div className="space-y-1">
              <h1 className="text-xl md:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
                <div className="size-8 md:size-14 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 relative group">
                   <Brain className="size-5 md:size-8 relative z-10" />
                   <div className="absolute inset-0 bg-white/20 rounded-xl md:rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="leading-tight">Cerveau <span className="text-primary italic">ACADEX</span></span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="size-1.5 md:size-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[7px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                       Analyse Omnisciente • Llama 3.3
                    </p>
                  </div>
                </div>
              </h1>
           </div>
           <div className="hidden md:flex items-center gap-4">
             <Badge className="bg-white border-2 border-primary/10 text-primary font-black px-6 py-2.5 rounded-full shadow-sm flex items-center gap-2">
                <Activity className="size-3 text-emerald-500" /> SYSTÈME CONNECTÉ
             </Badge>
           </div>
        </div>

        {/* Chat Card */}
        <Card className="flex-1 border-none shadow-2xl bg-white rounded-[1.8rem] md:rounded-[3.5rem] flex flex-col overflow-hidden relative border-t-8 border-primary">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
              <Zap className="size-64" />
           </div>
           
           {/* Messages Scroll Area */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-14 space-y-8 md:space-y-12 no-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-start gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-500", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                   <Avatar className={cn("size-8 md:size-16 border-4 shadow-xl shrink-0 transition-transform hover:scale-110", msg.role === 'user' ? "border-primary/10" : "border-emerald-50")}>
                      <AvatarFallback className={cn("font-black text-[10px] md:text-xl", msg.role === 'user' ? "bg-muted text-foreground" : "bg-primary text-white shadow-inner")}>
                         {msg.role === 'user' ? <User className="size-4 md:size-8" /> : <Bot className="size-4 md:size-8" />}
                      </AvatarFallback>
                   </Avatar>
                   <div className={cn(
                     "p-5 md:p-10 rounded-[1.8rem] md:rounded-[3rem] text-xs md:text-xl font-medium leading-relaxed max-w-[85%] md:max-w-[78%] shadow-sm relative group transition-all",
                     msg.role === 'user' 
                       ? "bg-[#F8FAFC] text-foreground rounded-tr-none border border-muted/50" 
                       : "bg-primary/5 text-foreground rounded-tl-none border border-primary/10 hover:bg-primary/10"
                   )}>
                      {msg.content}
                      <div className={cn(
                        "absolute -bottom-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                        msg.role === 'user' ? "right-0" : "left-0"
                      )}>
                        <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest">Scellé à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center gap-4 text-primary animate-pulse px-4 md:px-12">
                   <div className="size-10 md:size-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                     <Loader2 className="size-5 md:size-8 animate-spin" />
                   </div>
                   <div className="space-y-1">
                     <span className="text-[9px] md:text-sm font-black uppercase tracking-[0.2em]">Le Cerveau interroge les registres...</span>
                     <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-1/2 animate-infinite-loading" />
                     </div>
                   </div>
                </div>
              )}
           </div>

           {/* Input Section */}
           <div className="p-4 md:p-12 bg-[#F8FAFC]/80 backdrop-blur-md border-t border-muted/30">
              <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                
                {/* Mobile Suggestions - Horizontal Scroll */}
                <div className="flex md:grid md:grid-cols-3 gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setInput(s.label)}
                      className="whitespace-nowrap px-4 py-2.5 md:p-5 bg-white rounded-xl md:rounded-2xl border-2 border-transparent hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center justify-between group shrink-0 shadow-sm"
                    >
                        <div className="flex items-center gap-2 md:gap-4">
                           <div className="size-6 md:size-10 bg-primary/5 rounded-lg md:rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><s.icon className="size-3 md:size-5" /></div>
                           <span className="text-[9px] md:text-sm font-black uppercase tracking-tight text-muted-foreground group-hover:text-primary transition-colors">{s.label}</span>
                        </div>
                        <ChevronRight className="size-3 md:size-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
                    </button>
                  ))}
                </div>

                {/* Main Input Bar */}
                <form onSubmit={handleSend} className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2rem] md:rounded-[4rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
                   <div className="relative flex items-center gap-3 md:gap-6 bg-white p-2 md:p-4 pl-6 md:pl-12 rounded-[2rem] md:rounded-[4rem] shadow-2xl border-2 border-primary/5 focus-within:border-primary/20 transition-all">
                      <Command className="size-4 md:size-6 text-primary/30 hidden sm:block" />
                      <Input 
                        placeholder="Interrogez le savoir collectif de l'école..." 
                        className="flex-1 border-none shadow-none focus-visible:ring-0 font-bold text-sm md:text-2xl placeholder:text-muted-foreground/30 h-10 md:h-20 bg-transparent"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        disabled={loading || !input.trim()} 
                        className="size-10 md:size-20 rounded-[1.2rem] md:rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group/btn"
                      >
                         <Send className="size-4 md:size-9 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </Button>
                   </div>
                </form>
              </div>
           </div>
        </Card>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-6 px-4 py-2">
           <div className="flex items-center gap-2 text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
             <ShieldCheck className="size-3 text-emerald-500" /> Audit Sécurisé
           </div>
           <div className="w-px h-3 bg-muted-foreground/20" />
           <div className="flex items-center gap-2 text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
             <Zap className="size-3 text-amber-500" /> Calcul Temps Réel
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes infinite-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-infinite-loading {
          animation: infinite-loading 1.5s infinite linear;
        }
      `}</style>
    </DashboardLayout>
  )
}

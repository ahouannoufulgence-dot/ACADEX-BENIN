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
  Brain
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useFirestore } from "@/firebase"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const db = useFirestore()
  const [messages, setMessages] = useState<any[]>([
    { role: 'bot', content: "Bonjour. Je suis le Cerveau ACADEX. J'ai accès à l'ensemble des registres scellés de l'établissement pour vous aider. Comment puis-je vous éclairer aujourd'hui ?" }
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
        // RÉCUPÉRATION DONNÉES ÉLÈVE
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
        // RÉCUPÉRATION DONNÉES GLOBALES POUR LE DIRECTEUR
        const [studentsSnap, gradesSnap, paymentsSnap] = await Promise.all([
          getDocs(query(collection(db, "students"), where("academicYear", "==", activeYear))),
          getDocs(query(collection(db, "grades"), where("academicYear", "==", activeYear))),
          getDocs(query(collection(db, "payments"), where("academicYear", "==", activeYear)))
        ])

        const students = studentsSnap.docs.map(d => d.data())
        const grades = gradesSnap.docs.map(d => d.data())
        const payments = paymentsSnap.docs.map(d => d.data())

        // Analyse par promotion
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
        // RÉCUPÉRATION DONNÉES ENSEIGNANT
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between px-2">
           <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
                <div className="size-10 md:size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                   <Brain className="size-6 md:size-7" />
                </div>
                Cerveau <span className="text-primary italic">ACADEX</span>
              </h1>
              <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck className="size-3.5 text-emerald-500" /> Analyse Omnisciente • Llama 3.3
              </p>
           </div>
           <Badge className="hidden md:flex bg-white border-2 border-primary/10 text-primary font-black px-6 py-2 rounded-full shadow-sm">
              CONNEXION DIRECTE BASE DE DONNÉES
           </Badge>
        </div>

        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] flex flex-col overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Zap className="size-64" /></div>
           
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-14 space-y-8 no-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-start gap-4 animate-in slide-in-from-bottom-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                   <Avatar className={cn("size-10 md:size-14 border-4 shadow-sm shrink-0", msg.role === 'user' ? "border-primary/10" : "border-emerald-50")}>
                      <AvatarFallback className={cn("font-black text-xs md:text-lg", msg.role === 'user' ? "bg-muted text-foreground" : "bg-primary text-white")}>
                         {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
                      </AvatarFallback>
                   </Avatar>
                   <div className={cn(
                     "p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] text-xs md:text-lg font-medium leading-relaxed max-w-[85%] md:max-w-[75%] shadow-sm",
                     msg.role === 'user' ? "bg-muted/50 text-foreground rounded-tr-none" : "bg-primary/5 text-foreground rounded-tl-none border border-primary/5"
                   )}>
                      {msg.content}
                   </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-4 text-primary animate-pulse px-8">
                   <Loader2 className="size-5 animate-spin" />
                   <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">Le Cerveau interroge les registres scellés...</span>
                </div>
              )}
           </div>

           <div className="p-4 md:p-10 bg-muted/20 border-t border-muted/30">
              <form onSubmit={handleSend} className="flex items-center gap-3 md:gap-6 bg-white p-2 md:p-3 pl-6 md:pl-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border-2 border-primary/5 focus-within:border-primary/20 transition-all">
                 <Input 
                   placeholder="Posez une question sur n'importe quelle donnée de l'école..." 
                   className="flex-1 border-none shadow-none focus-visible:ring-0 font-bold text-sm md:text-xl placeholder:text-muted-foreground/30 h-11 md:h-16"
                   value={input}
                   onChange={e => setInput(e.target.value)}
                 />
                 <Button type="submit" disabled={loading || !input.trim()} className="size-11 md:size-16 rounded-[1.2rem] md:rounded-3xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Send className="size-5 md:size-8" />
                 </Button>
              </form>
           </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: "Bilan global de l'école", icon: Zap },
             { label: "Analyse des moyennes", icon: Sparkles },
             { label: "Point sur la trésorerie", icon: Info }
           ].map((s, i) => (
             <button 
               key={i} 
               onClick={() => { setInput(s.label); }}
               className="p-4 bg-white rounded-2xl border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all text-left flex items-center justify-between group"
             >
                <div className="flex items-center gap-3">
                   <div className="size-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary"><s.icon className="size-4" /></div>
                   <span className="text-xs font-black uppercase tracking-tight text-muted-foreground group-hover:text-primary transition-colors">{s.label}</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
             </button>
           ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

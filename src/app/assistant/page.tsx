"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ShieldCheck, 
  Lock,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { cn } from "@/lib/utils"

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isConfigError?: boolean;
}

export default function AssistantPage() {
  const db = useFirestore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", motto: "", year: "2024-2025" })
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Élève"
    setUserRole(role)
    
    const initialMsg: Message = {
      role: 'assistant',
      content: `Bonjour ! Je suis le Cerveau ACADEX configuré pour l'espace ${role}. Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
      suggestions: role === "Directeur" 
        ? ["Analyse des moyennes", "Point sur la trésorerie", "Élèves en difficulté"]
        : role === "Enseignant"
        ? ["Moyennes de ma matière", "Evolution des classes"]
        : ["Analyse ma moyenne", "Conseils réussite"]
    }
    setMessages([initialMsg])

    const fetchSchool = async () => {
      try {
        const docSnap = await getDoc(doc(db, "school_settings", "main_config"))
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSchoolInfo({
            name: data.schoolName || "ACADEX",
            motto: data.motto || "",
            year: data.academicYear || "2024-2025"
          })
        }
      } catch (err) {
        console.warn("School config fetch error", err)
      }
    }
    fetchSchool()
  }, [db])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input
    if (!text.trim() || loading || !userRole) return

    const userId = localStorage.getItem('acadex_user_id') || ""
    const userClasses = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")

    const newMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, newMessage])
    setInput("")
    setLoading(true)

    try {
      let contextGrades: any[] = []
      
      // Récupération sécurisée du contexte
      if (userRole === "Élève") {
        const q = query(collection(db, "grades"), where("studentId", "==", userId))
        const snap = await getDocs(q)
        contextGrades = snap.docs.map(d => d.data())
      } else if (userRole === "Enseignant" && userClasses.length > 0) {
        const q = query(collection(db, "grades"), where("classId", "in", userClasses))
        const snap = await getDocs(q)
        contextGrades = snap.docs.map(d => d.data())
      }

      const result = await askAcadexBrain({
        question: text,
        userRole: userRole as any,
        userId,
        contextData: { 
          schoolName: schoolInfo.name,
          year: schoolInfo.year,
          gradesCount: contextGrades.length,
        }
      })

      const aiMessage: Message = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        suggestions: result.suggestions
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (e: any) {
      console.error("AI Error:", e.message);
      
      const isConfigError = e.message.includes("MISSING_API_KEY") || e.message.includes("render");
      const errorContent = isConfigError 
        ? "Le Cerveau IA est actuellement indisponible. Veuillez vérifier la validité de la clé API (format AIza...) dans les paramètres de production."
        : `Une erreur est survenue lors de l'analyse : "${e.message}".`;

      const errorMsg: Message = {
        role: 'error',
        content: errorContent,
        timestamp: new Date(),
        isConfigError
      }
      setMessages(prev => [...prev, errorMsg])
      
      toast({ 
        title: "Incident IA", 
        description: "Échec de connexion au modèle.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100svh-11rem)] flex flex-col gap-4 md:gap-6 animate-in">
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="size-10 md:size-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Sparkles className="size-5 md:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black text-foreground tracking-tight uppercase">Cerveau {schoolInfo.name}</h1>
              <p className="text-[7px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <Lock className="size-2.5 text-emerald-500" />
                Session {userRole} Sécurisée
              </p>
            </div>
          </div>
        </div>

        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 bg-muted/5 scroll-smooth no-scrollbar"
          >
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex animate-in slide-in-from-bottom-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[90%] md:max-w-[85%] flex gap-3 md:gap-4", msg.role === 'user' ? 'flex-row-reverse' : '')}>
                  <div className={cn("size-8 md:size-10 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center shadow-sm", 
                    msg.role === 'user' ? 'bg-foreground text-white' : 
                    msg.role === 'error' ? 'bg-red-500 text-white' : 'bg-primary text-white')}>
                    {msg.role === 'user' ? <User className="size-4 md:size-5" /> : 
                     msg.role === 'error' ? <AlertCircle className="size-4 md:size-5" /> : <Bot className="size-4 md:size-5" />}
                  </div>
                  <div className="space-y-3">
                    <div className={cn("p-4 md:p-6 rounded-2xl md:rounded-3xl text-xs md:text-base font-medium leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : msg.role === 'error' 
                        ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none font-bold' 
                        : 'bg-white text-foreground rounded-tl-none border border-muted/50'
                    )}>
                      {msg.content}
                      {msg.isConfigError && (
                        <div className="mt-4 p-3 bg-white/50 rounded-xl border border-red-200">
                          <p className="text-[10px] font-black uppercase text-red-800">Note Technique :</p>
                          <p className="text-[10px] text-red-700 mt-1">La clé fournie semble invalide. Générez une clé Gemini standard (commençant par AIza) sur Google AI Studio.</p>
                        </div>
                      )}
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.suggestions.map((s, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSend(s)}
                            className="text-[8px] md:text-[10px] font-black uppercase tracking-wider bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/10 transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 md:gap-4">
                  <div className="size-8 md:size-10 rounded-xl md:rounded-2xl bg-muted flex items-center justify-center">
                    <Loader2 className="size-4 md:size-5 text-muted-foreground animate-spin" />
                  </div>
                  <div className="p-4 md:p-6 bg-muted/50 rounded-2xl md:rounded-3xl rounded-tl-none">
                    <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Le Cerveau réfléchit...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 md:p-8 pt-2 bg-white border-t border-muted/30">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-3 bg-muted/40 p-1.5 pl-5 md:pl-8 rounded-2xl md:rounded-[2rem] border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner"
            >
              <Input 
                placeholder={`Poser une question...`} 
                className="flex-1 bg-transparent border-none shadow-none h-10 md:h-14 font-bold focus-visible:ring-0 text-xs md:text-lg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="bg-primary text-white size-10 md:size-14 rounded-xl md:rounded-2xl shadow-xl transition-all"
              >
                <Send className="size-4 md:size-6" />
              </Button>
            </form>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-3 text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
           <ShieldCheck className="size-2.5 md:size-3 text-emerald-500" /> Analyse Certifiée ACADEX
        </div>
      </div>
    </DashboardLayout>
  )
}

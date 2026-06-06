
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
  MessageSquare,
  Lock
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { askAcadexBrain, type BrainOutput } from "@/ai/flows/acadex-brain"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { doc, getDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
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
        ? ["Bilan des inscriptions ?", "Point sur la trésorerie", "Profs en attente"]
        : role === "Enseignant"
        ? ["Moyennes de ma classe ?", "Liste de mes élèves", "Saisie des notes"]
        : ["Quelle est ma moyenne ?", "Mes dernières notes", "Conseils pour progresser"]
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
        console.warn("Erreur chargement config école assistant", err)
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

    const userId = localStorage.getItem('acadex_user_id') || "USER-001"

    const newMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, newMessage])
    setInput("")
    setLoading(true)

    try {
      // On prépare un contexte filtré côté client avant l'envoi à l'IA
      const result = await askAcadexBrain({
        question: text,
        userRole: userRole as any,
        userId,
        contextData: { 
          schoolName: schoolInfo.name,
          motto: schoolInfo.motto,
          year: schoolInfo.year,
          // Ici on pourrait ajouter des données spécifiques déjà chargées en RAM
          // mais l'IA se basera surtout sur ses instructions de rôle
        }
      })

      const aiMessage: Message = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        suggestions: result.suggestions
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (e) {
      toast({ title: "Erreur IA", description: "Le cerveau est momentanément indisponible.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col gap-6 animate-in">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Sparkles className="size-6 text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Cerveau {schoolInfo.name}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Lock className="size-3 text-emerald-500" />
                Accès {userRole} Sécurisé
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex rounded-full border-primary/20 text-primary font-black px-4 bg-primary/5">
            {schoolInfo.year}
          </Badge>
        </div>

        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-muted/5 scroll-smooth no-scrollbar"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`size-10 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-foreground text-white' : 'bg-primary text-white'}`}>
                    {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
                  </div>
                  <div className="space-y-3">
                    <div className={`p-5 rounded-3xl text-sm md:text-base font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-foreground text-white rounded-tr-none' 
                        : 'bg-white text-foreground rounded-tl-none border border-muted/50'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.suggestions.map((s, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSend(s)}
                            className="text-[10px] font-black uppercase tracking-wider bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/10 transition-all"
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
                <div className="flex gap-4">
                  <div className="size-10 rounded-2xl bg-muted flex items-center justify-center">
                    <Loader2 className="size-5 text-muted-foreground animate-spin" />
                  </div>
                  <div className="p-5 bg-muted/50 rounded-3xl rounded-tl-none border border-muted/50">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Filtrage des données...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 pt-4 bg-white border-t border-muted/30">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2rem] border-2 border-transparent focus-within:border-primary/20 transition-all shadow-inner"
            >
              <Input 
                placeholder={`Posez une question sur votre espace ${userRole}...`} 
                className="flex-1 bg-transparent border-none shadow-none h-12 font-bold placeholder:text-muted-foreground/50 focus-visible:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="bg-primary hover:bg-primary/90 text-white size-12 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </Button>
            </form>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
           <ShieldCheck className="size-3" /> Protection des données ACADEX Active
        </div>
      </div>
    </DashboardLayout>
  )
}

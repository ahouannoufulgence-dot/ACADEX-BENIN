'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  BarChart3,
  Search,
  MessageSquare
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { askAcadexBrain, type BrainOutput } from "@/ai/flows/acadex-brain"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, limit } from "firebase/firestore"

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Bonjour, je suis le Cerveau ACADEX. Je maîtrise l'intégralité des données de votre établissement. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
      suggestions: ["Qui sont les meilleurs élèves ?", "Y a-t-il des impayés ?", "Quels profs sont absents ?"]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();
  // We take a small snapshot for initial context (limited for performance)
  const { data: students } = useCollection(query(collection(db, "students"), limit(10)));
  const { data: payments } = useCollection(query(collection(db, "payments"), limit(10)));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || loading) return;

    const userRole = localStorage.getItem('acadex_user_role') || "Directeur";
    const userId = localStorage.getItem('acadex_user_id') || "DIR-001";

    const newMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build context for the AI
      const context = {
        role: userRole,
        recentStudents: students?.map(s => ({ name: s.fullName, class: s.classId, matricule: s.matricule, status: s.status })),
        recentPayments: payments?.map(p => ({ amount: p.amountPaid, status: p.status, studentId: p.studentId })),
        systemInfo: { year: "2024-2025", school: "Collège Acadex Elite" }
      };

      const result = await askAcadexBrain({
        question: text,
        userRole,
        userId,
        contextData: context
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        suggestions: result.suggestions
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      toast({ title: "Erreur Cerveau", description: "L'IA est indisponible pour le moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-14rem)] flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Sparkles className="size-6 text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Cerveau ACADEX</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="size-3 text-emerald-500" />
      Intelligence Interne Sécurisée
              </p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black px-4 h-8 bg-primary/5">
            ONLINE • V1.2
          </Badge>
        </div>

        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 bg-muted/5 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`size-10 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-foreground text-white' : 'bg-primary text-white'}`}>
                    {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
                  </div>
                  <div className="space-y-3">
                    <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
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
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Le cerveau analyse vos données...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 pt-4 bg-white border-t border-muted/30">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2rem] border-2 border-transparent focus-within:border-primary/20 transition-all"
            >
              <Input 
                placeholder="Posez une question sur votre établissement..." 
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
            <p className="text-[9px] text-center mt-4 font-bold text-muted-foreground uppercase tracking-[0.2em]">
              ACADEX BRAIN • ANALYSE INTERNE EXCLUSIVE • AUCUNE DONNÉE EXTERNE
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

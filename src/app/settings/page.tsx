
'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  School, 
  Lock, 
  Save, 
  ShieldCheck,
  Calculator,
  History,
  ShieldAlert,
  Eye,
  Smartphone,
  Loader2,
  Clock,
  RefreshCw,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, orderBy, limit, setDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Form states
  const [schoolName, setSchoolName] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [termLocked, setTermLocked] = useState(false)

  useEffect(() => {
    setMounted(true)
    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setConfig(data)
        if (!loading) {
          setSchoolName(data.schoolName || "")
          setAcademicYear(data.academicYear || "")
          setTermLocked(data.termLocked || false)
        }
      }
    })
    return () => unsub()
  }, [db, loading])

  const auditQuery = useMemo(() => query(
    collection(db, "student_life"),
    orderBy("createdAt", "desc"),
    limit(10)
  ), [db])

  const { data: auditLogs, loading: loadingLogs } = useCollection(auditQuery)

  const handleSaveInstitutional = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, "school_settings", "main_config"), {
        schoolName,
        academicYear,
        updatedAt: serverTimestamp()
      }, { merge: true })
      toast({ title: "Configuration scellée", description: "L'identité de l'établissement a été mise à jour." })
    } catch (e) {
      console.error(e)
      toast({ title: "Erreur", description: "Impossible de mettre à jour les paramètres.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = async () => {
    const newState = !termLocked
    setLoading(true)
    try {
      await setDoc(doc(db, "school_settings", "main_config"), {
        termLocked: newState,
        lastLockAction: serverTimestamp(),
        author: localStorage.getItem('acadex_user_name') || "Direction"
      }, { merge: true })
      setTermLocked(newState)
      toast({
        title: newState ? "Système Verrouillé" : "Système Déverrouillé",
        description: newState 
          ? "Toute modification de note est désormais interdite aux enseignants." 
          : "Les enseignants peuvent à nouveau saisir les notes.",
      })
    } catch (e) {
      console.error(e)
      toast({ title: "Erreur critique", description: "L'action de scellage a échoué.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase">
              Cockpit <span className="text-primary italic">Sécurité</span>
            </h1>
            <p className="text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="size-3.5 md:size-4 text-emerald-500" />
              Contrôle d'Intégrité ACADEX V1
            </p>
          </div>
          <Button onClick={handleSaveInstitutional} disabled={loading} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl md:rounded-2xl h-12 md:h-16 px-6 md:px-10 font-black text-xs md:text-lg transition-all active:scale-95 uppercase">
            {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4 md:size-5" />}
            Sauvegarder
          </Button>
        </div>

        <Tabs defaultValue="secu" className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.2rem] md:rounded-[2.5rem] h-12 md:h-20 p-1.5 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            <TabsTrigger value="secu" className="flex-1 md:flex-none rounded-xl md:rounded-[2rem] font-black px-6 md:px-12 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              <Lock className="size-3.5 md:size-4" /> Sécurité & Audit
            </TabsTrigger>
            <TabsTrigger value="ecole" className="flex-1 md:flex-none rounded-xl md:rounded-[2rem] font-black px-6 md:px-12 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              <School className="size-3.5 md:size-4" /> Établissement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secu" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3.5rem] p-5 md:p-12 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-14 gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl md:text-3xl font-black uppercase tracking-tight">Journal d'Audit</CardTitle>
                    <CardDescription className="font-bold text-[9px] md:text-sm uppercase tracking-widest">Traçabilité des flux critiques</CardDescription>
                  </div>
                  <Badge variant="outline" className="h-7 md:h-10 rounded-full border-2 border-primary/10 text-primary font-black px-4 text-[7px] md:text-xs uppercase w-fit">ACTIVITÉ LIVE</Badge>
                </div>
                
                <div className="space-y-3">
                  {loadingLogs ? (
                    <div className="py-20 text-center animate-pulse opacity-20"><Loader2 className="size-10 animate-spin mx-auto text-primary" /></div>
                  ) : auditLogs?.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-xs uppercase tracking-widest">Aucun événement enregistré.</div>
                  ) : (
                    auditLogs?.map((log: any, i) => (
                      <div key={i} className="flex items-center justify-between p-4 md:p-6 bg-muted/10 rounded-xl md:rounded-[2rem] border border-transparent hover:border-primary/10 transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "size-10 md:size-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            log.category === 'discipline' ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'
                          )}>
                            {log.category === 'discipline' ? <ShieldAlert className="size-5 md:size-7" /> : <Eye className="size-5 md:size-7" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[10px] md:text-lg font-black text-foreground truncate uppercase">{log.motif || log.status || "Action Système"}</p>
                              <Badge className={cn("text-[6px] md:text-[8px] font-black h-4 px-1.5 rounded-full shrink-0", log.category === 'discipline' ? 'bg-red-500' : 'bg-primary')}>
                                {log.category.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[8px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                              Par {log.authorName || "Système"} • {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "---"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-6 md:space-y-10">
                <Card className={cn(
                  "p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] transition-all duration-700 shadow-2xl relative overflow-hidden group border-none",
                  termLocked ? "bg-destructive text-white" : "bg-foreground text-white"
                )}>
                  <div className="relative z-10 space-y-6 md:space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="size-12 md:size-16 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                        <Lock className={cn("size-6 md:size-8", termLocked ? "text-white animate-pulse" : "text-primary")} />
                      </div>
                      <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Gel du Système</h3>
                    </div>
                    
                    <p className="text-[10px] md:text-lg font-medium leading-relaxed opacity-80 italic border-l-3 border-white/20 pl-4">
                      {termLocked 
                        ? "Le registre est scellé. Les enseignants ne peuvent plus modifier les notes." 
                        : "Le registre est ouvert. La saisie des notes est libre pour les classes autorisées."}
                    </p>

                    <Button 
                      onClick={handleToggleLock}
                      disabled={loading}
                      className={cn(
                        "w-full h-12 md:h-18 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xl shadow-xl transition-all active:scale-95 uppercase",
                        termLocked 
                          ? "bg-white text-destructive hover:bg-white/90" 
                          : "bg-primary text-white hover:bg-primary/90"
                      )}
                    >
                      {loading ? <Loader2 className="animate-spin size-5" /> : termLocked ? "Déverrouiller les Registres" : "Verrouiller le Trimestre"}
                    </Button>
                  </div>
                  <ShieldCheck className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[5000ms]" />
                </Card>

                <Card className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-white border-none shadow-sm space-y-8">
                  <h3 className="text-sm md:text-xl font-black uppercase tracking-widest text-muted-foreground border-b pb-4 flex items-center gap-3">
                    <Smartphone className="size-5 text-primary" /> Accès Périphériques
                  </h3>
                  <div className="space-y-6 md:space-y-10">
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-sm font-black text-foreground uppercase">Double Auth (2FA)</p>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Obligatoire Directeur</p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-sm font-black text-foreground uppercase">Auto-Déconnexion</p>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Inactivité 15 min</p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ecole" className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
            <Card className="p-6 md:p-14 rounded-[2.2rem] md:rounded-[4rem] bg-white border-none shadow-sm">
              <div className="flex items-center gap-4 mb-10 md:mb-16">
                 <div className="size-12 md:size-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner"><School className="size-6 md:size-8" /></div>
                 <div className="space-y-1">
                   <CardTitle className="text-xl md:text-4xl font-black uppercase tracking-tight">Paramètres Institutionnels</CardTitle>
                   <p className="text-[8px] md:text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">Identité officielle de l'école</p>
                 </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 md:gap-14">
                <div className="space-y-6">
                  <div className="space-y-2 px-1">
                    <Label className="font-black text-[9px] md:text-[11px] uppercase text-muted-foreground tracking-widest px-1">Nom de l'établissement</Label>
                    <Input 
                      value={schoolName} 
                      onChange={e => setSchoolName(e.target.value)} 
                      className="h-12 md:h-16 rounded-xl md:rounded-2xl border-2 font-black text-sm md:text-xl shadow-sm focus:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2 px-1">
                    <Label className="font-black text-[9px] md:text-[11px] uppercase text-muted-foreground tracking-widest px-1">Année Scolaire Active</Label>
                    <Input 
                      value={academicYear} 
                      onChange={e => setAcademicYear(e.target.value)} 
                      className="h-12 md:h-16 rounded-xl md:rounded-2xl border-2 font-black text-sm md:text-xl shadow-sm focus:ring-primary" 
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center p-8 md:p-12 bg-muted/20 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-muted-foreground/10 text-center space-y-4">
                   <div className="size-20 md:size-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-3xl md:text-5xl font-black text-primary border-4 border-white">
                     {schoolName?.[0] || "A"}
                   </div>
                   <div className="space-y-1">
                     <p className="text-base md:text-2xl font-black uppercase tracking-tight">{schoolName || "Nom de l'école"}</p>
                     <Badge variant="outline" className="font-black border-primary/20 text-primary text-[8px] md:text-xs">{academicYear}</Badge>
                   </div>
                </div>
              </div>

              <div className="mt-10 md:mt-16 pt-8 md:pt-12 border-t flex justify-end">
                 <Button onClick={handleSaveInstitutional} disabled={loading} className="w-full md:w-auto h-12 md:h-16 px-10 md:px-20 rounded-xl md:rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-xs md:text-xl uppercase active:scale-95 transition-all">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Sceller les modifications
                 </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

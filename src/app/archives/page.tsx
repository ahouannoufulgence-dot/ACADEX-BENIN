
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
  ShieldAlert
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

export default function AcademicYearsPage() {
  const [activeTab, setActiveTab] = useState("annees")
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeYear, setActiveYear] = useState("")

  const fetchConfig = async () => {
    const { data } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
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
      const [start, end] = currentYear.split('-').map(Number)
      const nextYear = `${start + 1}-${end + 1}`
      const newAvailableYears = [...(schoolConfig.available_years || []), nextYear]

      const { error } = await supabase.from('school_settings').update({
        available_years: newAvailableYears,
        academic_year: nextYear,
      }).eq('id', 'main_config')

      if (error) throw error

      localStorage.setItem('acadex_active_year', nextYear)
      toast({ 
        title: "Année Clôturée", 
        description: `L'année ${currentYear} est désormais scellée dans l'histoire.` 
      })
      window.location.reload()
    } catch (e) {
      toast({ title: "Erreur de scellement", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

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
              { id: "audit", label: "Audit", icon: ShieldCheck },
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
                         {schoolConfig?.available_years?.map((year: string) => (
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

          <TabsContent value="comparaison" className="animate-in zoom-in-95">
            <Card className="p-20 md:p-40 text-center rounded-[3rem] md:rounded-[5rem] border-4 border-dashed bg-muted/10 opacity-30 flex flex-col items-center justify-center gap-8">
              <BarChart3 className="size-12 md:size-24 text-muted-foreground mx-auto" />
              <div className="space-y-3">
                <h3 className="text-lg md:text-3xl font-black uppercase tracking-tight">Analyse Inter-Annuelle</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto text-xs md:text-lg leading-relaxed">
                  "Fonction de pilotage activée dès deux univers scellés."
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

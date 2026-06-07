
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Archive, 
  Search, 
  History, 
  ShieldCheck, 
  Users, 
  UserSquare2, 
  Calendar, 
  FileText,
  CreditCard,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Filter,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Zap,
  Plus,
  ArrowRight,
  AlertTriangle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, updateDoc, getDoc, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore"
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
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("annees")
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeYear, setActiveYear] = useState("")

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2024-2025")
    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) setSchoolConfig(snap.data())
    })
    return () => unsub()
  }, [db])

  const handleCloseYear = async () => {
    if (!schoolConfig) return
    setLoading(true)
    try {
      const currentYear = schoolConfig.academicYear
      const [start, end] = currentYear.split('-').map(Number)
      const nextYear = `${start + 1}-${end + 1}`

      // 1. Ajouter la nouvelle année à la liste des années disponibles
      const configRef = doc(db, "school_settings", "main_config")
      await updateDoc(configRef, {
        availableYears: arrayUnion(nextYear),
        academicYear: nextYear, // On bascule sur la nouvelle
        updatedAt: serverTimestamp()
      })

      localStorage.setItem('acadex_active_year', nextYear)
      toast({ 
        title: "Année Clôturée avec Succès", 
        description: `L'année ${currentYear} est scellée. Bienvenue en ${nextYear} !` 
      })
      window.location.reload() // On recharge pour réinitialiser tout le contexte
    } catch (e) {
      toast({ title: "Erreur lors de la clôture", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion des <span className="text-primary italic">Années Scolaires</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Univers multi-temporels d'ACADEX.</p>
          </div>
          <Badge className="bg-primary text-white h-12 px-8 rounded-2xl flex items-center gap-3 font-black text-lg shadow-xl shadow-primary/20">
             <History className="size-6" /> MÉMOIRE INSTITUTIONNELLE
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "annees", label: "Historique & Clôture", icon: Calendar },
              { id: "comparaison", label: "Comparateur Temporel", icon: BarChart3 },
              { id: "audit", label: "Audit de Sincérité", icon: ShieldCheck },
            ].map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="annees" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-center">
                   <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                      <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                         <Zap className="size-12 fill-primary" />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-3xl font-black">Clôturer l'Année {activeYear}</h3>
                         <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">
                           Cette action scelle définitivement les notes, moyennes et paiements de l'année actuelle et initialise l'univers scolaire suivant.
                         </p>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={loading} className="bg-primary hover:bg-primary/90 rounded-2xl h-16 px-12 font-black text-xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                             {loading ? <Loader2 className="animate-spin mr-3" /> : <ShieldCheck className="mr-3" />}
                             Sceller l'Année & Ouvrir la Suivante
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                           <AlertDialogHeader>
                             <AlertDialogTitle className="text-2xl font-black flex items-center gap-3">
                               <AlertTriangle className="text-destructive" /> Confirmation de Clôture
                             </AlertDialogTitle>
                             <AlertDialogDescription className="text-base font-medium">
                               Êtes-vous certain de vouloir clôturer l'année <b>{activeYear}</b> ? 
                               <br /><br />
                               Toutes les données seront scellées dans l'historique. Une nouvelle session <b>2025-2026</b> sera créée automatiquement.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter className="p-6 bg-muted/20 rounded-b-[2.5rem]">
                             <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                             <AlertDialogAction onClick={handleCloseYear} className="bg-primary hover:bg-primary/90 rounded-xl font-black px-8">
                               Valider la Clôture
                             </AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                   </div>
                </Card>

                <div className="lg:col-span-4 space-y-8">
                   <Card className="p-8 rounded-[3rem] bg-foreground text-white shadow-2xl relative overflow-hidden group">
                      <h4 className="text-xl font-black mb-6 flex items-center gap-3"><Clock className="text-primary" /> Années Scellées</h4>
                      <div className="space-y-4 relative z-10">
                         {schoolConfig?.availableYears?.map((year: string) => (
                           <div key={year} className={cn("p-4 rounded-2xl border-2 flex items-center justify-between transition-all", year === activeYear ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 opacity-60")}>
                              <span className="font-black">{year}</span>
                              {year === activeYear ? <Badge className="bg-primary">ACTIVE</Badge> : <Badge variant="outline" className="text-white/40 border-white/20">SCELLÉE</Badge>}
                           </div>
                         ))}
                      </div>
                      <Archive className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                   </Card>

                   <Card className="p-8 rounded-[3rem] bg-white border-none shadow-sm">
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <CheckCircle2 className="size-5" />
                        <h4 className="font-black uppercase text-xs tracking-widest">Intégrité ACADEX</h4>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        L'archivage multi-années garantit que vos bulletins de 2023 restent identiques même en 2030. Aucune modification n'est permise sur une année scellée.
                      </p>
                   </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="comparaison" className="space-y-8">
            <Card className="p-20 text-center rounded-[3rem] border-4 border-dashed bg-white/50">
              <BarChart3 className="size-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-2xl font-black">Comparateur Inter-Annuel</h3>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto">Cette fonction sera activée dès que vous aurez au moins deux années scolaires scellées en base de données.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

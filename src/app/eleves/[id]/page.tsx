
"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown,
  ChevronLeft,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Download,
  Share2,
  Award,
  History,
  Clock,
  Calendar,
  ChevronRight,
  Info,
  Loader2,
  CheckCircle2,
  FileText
} from "lucide-react"
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"

const progressionData = [
  { name: "T1", value: 14.5 },
  { name: "T2", value: 15.2 },
  { name: "T3", value: 16.1 },
]

export default function StudentDetailPage() {
  const { id } = useParams()
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<GenerateAcademicFeedbackOutput | null>(null)

  const handleAnalyzeResults = async () => {
    setAnalyzing(true)
    try {
      const input = {
        studentName: "Koffi Djimon",
        grades: [
          { subject: "Mathématiques", grade: 18, maxGrade: 20 },
          { subject: "Français", grade: 12, maxGrade: 20 },
          { subject: "Physique", grade: 16, maxGrade: 20 },
          { subject: "SVT", grade: 15, maxGrade: 20 },
        ],
        evaluationContext: "Bilan du premier semestre",
        teacherComments: "Élève très sérieux en sciences, doit s'appliquer davantage en lettres."
      }
      const result = await generateAcademicFeedback(input)
      setAiAnalysis(result)
      toast({ title: "Analyse terminée", description: "L'IA a terminé l'analyse des résultats." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'analyse IA.", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/eleves" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group">
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleAnalyzeResults} 
              disabled={analyzing}
              className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-base"
            >
              {analyzing ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Sparkles className="mr-2 size-5" />}
              Analyser les résultats (IA)
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
              <Download className="mr-2 size-5" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Hero Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
          <div className="h-32 bg-primary relative" />
          <CardContent className="pt-16 pb-10 px-8 md:px-16">
            <div className="absolute -top-12 left-8 md:left-16">
              <Avatar className="size-32 md:size-40 border-8 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${id}/400/400`} />
                <AvatarFallback className="bg-primary text-white text-5xl font-black">KD</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground">Koffi Djimon</h1>
                  <Badge className="bg-primary hover:bg-primary px-5 py-1 rounded-full font-black text-sm">TERMINALE S1</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-3 font-semibold">
                  Matricule: AC-2024-042 • Né le 12/04/2006
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-6 py-3 bg-muted/50 rounded-3xl border border-muted">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Moyenne</p>
                  <p className="text-2xl font-black text-primary">16.54</p>
                </div>
                <div className="text-center px-6 py-3 bg-muted/50 rounded-3xl border border-muted">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Rang</p>
                  <p className="text-2xl font-black text-foreground">2<sup>ème</sup></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="informations" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto no-scrollbar">
            <TabsTrigger value="informations" className="rounded-2xl font-bold px-8">Informations</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-2xl font-bold px-8">Notes</TabsTrigger>
            <TabsTrigger value="absences" className="rounded-2xl font-bold px-8">Absences</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-bold px-8">Paiements</TabsTrigger>
            <TabsTrigger value="analyse" className="rounded-2xl font-bold px-8 flex gap-2">
              <Sparkles className="size-4" /> Analyse IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-6">
             <div className="grid md:grid-cols-2 gap-8">
                <Card className="premium-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><Info className="text-primary" /> Détails Personnels</h3>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Sexe</p>
                      <p className="font-bold">Masculin</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Nationalité</p>
                      <p className="font-bold">Béninoise</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Téléphone</p>
                      <p className="font-bold">+229 97 00 00 00</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Adresse</p>
                      <p className="font-bold">Cotonou, Fidjrossè</p>
                    </div>
                  </div>
                </Card>
                <Card className="premium-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-primary" /> Responsables Légaux</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Père</p>
                      <p className="font-bold">M. Mensah Paul</p>
                      <p className="text-xs font-medium text-muted-foreground">+229 96 11 22 33</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Mère</p>
                      <p className="font-bold">Mme. Mensah Julie</p>
                      <p className="text-xs font-medium text-muted-foreground">+229 95 44 55 66</p>
                    </div>
                  </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="premium-card overflow-hidden">
               <div className="p-8 border-b">
                 <h3 className="text-xl font-black">Relevé de Notes (T1)</h3>
               </div>
               <div className="p-0">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr className="text-[10px] font-black uppercase text-muted-foreground border-b">
                        <th className="px-8 py-4 text-left">Matière</th>
                        <th className="px-4 py-4 text-center">Interro</th>
                        <th className="px-4 py-4 text-center">Devoir</th>
                        <th className="px-4 py-4 text-center">Examen</th>
                        <th className="px-8 py-4 text-right">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30 font-bold">
                      {[
                        { m: "Mathématiques", n1: 18, n2: 17, n3: 19, avg: 18.5 },
                        { m: "Français", n1: 12, n2: 11, n3: 13, avg: 12.0 },
                        { m: "Physique", n1: 15, n2: 16, n3: 17, avg: 16.0 },
                        { m: "SVT", n1: 14, n2: 15, n3: 16, avg: 15.0 },
                      ].map((r, i) => (
                        <tr key={i}>
                          <td className="px-8 py-4">{r.m}</td>
                          <td className="px-4 py-4 text-center">{r.n1}</td>
                          <td className="px-4 py-4 text-center">{r.n2}</td>
                          <td className="px-4 py-4 text-center">{r.n3}</td>
                          <td className="px-8 py-4 text-right text-primary">{r.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
               <Card className="premium-card p-8 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Heures</p>
                  <p className="text-4xl font-black">4h</p>
               </Card>
               <Card className="premium-card p-8 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Justifiées</p>
                  <p className="text-4xl font-black text-primary">4h</p>
               </Card>
               <Card className="premium-card p-8 text-center border-l-8 border-destructive">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Non Justifiées</p>
                  <p className="text-4xl font-black text-destructive">0h</p>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
             <Card className="premium-card p-8">
               <h3 className="text-xl font-black mb-6">Suivi des Tranches</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Inscription</p>
                      <p className="text-xs text-muted-foreground font-medium italic">Payé le 12/09/2024</p>
                    </div>
                    <Badge className="bg-primary">PAYÉ</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Tranche 1</p>
                      <p className="text-xs text-muted-foreground font-medium italic">Payé le 15/11/2024</p>
                    </div>
                    <Badge className="bg-primary">PAYÉ</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Tranche 2</p>
                      <p className="text-xs text-muted-foreground font-medium italic">Date limite : 15/02/2025</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold">À PAYER</Badge>
                  </div>
               </div>
             </Card>
          </TabsContent>

          <TabsContent value="analyse" className="space-y-8">
            {!aiAnalysis ? (
              <Card className="premium-card p-12 text-center border-4 border-dashed bg-muted/20">
                <div className="size-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Sparkles className="size-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4">Besoin d'un éclairage pédagogique ?</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-8">
                  L'intelligence ACADEX peut analyser l'ensemble des résultats de cet élève pour vous donner un rapport de synthèse en un clic.
                </p>
                <Button 
                  onClick={handleAnalyzeResults} 
                  disabled={analyzing}
                  className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-12 font-black shadow-xl shadow-primary/20"
                >
                  {analyzing ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Zap className="mr-2 size-6" />}
                  Lancer l'Analyse Maintenant
                </Button>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-12 animate-in fade-in zoom-in-95 duration-500">
                <Card className="md:col-span-8 premium-card p-10 border-l-[12px] border-primary">
                  <div className="flex justify-between items-start mb-8">
                    <Badge className="bg-primary px-4 py-1.5 font-black text-xs">SYNTHÈSE IA V1</Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Analysé le {new Date().toLocaleDateString()}</span>
                  </div>
                  
                  <div className="space-y-10">
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground">
                        <CheckCircle2 className="size-6 text-primary" />
                        Observation Académique
                      </h4>
                      <p className="text-lg text-foreground/80 leading-relaxed font-medium italic bg-muted/30 p-6 rounded-3xl">
                        "{aiAnalysis.academicFeedback}"
                      </p>
                    </section>

                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground">
                        <FileText className="size-6 text-primary" />
                        Synthèse Globale
                      </h4>
                      <div className="text-base text-foreground/80 leading-relaxed font-medium">
                        {aiAnalysis.summaryReport}
                      </div>
                    </section>
                  </div>
                </Card>

                <div className="md:col-span-4 space-y-6">
                  <Card className="premium-card p-8 bg-foreground text-white">
                    <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                      <Zap className="size-6 text-primary fill-primary" />
                      Plan d'Action
                    </h4>
                    <div className="space-y-4">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                          <span className="size-6 flex items-center justify-center bg-primary text-white text-[10px] font-black rounded-full shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm font-bold text-white/90 leading-tight">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-black text-primary bg-white hover:bg-primary/5">
                    <Download className="mr-2 size-5" /> Télécharger Rapport IA
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

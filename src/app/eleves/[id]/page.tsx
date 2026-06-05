
"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Download,
  Info,
  Loader2,
  CheckCircle2,
  FileText,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"

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
      toast({ title: "Analyse terminée", description: "L'IA a terminé l'analyse." })
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
              className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black"
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
                  <Badge className="bg-primary px-5 py-1 rounded-full font-black text-sm">TERMINALE S1</Badge>
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

        <Tabs defaultValue="notes" className="space-y-8">
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
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Sexe</p><p className="font-bold">Masculin</p></div>
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Nationalité</p><p className="font-bold">Béninoise</p></div>
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Téléphone</p><p className="font-bold">+229 97 00 00 00</p></div>
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Adresse</p><p className="font-bold">Cotonou, Fidjrossè</p></div>
                  </div>
                </Card>
                <Card className="premium-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-primary" /> Responsables</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Père</p>
                      <p className="font-bold">M. Mensah Paul</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Mère</p>
                      <p className="font-bold">Mme. Mensah Julie</p>
                    </div>
                  </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="premium-card overflow-hidden">
               <div className="p-8 border-b bg-muted/5">
                 <h3 className="text-xl font-black">Relevé de Notes (3 Int. / 2 Dev.)</h3>
               </div>
               <div className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-muted/30">
                      <tr className="text-[10px] font-black uppercase text-muted-foreground border-b text-center">
                        <th className="px-8 py-4 text-left">Matière</th>
                        <th className="px-2 py-4">Int 1</th>
                        <th className="px-2 py-4">Int 2</th>
                        <th className="px-2 py-4">Int 3</th>
                        <th className="px-2 py-4">Dev 1</th>
                        <th className="px-2 py-4">Dev 2</th>
                        <th className="px-8 py-4 text-right">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30 font-bold">
                      {[
                        { m: "Mathématiques", i1: 18, i2: 17, i3: 19, d1: 18, d2: 18, avg: 18.25 },
                        { m: "Français", i1: 12, i2: 11, i3: 13, d1: 12, d2: 12.5, avg: 12.16 },
                        { m: "Physique", i1: 15, i2: 16, i3: 17, d1: 15.5, d2: 16, avg: 15.83 },
                        { m: "SVT", i1: 14, i2: 15, i3: 16, d1: 14, d2: 15, avg: 14.66 },
                      ].map((r, i) => (
                        <tr key={i} className="text-center">
                          <td className="px-8 py-4 text-left">{r.m}</td>
                          <td className="px-2 py-4">{r.i1}</td>
                          <td className="px-2 py-4">{r.i2}</td>
                          <td className="px-2 py-4">{r.i3}</td>
                          <td className="px-2 py-4">{r.d1}</td>
                          <td className="px-2 py-4">{r.d2}</td>
                          <td className="px-8 py-4 text-right text-primary">{r.avg.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
               <Card className="premium-card p-8 text-center"><p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Heures</p><p className="text-4xl font-black">4h</p></Card>
               <Card className="premium-card p-8 text-center"><p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Justifiées</p><p className="text-4xl font-black text-primary">4h</p></Card>
               <Card className="premium-card p-8 text-center border-l-8 border-destructive"><p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Non Justifiées</p><p className="text-4xl font-black text-destructive">0h</p></Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
             <Card className="premium-card p-8">
               <h3 className="text-xl font-black mb-6">Suivi des Tranches</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center"><div><p className="font-bold">Inscription</p><p className="text-xs text-muted-foreground italic">Payé le 12/09/2024</p></div><Badge className="bg-primary">PAYÉ</Badge></div>
                  <div className="flex justify-between items-center"><div><p className="font-bold">Tranche 1</p><p className="text-xs text-muted-foreground italic">Payé le 15/11/2024</p></div><Badge className="bg-primary">PAYÉ</Badge></div>
               </div>
             </Card>
          </TabsContent>

          <TabsContent value="analyse" className="space-y-8">
            {!aiAnalysis ? (
              <Card className="premium-card p-12 text-center border-4 border-dashed bg-muted/20">
                <div className="size-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Sparkles className="size-10 text-muted-foreground" /></div>
                <h3 className="text-2xl font-black mb-4">Besoin d'un éclairage pédagogique ?</h3>
                <Button onClick={handleAnalyzeResults} disabled={analyzing} className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-12 font-black shadow-xl shadow-primary/20">
                  {analyzing ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Zap className="mr-2 size-6" />}
                  Lancer l'Analyse Maintenant
                </Button>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-12 animate-in fade-in zoom-in-95 duration-500">
                <Card className="md:col-span-8 premium-card p-10 border-l-[12px] border-primary">
                  <div className="flex justify-between items-start mb-8"><Badge className="bg-primary px-4 py-1.5 font-black text-xs">SYNTHÈSE IA</Badge></div>
                  <div className="space-y-10">
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground"><CheckCircle2 className="size-6 text-primary" /> Observation Académique</h4>
                      <p className="text-lg text-foreground/80 leading-relaxed font-medium italic bg-muted/30 p-6 rounded-3xl">"{aiAnalysis.academicFeedback}"</p>
                    </section>
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground"><FileText className="size-6 text-primary" /> Synthèse Globale</h4>
                      <div className="text-base text-foreground/80 font-medium">{aiAnalysis.summaryReport}</div>
                    </section>
                  </div>
                </Card>
                <div className="md:col-span-4 space-y-6">
                  <Card className="premium-card p-8 bg-foreground text-white">
                    <h4 className="text-xl font-black mb-6 flex items-center gap-3"><Zap className="size-6 text-primary fill-primary" /> Plan d'Action</h4>
                    <div className="space-y-4">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                          <span className="size-6 flex items-center justify-center bg-primary text-white text-[10px] font-black rounded-full shrink-0">{i + 1}</span>
                          <p className="text-sm font-bold text-white/90 leading-tight">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


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
  ChevronRight
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
import { toast } from "@/hooks/use-toast"
import { generateBulletinPDF, type BulletinData } from "@/lib/bulletin-generator"

const progressionData = [
  { name: "Sem 1", value: 14.5 },
  { name: "Sem 2", value: 15.2 },
  { name: "Sem 3", value: 14.8 },
  { name: "Sem 4", value: 16.5 },
  { name: "Sem 5", value: 16.1 },
  { name: "Sem 6", value: 17.2 },
]

const academicHistory = [
  { year: "2023-2024", class: "1ère D1", avg: 15.82, rank: "3ème", result: "Admis", bulletins: 3 },
  { year: "2022-2023", class: "2nde C", avg: 14.25, rank: "5ème", result: "Admis", bulletins: 3 },
  { year: "2021-2022", class: "3ème D1", avg: 16.10, rank: "1er", result: "Admis (BEPC)", bulletins: 3 },
]

export default function StudentDetailPage() {
  const { id } = useParams()

  const handleGenerateBulletin = async () => {
    toast({
      title: "Génération en cours",
      description: "Le bulletin officiel haute qualité est en cours de création...",
    })

    const mockData: BulletinData = {
      schoolInfo: {
        name: "Collège Acadex Elite",
        motto: "Discipline - Travail - Succès",
        address: "Cotonou, Quartier Fidjrossè",
        phone: "+229 97 00 00 00",
        academicYear: "2024-2025"
      },
      student: {
        id: id as string,
        fullName: "Koffi Djimon",
        matricule: "AC-2024-042",
        classId: "TERMINALE S1",
        dob: "12/04/2006",
        sex: "Masculin",
        rank: 2,
        effectif: 42,
        principalTeacher: "M. Dossou Marc"
      },
      term: "1er Trimestre",
      grades: [
        { subject: "Mathématiques", coef: 5, quiz: 18.5, exam: 17.5, avg: 18, weighted: 90, rank: 1, appreciation: "Excellent travail." },
        { subject: "Physique-Chimie", coef: 4, quiz: 16.0, exam: 15.5, avg: 15.75, weighted: 63, rank: 3, appreciation: "Très bon élève." },
        { subject: "SVT", coef: 3, quiz: 14.5, exam: 15.0, avg: 14.75, weighted: 44.25, rank: 5, appreciation: "Satisfaisant." },
        { subject: "Français", coef: 3, quiz: 12.0, exam: 13.0, avg: 12.5, weighted: 37.5, rank: 12, appreciation: "Assez bien." },
        { subject: "Anglais", coef: 2, quiz: 11.5, exam: 10.0, avg: 10.75, weighted: 21.5, rank: 18, appreciation: "Doit s'investir plus." },
        { subject: "Histoire-Géo", coef: 2, quiz: 13.5, exam: 14.0, avg: 13.75, weighted: 27.5, rank: 8, appreciation: "Bonne participation." },
      ],
      discipline: {
        absencesJustified: 1,
        absencesUnjustified: 0,
        delays: 2,
        behavior: "Excellent"
      },
      councilDecision: "Tableau d'Honneur avec Félicitations"
    }

    await generateBulletinPDF(mockData)
    toast({
      title: "Succès",
      description: "Bulletin PDF généré et téléchargé.",
    })
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
            <Button onClick={handleGenerateBulletin} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-base">
              <Download className="mr-2 size-5" />
              Générer Bulletin PDF Premium
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
              <Share2 className="mr-2 size-5" />
              Partager
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
          <div className="h-48 bg-primary relative">
            <div className="absolute -bottom-16 left-16">
              <Avatar className="size-40 border-8 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${id}/400/400`} />
                <AvatarFallback className="bg-primary text-white text-5xl font-black">KD</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="pt-20 pb-10 px-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-foreground">Koffi Djimon</h1>
                  <Badge className="bg-primary hover:bg-primary px-5 py-1 rounded-full font-black text-sm">TERMINALE S1</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-3 font-semibold text-lg">
                  Matricule: AC-2024-042 • Né le 12/04/2006 • Cotonou, Bénin
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold">Actif</Badge>
                  <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold">Boursier</Badge>
                  <Badge variant="outline" className="rounded-full border-amber-600/20 text-amber-600 font-bold flex gap-1 items-center">
                    <History className="size-3" /> Historique Disponible
                  </Badge>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center px-8 py-4 bg-muted/50 rounded-3xl border border-muted shadow-sm">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Moyenne Générale</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-black text-primary">16.54</p>
                    <TrendingUp className="size-5 text-primary" />
                  </div>
                </div>
                <div className="text-center px-8 py-4 bg-muted/50 rounded-3xl border border-muted shadow-sm">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Rang Global</p>
                  <p className="text-3xl font-black text-foreground">2<sup>ème</sup></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="suivi" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="suivi" className="rounded-2xl font-bold px-8">Suivi Actuel</TabsTrigger>
            <TabsTrigger value="parcours" className="rounded-2xl font-bold px-8 flex gap-2">
              <History className="size-4" /> Parcours Permanent
            </TabsTrigger>
            <TabsTrigger value="discipline" className="rounded-2xl font-bold px-8">Discipline</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-bold px-8">Finances</TabsTrigger>
          </TabsList>

          <TabsContent value="suivi" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-12">
              <div className="md:col-span-8 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Carnet de Suivi Intelligent</CardTitle>
                      <CardDescription>Évolution des performances sur le semestre</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black bg-primary/10 px-4 py-2 rounded-2xl">
                      <TrendingUp className="size-5" />
                      +8.4%
                    </div>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progressionData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14532D" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#14532D" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} domain={[0, 20]} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#14532D" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Matières Fortes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {[
                        { subject: "Mathématiques", score: 18.5, trend: "up" },
                        { subject: "Physique-Chimie", score: 17.2, trend: "up" },
                        { subject: "SVT", score: 16.8, trend: "stable" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center text-sm font-black">
                            <div className="flex items-center gap-2">
                              {item.subject}
                              {item.trend === 'up' ? <TrendingUp className="size-3 text-primary" /> : <div className="size-3 bg-muted rounded-full" />}
                            </div>
                            <span className="text-primary">{item.score}/20</span>
                          </div>
                          <Progress value={item.score * 5} className="h-2.5 rounded-full" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Points d'Amélioration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {[
                        { subject: "Anglais", score: 11.5, trend: "down" },
                        { subject: "Français", score: 12.0, trend: "up" },
                        { subject: "Histoire-Géo", score: 13.5, trend: "stable" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center text-sm font-black">
                            <div className="flex items-center gap-2">
                              {item.subject}
                              {item.trend === 'down' ? <TrendingDown className="size-3 text-destructive" /> : <TrendingUp className="size-3 text-primary" />}
                            </div>
                            <span className="text-amber-600">{item.score}/20</span>
                          </div>
                          <Progress value={item.score * 5} className="h-2.5 rounded-full" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="md:col-span-4 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                      <Award className="size-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Distinction Académique</h4>
                      <p className="text-xs text-muted-foreground font-bold">Tableau d'Honneur - Mars 2024</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">
                    Koffi est officiellement nominé pour le prix d'excellence de fin d'année dans la catégorie "Sciences Exactes".
                  </p>
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black rounded-2xl h-12">
                    Voir Palmarès
                  </Button>
                </Card>

                <Card className="border-none shadow-lg bg-primary text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles className="size-48" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <Sparkles className="size-7" />
                    Analyse IA
                  </h3>
                  <p className="text-base text-primary-foreground/90 leading-relaxed mb-8">
                    "Koffi présente un profil d'excellence scientifique. Une attention particulière sur l'Anglais équilibrerait son dossier pour des bourses internationales."
                  </p>
                  <Button variant="secondary" className="w-full bg-white text-primary font-black rounded-2xl h-12 px-8">
                    Voir recommandations
                  </Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parcours" className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <div className="p-10 border-b flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Mémoire Académique</CardTitle>
                  <CardDescription className="text-base">Historique consolidé de l'élève au sein de l'établissement.</CardDescription>
                </div>
                <Button className="bg-primary rounded-xl font-black gap-2">
                  <Download className="size-4" /> Export Dossier Complet
                </Button>
              </div>
              <div className="divide-y divide-muted/30">
                {academicHistory.map((h, i) => (
                  <div key={i} className="p-8 hover:bg-muted/5 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="size-16 bg-muted rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Calendar className="size-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-foreground">Année {h.year}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black">{h.class}</Badge>
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <FileText className="size-3" /> {h.bulletins} bulletins archivés
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 flex-1 md:max-w-md">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Moyenne</p>
                        <p className="text-xl font-black text-foreground">{h.avg.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Rang</p>
                        <p className="text-xl font-black text-primary">{h.rank}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Décision</p>
                        <Badge className="bg-emerald-500 font-black px-3">{h.result}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl border-2 font-bold px-4 h-10">Consulter</Button>
                      <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                        <ChevronRight className="size-6" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="premium-card p-8 bg-primary text-white relative overflow-hidden">
                <h4 className="text-xl font-black mb-4">Statistiques de Parcours</h4>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium opacity-80">Moyenne Cumulative</p>
                    <p className="text-3xl font-black">15.42/20</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium opacity-80">Assiduité Totale</p>
                    <p className="text-3xl font-black">98.2%</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium opacity-80">Ancienneté</p>
                    <p className="text-3xl font-black">4 Ans</p>
                  </div>
                </div>
                <Database className="absolute -bottom-8 -right-8 size-48 opacity-10" />
              </Card>
              
              <Card className="premium-card p-8 border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <History className="size-8" />
                </div>
                <h4 className="text-xl font-black">Certificat de Scolarité</h4>
                <p className="text-sm text-muted-foreground font-medium max-w-xs">Générez un certificat officiel attestant du parcours complet de l'élève.</p>
                <Button variant="outline" className="rounded-xl border-2 font-bold px-8">Générer Document</Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

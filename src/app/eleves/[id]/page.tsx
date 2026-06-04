
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
  Award
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

            <Card className="border-none shadow-lg bg-primary text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="size-48" />
              </div>
              <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                <Sparkles className="size-7" />
                Analyse Prédictive ACADEX
              </h3>
              <p className="text-lg text-primary-foreground/90 leading-relaxed mb-8">
                "Koffi présente un profil d'excellence scientifique. Son évolution en Mathématiques suggère un potentiel pour les concours nationaux. Une attention particulière sur l'Anglais permettrait d'équilibrer son dossier pour des bourses internationales."
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" className="bg-white text-primary font-black rounded-2xl h-12 px-8">
                  Voir recommandations
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-12 rounded-2xl">
                  Historique IA
                </Button>
              </div>
            </Card>
          </div>

          <div className="md:col-span-4 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <ShieldCheck className="size-6 text-primary" />
                  Carnet Disciplinaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-primary hover:bg-primary px-4 py-1 rounded-full font-black">EXCELLENT</Badge>
                    <span className="text-xs font-black text-primary">CONDUITE : 19/20</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Élève exemplaire, moteur pour sa classe. Respect absolu des valeurs de l'établissement.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Avertissements</p>
                    <p className="text-2xl font-black text-foreground">0</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Retards</p>
                    <p className="text-2xl font-black text-foreground">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <CreditCard className="size-6 text-primary" />
                  Situation Financière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total Payé</p>
                    <p className="text-2xl font-black text-foreground">320,000 FCFA</p>
                  </div>
                  <Badge className="bg-primary px-4 py-1 rounded-full font-black">À JOUR</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Scolarité : 100%</span>
                    <span className="text-muted-foreground">Reste : 0 FCFA</span>
                  </div>
                  <Progress value={100} className="h-3 rounded-full" />
                </div>
                <Button variant="ghost" className="w-full text-primary font-black text-sm h-12 hover:bg-primary/5 rounded-2xl">
                  Voir historique des reçus <Share2 className="size-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

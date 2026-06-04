
"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ChevronLeft,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  FileText,
  History,
  Award,
  BookOpen,
  UserPlus
} from "lucide-react"
import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const progressionData = [
  { name: "S1", value: 14.5 },
  { name: "S2", value: 15.2 },
  { name: "S3", value: 14.8 },
  { name: "S4", value: 16.5 },
  { name: "S5", value: 16.1 },
  { name: "S6", value: 17.2 },
]

export default function StudentDetailPage() {
  const { id } = useParams()

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/eleves" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold">
            <ChevronLeft className="size-4" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 rounded-full border-2">
              <FileText className="mr-2 size-4" />
              Bulletin PDF
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-11 px-6">
              Modifier Profil
            </Button>
          </div>
        </div>

        {/* Header Profile */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
          <div className="h-32 bg-primary relative">
            <div className="absolute -bottom-12 left-12">
              <Avatar className="size-32 border-8 border-white shadow-xl">
                <AvatarImage src={`https://picsum.photos/seed/${id}/200/200`} />
                <AvatarFallback className="bg-primary text-white text-3xl font-black">KD</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="pt-16 pb-8 px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-foreground">Koffi Djimon</h1>
                  <Badge className="bg-primary hover:bg-primary px-3 rounded-full font-bold">TERMINALE S1</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 font-medium">
                  Matricule: AC-2024-042 • Né le 12/04/2006 • Cotonou, Bénin
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-6 py-2 bg-muted/50 rounded-2xl border border-muted">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Moyenne Générale</p>
                  <p className="text-2xl font-black text-primary">16.54/20</p>
                </div>
                <div className="text-center px-6 py-2 bg-muted/50 rounded-2xl border border-muted">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rang Global</p>
                  <p className="text-2xl font-black text-foreground">2<sup>ème</sup></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Main Content - Progression */}
          <div className="md:col-span-8 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Graphique de Progression</CardTitle>
                  <CardDescription>Évolution des moyennes par semaine</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none font-bold">
                  <TrendingUp className="size-3 mr-1" />
                  +8% ce mois
                </Badge>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} domain={[0, 20]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#14532D" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#14532D', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-base">Matières Fortes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { subject: "Mathématiques", score: 18.5, color: "bg-primary" },
                    { subject: "Physique-Chimie", score: 17.2, color: "bg-primary" },
                    { subject: "SVT", score: 16.8, color: "bg-primary" },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>{item.subject}</span>
                        <span className="text-primary">{item.score}/20</span>
                      </div>
                      <Progress value={item.score * 5} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-base">Points d'Amélioration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { subject: "Anglais", score: 11.5, color: "bg-amber-500" },
                    { subject: "Français", score: 12.0, color: "bg-amber-500" },
                    { subject: "Histoire-Géo", score: 13.5, color: "bg-primary" },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>{item.subject}</span>
                        <span className="text-amber-600">{item.score}/20</span>
                      </div>
                      <Progress value={item.score * 5} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar Info - Discipline & Payments */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Carnet de Discipline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl border border-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-primary/10 text-primary border-none rounded-full">EXCELLENT</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Note de conduite: 19/20</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Élève exemplaire. Participation active en classe et respect strict du règlement intérieur.
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 border-l-4 border-primary bg-primary/5 rounded-r-xl">
                  <div className="text-sm font-bold">0 Avertissement</div>
                  <div className="text-[10px] font-bold text-muted-foreground">CE TRIMESTRE</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  Situation Financière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Payé</p>
                    <p className="text-xl font-black text-foreground">320,000 FCFA</p>
                  </div>
                  <Badge className="bg-primary rounded-full font-bold">SOLDE À JOUR</Badge>
                </div>
                <Progress value={100} className="h-2" />
                <Button variant="ghost" className="w-full text-primary font-bold text-xs h-10 hover:bg-primary/5">
                  Historique des reçus <ChevronRight className="size-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary text-white p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Award className="size-6" />
                </div>
                <h3 className="font-bold">Mention d'Excellence</h3>
              </div>
              <p className="text-xs text-white/80 leading-relaxed mb-6">
                Félicitations ! Koffi Djimon est éligible pour le tableau d'honneur du mois de Mars 2024.
              </p>
              <Button className="w-full bg-white text-primary font-bold rounded-xl h-11 hover:bg-white/90">
                Générer Certificat
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

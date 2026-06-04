
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle,
  FileDown,
  ChevronRight,
  UserCheck,
  UserX,
  PieChart as PieChartIcon,
  Sparkles
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  Legend
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const academicPerformance = [
  { level: "6ème", moyenne: 12.5, success: 88 },
  { level: "5ème", moyenne: 11.8, success: 82 },
  { level: "4ème", moyenne: 13.2, success: 91 },
  { level: "3ème", moyenne: 10.9, success: 75 },
  { level: "2nde", moyenne: 14.1, success: 94 },
  { level: "1ère", moyenne: 12.8, success: 85 },
  { level: "Tle", moyenne: 15.2, success: 98 },
]

const financialCollection = [
  { tranche: "Inscription", rate: 100, color: "#14532D" },
  { tranche: "Tranche 1", rate: 84, color: "#166534" },
  { tranche: "Tranche 2", rate: 45, color: "#15803d" },
  { tranche: "Examen", rate: 12, color: "#B91C1C" },
]

const genderDistribution = [
  { name: "Filles", value: 642, color: "#14532D" },
  { name: "Garçons", value: 606, color: "#111827" },
]

const seriesDistribution = [
  { series: "Série A", count: 245 },
  { series: "Série C", count: 82 },
  { series: "Série D", count: 320 },
  { series: "G2/G3", count: 115 },
]

export default function StatisticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Intelligence Établissement</h1>
            <p className="text-muted-foreground mt-2 font-medium">Analyse multidimensionnelle des performances Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6 bg-white">
              Année 2025-2026
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <FileDown className="mr-2 size-5" />
              Exporter Rapport Complet
            </Button>
          </div>
        </div>

        {/* High-Level KPIs */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Effectif Global", value: "1,248", sub: "Élèves", icon: Users, trend: "+12%" },
            { label: "Moyenne École", value: "13.24", sub: "/20", icon: GraduationCap, trend: "+0.4" },
            { label: "Taux de Réussite", value: "86.4%", sub: "Objectif 90%", icon: CheckCircle2, trend: "+2.1%" },
            { label: "Recouvrement", value: "84.2M", sub: "FCFA", icon: CreditCard, trend: "+14%" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                    <kpi.icon className="size-6" />
                  </div>
                  <Badge className="bg-primary/5 text-primary border-none font-black text-[10px]">{kpi.trend}</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{kpi.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{kpi.value}</span>
                  <span className="text-xs font-bold text-muted-foreground">{kpi.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="academique" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="academique" className="rounded-2xl font-bold px-8 flex gap-2">
              <GraduationCap className="size-4" /> Académique
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-bold px-8 flex gap-2">
              <CreditCard className="size-4" /> Finance
            </TabsTrigger>
            <TabsTrigger value="effectifs" className="rounded-2xl font-bold px-8 flex gap-2">
              <Users className="size-4" /> Effectifs
            </TabsTrigger>
            <TabsTrigger value="vie-scolaire" className="rounded-2xl font-bold px-8 flex gap-2">
              <Calendar className="size-4" /> Vie Scolaire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academique" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Performance par Niveau</CardTitle>
                  <CardDescription>Comparaison des moyennes générales du 1er Trimestre.</CardDescription>
                </CardHeader>
                <div className="h-[400px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={academicPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="moyenne" radius={[8, 8, 0, 0]}>
                        {academicPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.moyenne >= 12 ? '#14532D' : entry.moyenne >= 10 ? '#15803d' : '#B91C1C'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl font-black">Top Classes</CardTitle>
                  <CardDescription>Les sections d'élite Acadex.</CardDescription>
                </CardHeader>
                <div className="space-y-6 mt-6">
                  {academicPerformance.sort((a, b) => b.moyenne - a.moyenne).slice(0, 5).map((lvl, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-primary/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-muted-foreground w-4">{i + 1}</span>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{lvl.level}</p>
                      </div>
                      <Badge className="bg-primary px-3 rounded-full font-black">{lvl.moyenne}/20</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">État des Recouvrements</CardTitle>
                  <CardDescription>Taux de paiement par type de tranche.</CardDescription>
                </CardHeader>
                <div className="h-[350px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={financialCollection}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="tranche" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} width={100} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                        {financialCollection.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10 bg-foreground text-white">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Trésorerie Projetée</CardTitle>
                  <CardDescription className="text-white/60">Estimations basées sur le recouvrement actuel.</CardDescription>
                </CardHeader>
                <div className="mt-12 space-y-12">
                  <div>
                    <div className="flex justify-between mb-4">
                      <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Recettes Effectives</span>
                      <span className="text-2xl font-black">84,250,000 F</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[84%] rounded-full shadow-[0_0_15px_rgba(20,83,45,0.5)]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-4">
                      <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Reste à Recouvrer</span>
                      <span className="text-2xl font-black">15,420,000 F</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[15%] rounded-full" />
                    </div>
                  </div>
                  <Button className="w-full bg-white text-foreground hover:bg-white/90 font-black h-16 rounded-2xl text-lg mt-8">
                    Générer Relances Automatiques
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="effectifs" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-5 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Répartition Genre</CardTitle>
                  <CardDescription>Composition de l'école par sexe.</CardDescription>
                </CardHeader>
                <div className="h-[300px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderDistribution}
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        {genderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="lg:col-span-7 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Distribution par Série</CardTitle>
                  <CardDescription>Nombre d'élèves par parcours académique.</CardDescription>
                </CardHeader>
                <div className="h-[300px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seriesDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="series" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#14532D" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vie-scolaire" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
                    <AlertCircle className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Absences Critiques</h3>
                    <p className="text-xs text-muted-foreground font-bold">Élèves ayant dépassé le quota mensuel.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Sossa Marie", class: "3ème D2", count: 12, trend: "up" },
                    { name: "Koffi Djimon", class: "Tle D1", count: 8, trend: "down" },
                    { name: "Dossou Marc", class: "4ème C", count: 7, trend: "up" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/10">
                      <div>
                        <p className="font-black text-foreground">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.class}</p>
                      </div>
                      <Badge variant="destructive" className="font-black px-4">{item.count} HEURES</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <UserCheck className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Assiduité Enseignants</h3>
                    <p className="text-xs text-muted-foreground font-bold">Taux de présence aux cours programmés.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center h-[200px] space-y-4">
                  <div className="text-6xl font-black text-primary italic">98.4%</div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Record d'assiduité</p>
                  <Button variant="ghost" className="text-primary font-black">Consulter le registre complet</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Insight Card */}
        <Card className="border-none shadow-xl bg-foreground text-white p-12 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-24 bg-primary/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
              <Sparkles className="size-12 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-3xl font-black">Analyse Prédictive ACADEX</h3>
              <p className="text-lg text-white/70 font-medium leading-relaxed">
                "Sur la base des tendances actuelles, nous projetons un taux de réussite de 92% pour le BEPC si le soutien en Mathématiques est maintenu. Le recouvrement financier est en avance de 8% par rapport à l'année dernière à la même période."
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-16 px-12 text-lg shadow-xl shadow-primary/20">
                Rapport Détaillé IA
              </Button>
              <Button variant="ghost" className="text-white/70 hover:text-white font-bold h-12">
                Plus de détails →
              </Button>
            </div>
          </div>
          <BarChart3 className="absolute -bottom-16 -right-16 size-80 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>
      </div>
    </DashboardLayout>
  )
}

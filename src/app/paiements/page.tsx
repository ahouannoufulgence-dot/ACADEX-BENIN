"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  PieChart as PieChartIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Printer,
  History,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

const financialStats = [
  { title: "Recettes Totales", value: "84,250,000", change: "+14%", trend: "up", color: "text-primary" },
  { title: "Reste à Recouvrer", value: "15,420,000", change: "15% total", trend: "down", color: "text-destructive" },
  { title: "Taux de Recouvrement", value: "84.2%", change: "+5% vs 2023", trend: "up", color: "text-primary" },
  { title: "Dépenses Mensuelles", value: "12,100,000", change: "-2%", trend: "down", color: "text-primary" },
]

const paymentData = [
  { name: "Payé", value: 84, color: "#14532D" },
  { name: "En Attente", value: 10, color: "#111827" },
  { name: "Impayé", value: 6, color: "#B91C1C" },
]

const recentPayments = [
  { id: "1", name: "Koffi Djimon", class: "Tle D2", amount: "120,000 FCFA", type: "Tranche 2", date: "Aujourd'hui, 09:45", status: "Payé", receiptId: "RC-25-001", totalOwed: 150000, paidSoFar: 120000 },
  { id: "2", name: "Amoussou Marie", class: "3ème D1", amount: "45,000 FCFA", type: "Inscription", date: "Aujourd'hui, 08:30", status: "Payé", receiptId: "RC-25-002", totalOwed: 135000, paidSoFar: 45000 },
  { id: "3", name: "Tidjani Amadou", class: "Tle C", amount: "210,000 FCFA", type: "Scolarité Totale", date: "Hier", status: "Payé", receiptId: "RC-25-003", totalOwed: 210000, paidSoFar: 210000 },
  { id: "4", name: "Sossa Luc", class: "6ème A", amount: "15,000 FCFA", type: "Transport", date: "Hier", status: "Payé", receiptId: "RC-25-004", totalOwed: 15000, paidSoFar: 15000 },
]

export default function PaymentsPage() {
  const handlePrintReceipt = (receiptId: string) => {
    toast({
      title: "Génération du Reçu",
      description: `Le reçu officiel ${receiptId} a été généré avec succès.`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Trésorerie & Finance</h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi des écolages et frais annexes (Session 2025-2026).</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6">
              <Download className="mr-2 size-5" /> Exporter Grand Livre
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Plus className="mr-2 size-5" /> Encaisser Tranche
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {financialStats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                    <DollarSign className="size-7" />
                  </div>
                  <div className={`flex items-center font-black text-xs ${stat.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</h3>
                <div className="text-2xl font-black mt-1 text-foreground">{stat.value} FCFA</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Chart Section */}
          <Card className="md:col-span-5 border-none shadow-sm bg-white rounded-[2.5rem] p-10 flex flex-col">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-black">Santé Financière</CardTitle>
              <CardDescription className="text-base">Répartition du recouvrement annuel</CardDescription>
            </CardHeader>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
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
            <div className="mt-8 p-6 bg-muted/30 rounded-3xl">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-black text-muted-foreground">Taux Global</span>
                <span className="text-3xl font-black text-primary">84.2%</span>
              </div>
              <Progress value={84.2} className="h-3 rounded-full bg-muted/50" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-4 text-center">Objectif : 100% au 15 Juin 2026</p>
            </div>
          </Card>

          {/* Detailed Transaction List */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                <Input placeholder="Chercher un élève ou un reçu..." className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold" />
              </div>
              <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6">
                <Filter className="mr-2 size-4" /> Filtres
              </Button>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <div className="divide-y divide-muted/30">
                {recentPayments.map((pay) => (
                  <div key={pay.id} className="p-8 hover:bg-muted/10 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-white rounded-2xl shadow-sm border border-muted/50 flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                          {pay.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{pay.name}</h4>
                            <Badge variant="outline" className="text-[10px] py-0 border-primary/20 text-primary font-bold">{pay.type}</Badge>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{pay.class} • {pay.receiptId}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-2xl font-black text-foreground">{pay.amount}</p>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{pay.date}</span>
                          <Badge className="bg-primary font-black rounded-full px-4 border-none">VALIDÉ</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Progress inside list item */}
                    <div className="mt-6 pt-6 border-t border-dashed border-muted/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                          <span>Couverture Écolage</span>
                          <span>{Math.round((pay.paidSoFar / pay.totalOwed) * 100)}%</span>
                        </div>
                        <Progress value={(pay.paidSoFar / pay.totalOwed) * 100} className="h-2 rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => handlePrintReceipt(pay.receiptId)} variant="outline" size="sm" className="rounded-xl border-2 font-black">
                          <Printer className="size-4 mr-2" /> Reçu PDF
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <ChevronRight className="size-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-muted/20 border-t border-muted/30 text-center">
                <Button variant="ghost" className="text-primary font-black h-12 rounded-2xl hover:bg-primary hover:text-white transition-all w-full text-base">
                  Accéder au Journal Comptable Complet <ChevronRight className="size-5 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Warning card for Unpaid tranches */}
        <Card className="border-none shadow-xl bg-destructive p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="size-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
              <History className="size-10 text-white" />
            </div>
            <div className="flex-1 text-white">
              <h3 className="text-2xl font-black mb-2">Alerte Échéances - Trimestre 2</h3>
              <p className="text-white/80 font-medium leading-relaxed max-w-2xl">
                Il reste 15.4M FCFA à recouvrer avant les compositions du 2ème trimestre. 42 élèves n'ont pas encore soldé l'inscription.
              </p>
            </div>
            <Button className="bg-white text-destructive hover:bg-white/90 font-black rounded-2xl h-14 px-10 shadow-2xl">
              Lancer les Relances SMS
            </Button>
          </div>
          <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <DollarSign className="size-64" />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
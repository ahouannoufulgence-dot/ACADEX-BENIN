
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
  History
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
  { id: "1", name: "Koffi Djimon", class: "Terminale S1", amount: "120,000 FCFA", type: "Scolarité", date: "Aujourd'hui, 09:45", status: "Payé", receiptId: "RC-2024-001" },
  { id: "2", name: "Amoussou Marie", class: "3ème A", amount: "45,000 FCFA", type: "Cantine", date: "Aujourd'hui, 08:30", status: "Partiel", receiptId: "RC-2024-002" },
  { id: "3", name: "Tidjani Amadou", class: "Terminale S1", amount: "210,000 FCFA", type: "Scolarité", date: "Hier", status: "Payé", receiptId: "RC-2024-003" },
  { id: "4", name: "Sossa Luc", class: "6ème B", amount: "15,000 FCFA", type: "Transport", date: "Hier", status: "Payé", receiptId: "RC-2024-004" },
]

export default function PaymentsPage() {
  const handlePrintReceipt = (receiptId: string) => {
    toast({
      title: "Impression",
      description: `Génération du reçu ${receiptId} en cours...`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion Financière</h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi temps réel du recouvrement et de la trésorerie.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6">
              <Download className="mr-2 size-5" />
              Exporter Grand Livre
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Plus className="mr-2 size-5" />
              Nouveau Paiement
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
          <Card className="md:col-span-5 border-none shadow-sm bg-white rounded-[2.5rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold">Répartition du Recouvrement</CardTitle>
              <CardDescription className="font-medium">Visualisation globale de l'année scolaire</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
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
              <div className="mt-4 p-6 bg-muted/30 rounded-3xl">
                <p className="text-xs font-bold text-center text-muted-foreground mb-4">Progression vers l'objectif annuel</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-primary">84.2%</span>
                  <span className="text-[10px] font-black text-muted-foreground">RESTE : 15.4M FCFA</span>
                </div>
                <Progress value={84.2} className="h-3 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Card className="md:col-span-7 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Dernières Transactions</CardTitle>
                <CardDescription className="font-medium">Historique des encaissements validés</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-xl border-2">
                  <History className="size-5" />
                </Button>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-9 h-10 w-48 bg-muted border-none rounded-2xl text-xs font-bold" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/30">
                {recentPayments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-7 hover:bg-muted/10 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="size-14 bg-white rounded-2xl shadow-sm border border-muted/50 flex items-center justify-center text-primary font-black text-xl">
                        {pay.name[0]}
                      </div>
                      <div>
                        <p className="text-base font-black text-foreground group-hover:text-primary transition-colors">{pay.name}</p>
                        <p className="text-xs font-bold text-muted-foreground">{pay.class} • <Badge variant="outline" className="text-[10px] py-0 border-primary/20">{pay.type}</Badge></p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-8">
                      <div className="space-y-1">
                        <p className="text-lg font-black text-foreground">{pay.amount}</p>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{pay.date}</span>
                          <Badge className={`font-black rounded-full px-3 ${pay.status === 'Payé' ? 'bg-primary' : 'bg-amber-500'}`}>{pay.status}</Badge>
                        </div>
                      </div>
                      <Button onClick={() => handlePrintReceipt(pay.receiptId)} variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary">
                        <Printer className="size-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 border-t border-muted/30">
                <Button variant="ghost" className="w-full text-primary font-black h-14 rounded-2xl hover:bg-primary hover:text-white transition-all text-base shadow-none">
                  Accéder au Journal Comptable Complet <ChevronRight className="size-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

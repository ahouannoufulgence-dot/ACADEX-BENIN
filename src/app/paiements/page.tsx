
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
  ArrowDownRight
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
  { id: "1", name: "Koffi Djimon", class: "Terminale S1", amount: "120,000 FCFA", type: "Scolarité", date: "Il y a 2h", status: "Payé" },
  { id: "2", name: "Amoussou Marie", class: "3ème A", amount: "45,000 FCFA", type: "Cantine", date: "Il y a 5h", status: "Partiel" },
  { id: "3", name: "Tidjani Amadou", class: "Terminale S1", amount: "210,000 FCFA", type: "Scolarité", date: "Hier", status: "Payé" },
  { id: "4", name: "Sossa Luc", class: "6ème B", amount: "15,000 FCFA", type: "Transport", date: "Hier", status: "Payé" },
]

export default function PaymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestion Financière</h1>
            <p className="text-muted-foreground mt-1">Suivi des scolarités, cantines et frais annexes.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 rounded-full border-2">
              <Download className="mr-2 size-4" />
              Exporter Bilan
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-11 px-6 font-bold">
              <Plus className="mr-2 size-4" />
              Nouveau Paiement
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {financialStats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                    <DollarSign className="size-6" />
                  </div>
                  {stat.trend === 'up' ? (
                    <div className="flex items-center text-primary font-bold text-xs">
                      <ArrowUpRight className="size-3 mr-1" /> {stat.change}
                    </div>
                  ) : (
                    <div className="flex items-center text-destructive font-bold text-xs">
                      <ArrowDownRight className="size-3 mr-1" /> {stat.change}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="text-2xl font-black mt-1 text-foreground">{stat.value} FCFA</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Chart Section */}
          <Card className="md:col-span-5 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Répartition des Statuts</CardTitle>
              <CardDescription>Visualisation globale du recouvrement</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Card className="md:col-span-7 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transactions Récentes</CardTitle>
                <CardDescription>Derniers encaissements validés</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Chercher un reçu..." className="pl-9 h-9 w-48 bg-muted border-none rounded-full text-xs" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl hover:bg-muted/40 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black">
                        {pay.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{pay.name}</p>
                        <p className="text-xs text-muted-foreground">{pay.class} • {pay.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{pay.amount}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground">{pay.date}</span>
                        <Badge className={pay.status === 'Payé' ? 'bg-primary' : 'bg-amber-500'}>{pay.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-primary font-bold h-12 rounded-xl hover:bg-primary/5">
                Accéder au grand livre comptable <ChevronRight className="size-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

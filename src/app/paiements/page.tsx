
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
  DollarSign,
  ChevronRight,
  Printer,
  History,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

const financialStats = [
  { title: "Recettes Totales", value: "84.2M", change: "+14%", trend: "up" },
  { title: "Reste à Recouvrer", value: "15.4M", change: "15%", trend: "down" },
  { title: "Taux Global", value: "84.2%", change: "+5%", trend: "up" },
  { title: "Dépenses", value: "12.1M", change: "-2%", trend: "down" },
]

const recentPayments = [
  { id: "RC-25-001", name: "Koffi Djimon", class: "Tle D2", amount: "120,000", total: "150,000", type: "Tranche 2", date: "9:45", status: "Partiel" },
  { id: "RC-25-002", name: "Amoussou Marie", class: "3ème D1", amount: "45,000", total: "135,000", type: "Inscription", date: "8:30", status: "Partiel" },
  { id: "RC-25-003", name: "Tidjani Amadou", class: "Tle C", amount: "210,000", total: "210,000", type: "Totalité", date: "Hier", status: "Payé" },
]

export default function PaymentsPage() {
  const [search, setSearch] = useState("")

  const handleConfirm = (name: string) => {
    toast({
      title: "Paiement Validé",
      description: `Le versement pour ${name} a été enregistré et archivé.`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Trésorerie & Finance</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestion simplifiée des écolages et encaissements.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
              <History className="mr-2 size-5" /> Journal
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-lg">
              <Plus className="mr-2 size-5" />
              Confirmer Paiement
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {financialStats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 bg-muted rounded-2xl">
                    <DollarSign className="size-7 text-primary" />
                  </div>
                  <div className={`flex items-center font-black text-xs ${stat.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1 text-foreground">{stat.value} FCFA</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Chercher un élève ou un numéro de reçu..." 
                className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-14 rounded-2xl border-2 font-bold px-8 bg-white">
              <Filter className="mr-2 size-5" /> Filtres Avancés
            </Button>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <div className="divide-y divide-muted/30">
              {recentPayments.map((pay) => (
                <div key={pay.id} className="p-8 hover:bg-muted/5 transition-all group">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="size-16 bg-muted rounded-2xl flex items-center justify-center text-primary font-black text-3xl group-hover:bg-primary group-hover:text-white transition-all">
                        {pay.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-black text-foreground">{pay.name}</h4>
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-bold">{pay.type}</Badge>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{pay.class} • {pay.id}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-3xl font-black text-foreground">{pay.amount} <span className="text-xs text-muted-foreground">FCFA</span></p>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-black text-muted-foreground uppercase">{pay.date}</span>
                        <Badge className={`font-black rounded-full px-4 border-none ${pay.status === 'Payé' ? 'bg-primary' : 'bg-amber-500'}`}>
                          {pay.status === 'Payé' ? 'SOLDE' : 'TRANCHE'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-dashed border-muted/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
                        <span>Couverture de la scolarité</span>
                        <span className="text-foreground">{Math.round((parseInt(pay.amount.replace(',','')) / parseInt(pay.total.replace(',',''))) * 100)}%</span>
                      </div>
                      <Progress value={(parseInt(pay.amount.replace(',','')) / parseInt(pay.total.replace(',',''))) * 100} className="h-2.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={() => handleConfirm(pay.name)} className="bg-primary h-12 rounded-xl font-black px-6">
                        <CheckCircle2 className="size-4 mr-2" /> Valider Reçu
                      </Button>
                      <Button variant="outline" className="h-12 w-12 rounded-xl border-2">
                        <Printer className="size-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <ChevronRight className="size-6" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

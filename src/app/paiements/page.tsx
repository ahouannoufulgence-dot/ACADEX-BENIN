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
  ArrowDownRight,
  FileDown,
  Wallet
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const financialStats = [
  { title: "Recettes Totales", value: "0", change: "0%", trend: "up" },
  { title: "Reste à Recouvrer", value: "0", change: "0%", trend: "down" },
  { title: "Taux Global", value: "0.0%", change: "0%", trend: "up" },
  { title: "Dépenses", value: "0", change: "0%", trend: "down" },
]

export default function PaymentsPage() {
  const [search, setSearch] = useState("")

  const handleExportPDF = () => {
    toast({ title: "Info", description: "Aucune transaction à exporter." })
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
            <Button onClick={handleExportPDF} variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
              <FileDown className="mr-2 size-5" /> Exporter PDF
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-lg">
              <Plus className="mr-2 size-5" />
              Confirmer Paiement
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {financialStats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 bg-muted rounded-2xl">
                    <DollarSign className="size-7 text-primary" />
                  </div>
                  <div className={`flex items-center font-black text-xs ${stat.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                    {stat.change}
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1 text-foreground">{stat.value} FCFA</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
             <div className="size-20 bg-muted rounded-full flex items-center justify-center">
               <Wallet className="size-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-black">Aucun paiement enregistré</h3>
             <p className="text-muted-foreground font-medium max-w-sm">Le registre des paiements s'affichera ici dès la première inscription validée.</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Filter, 
  History, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserX,
  ChevronRight,
  FileDown,
  Scale
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"

export default function DisciplinePage() {
  const handleExportPDF = () => {
    toast({ title: "Info", description: "Aucun incident à exporter." })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Carnet de Discipline</h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi comportemental et éthique des élèves Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <FileDown className="mr-2 size-4" />
              Rapport PDF
            </Button>
            <Button className="bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Signaler Incident
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Incidents", value: "0", icon: ShieldAlert, color: "text-primary" },
            { label: "Exclusions", value: "0", icon: UserX, color: "text-destructive" },
            { label: "Retards Mois", value: "0", icon: Clock, color: "text-amber-600" },
            { label: "Taux Conduite", value: "---", icon: CheckCircle2, color: "text-primary" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none font-bold">Hebdo</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
             <div className="size-20 bg-muted rounded-full flex items-center justify-center">
               <Scale className="size-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-black">Journal de discipline vierge</h3>
             <p className="text-muted-foreground font-medium max-w-sm">Tous les élèves ont une conduite exemplaire. Les rapports d'incidents apparaîtront ici.</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
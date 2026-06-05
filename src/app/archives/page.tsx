"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Database, 
  Calendar, 
  Users, 
  UserSquare2, 
  CreditCard, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Printer,
  History,
  AlertCircle,
  FolderOpen,
  Box
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ArchivesPage() {
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState("2024-2025")

  const handleArchiveYear = () => {
    toast({ title: "Action bloquée", description: "Aucune donnée à archiver pour le moment." })
  }

  const archiveStats = [
    { label: "Années Archivées", value: "0", icon: Calendar, color: "text-primary" },
    { label: "Élèves Historiques", value: "0", icon: Users, color: "text-primary" },
    { label: "Bulletins Scellés", value: "0", icon: FileText, color: "text-amber-600" },
    { label: "Recettes Archivées", value: "0", sub: "FCFA", icon: CreditCard, color: "text-primary" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Archives Institutionnelles</h1>
            <p className="text-muted-foreground mt-2 font-medium">Mémoire numérique et traçabilité historique de l'établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleArchiveYear} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Archive className="mr-2 size-5" />
              Archiver Année Actuelle
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {archiveStats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <ShieldCheck className="size-4 text-emerald-500" />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-xs font-bold text-muted-foreground">{stat.sub}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
             <div className="size-20 bg-muted rounded-full flex items-center justify-center">
               <Box className="size-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-black">Répertoire d'archives vide</h3>
             <p className="text-muted-foreground font-medium max-w-sm">Aucun historique détecté. Les données seront archivées lors de la clôture de l'année scolaire.</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
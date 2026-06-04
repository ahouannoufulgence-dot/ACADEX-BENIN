'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  CreditCard,
  ShieldCheck,
  Zap,
  PieChart as PieChartIcon,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  Lock,
  Sparkles,
  FileDown,
  GraduationCap,
  Calendar,
  Trophy
} from "lucide-react"
import { 
  ResponsiveContainer, 
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useMemo } from "react"
import { jsPDF } from "jspdf"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DashboardPage() {
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState("Directeur")
  const [userClasses, setUserClasses] = useState<string[]>([])

  useEffect(() => {
    setUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  const stats = useMemo(() => {
    if (userRole === "Directeur") {
      return [
        { title: "Élèves Total", value: "1,248", change: "+12", trend: "up", icon: Users },
        { title: "Enseignants", value: "48", change: "Actifs", trend: "up", icon: ShieldCheck },
        { title: "Réussite", value: "94.2%", change: "+2.1%", trend: "up", icon: TrendingUp },
        { title: "Recouvrement", value: "84.2M", sub: "FCFA", change: "84%", trend: "up", icon: CreditCard },
      ]
    } else if (userRole === "Professeur" || userRole === "Enseignant") {
      return [
        { title: "Mes Élèves", value: "156", change: "3 Classes", trend: "up", icon: Users },
        { title: "Moyenne Classe", value: "13.8", change: "+0.5", trend: "up", icon: TrendingUp },
        { title: "Absences Jour", value: "4", change: "-2", trend: "down", icon: Clock },
        { title: "Examens Prévis", value: "2", change: "Cette sem.", trend: "up", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ma Moyenne", value: "15.42", change: "+0.8", trend: "up", icon: GraduationCap },
        { title: "Mon Rang", value: "4ème", change: "Classe", trend: "up", icon: Trophy },
        { title: "Paiements", value: "Payé", change: "À jour", trend: "up", icon: CreditCard },
        { title: "Absences", value: "2", change: "Total", trend: "down", icon: Clock },
      ]
    }
  }, [userRole])

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text(`ACADEX - RAPPORT ${userRole.toUpperCase()}`, 105, 20, { align: "center" })
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(`Utilisateur : ${userName}`, 20, 45)
      doc.text(`Rôle : ${userRole}`, 20, 55)
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 190, 45, { align: "right" })
      
      doc.save(`ACADEX_${userRole}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast({ title: "Succès", description: "Le rapport a été généré." })
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de générer le PDF.", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-2">
              <Sparkles className="size-4 fill-primary" />
              Pilotage Excellence Acadex
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Bonjour Monsieur <span className="text-primary italic">{userName}</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              {userRole === "Directeur" ? "Voici l'état actuel de votre établissement." : `Bienvenue dans votre espace sécurisé (${userRole}).`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 px-6 font-bold bg-white">
              <FileDown className="mr-2 size-5" />
              Rapport PDF
            </Button>
            {userRole === "Directeur" && (
              <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
                <Zap className="mr-2 size-5 fill-white" />
                Rapport IA
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm rounded-3xl group bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-7" />
                  </div>
                  <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="rounded-full font-bold px-3 py-1">
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</h3>
                <div className="text-3xl font-black mt-1 text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userRole === "Directeur" && (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="size-5 text-primary fill-primary/20" />
                <h2 className="text-xl font-black">Centre de Vigilance</h2>
              </div>
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
                <div className="h-1.5 w-full bg-destructive" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                      <ShieldAlert className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SÉCURITÉ</p>
                      <p className="text-sm font-bold leading-relaxed">Modification de note suspecte détectée sur ENS-MATH-042.</p>
                      <Button variant="link" className="p-0 h-auto text-xs font-black text-primary hover:no-underline">Enquêter →</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-8">
              <Card className="border-none shadow-sm bg-white rounded-[2rem] p-10 h-full flex flex-col justify-center text-center space-y-6">
                <div className="size-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto">
                  <Lock className="size-10" />
                </div>
                <h3 className="text-2xl font-black">Contrôle des Trimestres</h3>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">
                  Vous pouvez verrouiller l'édition des notes pour l'ensemble des enseignants une fois les compositions terminées.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" className="border-2 rounded-2xl h-12 px-8 font-black">Déverrouiller</Button>
                  <Button className="bg-primary rounded-2xl h-12 px-8 font-black">Verrouiller T1</Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {(userRole === "Professeur" || userRole === "Enseignant") && (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                <h3 className="text-xl font-black mb-6">Mes Classes Actives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userClasses.map((cls, i) => (
                    <div key={i} className="p-6 bg-muted/30 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-primary font-black">{cls}</Badge>
                        <GraduationCap className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="font-black text-lg">42 Élèves</p>
                      <Button asChild variant="link" className="p-0 h-auto font-black text-xs text-primary mt-2">
                        <Link href={`/eleves?class=${cls}`}>Voir la liste →</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="border-none shadow-xl bg-primary text-white p-8 rounded-[2rem] h-full flex flex-col justify-between">
                <div>
                  <Sparkles className="size-8 mb-4 fill-white/20" />
                  <h3 className="text-xl font-black mb-2">Conseil de Classe</h3>
                  <p className="text-sm text-white/70 font-medium">Les bulletins du 1er Trimestre pour la 3ème D sont prêts à être générés via l'IA.</p>
                </div>
                <Button className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl h-12">
                  Lancer l'IA
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

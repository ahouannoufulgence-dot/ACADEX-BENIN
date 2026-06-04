"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Folder, 
  FileCheck, 
  Clock, 
  ShieldCheck,
  Share2,
  MoreVertical,
  ChevronRight,
  HardDrive
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

const documents = [
  { id: "1", name: "Rapport_Trimestriel_T1_2024.pdf", category: "Académique", date: "Il y a 2h", size: "2.4 MB", status: "Signé", type: "pdf" },
  { id: "2", name: "Liste_Eleves_Terminale_S1.xlsx", category: "Administratif", date: "Hier", size: "1.1 MB", status: "Brouillon", type: "excel" },
  { id: "3", name: "Recu_Scolarite_AC-2024-042.pdf", category: "Finance", date: "Il y a 3 jours", size: "450 KB", status: "Validé", type: "pdf" },
  { id: "4", name: "Certificat_Scolarite_Koffi.pdf", category: "Académique", date: "Il y a 1 semaine", size: "320 KB", status: "Signé", type: "pdf" },
  { id: "5", name: "Reglement_Interieur_v2.pdf", category: "Administratif", date: "Il y a 2 semaines", size: "5.8 MB", status: "Public", type: "pdf" },
]

const stats = [
  { label: "Total Documents", value: "1,452", icon: FileText, color: "text-primary" },
  { label: "Validés & Signés", value: "892", icon: FileCheck, color: "text-primary" },
  { label: "Espace Utilisé", value: "4.2 GB", icon: HardDrive, color: "text-amber-600" },
  { label: "Partagés", value: "245", icon: Share2, color: "text-primary" },
]

export default function DocumentsPage() {
  const handleDownload = (name: string) => {
    toast({
      title: "Téléchargement",
      description: `Le fichier ${name} est en cours de préparation...`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Centre de Documents</h1>
            <p className="text-muted-foreground mt-2 font-medium">Archivage sécurisé et gestion des documents officiels Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <Folder className="mr-2 size-5" />
              Nouveau Dossier
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Plus className="mr-2 size-5" />
              Importer
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px]">MAJ</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Categories Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Explorateur</h3>
              <nav className="space-y-1">
                {[
                  { name: "Tous les fichiers", icon: FileText, count: 1452, active: true },
                  { name: "Bulletins de notes", icon: FileCheck, count: 840 },
                  { name: "Documents Admin", icon: ShieldCheck, count: 215 },
                  { name: "Reçus Financiers", icon: Clock, count: 397 },
                ].map((item, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    className={`w-full justify-between rounded-xl h-12 font-bold px-4 ${item.active ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="size-5" />
                      {item.name}
                    </div>
                    <Badge variant="ghost" className="text-[10px] font-black">{item.count}</Badge>
                  </Button>
                ))}
              </nav>

              <div className="mt-12 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                  <span>Stockage Cloud</span>
                  <span>42% utilisé</span>
                </div>
                <Progress value={42} className="h-2 rounded-full" />
                <p className="text-[10px] text-muted-foreground font-medium text-center">4.2 GB sur 10 GB disponibles</p>
                <Button className="w-full h-10 rounded-xl bg-foreground text-white font-bold text-xs mt-4">Augmenter Capacité</Button>
              </div>
            </Card>
          </div>

          {/* Document List */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Rechercher un document..." className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2">
                  <Filter className="size-5" />
                </Button>
                <Tabs defaultValue="list">
                  <TabsList className="bg-white border-2 rounded-2xl h-12 p-1">
                    <TabsTrigger value="grid" className="rounded-xl font-bold px-6">Grille</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl font-bold px-6">Liste</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <div className="divide-y divide-muted/30">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col md:flex-row md:items-center justify-between p-7 hover:bg-muted/10 transition-all group">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                      <div className={`size-14 rounded-2xl flex items-center justify-center shadow-sm border border-muted/50 transition-transform group-hover:scale-110 ${doc.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <FileText className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">{doc.name}</h4>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px] font-black rounded-full border-muted text-muted-foreground py-0">{doc.category}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Clock className="size-3" />
                            {doc.date}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">{doc.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Status</p>
                        <Badge className={`rounded-full px-3 font-black text-[10px] ${doc.status === 'Signé' ? 'bg-primary' : doc.status === 'Validé' ? 'bg-primary/80' : 'bg-muted text-muted-foreground'}`}>
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleDownload(doc.name)} variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Download className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Share2 className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <MoreVertical className="size-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-muted/20 border-t border-muted/30 text-center">
                <Button variant="ghost" className="text-primary font-black hover:bg-transparent group">
                  Voir plus de documents
                  <ChevronRight className="size-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>

            {/* AI Document Insight Card */}
            <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3rem] relative overflow-hidden group">
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="size-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                  <ShieldCheck className="size-10 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-black">Sécurité & Intégrité Acadex</h3>
                  <p className="text-white/70 font-medium leading-relaxed">
                    Tous vos documents sont cryptés et sauvegardés quotidiennement. Le système de signature électronique garantit l'authenticité de chaque bulletin généré par l'établissement.
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-14 px-10 shadow-xl shadow-primary/20">
                  Vérifier l'Authenticité
                </Button>
              </div>
              <div className="absolute -top-12 -right-12 p-20 opacity-[0.05] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                <FileText className="size-64" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

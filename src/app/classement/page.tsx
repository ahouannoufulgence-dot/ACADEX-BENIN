
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  TrendingUp, 
  UserPlus, 
  Search, 
  Filter, 
  ChevronRight,
  GraduationCap,
  Medal,
  Star
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from "recharts"
import { Input } from "@/components/ui/input"

const topStudents = [
  { id: "1", name: "Tidjani Amadou", class: "Terminale S1", average: 18.12, rank: 1, trend: "+0.5" },
  { id: "2", name: "Koffi Djimon", class: "Terminale S1", average: 17.54, rank: 2, trend: "+1.2" },
  { id: "3", name: "Sossa Marie", class: "3ème A", average: 17.10, rank: 3, trend: "-0.2" },
  { id: "4", name: "Amoussou Marc", class: "6ème B", average: 16.85, rank: 4, trend: "+2.1" },
  { id: "5", name: "Dossou Julie", class: "1ère D", average: 16.42, rank: 5, trend: "+0.8" },
]

export default function RankingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Classement Élite</h1>
            <p className="text-muted-foreground mt-2 font-medium">Les meilleurs talents de l'établissement Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold">
              <Filter className="mr-2 size-4" />
              Filtrer par niveau
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              Générer Rapport Global
            </Button>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {topStudents.slice(0, 3).map((student, index) => (
            <Card key={student.id} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden transform hover:scale-105 transition-all duration-500 ${index === 0 ? 'bg-primary text-white' : 'bg-white'}`}>
              <CardContent className="p-8 text-center relative">
                <div className="absolute top-6 right-6">
                  {index === 0 ? <Medal className="size-10 text-amber-400" /> : index === 1 ? <Medal className="size-8 text-slate-300" /> : <Medal className="size-8 text-amber-600" />}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="size-28 border-4 border-white/20 shadow-2xl">
                    <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} />
                    <AvatarFallback className="text-primary font-black text-2xl"> {student.name.substring(0, 2)} </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black">{student.name}</h3>
                    <p className={`text-sm font-bold ${index === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>{student.class}</p>
                  </div>
                  <div className="mt-4 space-y-2 w-full">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-white/50' : 'text-muted-foreground'}`}>Moyenne Générale</p>
                    <p className="text-4xl font-black">{student.average}</p>
                    <Badge className={`${index === 0 ? 'bg-white text-primary' : 'bg-primary'} font-black rounded-full px-4`}>
                      RANG : {student.rank}<sup>{student.rank === 1 ? 'er' : 'ème'}</sup>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Ranking Table */}
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div>
              <CardTitle className="text-2xl font-black">Top 50 Acadex</CardTitle>
              <CardDescription className="font-medium">Évaluations basées sur le 1er Semestre 2024</CardDescription>
            </div>
            <div className="relative w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
              <Input placeholder="Chercher un élève..." className="pl-12 h-12 bg-muted/50 border-none rounded-2xl font-bold" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                    <th className="px-8 py-5 text-left">Rang</th>
                    <th className="px-8 py-5 text-left">Élève</th>
                    <th className="px-8 py-5 text-left">Classe</th>
                    <th className="px-8 py-5 text-right">Moyenne</th>
                    <th className="px-8 py-5 text-right">Tendance</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {topStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-6">
                        <span className={`flex items-center justify-center size-10 rounded-2xl font-black text-sm ${student.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-foreground'}`}>
                          {student.rank}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-12 shadow-sm border-2 border-white group-hover:border-primary/20 transition-all">
                            <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} />
                            <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-black text-foreground">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-muted-foreground">{student.class}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-lg font-black text-primary">{student.average}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Badge variant="outline" className={`rounded-full font-black ${student.trend.startsWith('+') ? 'text-primary border-primary/20 bg-primary/5' : 'text-destructive border-destructive/20 bg-destructive/5'}`}>
                          {student.trend.startsWith('+') ? <TrendingUp className="size-3 mr-1" /> : <TrendingUp className="size-3 mr-1 rotate-180" />}
                          {student.trend}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                          <ChevronRight className="size-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

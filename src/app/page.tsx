
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCog, GraduationCap, UserCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const roles = [
    {
      title: "Directeur",
      desc: "Piloter l'établissement et la stratégie scolaire",
      icon: UserCog,
      href: "/register/director",
      color: "bg-primary",
      buttonText: "Espace Directeur"
    },
    {
      title: "Enseignant",
      desc: "Gérer mes classes et mes évaluations",
      icon: UserCircle2,
      href: "/register/teacher",
      color: "bg-foreground",
      buttonText: "Espace Enseignant"
    },
    {
      title: "Élève / Parent",
      desc: "Suivre mes notes et ma progression",
      icon: GraduationCap,
      href: "/register/student",
      color: "bg-amber-600",
      buttonText: "Espace Élève"
    }
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#F8FAFC] overflow-hidden">
      {/* Background subtil */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="size-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl">
              <span className="text-white font-black text-4xl">A</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="size-4" />
            Écosystème ACADEX Bénin
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Bienvenue sur votre <span className="text-primary italic">Cockpit</span>
          </h1>
          <p className="text-lg text-muted-foreground font-semibold">
            Sélectionnez votre profil pour commencer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.title} className="border-none shadow-xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl group hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className={`h-2 w-full ${role.color}`} />
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className={`size-16 ${role.color} text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                  <role.icon className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black">{role.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </div>
                <Button asChild className={`w-full h-12 rounded-xl font-black ${role.color} hover:opacity-90 shadow-lg`}>
                  <Link href={role.href}>
                    {role.buttonText}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="h-px w-32 bg-border" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Déjà un compte officiel ?</p>
          <Button asChild variant="outline" className="h-14 px-12 rounded-2xl border-2 font-black text-lg hover:bg-muted group transition-all">
            <Link href="/login" className="flex items-center gap-3">
              Connexion Sécurisée
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer minimaliste */}
      <div className="absolute bottom-8 text-center w-full text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
        ACADEX V1 • Intelligence Scolaire Béninoise
      </div>
    </div>
  );
}

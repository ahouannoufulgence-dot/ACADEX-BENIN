
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCog, GraduationCap, UserCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterEntryPage() {
  const roles = [
    {
      title: "Directeur",
      desc: "Créer un nouvel espace établissement",
      icon: UserCog,
      href: "/register/director",
      color: "bg-primary",
      buttonText: "Créer mon espace Directeur"
    },
    {
      title: "Enseignant",
      desc: "Rejoindre mon équipe pédagogique",
      icon: UserCircle2,
      href: "/register/teacher",
      color: "bg-foreground",
      buttonText: "Créer mon espace Enseignant"
    },
    {
      title: "Élève / Parent",
      desc: "Activer mon compte élève officiel",
      icon: GraduationCap,
      href: "/register/student",
      color: "bg-amber-600",
      buttonText: "Activer mon espace Élève"
    }
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#F8FAFC]">
      {/* Background with Real Feel */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/acadex-students/1920/1080" 
          alt="African students" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="size-4" />
            Portail de confiance ACADEX
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground">
            Bienvenue sur <span className="text-primary italic">ACADEX</span>
          </h1>
          <p className="text-xl text-muted-foreground font-semibold">
            "Apprendre aujourd’hui, réussir demain"
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.title} className="border-none shadow-xl rounded-[2.5rem] bg-white/70 backdrop-blur-xl group hover:shadow-2xl transition-all duration-500 overflow-hidden">
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
                <Button asChild className={`w-full h-12 rounded-xl font-black ${role.color} hover:opacity-90`}>
                  <Link href={role.href}>
                    {role.buttonText}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Déjà un compte ?</p>
          <Button asChild variant="outline" className="h-14 px-12 rounded-2xl border-2 font-black text-lg hover:bg-muted group">
            <Link href="/login" className="flex items-center gap-3">
              Connexion sécurisée
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

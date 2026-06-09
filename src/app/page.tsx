
'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCog, GraduationCap, UserCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import placeholderData from "@/app/lib/placeholder-images.json";

export default function Home() {
  const homeImage = placeholderData.placeholderImages.find(img => img.id === "hero-students-class");

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
      color: "bg-emerald-600",
      buttonText: "Espace Élève"
    }
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-background overflow-hidden">
      {/* CORRECT PROFESSIONAL HUMAN BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <Image 
          src={homeImage?.imageUrl || "https://picsum.photos/seed/acadex-students-happy/1920/1080"}
          alt="ACADEX Excellence"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="size-16 md:size-20 bg-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform hover:rotate-6">
              <span className="text-primary font-black text-3xl md:text-4xl">A</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="size-3.5 md:size-4 text-emerald-400" />
            Écosystème ACADEX Bénin
          </div>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
            Bienvenue sur votre <span className="text-emerald-400 italic">Cockpit</span>
          </h1>
          <p className="text-sm md:text-xl text-white/80 font-semibold max-w-2xl mx-auto leading-relaxed px-4">
            La plateforme premium de gestion scolaire qui met l'excellence au cœur de l'éducation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {roles.map((role) => (
            <Card key={role.title} className="border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] bg-white/95 backdrop-blur-xl group hover:shadow-primary/20 transition-all duration-500 overflow-hidden">
              <div className={`h-1.5 md:h-2 w-full ${role.color}`} />
              <CardContent className="p-6 md:p-8 flex flex-col items-center text-center space-y-4 md:space-y-6">
                <div className={`size-12 md:size-16 ${role.color} text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                  <role.icon className="size-5 md:size-8" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-lg md:text-xl font-black text-foreground">{role.title}</h3>
                  <p className="text-[11px] md:text-sm font-medium text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </div>
                <Button asChild className={`w-full h-10 md:h-12 rounded-lg md:rounded-xl font-black ${role.color} hover:opacity-90 shadow-lg transition-all active:scale-95 text-xs md:text-sm`}>
                  <Link href={role.href}>
                    {role.buttonText}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-6 pt-4">
          <div className="h-px w-20 md:w-32 bg-white/20" />
          <p className="text-[9px] md:text-xs font-bold text-white/60 uppercase tracking-widest">Déjà un compte officiel ?</p>
          <Button asChild variant="outline" className="h-12 md:h-14 px-8 md:px-12 rounded-xl md:rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-md text-white font-black text-sm md:text-lg hover:bg-white/10 group transition-all">
            <Link href="/login" className="flex items-center gap-3">
              Connexion Sécurisée
              <ArrowRight className="size-4 md:size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-6 md:bottom-8 text-center w-full text-[8px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest px-4">
        ACADEX V1 • Intelligence Scolaire
      </div>
    </div>
  );
}

'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCog, GraduationCap, UserCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import placeholderData from "@/app/lib/placeholder-images.json";

export default function Home() {
  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students");

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
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-background overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex/1920/1080"}
          alt="ACADEX Background"
          fill
          className="object-cover opacity-20 grayscale-[0.5] blur-[2px]"
          priority
          data-ai-hint={heroImage?.imageHint || "smiling students"}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-background/90 to-amber-900/40" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="size-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl">
              <span className="text-primary font-black text-4xl">A</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="size-4 text-emerald-400" />
            Écosystème ACADEX Bénin
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
            Bienvenue sur votre <span className="text-emerald-400 italic">Cockpit</span>
          </h1>
          <p className="text-xl text-white/80 font-semibold max-w-2xl mx-auto">
            La plateforme premium de gestion scolaire qui met l'excellence au cœur de l'éducation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.title} className="border-none shadow-2xl rounded-[2.5rem] bg-white/90 backdrop-blur-xl group hover:shadow-primary/20 transition-all duration-500 overflow-hidden">
              <div className={`h-2 w-full ${role.color}`} />
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className={`size-16 ${role.color} text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                  <role.icon className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground">{role.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </div>
                <Button asChild className={`w-full h-12 rounded-xl font-black ${role.color} hover:opacity-90 shadow-lg transition-all active:scale-95`}>
                  <Link href={role.href}>
                    {role.buttonText}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="h-px w-32 bg-white/20" />
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Déjà un compte officiel ?</p>
          <Button asChild variant="outline" className="h-14 px-12 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-md text-white font-black text-lg hover:bg-white/10 group transition-all">
            <Link href="/login" className="flex items-center gap-3">
              Connexion Sécurisée
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer minimaliste */}
      <div className="absolute bottom-8 text-center w-full text-[10px] font-bold text-white/30 uppercase tracking-widest">
        ACADEX V1 • Intelligence Scolaire Béninoise
      </div>
    </div>
  );
}
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, UserCog, Lock, CheckCircle2, Copy, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, School } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import placeholderData from "@/app/lib/placeholder-images.json";

export default function RegisterDirectorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    schoolName: "",
    city: "Cotonou",
    address: "",
    schoolType: "col-lyc",
    password: "",
    confirmPassword: "",
    secretQuestion: "mother",
    secretAnswer: ""
  });

  const regImage = placeholderData.placeholderImages.find(img => img.id === "registration-green");

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('school_settings').upsert({
        id: 'main_config',
        school_name: form.schoolName,
        academic_year: "2026-2027",
        phone: form.phone,
        address: `${form.address ? form.address + ', ' : ''}${form.city}`,
        director_name: `${form.firstName} ${form.lastName}`,
        director_password: form.password,
      });

      if (error) throw error;

      localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);
      localStorage.setItem('acadex_user_role', 'Directeur');
      localStorage.setItem('acadex_user_id', 'DIR-001');
      localStorage.setItem('acadex_active_year', '2026-2027');
      
      setLoading(false);
      nextStep();
      toast({
        title: "Configuration Initialisée",
        description: `Bienvenue en 2026-2027 au sein de ${form.schoolName}.`
      });
    } catch (e) {
      toast({ title: "Erreur de configuration", variant: "destructive" });
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText("DIR-001");
    toast({ title: "Identifiant copié !" });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={regImage?.imageUrl || "https://picsum.photos/seed/green/1920/1080"}
          alt="Registration Background"
          fill
          className="object-cover"
          priority
          data-ai-hint={regImage?.imageHint || "green nature"}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-emerald-500/60" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 md:space-y-8 animate-in fade-in duration-700">
        
        {step < 3 && (
          <div className="flex justify-center items-center gap-3 md:gap-4 mb-4 md:mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-7 md:size-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs ${step === i ? 'bg-white text-primary shadow-lg' : step > i ? 'bg-white/20 text-white' : 'bg-black/20 text-white/40'}`}>
                  {i}
                </div>
                {i === 1 && <div className={`w-8 md:w-12 h-1 rounded-full ${step > 1 ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 md:h-2 bg-primary w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <div className="size-12 md:size-16 bg-primary/10 text-primary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <School className="size-6 md:size-8" />
                </div>
                <CardTitle className="text-xl md:text-3xl font-black">Configuration</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium">Initialisons l'année 2026-2027.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Nom</Label>
                    <Input placeholder="Koffi" className="h-11 md:h-12 rounded-xl text-sm" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Prénom</Label>
                    <Input placeholder="Mensah" className="h-11 md:h-12 rounded-xl text-sm" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Téléphone École</Label>
                  <Input placeholder="+229 ..." className="h-11 md:h-12 rounded-xl text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Nom de l'établissement</Label>
                  <Input placeholder="Collège Acadex Elite" className="h-11 md:h-12 rounded-xl text-sm" value={form.schoolName} onChange={e => setForm({...form, schoolName: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Ville</Label>
                    <Input placeholder="Cotonou" className="h-11 md:h-12 rounded-xl text-sm" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Type d'école</Label>
                    <Select value={form.schoolType} onValueChange={v => setForm({...form, schoolType: v})}>
                      <SelectTrigger className="h-11 md:h-12 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 p-1">
                        <SelectItem value="college" className="font-bold p-3 rounded-lg text-xs">Collège</SelectItem>
                        <SelectItem value="lycee" className="font-bold p-3 rounded-lg text-xs">Lycée</SelectItem>
                        <SelectItem value="col-lyc" className="font-bold p-3 rounded-lg text-xs">Collège + Lycée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" onClick={() => router.push("/")} className="font-bold rounded-xl h-11 md:h-12 text-xs md:text-sm px-4 md:px-8">Annuler</Button>
                <Button onClick={nextStep} className="bg-primary rounded-xl font-black px-6 md:px-10 h-11 md:h-12 text-xs md:text-sm">Continuer <ArrowRight className="ml-2 size-3.5 md:size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <div className="size-12 md:size-16 bg-primary/10 text-primary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Lock className="size-6 md:size-8" />
                </div>
                <CardTitle className="text-xl md:text-3xl font-black">Sécurité</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium">Configurez vos accès directoriaux.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Mot de passe Directeur</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-11 md:h-12 rounded-xl pr-12 text-sm" 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-2"
                    >
                      {showPassword ? <EyeOff className="size-4 md:size-5" /> : <Eye className="size-4 md:size-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Confirmer mot de passe</Label>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-11 md:h-12 rounded-xl text-sm" 
                    value={form.confirmPassword} 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                  />
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Démarrage Officiel</p>
                  <p className="text-[11px] md:text-sm font-bold text-foreground">Année scolaire : 2026-2027</p>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-11 md:h-12 text-xs md:text-sm px-4 md:px-8">Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-primary rounded-xl font-black px-6 md:px-10 h-11 md:h-12 text-xs md:text-sm shadow-xl shadow-primary/20">
                  {loading ? <Loader2 className="size-3.5 md:size-5 animate-spin mr-2" /> : <ShieldCheck className="size-3.5 md:size-5 mr-2" />}
                  Lancer ACADEX
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <div className="p-8 md:p-12 text-center space-y-6 md:space-y-8 animate-in zoom-in-95">
              <div className="size-20 md:size-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-10 md:size-12" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">Univers Prêt !</h2>
                <p className="text-muted-foreground font-medium text-sm md:text-lg">Le cockpit est configuré pour 2026-2027.</p>
              </div>
              <div className="bg-muted/50 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2rem] border-2 border-dashed border-primary/20 space-y-3 md:space-y-4">
                <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Votre Identifiant Unique</p>
                <p className="text-3xl md:text-5xl font-black text-primary tracking-tighter tabular-nums">DIR-001</p>
                <Button onClick={copyId} variant="outline" size="sm" className="rounded-full border-primary/20 text-primary font-bold h-9 md:h-10 px-6 text-[10px] md:text-xs">
                  Copier l'identifiant
                </Button>
              </div>
              <div className="pt-4 md:pt-8">
                <Button asChild className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 font-black text-sm md:text-lg shadow-xl shadow-primary/20">
                  <Link href="/dashboard">
                    Entrer dans le Dashboard <ArrowRight className="ml-2 size-4 md:size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

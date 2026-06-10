'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, UserCircle2, Lock, CheckCircle2, Copy, ArrowLeft, ArrowRight, Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import placeholderData from "@/app/lib/placeholder-images.json";

export default function RegisterTeacherPage() {
  const router = useRouter();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    subject: "",
    classes: [] as string[],
    password: "",
    confirmPassword: ""
  });

  const regImage = placeholderData.placeholderImages.find(img => img.id === "registration-green");
  const subjects = ["Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "Allemand", "Espagnol", "Économie", "Informatique", "EPS"];
  
  const availableClasses = [
    "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
    "2NDE A", "2NDE B", "2NDE C", "2NDE D",
    "1ERE A", "1ERE B", "1ERE C", "1ERE D",
    "TLE A", "TLE B", "TLE C", "TLE D"
  ];

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleClass = (cls: string) => {
    setForm(prev => ({
      ...prev,
      classes: prev.classes.includes(cls) 
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls]
    }));
  };

  const handleRegister = async () => {
    if (!form.password || form.password !== form.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const subjectPrefix = form.subject.substring(0, 3).toUpperCase() || "ENS";
    const randomId = Math.floor(100 + Math.random() * 900);
    const newId = `ENS-${subjectPrefix}-${randomId}`;
    setGeneratedId(newId);

    const teacherData = {
      officialId: newId,
      fullName: `${form.firstName} ${form.lastName}`,
      phone: form.phone,
      subject: form.subject,
      classes: form.classes,
      status: "En attente",
      registeredAt: new Date().toISOString()
    };

    addDoc(collection(db, "teachers"), teacherData)
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: 'teachers',
          operation: 'create',
          requestResourceData: teacherData,
        });
        errorEmitter.emit('permission-error', error);
      });

    localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);
    localStorage.setItem('acadex_user_role', `Enseignant`);
    localStorage.setItem('acadex_user_id', newId);
    localStorage.setItem('acadex_user_subject', form.subject);
    localStorage.setItem('acadex_user_classes', JSON.stringify(form.classes));

    setLoading(false);
    nextStep();
    toast({ title: "Compte créé avec succès" });
  };

  const copyId = () => {
    navigator.clipboard.writeText(generatedId);
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
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-emerald-600/80 to-primary/60" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 md:space-y-8 animate-in fade-in duration-700">
        
        {step < 4 && (
          <div className="flex justify-center items-center gap-3 md:gap-4 mb-4 md:mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-7 md:size-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs ${step === i ? 'bg-white text-foreground shadow-lg' : step > i ? 'bg-white/20 text-white' : 'bg-black/20 text-white/40'}`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-8 md:w-12 h-1 rounded-full ${step > i ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 md:h-2 bg-foreground w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <div className="size-12 md:size-16 bg-muted text-foreground rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <UserCircle2 className="size-6 md:size-8" />
                </div>
                <CardTitle className="text-xl md:text-3xl font-black">Identité</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium">Rejoignez l'équipe pédagogique.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Nom</Label>
                    <Input placeholder="Nom" className="h-11 md:h-12 rounded-xl text-sm" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Prénom</Label>
                    <Input placeholder="Prénom" className="h-11 md:h-12 rounded-xl text-sm" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Téléphone</Label>
                  <Input placeholder="+229 ..." className="h-11 md:h-12 rounded-xl text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-11 md:h-12 text-xs md:text-sm px-4 md:px-8"><Link href="/">Annuler</Link></Button>
                <Button onClick={nextStep} className="bg-foreground text-white rounded-xl font-black px-6 md:px-10 h-11 md:h-12 text-xs md:text-sm">Continuer <ArrowRight className="ml-2 size-3.5 md:size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <div className="size-12 md:size-16 bg-muted text-foreground rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <BookOpen className="size-6 md:size-8" />
                </div>
                <CardTitle className="text-xl md:text-3xl font-black">Périmètre</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium">Assignez vos classes et matières.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Matière principale</Label>
                  <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                    <SelectTrigger className="h-11 md:h-12 rounded-xl text-sm font-bold">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {subjects.map(s => <SelectItem key={s} value={s} className="font-bold p-2.5 rounded-lg text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold block mb-3 uppercase text-[9px] md:text-[10px] tracking-[0.2em] text-muted-foreground">Classes autorisées</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                    {availableClasses.map(cls => (
                      <div 
                        key={cls}
                        onClick={() => toggleClass(cls)}
                        className={`cursor-pointer p-2.5 md:p-3 rounded-xl border-2 text-center text-[8px] md:text-[9px] font-black transition-all ${form.classes.includes(cls) ? 'bg-foreground text-white border-foreground shadow-md' : 'bg-muted/50 border-transparent hover:border-muted'}`}
                      >
                        {cls}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-11 md:h-12 text-xs md:text-sm flex gap-2"><ArrowLeft className="size-3.5 md:size-4" /> Retour</Button>
                <Button onClick={nextStep} className="bg-foreground text-white rounded-xl font-black px-6 md:px-10 h-11 md:h-12 text-xs md:text-sm">Continuer <ArrowRight className="ml-2 size-3.5 md:size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <div className="size-12 md:size-16 bg-muted text-foreground rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Lock className="size-6 md:size-8" />
                </div>
                <CardTitle className="text-xl md:text-3xl font-black">Sécurité</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium">Protégez votre espace pédagogique.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-2"
                      >
                        {showPassword ? <EyeOff className="size-4 md:size-5" /> : <Eye className="size-4 md:size-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Confirmer</Label>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-11 md:h-12 rounded-xl text-sm" 
                      value={form.confirmPassword} 
                      onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-11 md:h-12 text-xs md:text-sm flex gap-2"><ArrowLeft className="size-3.5 md:size-4" /> Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-foreground text-white rounded-xl font-black px-6 md:px-10 h-11 md:h-12 text-xs md:text-sm">
                  {loading ? <Loader2 className="size-3.5 md:size-5 animate-spin mr-2" /> : <ShieldCheck className="size-3.5 md:size-5 mr-2" />}
                  Finaliser
                </Button>
              </CardFooter>
            </>
          )}

          {step === 4 && (
            <div className="p-8 md:p-12 text-center space-y-6 md:space-y-8 animate-in zoom-in-95">
              <div className="size-20 md:size-24 bg-foreground text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-10 md:size-12" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">Inscription Réussie !</h2>
                <p className="text-muted-foreground font-medium text-sm md:text-lg">Votre compte est en attente de validation.</p>
              </div>
              <div className="bg-muted/50 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2rem] border-2 border-dashed border-foreground space-y-3 md:space-y-4">
                <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Votre Identifiant</p>
                <p className="text-2xl md:text-4xl font-black text-foreground tracking-tighter tabular-nums uppercase">{generatedId}</p>
                <Button onClick={copyId} variant="outline" size="sm" className="rounded-full border-foreground/20 text-foreground font-bold h-9 md:h-10 px-6 text-[10px] md:text-xs">
                  <Copy className="size-3.5 md:size-4 mr-2" /> Copier l'identifiant
                </Button>
              </div>
              <div className="pt-4 md:pt-8">
                <Button asChild className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-foreground text-white font-black text-sm md:text-lg shadow-xl active:scale-95 transition-all">
                  <Link href="/dashboard">Entrer dans mon Cockpit <ArrowRight className="ml-2 size-4 md:size-5" /></Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

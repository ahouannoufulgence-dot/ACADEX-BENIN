
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, UserCircle2, Lock, CheckCircle2, Copy, ArrowLeft, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function RegisterTeacherPage() {
  const router = useRouter();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    subject: "",
    classes: [] as string[],
    isFormTeacher: false,
    formClass: "",
    password: "",
    confirmPassword: "",
    secretQuestion: "teacher",
    secretAnswer: ""
  });

  const subjects = ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géographie", "Philosophie", "Informatique", "EPS"];
  const availableClasses = ["6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"];

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
      isFormTeacher: form.isFormTeacher,
      formClass: form.formClass,
      status: "En attente",
      registeredAt: new Date().toISOString()
    };

    // Sauvegarde automatique dans Firestore
    addDoc(collection(db, "teachers"), teacherData)
      .catch(async (serverError) => {
        const error = new FirestorePermissionError({
          path: 'teachers',
          operation: 'create',
          requestResourceData: teacherData,
        });
        errorEmitter.emit('permission-error', error);
      });

    // Sauvegarde en session locale pour le login immédiat
    localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);
    localStorage.setItem('acadex_user_role', `Enseignant`);
    localStorage.setItem('acadex_user_id', newId);
    localStorage.setItem('acadex_user_subject', form.subject);
    localStorage.setItem('acadex_user_classes', JSON.stringify(form.classes));

    setLoading(false);
    nextStep();
    toast({
      title: "Compte Enseignant créé",
      description: `Bienvenue dans l'équipe pédagogique ACADEX.`
    });
  };

  const copyId = () => {
    navigator.clipboard.writeText(generatedId);
    toast({ title: "Identifiant copié !" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-700">
        
        {step < 4 && (
          <div className="flex justify-center items-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${step === i ? 'bg-foreground text-white shadow-lg' : step > i ? 'bg-foreground/20 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-12 h-1 rounded-full ${step > i ? 'bg-foreground' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-foreground w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-muted text-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserCircle2 className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Identité Enseignant</CardTitle>
                <CardDescription className="text-lg font-medium">Rejoignez l'équipe pédagogique de votre établissement.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom</Label>
                    <Input placeholder="Dossou" className="h-12 rounded-xl" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Prénom</Label>
                    <Input placeholder="Marc" className="h-12 rounded-xl" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Téléphone</Label>
                  <Input placeholder="+229 ..." className="h-12 rounded-xl" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-12"><Link href="/">Annuler</Link></Button>
                <Button onClick={nextStep} className="bg-foreground text-white rounded-xl font-black px-10 h-12">Continuer <ArrowRight className="ml-2 size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-muted text-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Profil Pédagogique</CardTitle>
                <CardDescription className="text-lg font-medium">Quelles matières et classes gérez-vous ?</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Matière Principale</Label>
                  <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionner votre matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold block mb-4">Classes Enseignées</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableClasses.map(cls => (
                      <div 
                        key={cls}
                        onClick={() => toggleClass(cls)}
                        className={`cursor-pointer p-3 rounded-xl border-2 text-center text-xs font-black transition-all ${form.classes.includes(cls) ? 'bg-foreground text-white border-foreground shadow-md' : 'bg-muted/50 border-transparent hover:border-muted'}`}
                      >
                        {cls}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-dashed">
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox id="formTeacher" checked={form.isFormTeacher} onCheckedChange={c => setForm({...form, isFormTeacher: !!c})} />
                    <Label htmlFor="formTeacher" className="font-bold cursor-pointer">Je suis professeur principal</Label>
                  </div>
                  {form.isFormTeacher && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-xs font-black uppercase mb-2 block">Classe sous votre responsabilité</Label>
                      <Select value={form.formClass} onValueChange={v => setForm({...form, formClass: v})}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Choisir la classe" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12 flex gap-2"><ArrowLeft className="size-4" /> Retour</Button>
                <Button onClick={nextStep} className="bg-foreground text-white rounded-xl font-black px-10 h-12">Continuer <ArrowRight className="ml-2 size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-muted text-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Sécurité & Question</CardTitle>
                <CardDescription className="text-lg font-medium">Définissez vos identifiants de connexion personnels.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Mot de passe</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Confirmer</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="font-bold">Question Secrète (Récupération)</Label>
                    <Select value={form.secretQuestion} onValueChange={v => setForm({...form, secretQuestion: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mother">Nom de jeune fille de votre mère ?</SelectItem>
                        <SelectItem value="teacher">Nom de votre premier enseignant ?</SelectItem>
                        <SelectItem value="birth">Ville de votre naissance ?</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Réponse Secrète</Label>
                    <Input placeholder="Votre réponse" className="h-12 rounded-xl" value={form.secretAnswer} onChange={e => setForm({...form, secretAnswer: e.target.value})} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12 flex gap-2"><ArrowLeft className="size-4" /> Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-foreground text-white rounded-xl font-black px-10 h-12">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Finaliser l'inscription
                </Button>
              </CardFooter>
            </>
          )}

          {step === 4 && (
            <div className="p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-24 bg-foreground text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black">Compte Activé !</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  Votre espace Enseignant est prêt. Utilisez cet identifiant pour vous connecter à votre cockpit.
                </p>
              </div>
              <div className="bg-muted/50 p-8 rounded-[2rem] border-2 border-dashed border-foreground space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Votre Identifiant Officiel</p>
                <p className="text-4xl font-black text-foreground tracking-tighter">{generatedId}</p>
                <Button onClick={copyId} variant="outline" size="sm" className="rounded-full border-foreground/20 text-foreground font-bold h-10 px-6">
                  <Copy className="size-4 mr-2" /> Copier l'identifiant
                </Button>
              </div>
              <div className="pt-8">
                <Button asChild className="w-full h-14 rounded-2xl bg-foreground text-white font-black text-lg shadow-xl">
                  <Link href="/dashboard">
                    Accéder au tableau de bord <ArrowRight className="ml-2 size-5" />
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

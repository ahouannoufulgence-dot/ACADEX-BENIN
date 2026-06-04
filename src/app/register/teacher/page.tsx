
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, UserCircle2, Lock, CheckCircle2, Clock, ArrowLeft, ArrowRight, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function RegisterTeacherPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
  const availableClasses = ["6e A", "6e B", "5e A", "5e B", "4e C", "3D1", "3D2", "2nde C", "1ère D", "Terminale D1", "Terminale D2"];

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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      nextStep();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-700">
        
        {/* Step Indicator */}
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
                <Button variant="ghost" onClick={() => router.push("/register")} className="font-bold rounded-xl h-12">Annuler</Button>
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
                      {subjects.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
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
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Confirmer</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" />
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
                    <Input placeholder="Votre réponse" className="h-12 rounded-xl" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12 flex gap-2"><ArrowLeft className="size-4" /> Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-foreground text-white rounded-xl font-black px-10 h-12">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Soumettre mon inscription
                </Button>
              </CardFooter>
            </>
          )}

          {step === 4 && (
            <div className="p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-24 bg-foreground text-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <Clock className="size-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black">Demande Enregistrée</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  Votre compte Enseignant est maintenant <span className="text-foreground font-black">en attente de validation</span> par la direction de votre établissement.
                </p>
              </div>
              <div className="bg-muted/50 p-8 rounded-[2rem] border-2 border-dashed border-muted text-left space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prochaines étapes :</p>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm font-bold">
                    <div className="size-5 bg-foreground text-white rounded-full flex items-center justify-center text-[10px]">1</div>
                    Votre directeur reçoit une notification.
                  </li>
                  <li className="flex gap-3 text-sm font-bold">
                    <div className="size-5 bg-foreground text-white rounded-full flex items-center justify-center text-[10px]">2</div>
                    Il vérifie vos informations et vos classes.
                  </li>
                  <li className="flex gap-3 text-sm font-bold">
                    <div className="size-5 bg-foreground text-white rounded-full flex items-center justify-center text-[10px]">3</div>
                    Vous recevez votre identifiant ENS-xxx par SMS/Email.
                  </li>
                </ul>
              </div>
              <div className="pt-8">
                <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-2 font-black text-lg">
                  <Link href="/">
                    Retour à l'accueil
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


'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, GraduationCap, Lock, CheckCircle2, Search, ArrowLeft, ArrowRight, Loader2, UserCircle2, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function RegisterStudentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");
  const [studentData, setStudentData] = useState<any>(null);

  const verifyId = async () => {
    if (!id.startsWith("ELV-")) {
      toast({ title: "Identifiant invalide", description: "Le format doit être ELV-xxx-xxx", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      setStudentData({
        name: "David",
        lastName: "Mensah",
        class: "3ème D1",
        phone: "+229 97 00 11 22",
        status: "Inscrit"
      });
      nextStep();
    }, 1500);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleActivate = async () => {
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
        {step < 4 && ( step > 0 && (
          <div className="flex justify-center items-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${step === i ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : step > i ? 'bg-amber-600/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-12 h-1 rounded-full ${step > i ? 'bg-amber-600' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        ))}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-amber-600 w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Identifiant Officiel</CardTitle>
                <CardDescription className="text-lg font-medium">Saisissez l'identifiant remis par votre école.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-center block">Matricule Élève (ex: ELV-3D-001)</Label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input 
                        placeholder="ELV-..." 
                        className="h-16 pl-12 rounded-2xl text-2xl font-black tracking-widest text-center border-none bg-muted/50 focus-visible:ring-amber-600 shadow-inner" 
                        value={id} 
                        onChange={e => setId(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <ShieldAlert className="size-5 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                      L'activation d'un compte nécessite l'identifiant unique généré par l'administration de votre collège ou lycée.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={() => router.push("/register")} className="font-bold rounded-xl h-12">Annuler</Button>
                <Button onClick={verifyId} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black px-10 h-12 shadow-xl shadow-amber-600/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <Search className="size-4 mr-2" />}
                  Vérifier l'identifiant
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && studentData && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserCircle2 className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Vérification d'Identité</CardTitle>
                <CardDescription className="text-lg font-medium">Est-ce bien vous ?</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <div className="bg-muted/30 p-8 rounded-[2rem] border-2 border-amber-600/20 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-amber-600 shadow-sm">
                      {studentData.name[0]}{studentData.lastName[0]}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-foreground">{studentData.name} {studentData.lastName}</h3>
                      <Badge className="bg-amber-600 font-bold px-4">{studentData.class}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Téléphone Parent</p>
                      <p className="font-bold text-foreground">{studentData.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Statut Scolaire</p>
                      <Badge variant="outline" className="border-primary/20 text-primary font-black bg-primary/5">{studentData.status}</Badge>
                    </div>
                  </div>
                </div>
                <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
                  Si ces informations sont incorrectes, veuillez contacter l'administration de votre école avant de continuer.
                </p>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12">Ce n'est pas moi</Button>
                <Button onClick={nextStep} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black px-10 h-12 shadow-xl shadow-amber-600/20">Oui, c'est bien moi <ArrowRight className="ml-2 size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Activation Sécurisée</CardTitle>
                <CardDescription className="text-lg font-medium">Créez votre mot de passe pour accéder à vos notes.</CardDescription>
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
                    <Select defaultValue="mother">
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
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12"><ArrowLeft className="size-4 mr-2" /> Retour</Button>
                <Button onClick={handleActivate} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black px-10 h-12 shadow-xl shadow-amber-600/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Activer mon espace
                </Button>
              </CardFooter>
            </>
          )}

          {step === 4 && (
            <div className="p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-24 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black">Activation Réussie !</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  Votre espace Élève est maintenant actif. Vous pouvez consulter vos notes et votre agenda.
                </p>
              </div>
              <div className="bg-muted/50 p-8 rounded-[2rem] border-2 border-dashed border-amber-600/20 space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Votre Identifiant Officiel</p>
                <p className="text-4xl font-black text-amber-600 tracking-tighter">{id}</p>
                <div className="flex items-center justify-center gap-2 text-xs font-black text-muted-foreground">
                  <ShieldCheck className="size-3" /> COMPTE VÉRIFIÉ & SÉCURISÉ
                </div>
              </div>
              <div className="pt-8">
                <Button asChild className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black text-lg shadow-xl shadow-amber-600/20">
                  <Link href="/dashboard">
                    Accéder à mon espace <ArrowRight className="ml-2 size-5" />
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

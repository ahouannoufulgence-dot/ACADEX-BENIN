'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { GraduationCap, CheckCircle2, Search, ArrowRight, Loader2, Heart, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import placeholderData from "@/app/lib/placeholder-images.json";

export default function RegisterStudentPage() {
  const router = useRouter();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [matricule, setMatricule] = useState("");
  const [regDoc, setRegDoc] = useState<any>(null);

  const regImage = placeholderData.placeholderImages.find(img => img.id === "registration-green");

  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    gender: "Masculin",
    phone: "",
    cityOfBirth: "",
    dob: "",
    parentName: "",
    parentFirstName: "",
    password: ""
  });

  const verifyIdentifier = async () => {
    const formatted = matricule.trim().toUpperCase();
    if (!formatted) {
      toast({ title: "Champ requis", description: "Veuillez saisir votre matricule.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "registration_ids"), where("matricule", "==", formatted));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({ title: "Identifiant invalide", description: "Ce matricule n'a pas été généré par l'établissement.", variant: "destructive" });
        return;
      }

      const data = snap.docs[0].data();
      if (data.status === "utilisé") {
        toast({ title: "Identifiant déjà utilisé", description: "Ce compte a déjà été activé.", variant: "destructive" });
        return;
      }

      setRegDoc({ ...data, id: snap.docs[0].id });
      setStep(2);
      toast({ title: "Identifiant validé", description: `Bienvenue en ${data.classId} !` });
    } catch (e) {
      toast({ title: "Erreur de connexion", description: "Impossible de vérifier l'identifiant.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!form.lastName || !form.firstName || !form.password) {
      toast({ title: "Champs obligatoires", description: "Nom, Prénom et Mot de passe sont requis.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const studentData = {
      ...form,
      matricule: regDoc.matricule,
      classId: regDoc.classId,
      status: "Actif",
      academicYear: "2024-2025",
      registeredAt: new Date().toISOString()
    };

    const studentRef = collection(db, "students");
    const regIdRef = doc(db, "registration_ids", regDoc.id);

    addDoc(studentRef, studentData).catch(async () => {
      const error = new FirestorePermissionError({
        path: 'students',
        operation: 'create',
        requestResourceData: studentData,
      });
      errorEmitter.emit('permission-error', error);
    });

    updateDoc(regIdRef, { status: "utilisé" }).catch(async () => {
      const error = new FirestorePermissionError({
        path: regIdRef.path,
        operation: 'update',
        requestResourceData: { status: "utilisé" },
      });
      errorEmitter.emit('permission-error', error);
    });

    localStorage.setItem('acadex_user_id', regDoc.matricule);
    localStorage.setItem('acadex_user_role', 'Élève');
    localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);

    setStep(3);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-background overflow-hidden">
      {/* Background with Vibrant Green Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={regImage?.imageUrl || "https://picsum.photos/seed/green/1920/1080"}
          alt="Registration Background"
          fill
          className="object-cover"
          priority
          data-ai-hint={regImage?.imageHint || "green nature"}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/90 via-primary/80 to-emerald-400/60" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-8 animate-in fade-in duration-700">
        
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-12 text-center">
                <div className="size-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="size-10" />
                </div>
                <CardTitle className="text-4xl font-black text-foreground">Activer mon espace</CardTitle>
                <CardDescription className="text-lg font-medium mt-2">Saisissez l'identifiant reçu lors de votre inscription.</CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-0 space-y-8">
                <div className="space-y-4">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground tracking-[0.2em] px-2">Identifiant Officiel (ELV-...)</Label>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                    <Input 
                      placeholder="Ex: ELV-3EMEA-001" 
                      className="h-20 pl-16 rounded-[1.5rem] text-2xl font-black tracking-widest border-2 focus-visible:ring-primary uppercase" 
                      value={matricule} 
                      onChange={e => setMatricule(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-12 bg-muted/30 flex justify-between">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-14 px-8"><Link href="/">Retour</Link></Button>
                <Button onClick={verifyIdentifier} disabled={loading} className="bg-primary rounded-2xl font-black px-12 h-14 shadow-xl shadow-primary/20 text-lg">
                  {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : "Vérifier mon matricule"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-12 text-center">
                <Badge className="bg-primary text-white mx-auto mb-4 px-6 py-2 rounded-full font-black">CLASSE : {regDoc.classId}</Badge>
                <CardTitle className="text-3xl font-black">Finaliser mon inscription</CardTitle>
                <CardDescription className="font-medium italic">"Toutes vos données seront transmises à la direction."</CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-0 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom de famille</Label>
                    <Input placeholder="KOFFI" className="h-12 rounded-xl font-bold uppercase" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Prénom(s)</Label>
                    <Input placeholder="Djimon" className="h-12 rounded-xl font-bold" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Sexe</Label>
                    <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculin">Masculin</SelectItem>
                        <SelectItem value="Féminin">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Numéro de téléphone</Label>
                    <Input placeholder="+229 ..." className="h-12 rounded-xl font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Ville de naissance</Label>
                    <Input placeholder="Cotonou" className="h-12 rounded-xl font-bold" value={form.cityOfBirth} onChange={e => setForm({...form, cityOfBirth: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Date de naissance</Label>
                    <Input type="date" className="h-12 rounded-xl font-bold" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed space-y-6">
                  <h3 className="font-black text-primary flex items-center gap-2"><Heart className="size-4" /> Responsable Légal (Parent)</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Nom du parent</Label>
                      <Input className="h-12 rounded-xl font-bold" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Prénom du parent</Label>
                      <Input className="h-12 rounded-xl font-bold" value={form.parentFirstName} onChange={e => setForm({...form, parentFirstName: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="font-bold">Définir un Mot de Passe sécurisé</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="h-12 rounded-xl font-bold pr-12" 
                        value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-12 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="font-bold rounded-xl h-14 px-8">Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-primary rounded-2xl font-black px-12 h-14 shadow-xl shadow-primary/20 text-lg">
                  {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : "Terminer mon inscription"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <div className="p-20 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-20" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black">Inscription Réussie !</h2>
                <p className="text-muted-foreground font-medium text-xl leading-relaxed">
                  Félicitations {form.firstName}, votre profil est maintenant actif en classe de <span className="text-primary font-black">{regDoc.classId}</span>.
                </p>
              </div>
              <Button asChild className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-xl shadow-primary/20">
                <Link href="/dashboard">Entrer dans mon Cockpit <ArrowRight className="ml-2 size-6" /></Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
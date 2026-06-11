'use client';

import { useState, useEffect } from "react";
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
import { collection, query, where, getDocs, doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
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
  const [activeYear, setActiveYear] = useState("2026-2027");

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, "school_settings", "main_config"));
        if (docSnap.exists()) {
          setActiveYear(docSnap.data().academicYear || "2026-2027");
        }
      } catch (e) {
        console.warn("Config non trouvée");
      }
    };
    fetchConfig();
  }, [db]);

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

  const handleRegister = async () => {
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
      academicYear: activeYear,
      registeredAt: new Date().toISOString()
    };

    try {
      const batch = writeBatch(db);
      const studentRef = doc(collection(db, "students"));
      const regIdRef = doc(db, "registration_ids", regDoc.id);

      batch.set(studentRef, studentData);
      batch.update(regIdRef, { status: "utilisé", activatedAt: serverTimestamp() });

      await batch.commit();

      localStorage.setItem('acadex_user_id', regDoc.matricule);
      localStorage.setItem('acadex_user_role', 'Élève');
      localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);
      localStorage.setItem('acadex_active_year', activeYear);
      
      setStep(3);
    } catch (err) {
      const error = new FirestorePermissionError({
        path: 'students',
        operation: 'create',
        requestResourceData: studentData,
      });
      errorEmitter.emit('permission-error', error);
      toast({ title: "Échec de l'inscription", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/90 via-primary/80 to-emerald-400/60" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 md:space-y-8 animate-in fade-in duration-700">
        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[3rem] bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 md:h-2 bg-primary w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-8 md:p-12 text-center">
                <div className="size-14 md:size-20 bg-primary/10 text-primary rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <GraduationCap className="size-7 md:size-10" />
                </div>
                <CardTitle className="text-2xl md:text-4xl font-black text-foreground">Activation</CardTitle>
                <CardDescription className="text-sm md:text-lg font-medium mt-2">Bienvenue pour l'année scolaire {activeYear}.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-12 pt-0 space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <Label className="font-black uppercase text-[9px] md:text-[10px] text-muted-foreground tracking-[0.2em] px-2">Identifiant Officiel (ELV-...)</Label>
                  <div className="relative">
                    <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 size-5 md:size-6 text-muted-foreground" />
                    <Input 
                      placeholder="Ex: ELV-3EMEA-001" 
                      className="h-14 md:h-20 pl-12 md:pl-16 rounded-xl md:rounded-[1.5rem] text-lg md:text-2xl font-black tracking-widest border-2 focus-visible:ring-primary uppercase shadow-inner" 
                      value={matricule} 
                      onChange={e => setMatricule(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-12 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-11 md:h-14 px-4 md:px-8 text-xs md:text-sm"><Link href="/">Retour</Link></Button>
                <Button onClick={verifyIdentifier} disabled={loading} className="bg-primary rounded-xl md:rounded-2xl font-black px-6 md:px-12 h-11 md:h-14 shadow-xl shadow-primary/20 text-xs md:text-lg">
                  {loading ? <Loader2 className="size-4 md:size-5 animate-spin" /> : "Vérifier mon matricule"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-6 md:p-10 text-center">
                <Badge className="bg-primary text-white mx-auto mb-3 md:mb-4 px-4 md:px-6 py-1 md:py-2 rounded-full font-black text-[9px] md:text-xs">CLASSE : {regDoc.classId}</Badge>
                <CardTitle className="text-xl md:text-3xl font-black">Finaliser</CardTitle>
                <CardDescription className="text-xs md:text-sm font-medium italic opacity-60">"Vos données seront scellées par la direction."</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-0 space-y-6 md:space-y-8 max-h-[400px] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Nom de famille</Label>
                    <Input placeholder="KOFFI" className="h-11 md:h-12 rounded-xl font-bold uppercase text-sm" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Prénom(s)</Label>
                    <Input placeholder="Djimon" className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Sexe</Label>
                    <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                      <SelectTrigger className="h-11 md:h-12 rounded-xl font-bold text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-2 p-1.5">
                        <SelectItem value="Masculin" className="font-bold p-3 rounded-xl text-xs">Masculin</SelectItem>
                        <SelectItem value="Féminin" className="font-bold p-3 rounded-xl text-xs">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Numéro téléphone</Label>
                    <Input placeholder="+229 ..." className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Ville naissance</Label>
                    <Input placeholder="Cotonou" className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.cityOfBirth} onChange={e => setForm({...form, cityOfBirth: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Date naissance</Label>
                    <Input type="date" className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed space-y-4">
                  <h3 className="font-black text-primary flex items-center gap-2 text-[10px] md:text-sm uppercase tracking-widest"><Heart className="size-3 md:size-4" /> Parent / Responsable</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Nom du parent</Label>
                      <Input className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Prénom du parent</Label>
                      <Input className="h-11 md:h-12 rounded-xl font-bold text-sm" value={form.parentFirstName} onChange={e => setForm({...form, parentFirstName: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] md:text-xs text-muted-foreground uppercase">Définir un Mot de Passe</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="h-11 md:h-12 rounded-xl font-bold pr-12 text-sm" 
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
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-12 bg-muted/30 flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="font-bold rounded-xl h-11 md:h-14 px-4 md:px-8 text-xs md:text-sm">Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-primary rounded-xl md:rounded-2xl font-black px-6 md:px-12 h-11 md:h-14 shadow-xl shadow-primary/20 text-xs md:text-lg">
                  {loading ? <Loader2 className="size-4 md:size-5 animate-spin mr-2" /> : "Terminer"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <div className="p-10 md:p-20 text-center space-y-6 md:space-y-8 animate-in zoom-in-95">
              <div className="size-20 md:size-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-12 md:size-20" />
              </div>
              <div className="space-y-2 md:space-y-4">
                <h2 className="text-2xl md:text-4xl font-black">Succès !</h2>
                <p className="text-muted-foreground font-medium text-sm md:text-xl leading-relaxed">
                  Félicitations {form.firstName}, votre cockpit est actif en classe de <span className="text-primary font-black">{regDoc.classId}</span>.
                </p>
              </div>
              <Button asChild className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm md:text-xl shadow-xl active:scale-95 transition-all">
                <Link href="/dashboard">Entrer dans mon Cockpit <ArrowRight className="ml-2 size-4 md:size-6" /></Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

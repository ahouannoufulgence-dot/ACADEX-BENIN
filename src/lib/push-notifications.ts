"use client"

import { initializeApp, getApps } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"
import { firebaseConfig } from "@/firebase/config"
import { supabase } from "@/lib/supabase"

const VAPID_KEY = "BM9TogsTUN52NpLv0Z69Y-582MdAfAI23bwbnB7Ciy6deZAzq43jN4Vik1vXCStV7-OycJMyu8fnDBLq9gQ57Co"

/**
 * Demande la permission de notification et enregistre le token FCM
 * pour l'utilisateur courant dans Supabase.
 * VERSION DEBUG : affiche des alertes visibles à chaque étape.
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

    const supported = await isSupported()
    alert("Étape 1 - Supporté: " + supported)
    if (!supported) return false

    if (!("serviceWorker" in navigator)) {
      alert("Service Worker non disponible")
      return false
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    alert("Étape 2 - SW enregistré: " + registration.scope)

    const currentPermission = Notification.permission
    alert("Étape 3 - Permission actuelle: " + currentPermission)

    const permission = await Notification.requestPermission()
    alert("Étape 4 - Permission après demande: " + permission)

    if (permission !== "granted") {
      alert("Permission refusée, arrêt")
      return false
    }

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    alert("Étape 5 - Firebase Messaging initialisé")

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })

    alert("Étape 6 - Token: " + (token ? token.substring(0, 30) + "..." : "AUCUN"))

    if (!token) return false

    const { error } = await supabase.from("push_tokens").upsert({
      user_id: userId,
      fcm_token: token
    }, { onConflict: "user_id,fcm_token" })

    if (error) {
      alert("Erreur Supabase: " + JSON.stringify(error))
      return false
    }

    alert("SUCCÈS - Token enregistré !")
    return true
  } catch (e: any) {
    alert("ERREUR CATCH: " + (e?.message || JSON.stringify(e)))
    return false
  }
}
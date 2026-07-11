"use client"

import { initializeApp, getApps } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"
import { firebaseConfig } from "@/firebase/config"
import { supabase } from "@/lib/supabase"

const VAPID_KEY = "BM9TogsTUN52NpLv0Z69Y-582MdAfAI23bwbnB7Ciy6deZAzq43jN4Vik1vXCStV7-OycJMyu8fnDBLq9gQ57Co"

/**
 * Demande la permission de notification et enregistre le token FCM
 * pour l'utilisateur courant dans Supabase.
 * À appeler juste après une connexion réussie.
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

    const supported = await isSupported()
    if (!supported) {
      console.log("Push notifications non supportées sur cet appareil")
      return false
    }

    if (!("serviceWorker" in navigator)) return false

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.log("Permission notification refusée")
      return false
    }

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })

    if (!token) {
      console.log("Impossible de récupérer le token FCM")
      return false
    }

    const { error } = await supabase.from("push_tokens").upsert({
      user_id: userId,
      fcm_token: token
    }, { onConflict: "user_id,fcm_token" })

    if (error) {
      console.error("Erreur sauvegarde token:", error)
      return false
    }

    console.log("Token push enregistré avec succès")
    return true
  } catch (e) {
    console.error("Erreur registerPushToken:", e)
    return false
  }
}
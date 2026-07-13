import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";

// Initialiser Firebase Admin une seule fois
function getFirebaseAdmin() {
  console.log("DEBUG projectId:", process.env.FIREBASE_PROJECT_ID);
  console.log("DEBUG clientEmail:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("DEBUG base64 length:", (process.env.FIREBASE_PRIVATE_KEY_BASE64 || "").length);
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    }),
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    // Protection par token secret (même mécanisme que /api/brain)
    const authHeader = req.headers.get('x-acadex-token');
    const validToken = process.env.ACADEX_SECRET_TOKEN || 'acadex_secret_2024';
    if (!authHeader || authHeader !== validToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { userId, title, body, url } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Paramètres manquants (userId, title, body requis)' }, { status: 400 });
    }

    // Récupérer tous les tokens de cet utilisateur (peut avoir plusieurs appareils)
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Aucun token pour cet utilisateur' });
    }

    getFirebaseAdmin();
    const messaging = getMessaging();

    let sentCount = 0;
    let failedTokens: string[] = [];

    for (const t of tokens) {
      try {
        await messaging.send({
          token: t.fcm_token,
          notification: { title, body },
          data: { url: url || '/' },
          android: {
            priority: 'high' as const,
            notification: {
              sound: 'default',
              priority: 'max' as const,
              defaultVibrateTimings: true,
            }
          },
          webpush: {
            headers: { Urgency: 'high' },
            notification: {
              icon: '/icons/android-chrome-192x192.png',
              badge: '/icons/android-chrome-192x192.png',
              requireInteraction: true,
              vibrate: [200, 100, 200]
            },
            fcmOptions: { link: url || '/' }
          }
        });
        sentCount++;
      } catch (e: any) {
        // Token invalide/expiré -> à supprimer
        if (e?.code === 'messaging/registration-token-not-registered') {
          failedTokens.push(t.fcm_token);
        }
      }
    }

    // Nettoyer les tokens invalides
    if (failedTokens.length > 0) {
      await supabaseAdmin.from('push_tokens').delete().in('fcm_token', failedTokens);
    }

    return NextResponse.json({ sent: sentCount, cleaned: failedTokens.length });
  } catch (e: any) {
    console.error('Erreur envoi notification:', e);
    return NextResponse.json({ error: e.message || 'Erreur serveur', debug: { hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID), hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL), keyLength: (process.env.FIREBASE_PRIVATE_KEY || '').length, keyStart: (process.env.FIREBASE_PRIVATE_KEY || '').substring(0, 30) } }, { status: 500 });
  }
}
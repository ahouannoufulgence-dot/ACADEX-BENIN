/**
 * Envoie une notification push à un utilisateur via /api/notify.
 * Échoue silencieusement si l'utilisateur n'a pas de token (pas grave,
 * ça ne doit jamais bloquer l'action principale comme sauvegarder une note).
 */
export async function sendPushNotification(params: {
    userId: string
    title: string
    body: string
    url?: string
  }) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acadex-token': process.env.NEXT_PUBLIC_ACADEX_TOKEN || 'acadex_secret_2024'
        },
        body: JSON.stringify(params)
      })
    } catch (e) {
      // Silencieux : une notification ratée ne doit jamais bloquer l'action principale
      console.error('Erreur envoi notification:', e)
    }
  }
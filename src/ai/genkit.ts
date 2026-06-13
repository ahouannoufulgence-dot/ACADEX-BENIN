/**
 * Connecteur direct ACADEX vers l'API Groq
 * Performance maximale et analyse en temps réel.
 */

export async function callGroq(messages: {role: string, content: string}[]) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error("GROQ_API_KEY manquante dans l'environnement.");
    return "Le service d'intelligence est en maintenance technique. Veuillez configurer la clé API dans Vercel.";
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.5,
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      return "Je rencontre une difficulté pour me connecter à mon centre de calcul. Veuillez réessayer dans quelques instants.";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Fetch Error:", error);
    return "Une erreur de connexion est survenue. L'analyse ne peut pas aboutir pour le moment.";
  }
}

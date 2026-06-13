/**
 * Connecteur direct ACADEX vers l'API Groq
 * Performance maximale et analyse en temps réel.
 */

export async function callGroq(messages: {role: string, content: string}[]) {
  // Clé API fournie par l'utilisateur
  const apiKey = "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";
  
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
        temperature: 0.4, // Un peu plus bas pour plus de précision sur les chiffres
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      return "Je rencontre une difficulté technique pour accéder à mon centre de calcul. Veuillez vérifier la connexion.";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Fetch Error:", error);
    return "Une erreur de connexion est survenue. L'analyse ne peut pas aboutir pour le moment.";
  }
}

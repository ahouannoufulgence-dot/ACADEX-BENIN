export async function callGroq(messages: {role: string, content: string}[]) {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://acadex-benin.vercel.app')
      : '';
    const response = await fetch(`${baseUrl}/api/brain`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
      "x-acadex-token": process.env.NEXT_PUBLIC_ACADEX_TOKEN || "acadex_secret_2024" },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) {
      console.error("Brain API Error:", await response.text());
      return "Je rencontre une difficulté technique pour accéder à mon centre de calcul.";
    }
    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Fetch Error:", error);
    return "Une erreur de connexion est survenue. L'analyse ne peut pas aboutir pour le moment.";
  }
}

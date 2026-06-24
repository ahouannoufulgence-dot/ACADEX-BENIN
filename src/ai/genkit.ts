export async function callGroq(messages: {role: string, content: string}[]) {
  try {
    const response = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

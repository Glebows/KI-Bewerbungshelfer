// netlify/functions/generate.js

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// Das ist die "Serverless Function"
export async function handler(event, context) {
  // Wir erlauben Anfragen von überall (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Netlify sendet manchmal eine "Preflight"-Anfrage, die wir einfach mit OK beantworten
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    const { skills, experience, jobDescription } = JSON.parse(event.body);

    const prompt = `
      Erstelle ein perfektes, professionelles und motiviertes deutsches Anschreiben für ein Praktikum oder eine Arbeitsstelle.
      
      Struktur:
      1. Einleitung: Nimm Bezug auf die Stellenanzeige und bekunde klares Interesse.
      2. Hauptteil: Gehe auf die Anforderungen der Stellenanzeige ein. Verbinde die Fähigkeiten und Erfahrungen des Bewerbers überzeugend mit den Anforderungen. Wenn der Bewerber wenig formale Erfahrung hat, betone stattdessen seine Eigeninitiative, seine Projekte und seine hohe Lernbereitschaft. Belege jede Behauptung mit einem Beispiel aus den bereitgestellten Informationen.
      3. Schluss: Formuliere einen klaren Schlusssatz mit dem Wunsch nach einem persönlichen Gespräch.

      Anforderungen an den Text:
      - Der Ton soll professionell, enthusiastisch und selbstbewusst sein, aber nicht überheblich.
      - Vermeide jegliche Platzhalter wie "[Name des Bewerbers]" oder "[Datum]".
      - Schreibe flüssige, ausformulierte Sätze. Keine Stichpunkte.
      - Beende den Text exakt nach der Grußformel "Mit freundlichen Grüßen". Füge danach KEINEN Namen oder weitere Kontaktdaten hinzu.

      Hier sind die Informationen über den Bewerber:
      Fähigkeiten: ${skills}
      Erfahrungen: ${experience}

      Hier ist die Stellenanzeige, auf die sich beworben wird:
      ${jobDescription}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();
    
    // Wir schicken die Antwort im speziellen Format zurück, das Netlify erwartet
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ anschreiben: generatedText })
    };

  } catch (error) {
    console.error('Fehler bei der Google AI-Anfrage:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Etwas ist schiefgelaufen.' })
    };
  }
}

import { GoogleGenAI } from "@google/genai";
import { GameState, GameLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGame = async (state: GameState, log: GameLog[]) => {
  try {
    const prompt = `
      As a basketball commentator, provide a 2-sentence expert analysis of the current game state.
      Home Team (${state.home.name}): ${state.home.score}
      Away Team (${state.away.name}): ${state.away.score}
      Period: ${state.period}
      Time Remaining: ${Math.floor(state.gameClock / 60)}:${(state.gameClock % 60).toString().padStart(2, '0')}
      Recent Events (Log):
      ${log.slice(-5).map(l => l.event).join('\n')}
      
      Make the tone professional, like ESPN or TNT.
    `;

    // Updated to follow @google/genai guidelines: avoid setting maxOutputTokens if not strictly required.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        // Removed maxOutputTokens to prevent potential empty responses when thinking is involved.
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "The game is intense! Every possession matters in this matchup.";
  }
};

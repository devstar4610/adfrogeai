/**
 * AdForge AI - Shared Google GenAI Client
 * Initializes the official @google/genai SDK with appropriate telemetry headers.
 */
import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please ensure your Gemini API key is set in AI Studio Secrets.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

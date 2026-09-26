/**
 * AdForge AI - Central Configuration Module
 * Single source of truth for AI model identifiers, API keys, paths, and timeouts.
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  storageDir: process.env.STORAGE_DIR || './data/storage',
  dbFile: process.env.DB_FILE || './data/adforge_db.json',
  
  // Model Identifiers strictly adhering to official guidelines
  models: {
    // Creative brief planning & JSON reasoning
    planner: 'gemini-3.8-flash',
    // Nano Banana 2 Lite / Flash Lite Image for rapid visual storyboard generation
    imageGenerator: 'gemini-3.1-flash-lite-image',
    // Gemini Omni Flash for video generation and multi-turn conversational video editing
    videoGenerator: 'gemini-omni-1.1-flash',
    // Lyria for adaptive soundtrack generation
    musicGenerator: 'lyria-3-clip-preview',
    musicGeneratorPro: 'lyria-3.5',
  },

  timeouts: {
    planner: 60000,
    image: 90000,
    video: 360000,
    audio: 120000,
    ffmpeg: 180000,
  },

  jwtSecret: process.env.JWT_SECRET || 'adforge-ai-studio-production-secret-2026',
};

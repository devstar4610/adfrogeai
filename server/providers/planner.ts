/**
 * AdForge AI - Creative Planner Provider
 * Uses Gemini 3.8 Flash to transform raw creative briefs into structured
 * creative plans and a persistent Visual Bible for cross-modal continuity.
 */
import { Type } from '@google/genai';
import { getGenAI } from './client';
import { config } from '../config';
import { CreativePlan, VisualBible } from '../database';

export interface PlanGenerationInput {
  title: string;
  brief: string;
  target_audience: string;
  duration: number; // e.g. 20
  visual_style: string;
  aspect_ratio: string;
  brand_info?: string;
}

export interface PlanGenerationResult {
  plan: CreativePlan;
  visual_bible: VisualBible;
}

export class CreativePlannerProvider {
  async generatePlan(input: PlanGenerationInput): Promise<PlanGenerationResult> {
    const ai = getGenAI();

    const systemInstruction = `You are an elite cinematic advertising director and multimodal creative strategist for high-end commercial campaigns.
Your responsibility is to take a creative brief and generate two structured artifacts:
1. A meticulously timed "Creative Plan" breaking down the entire commercial into sequential scenes that fit exactly into the specified duration (${input.duration} seconds).
2. A comprehensive "Visual Bible" detailing the persistent characters, hero products, recurring locations, color palettes, lighting rules, and camera language so that downstream image, video, and audio generators maintain strict visual and thematic continuity.

Ensure every scene has:
- scene_number (1-indexed)
- duration (summing precisely to ${input.duration} seconds)
- title (cinematic headline)
- description (rich visual prompt instructions)
- subject (key focal point)
- camera (focal length, motion, angle, e.g. "Low-angle tracking shot on 35mm anamorphic")
- lighting (exact lighting style, e.g. "Volumetric neon rim light with deep shadows")
- transition (e.g. "Hard cut on beat", "Whip pan", "Match cut")
- energy_level ("low", "medium", "high", or "climax")`;

    const prompt = `Creative Brief Details:
- Project Title: ${input.title}
- Creative Brief: ${input.brief}
- Target Audience: ${input.target_audience}
- Desired Duration: ${input.duration} seconds
- Visual Style / Mood: ${input.visual_style}
- Aspect Ratio: ${input.aspect_ratio}
- Brand / Product Specifications: ${input.brand_info || 'Not specified'}

Analyze the brief and generate the complete structured creative plan and visual bible in JSON format.`;

    const response = await ai.models.generateContent({
      model: config.models.planner,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                target_audience: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                tone: { type: Type.STRING },
                visual_style: { type: Type.STRING },
                color_direction: { type: Type.STRING },
                camera_language: { type: Type.STRING },
                music_direction: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      scene_number: { type: Type.INTEGER },
                      duration: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      subject: { type: Type.STRING },
                      camera: { type: Type.STRING },
                      lighting: { type: Type.STRING },
                      transition: { type: Type.STRING },
                      energy_level: {
                        type: Type.STRING,
                        description: 'low, medium, high, or climax',
                      },
                    },
                    required: [
                      'scene_number',
                      'duration',
                      'title',
                      'description',
                      'subject',
                      'camera',
                      'lighting',
                      'transition',
                      'energy_level',
                    ],
                  },
                },
              },
              required: [
                'concept',
                'target_audience',
                'duration',
                'tone',
                'visual_style',
                'color_direction',
                'camera_language',
                'music_direction',
                'scenes',
              ],
            },
            visual_bible: {
              type: Type.OBJECT,
              properties: {
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      role: { type: Type.STRING },
                    },
                    required: ['name', 'description', 'role'],
                  },
                },
                products: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      visual_features: { type: Type.STRING },
                      color: { type: Type.STRING },
                    },
                    required: ['name', 'description', 'visual_features', 'color'],
                  },
                },
                locations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      atmosphere: { type: Type.STRING },
                    },
                    required: ['name', 'description', 'atmosphere'],
                  },
                },
                visual_style: { type: Type.STRING },
                color_palette: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                lighting_style: { type: Type.STRING },
                camera_language: { type: Type.STRING },
                environment: { type: Type.STRING },
              },
              required: [
                'characters',
                'products',
                'locations',
                'visual_style',
                'color_palette',
                'lighting_style',
                'camera_language',
                'environment',
              ],
            },
          },
          required: ['plan', 'visual_bible'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Creative Planner model returned an empty response.');
    }

    const parsed = JSON.parse(text) as PlanGenerationResult;
    return parsed;
  }
}

export const plannerProvider = new CreativePlannerProvider();

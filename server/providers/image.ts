/**
 * AdForge AI - Nano Banana 2 Lite Image Generation Provider
 * Uses gemini-3.1-flash-lite-image to generate consistent storyboard scene frames,
 * contextual visual assets, and scene alternatives anchored in the Visual Bible.
 */
import { getGenAI } from './client';
import { config } from '../config';
import { storage, StoredMedia } from '../storage';
import { VisualBible, CreativePlan, Scene } from '../database';

export interface SceneImageContext {
  scene: Scene;
  plan: CreativePlan;
  visualBible: VisualBible;
  aspectRatio: '16:9' | '9:16' | '1:1';
  alternativePrompt?: string;
}

export class NanoBananaImageProvider {
  /**
   * Constructs the rich contextual prompt fusing scene details with the persistent Visual Bible
   */
  private buildPrompt(ctx: SceneImageContext): string {
    const { scene, visualBible, plan, alternativePrompt } = ctx;

    const productsContext = visualBible.products
      .map((p) => `- Hero Product: "${p.name}". Details: ${p.description}. Visual Features: ${p.visual_features}. Color: ${p.color}.`)
      .join('\n');

    const charactersContext = visualBible.characters
      .map((c) => `- Character: "${c.name}". Description: ${c.description}. Role: ${c.role}.`)
      .join('\n');

    const locationsContext = visualBible.locations
      .map((l) => `- Key Environment: "${l.name}". Atmosphere: ${l.atmosphere}. Details: ${l.description}.`)
      .join('\n');

    const colorsContext = visualBible.color_palette.join(', ');

    return `MASTER VISUAL CONTINUITY & PRODUCTION DIRECTIVE:
Project Aesthetic: ${visualBible.visual_style}
Color Direction: ${colorsContext}
Lighting Architecture: ${visualBible.lighting_style}
Camera Language: ${visualBible.camera_language}
Global Environment: ${visualBible.environment}

HERO ASSETS FOR VISUAL CONTINUITY (MANDATORY ACCURACY):
${productsContext || 'None specified'}
${charactersContext || 'None specified'}
${locationsContext || 'None specified'}

SPECIFIC SCENE STORYBOARD FRAME:
Scene Number: ${scene.scene_number} - "${scene.title}"
Subject: ${scene.subject}
Scene Action / Narrative: ${scene.description}
Camera Framing & Motion: ${scene.camera}
Lighting Design: ${scene.lighting}
Atmospheric Energy: ${scene.energy_level}
${alternativePrompt ? `Director Revision Request: ${alternativePrompt}` : ''}

Generate a cinematic, production-grade storyboard still frame adhering strictly to the visual style, color palette, and product specifications defined above. Photorealistic, hyper-detailed commercial cinematography.`;
  }

  /**
   * Generates a storyboard frame for a scene using gemini-3.1-flash-lite-image
   */
  async generateSceneImage(ctx: SceneImageContext): Promise<{ media: StoredMedia; promptUsed: string }> {
    const ai = getGenAI();
    const prompt = this.buildPrompt(ctx);

    const validAspectRatio =
      ctx.aspectRatio === '9:16' || ctx.aspectRatio === '1:1' || ctx.aspectRatio === '16:9'
        ? ctx.aspectRatio
        : '16:9';

    const response = await ai.models.generateContent({
      model: config.models.imageGenerator,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: validAspectRatio,
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidate returned by the image generation model.');
    }

    let base64Data: string | null = null;
    let mimeType = 'image/png';

    for (const part of candidates[0].content?.parts || []) {
      if (part.inlineData?.data) {
        base64Data = part.inlineData.data;
        if (part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        break;
      }
    }

    if (!base64Data) {
      throw new Error('Image model succeeded without returning inline image data.');
    }

    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const media = await storage.saveBase64(base64Data, 'images', ext, mimeType);

    return { media, promptUsed: prompt };
  }
}

export const nanoBananaProvider = new NanoBananaImageProvider();

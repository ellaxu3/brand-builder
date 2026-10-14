import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

const port = 3000;

// Lazy initialization function to handle missing GEMINI_API_KEY gracefully
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in Secrets / environment variables.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Route to generate cohesive brand prompts and guides
app.post('/api/plan-brand', async (req, res) => {
  try {
    const { productName, productDescription, slogan, typographyStyle, vibe } = req.body;

    if (!productName || !productDescription) {
      return res.status(400).json({ error: 'Product name and description are required.' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert brand strategist and image prompting specialist.
Your task is to take a product name, description, slogan, typography style, and brand vibe, and generate a cohesive Brand Identity and three highly optimized image generation prompts for the Nano-Banana image model (gemini-3.1-flash-lite-image or gemini-3.1-flash-image).

Crucial Constraints for the Image Generation Prompts:
1. STRICTLY NO PEOPLE: Under no circumstances should any people, human figures, hands, faces, silhouettes, or body parts be in any generated image. Explicitly state this in all prompts (e.g. "Strictly no people, no hands, human-free composition").
2. PRODUCT CONSISTENCY: Visually describe the product in meticulous detail (shape, materials, texture, colors, finish, unique branding markers) in each prompt so that the product looks identical in all shots.
3. SLOGAN INTEGRATION: Ensure the custom text/slogan is seamlessly integrated. State: "The exact text '[SLOGAN]' must be cleanly and professionally integrated into the ad, rendered in a consistent ${typographyStyle || 'bold sans-serif'} typography style, looking like actual polished branding."
4. NO GARBLED TEXT: Explicitly command the model to ONLY render the exact characters in the slogan '[SLOGAN]' and avoid any random filler text on the product or ad background.
5. MEDIUM SPECIFICS:
   - Billboard: A wide horizontal shot of a high-impact outdoor billboard. It is set against a clean, uncluttered background (like a clear blue sky or modern minimalist architecture). The billboard clearly showcases the product and the slogan '[SLOGAN]' in ${typographyStyle || 'bold sans-serif'} font. Wide shot, 16:9 composition, strictly no people or cars.
   - Newspaper: A high-contrast monochrome or low-saturation printed newspaper ad. It features realistic newsprint texture, clean layout grids, elegant border lines, with surrounding mock columns of neat text. The slogan '[SLOGAN]' is integrated as a crisp printed headline in ${typographyStyle || 'serif'} style. Strictly no people.
   - Social Post: A sleek, high-end studio lifestyle product photography shot for social media. Styled with soft natural lighting, elegant geometric props, minimal background, and extremely polished layout. The slogan '[SLOGAN]' is integrated cleanly, perhaps in a subtle lower-third overlay or embossed nicely. Strictly no people, clean 1:1 framing.`;

    const promptText = `Generate the brand details and image prompts for:
Product: ${productName}
Description: ${productDescription}
Slogan: ${slogan || ''}
Vibe/Vibe: ${vibe || 'modern minimalist'}
Typography: ${typographyStyle || 'Sleek Modern Sans'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 color hex codes or descriptors that fit this brand visual identity.'
            },
            brandDescription: {
              type: Type.STRING,
              description: 'A summary explaining the visual strategy for consistent representation.'
            },
            typographyNotes: {
              type: Type.STRING,
              description: 'How the slogan text/typography is structured for perfect consistency across mediums.'
            },
            billboardPrompt: {
              type: Type.STRING,
              description: 'Detailed prompt for the billboard image generation.'
            },
            newspaperPrompt: {
              type: Type.STRING,
              description: 'Detailed prompt for the newspaper ad image generation.'
            },
            socialPrompt: {
              type: Type.STRING,
              description: 'Detailed prompt for the social post image generation.'
            }
          },
          required: ['brandColors', 'brandDescription', 'typographyNotes', 'billboardPrompt', 'newspaperPrompt', 'socialPrompt']
        }
      }
    });

    const parsedResult = JSON.parse(response.text || '{}');
    return res.json(parsedResult);
  } catch (error: any) {
    console.error('Error planning brand:', error);
    return res.status(500).json({ error: error.message || 'Failed to plan brand identity.' });
  }
});

// Route to generate an image using a selected Nano-Banana model and aspect ratio
app.post('/api/generate-shot', async (req, res) => {
  try {
    const { prompt, aspectRatio, modelName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getGeminiClient();

    // Select the correct model: Nano-Banana (lite) or Nano-Banana 2 (high-quality)
    // Lite: gemini-3.1-flash-lite-image
    // Pro/High-Quality: gemini-3.1-flash-image
    const selectedModel = modelName === 'high-quality' ? 'gemini-3.1-flash-image' : 'gemini-3.1-flash-lite-image';

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio || '1:1',
      }
    };

    // If using the high-quality model, we can specify image size
    if (selectedModel === 'gemini-3.1-flash-image') {
      config.imageConfig.imageSize = '1K';
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [{ text: prompt }]
      },
      config
    });

    let base64Image = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      return res.status(500).json({ error: 'No image was returned by the image model.' });
    }

    return res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error('Error generating image shot:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate brand shot.' });
  }
});

// Check if API key is configured
app.get('/api/config-check', (req, res) => {
  return res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Serve Vite in development, static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

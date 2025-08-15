import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(apiKey);

const GENERATION_CONFIG = {
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

const IMAGE_GENERATION_CONFIG = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 512,
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && shouldRetry(error)) {
      console.log(`Retrying operation in ${delay}ms... (${retries} attempts left)`);
      await sleep(delay);
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

function shouldRetry(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  return (
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('temporarily overloaded') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  );
}

function handleApiError(error: any): string {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('api_key_invalid') || errorMessage.includes('api key')) {
    throw new Error('Invalid Google AI API Key. Please check your configuration.');
  }
  
  if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota')) {
    throw new Error('Google AI quota exceeded. Please try again later.');
  }
  
  if (errorMessage.includes('model_not_found') || errorMessage.includes('model')) {
    throw new Error('Gemini model not available. Please try again later.');
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
    throw new Error('Service Unavailable: The model is overloaded. Please try again later.');
  }
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
  }
  
  if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
    return 'I apologize, but I cannot provide a response to that request due to safety guidelines. Please try rephrasing your question in a different way.';
  }
  
  if (errorMessage.includes('timeout')) {
    throw new Error('Request timeout. Please try again.');
  }
  
  if (errorMessage.includes('network')) {
    throw new Error('Network error. Please check your connection and try again.');
  }
  
  throw new Error(`AI service error: ${error.message || 'Unknown error occurred'}`);
}

export async function generateText(prompt: string): Promise<string> {
  if (!prompt?.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  if (prompt.length > 8000) {
    throw new Error('Prompt is too long. Please shorten your message.');
  }

  const operation = async () => {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: GENERATION_CONFIG,
      });
      
      const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const enhancedPrompt = `You are an intelligent AI assistant with extensive knowledge and conversational abilities.

Current date and time: ${currentTime} UTC
User query: ${prompt}

Instructions:
- Provide helpful, accurate, and engaging responses
- Use relevant emojis to make responses more engaging  
- Be conversational and friendly while maintaining accuracy
- For complex topics, break down explanations clearly
- If asked about current events after January 2025, acknowledge your knowledge limitations
- Keep responses informative but conversational
- Use markdown formatting when helpful (like **bold** for emphasis)
- If the user asks for something that could be harmful or inappropriate, politely decline and suggest alternatives

Response: `;

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text?.trim()) {
        throw new Error('Empty response from AI service');
      }
      
      return text.trim();
    } catch (error: any) {
      console.error('Error generating text:', error);
      const errorResult = handleApiError(error);
      if (typeof errorResult === 'string') {
        return errorResult;
      }
      throw new Error('Unknown error occurred');
    }
  };

  return retryWithBackoff(operation);
}

export async function generateImage(prompt: string): Promise<{ description: string; imageUrl: string }> {
  if (!prompt?.trim()) {
    throw new Error('Image prompt cannot be empty');
  }

  if (prompt.length > 2000) {
    throw new Error('Image prompt is too long. Please shorten your description.');
  }

  const operation = async () => {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: IMAGE_GENERATION_CONFIG,
      });
      
      const imagePrompt = `Create a vivid, detailed, and artistic description for an image based on this request: "${prompt}".

Requirements:
- Make the description visual, specific, and rich in detail
- Include colors, composition, lighting, mood, and artistic style
- Focus on creating something beautiful and engaging
- Keep it under 150 words but make it compelling
- Consider modern artistic styles and techniques
- Avoid any inappropriate, harmful, or offensive content
- Make it suitable for image generation

Example format: "A breathtaking sunset over snow-capped mountains, with vibrant orange and pink hues painting the sky, golden light illuminating the peaks, creating a serene and majestic landscape with dramatic clouds and ethereal atmosphere"

Description: `;

      const result = await model.generateContent(imagePrompt);
      const response = await result.response;
      const description = response.text();
      
      if (!description?.trim()) {
        throw new Error('Empty description from AI service');
      }

      const cleanPrompt = prompt
        .replace(/[^\w\s]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 200);
      
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=800&height=600&nologo=true&nofeed=true&seed=${timestamp}-${randomSeed}`;
      
      return {
        description: `🎨 **AI Generated Image Description:** ${description.trim()}\n\n*Note: This is a conceptual description paired with a generated image*`,
        imageUrl: imageUrl
      };
    } catch (error: any) {
      console.error('Error generating image description:', error);
      
      if (shouldRetry(error)) {
        throw error;
      }
      
      const cleanPrompt = prompt
        .replace(/[^\w\s]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 200);
        
      const fallbackPrompt = `${cleanPrompt} beautiful artistic style`;
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      return {
        description: `🎨 **Creative Interpretation:** A beautiful and creative interpretation of: "${prompt}"\n\n*This represents a visual concept based on your request. The AI description service encountered an issue, but here's a generated image based on your prompt.*`,
        imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=800&height=600&nologo=true&nofeed=true&seed=${timestamp}-${randomSeed}`
      };
    }
  };

  return retryWithBackoff(operation);
}
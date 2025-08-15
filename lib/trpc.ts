import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { createClient } from '@supabase/supabase-js';
import { generateText, generateImage } from './gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const createSupabaseClient = () => {
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Database configuration error');
  }
};

const supabase = createSupabaseClient();

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
      },
    };
  },
});

async function testDatabaseConnection() {
  try {
    const { error } = await supabase.from('messages').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export const appRouter = t.router({
  getMessages: t.procedure
    .query(async () => {
      try {
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
          throw new Error('Database connection failed');
        }

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);
        
        if (error) {
          console.error('Database query error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        return data || [];
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (error instanceof Error) {
          if (error.message.includes('fetch failed')) {
            throw new Error('Network connection failed. Please check your internet connection.');
          }
          if (error.message.includes('timeout')) {
            throw new Error('Request timed out. Please try again.');
          }
          throw error;
        }
        throw new Error('Failed to fetch messages');
      }
    }),

  sendMessage: t.procedure
    .input(z.object({
      message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
      isImageRequest: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const userId = 'anonymous';
      
      try {
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
          throw new Error('Database connection failed');
        }

        const { data: userMessage, error: userError } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            role: 'user',
            content: input.message.trim(),
          })
          .select()
          .single();

        if (userError) {
          console.error('User message error:', userError);
          throw new Error(`Failed to save user message: ${userError.message}`);
        }

        let assistantContent = '';
        let imageUrl = null;

        try {
          if (input.isImageRequest) {
            const imageResult = await generateImage(input.message);
            assistantContent = imageResult.description;
            imageUrl = imageResult.imageUrl;
          } else {
            assistantContent = await generateText(input.message);
          }
        } catch (aiError: any) {
          console.error('AI generation error:', aiError);
          
          if (aiError?.message?.includes('503') || aiError?.message?.includes('Service Unavailable')) {
            assistantContent = 'I apologize, but the AI service is temporarily overloaded. Please try again in a few moments.';
          } else if (aiError?.message?.includes('quota')) {
            assistantContent = 'I apologize, but the AI service quota has been exceeded. Please try again later.';
          } else if (aiError?.message?.includes('rate limit')) {
            assistantContent = 'I apologize, but too many requests have been made. Please wait a moment before trying again.';
          } else {
            assistantContent = input.isImageRequest 
              ? 'Sorry, I encountered an error while generating the image. Please try again with a different description.'
              : 'Sorry, I encountered an error while processing your message. Please try rephrasing your question.';
          }
        }

        const { data: assistantMessage, error: assistantError } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            role: 'assistant',
            content: assistantContent,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (assistantError) {
          console.error('Assistant message error:', assistantError);
          throw new Error(`Failed to save assistant message: ${assistantError.message}`);
        }

        return { userMessage, assistantMessage };
      } catch (error) {
        console.error('Send message error:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('fetch failed')) {
            throw new Error('Network connection failed. Please check your internet connection.');
          }
          if (error.message.includes('timeout')) {
            throw new Error('Request timed out. Please try again.');
          }
          throw error;
        }
        
        throw new Error('Failed to send message');
      }
    }),

  clearMessages: t.procedure
    .mutation(async () => {
      try {
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
          throw new Error('Database connection failed');
        }

        const { error } = await supabase
          .from('messages')
          .delete()
          .gte('created_at', '2000-01-01T00:00:00.000Z');
        
        if (error) {
          console.error('Clear messages error:', error);
          throw new Error(`Failed to clear messages: ${error.message}`);
        }
        
        return { success: true, message: 'All messages cleared successfully' };
      } catch (error) {
        console.error('Clear messages error:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('fetch failed')) {
            throw new Error('Network connection failed. Please check your internet connection.');
          }
          if (error.message.includes('timeout')) {
            throw new Error('Request timed out. Please try again.');
          }
          throw error;
        }
        
        throw new Error('Failed to clear messages');
      }
    }),

  healthCheck: t.procedure
    .query(async () => {
      try {
        const dbConnected = await testDatabaseConnection();
        return {
          status: 'ok',
          database: dbConnected ? 'connected' : 'disconnected',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),
});

export type AppRouter = typeof appRouter;
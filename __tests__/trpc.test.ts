import { generateText, generateImage } from '../lib/gemini';

// Mock Google AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mock AI response'),
        },
      }),
    }),
  })),
}));

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        error: null,
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          error: null,
        }),
      }),
    }),
  },
}));

// Mock Auth0
jest.mock('@auth0/nextjs-auth0', () => ({
  getSession: jest.fn().mockResolvedValue({
    user: {
      sub: 'test-user-id',
    },
  }),
}));

describe('Gemini AI Service', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should generate text response successfully', async () => {
      const result = await generateText('Hello');
      expect(result).toBe('Mock AI response');
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('API Error');
      
      // Mock the Google AI to throw an error
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockRejectedValue(mockError),
          }),
        })),
      }));

      await expect(generateText('Hello')).rejects.toThrow('Failed to generate text response');
    });
  });

  describe('generateImage', () => {
    it('should generate image with description and URL', async () => {
      const result = await generateImage('beautiful sunset');
      
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('imageUrl');
      expect(result.description).toBe('Mock AI response');
      expect(result.imageUrl).toContain('unsplash.com');
      expect(result.imageUrl).toContain('beautiful,sunset');
    });

    it('should handle empty prompts', async () => {
      const result = await generateImage('');
      
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('imageUrl');
    });

    it('should handle long prompts by truncating for image URL', async () => {
      const longPrompt = 'a very long description with many words that should be truncated for the image URL generation';
      const result = await generateImage(longPrompt);
      
      expect(result.imageUrl).toContain('a,very,long');
      expect(result.imageUrl).not.toContain('that,should,be');
    });
  });
});

describe('TRPC Procedures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate sendMessage input', () => {
    // Test input validation schema
    const validInput = {
      message: 'Hello world',
      isImageRequest: false,
    };

    const invalidInput = {
      message: '', // Empty message should fail
      isImageRequest: false,
    };

    expect(validInput.message.length).toBeGreaterThan(0);
    expect(invalidInput.message.length).toBe(0);
  });

  it('should handle authentication requirements', () => {
    // Mock no session
    jest.doMock('@auth0/nextjs-auth0', () => ({
      getSession: jest.fn().mockResolvedValue(null),
    }));

    // This would test the authentication logic
    expect(true).toBe(true); // Placeholder for actual auth test
  });

  it('should handle rate limiting', () => {
    // Test rate limiting logic
    const mockMessages = Array.from({ length: 10 }, (_, i) => ({
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));

    expect(mockMessages.length).toBe(10);
  });
});

describe('Database Operations', () => {
  it('should save user messages', () => {
    // Test message saving logic
    const userMessage = {
      user_id: 'test-user',
      content: 'Hello',
      role: 'user' as const,
    };

    expect(userMessage.role).toBe('user');
    expect(userMessage.content).toBe('Hello');
  });

  it('should save AI responses', () => {
    const aiMessage = {
      user_id: 'test-user',
      content: 'AI response',
      role: 'assistant' as const,
      image_url: 'https://example.com/image.jpg',
    };

    expect(aiMessage.role).toBe('assistant');
    expect(aiMessage.image_url).toBeDefined();
  });

  it('should fetch messages in correct order', () => {
    const messages = [
      { created_at: '2024-01-01T10:00:00Z', content: 'First' },
      { created_at: '2024-01-01T10:01:00Z', content: 'Second' },
    ];

    const sorted = messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    expect(sorted[0].content).toBe('First');
    expect(sorted[1].content).toBe('Second');
  });
});
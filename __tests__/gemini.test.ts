import { generateText, generateImage } from '../lib/gemini'

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
}))

describe('Gemini AI Service', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test-key'
  })

  it('should generate text response', async () => {
    const result = await generateText('Hello')
    expect(result).toBe('Mock AI response')
  })

  it('should generate image with description', async () => {
    const result = await generateImage('beautiful sunset')
    expect(result).toHaveProperty('description')
    expect(result).toHaveProperty('imageUrl')
    expect(result.imageUrl).toContain('unsplash.com')
  })
})
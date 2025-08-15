interface SerpApiResponse {
  search_metadata: {
    status: string;
    query_displayed: string;
  };
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }>;
  answer_box?: {
    answer: string;
    title: string;
    link: string;
  };
  sports_results?: {
    title: string;
    game_spotlight?: {
      teams: Array<{
        name: string;
        score: string;
      }>;
      status: string;
      date: string;
    };
  };
  knowledge_graph?: {
    title: string;
    description: string;
  };
}

export class SerpApiService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor() {
    this.apiKey = process.env.SERP_API_KEY!;
    if (!this.apiKey) {
      throw new Error('SERP_API_KEY environment variable is required');
    }
  }

  async search(query: string, options: {
    location?: string;
    hl?: string; 
    gl?: string; 
    num?: number; 
  } = {}): Promise<SerpApiResponse> {
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      api_key: this.apiKey,
      location: options.location || 'United States',
      hl: options.hl || 'en',
      gl: options.gl || 'us',
      num: (options.num || 10).toString(),
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status} ${response.statusText}`);
      }

      const data: SerpApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('SERP API request failed:', error);
      throw new Error('Failed to fetch search results');
    }
  }

  async getSportsScore(team1: string | undefined, team2: string | undefined): Promise<string> {
    const t1 = team1 ?? '';
    const t2 = team2 ?? '';
    const query = `${t1} vs ${t2} live score`;
    
    try {
      const data = await this.search(query);

      if (data.sports_results?.game_spotlight) {
        const game = data.sports_results.game_spotlight;
        const teams = game.teams;
        const status = game.status;
        
        if (teams && teams.length >= 2 && teams[0] && teams[1]) {
          return `${teams[0].name}: ${teams[0].score} - ${teams[1].name}: ${teams[1].score} (${status})`;
        }
      }

      if (data.answer_box?.answer) {
        return data.answer_box.answer;
      }

      if (data.organic_results && data.organic_results.length > 0) {
        const relevantResult = data.organic_results.find(result => 
          result.snippet.toLowerCase().includes('score') || 
          result.snippet.toLowerCase().includes(t1.toLowerCase()) ||
          result.snippet.toLowerCase().includes(t2.toLowerCase())
        );
        
        if (relevantResult) {
          return `${relevantResult.title}: ${relevantResult.snippet}`;
        }
      }

      return `No live score found for ${t1} vs ${t2}. Please check sports websites for the latest updates.`;
    } catch (error) {
      console.error('Error fetching sports score:', error);
      return `Unable to fetch live score at this time. Please try again later.`;
    }
  }

  async getNewsUpdates(topic: string): Promise<string> {
    const query = `${topic} news today`;
    
    try {
      const data = await this.search(query, { num: 5 });
      
      if (data.organic_results && data.organic_results.length > 0) {
        const newsItems = data.organic_results
          .slice(0, 5)
          .map((result, index) => {
            const date = result.date ? ` (${result.date})` : '';
            return `${index + 1}. **${result.title}**${date}\n   ${result.snippet}\n   Source: ${new URL(result.link).hostname}`;
          })
          .join('\n\n');
        
        return `Here are the latest news updates about ${topic}:\n\n${newsItems}`;
      }

      return `No recent news found for "${topic}". Please try a different search term.`;
    } catch (error) {
      console.error('Error fetching news:', error);
      return `Unable to fetch news updates at this time. Please try again later.`;
    }
  }

  async getGeneralInfo(query: string): Promise<string> {
    try {
      const data = await this.search(query);

      if (data.knowledge_graph) {
        return `${data.knowledge_graph.title}: ${data.knowledge_graph.description}`;
      }

      if (data.answer_box?.answer) {
        return data.answer_box.answer;
      }

      if (data.organic_results && data.organic_results.length > 0) {
        const topResults = data.organic_results
          .slice(0, 3)
          .map((result, index) => {
            return `${index + 1}. **${result.title}**\n   ${result.snippet}\n   Source: ${new URL(result.link).hostname}`;
          })
          .join('\n\n');
        
        return `Here's what I found about "${query}":\n\n${topResults}`;
      }

      return `No results found for "${query}". Please try rephrasing your search.`;
    } catch (error) {
      console.error('Error fetching general info:', error);
      return `Unable to fetch information at this time. Please try again later.`;
    }
  }

  async handleQuery(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();

    const sportsPatterns = [
      /(\w+)\s+vs?\s+(\w+)\s+(live\s+)?score/i,
      /(\w+)\s+(\w+)\s+(live\s+)?score/i,
      /live\s+score\s+(\w+)\s+vs?\s+(\w+)/i
    ];

    for (const pattern of sportsPatterns) {
      const match = query.match(pattern);
      if (match) {
        const team1 = match[1];
        const team2 = match[2] || match[1]; 
        return await this.getSportsScore(team1, team2);
      }
    }

    const newsPatterns = [
      /(?:latest|recent|current|today's?)\s+news/i,
      /news\s+(?:about|on|regarding)/i,
      /what's\s+happening\s+(?:in|with)/i,
      /current\s+events/i
    ];

    if (newsPatterns.some(pattern => pattern.test(lowerQuery))) {
      const topic = query
        .replace(/(?:latest|recent|current|today's?)\s+news\s+(?:about|on|regarding)?/gi, '')
        .replace(/what's\s+happening\s+(?:in|with)/gi, '')
        .replace(/current\s+events\s+(?:about|on|regarding)?/gi, '')
        .replace(/news/gi, '')
        .trim() || 'world';
      
      return await this.getNewsUpdates(topic);
    }

    return await this.getGeneralInfo(query);
  }
}

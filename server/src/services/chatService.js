const { chatCompletion, chatCompletionStream } = require('./openaiService');
const { searchAllPlatforms } = require('./scrapers/baseScraper');
const { normalizeProducts } = require('./productNormalizer');
const logger = require('../middleware/logger');

const SYSTEM_PROMPT = `You are ShopAI's Fashion Assistant — a friendly, knowledgeable AI stylist and shopping guide. You help users find the perfect clothing, accessories, and fashion items.

Your capabilities:
1. Suggest outfits for specific occasions (weddings, casual, office, party, etc.)
2. Recommend products based on style preferences, budget, and body type
3. Provide fashion tips and styling advice
4. Compare products across platforms (Amazon, Flipkart, Myntra)
5. Help users find deals and best prices

When recommending products, use the search_products function to find real products.

Guidelines:
- Be conversational, warm, and helpful
- Consider Indian fashion trends and brands
- Always ask about budget if not specified
- Suggest complete outfits when possible (top + bottom + accessories)
- Be inclusive of all body types and styles
- Prices are in INR (₹)`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products across e-commerce platforms (Amazon, Flipkart, Myntra)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for products' },
          category: { type: 'string', description: 'Product category filter', enum: ['clothing', 'shoes', 'accessories', 'bags', 'watches', 'jewellery'] },
        },
        required: ['query'],
      },
    },
  },
];

const handleToolCall = async (toolCall) => {
  if (toolCall.function.name === 'search_products') {
    let args;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return JSON.stringify({ error: 'Failed to parse tool arguments' });
    }
    try {
      const rawResults = await searchAllPlatforms(args.query, { category: args.category, page: 1 });
      const normalized = normalizeProducts(rawResults);
      const top5 = normalized.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        rating: p.rating,
        platform: p.platform,
        url: p.url,
        image: p.images?.[0] || '',
      }));
      return JSON.stringify(top5);
    } catch (err) {
      logger.error(`Chat tool call error: ${err.message}`);
      return JSON.stringify([]);
    }
  }
  return '[]';
};

const getChatResponse = async (messages, context = {}) => {
  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  try {
    let result = await chatCompletion(formattedMessages, {
      model: 'gpt-4',
      tools,
      temperature: 0.7,
      maxTokens: 1500,
    });

    let products = [];

    // Handle function calling
    if (result.finish_reason === 'tool_calls' && result.message.tool_calls) {
      const toolResults = await Promise.all(
        result.message.tool_calls.map(async (tc) => {
          const output = await handleToolCall(tc);
          try { products = JSON.parse(output); } catch {}
          return {
            role: 'tool',
            tool_call_id: tc.id,
            content: output,
          };
        })
      );

      // Get final response with tool results
      formattedMessages.push(result.message);
      formattedMessages.push(...toolResults);

      result = await chatCompletion(formattedMessages, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1500,
      });
    }

    return {
      content: result.message.content,
      products,
    };
  } catch (err) {
    logger.error(`Chat service error: ${err.message}`);
    return {
      content: "I'm sorry, I'm having trouble right now. Please try again in a moment!",
      products: [],
    };
  }
};

const getChatResponseStream = async (messages, context = {}) => {
  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  return chatCompletionStream(formattedMessages, {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1500,
    tools,
  });
};

module.exports = { getChatResponse, getChatResponseStream, handleToolCall };

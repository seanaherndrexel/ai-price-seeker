import { searchProducts } from '../../lib/shoppingSearch';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly shopping assistant for older adults. Always use simple clear language. When they ask for something to buy, use the search_products tool. Prefer items that are good value and highlight the cheapest option. If no price specified, assume they want reasonable options.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products and prices from multiple retailers and return options sorted by price.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query describing what the user wants.' },
          max_price: { type: 'number', description: 'Maximum price in USD' },
        },
        required: ['query'],
      },
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { message } = req.body || {};
  if (!message) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }

  try {
    const first = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      tools,
      tool_choice: 'auto',
    });

    const firstMsg = first.choices[0].message;
    const toolCalls = firstMsg.tool_calls || [];

    if (toolCalls.length === 0) {
      res.status(200).json({ reply: firstMsg.content || '', products: [] });
      return;
    }

    const toolCall = toolCalls[0];
    const args = JSON.parse(toolCall.function.arguments || '{}');
    const query = args.query || message;
    const maxPrice = typeof args.max_price === 'number' ? args.max_price : null;

    const products = await searchProducts(query, maxPrice);

    const second = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
        firstMsg,
        {
          role: 'tool',
          name: toolCall.function.name,
          tool_call_id: toolCall.id,
          content: JSON.stringify(products),
        },
      ],
    });

    const finalMsg = second.choices[0].message;
    res.status(200).json({
      reply: finalMsg.content || '',
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const AI_API_KEY = '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';
const AI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SQL_EXTRACTION_PROMPT = `
You are a SQL expert. When the user asks a question about data, respond with:
1. A brief explanation of how you'll answer their question
2. The SQL query to get that information, formatted like this:
   ---SQL---
   SELECT ...
   ---END SQL---
`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Add SQL extraction prompt to the conversation
    const augmentedMessages = [
      { role: 'system', content: SQL_EXTRACTION_PROMPT },
      ...messages
    ];

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        'HTTP-Referer': 'https://tree.new',
        'X-Title': 'Tree - Business Intelligence Platform',
        'OpenAI-Organization': 'Tree Analytics',
        'User-Agent': 'Tree Analytics/1.0.0'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: augmentedMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `AI API request failed: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
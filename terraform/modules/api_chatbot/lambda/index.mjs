// index.mjs
import axios from 'axios';

export const handler = async (event) => {
  // 1️⃣ Pull in your only env var
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
      },
      body: JSON.stringify({ error: 'Server misconfiguration' })
    };
  }

  // 2️⃣ Hard-coded response limit (words)
  const RESPONSE_LIMIT = 30;

  // 3️⃣ CORS headers
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };

  // 4️⃣ Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // 5️⃣ Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let messages;
  try {
    // 6️⃣ Normalize incoming payload:
    //    allow { message: "…" } or { messages: ["…", …] } or legacy { messages:[{role,content},…] }
    const body = JSON.parse(event.body || '{}');

    if (typeof body.message === 'string') {
      messages = [{ role: 'user', content: body.message }];

    } else if (
      Array.isArray(body.messages) &&
      body.messages.every(m => typeof m === 'string')
    ) {
      messages = body.messages.map(content => ({ role: 'user', content }));

    } else if (
      Array.isArray(body.messages) &&
      body.messages.every(m => typeof m === 'object' && 'content' in m)
    ) {
      messages = body.messages;

    } else {
      throw new Error(
        'Invalid payload: send {"message":"…"} or {"messages":["…"]}'
      );
    }
  } catch (err) {
    console.error('Payload error:', err);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ error: err.message })
    };
  }

  try {
    // 7️⃣ Build your system prompt with the limit
    const systemMessage = {
      role: 'system',
      content: `
You are a friendly, expert nutrition & health assistant in an interactive chat.
Respond concisely and specifically, using no more than ${RESPONSE_LIMIT} words.
Only expand with extra details if the user explicitly asks for more.
Maintain a clear, professional, and helpful tone throughout.
      `.trim()
    };

    // 8️⃣ Prepare OpenAI payload
    const chatPayload = {
      model      : 'gpt-4o',
      messages   : [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens : 600
    };

    // 9️⃣ Call OpenAI
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      chatPayload,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistantMessage = aiResponse.data.choices?.[0]?.message?.content || '';

    // 🔟 Return to frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ reply: assistantMessage })
    };

  } catch (error) {
    console.error('OpenAI call error:', error.response?.data || error.message);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ error: 'OpenAI API error', details: error.response?.data || error.message })
    };
  }
};

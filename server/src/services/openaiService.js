const OpenAI = require('openai');
const config = require('../config/env');
const logger = require('../middleware/logger');

let openai = null;

const getClient = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openai;
};

const chatCompletion = async (messages, options = {}) => {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: options.model || 'gpt-4o-mini',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 2000,
    ...(options.tools && { tools: options.tools }),
    ...(options.tool_choice && { tool_choice: options.tool_choice }),
    ...(options.response_format && { response_format: options.response_format }),
  });

  return response.choices[0];
};

const chatCompletionStream = async (messages, options = {}) => {
  const client = getClient();
  const stream = await client.chat.completions.create({
    model: options.model || 'gpt-4',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 2000,
    stream: true,
    ...(options.tools && { tools: options.tools }),
  });

  return stream;
};

module.exports = { getClient, chatCompletion, chatCompletionStream };

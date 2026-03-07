const { chatCompletion } = require('./openaiService');
const logger = require('../middleware/logger');

const analyzeSentiment = async (reviews, productTitle = '') => {
  if (!reviews || reviews.length === 0) {
    return {
      overallSentiment: 'neutral',
      score: 50,
      pros: [],
      cons: [],
      summary: 'No reviews available for analysis.',
    };
  }

  // Prepare review text (batch reviews, limit to ~30 for token efficiency)
  const reviewTexts = reviews.slice(0, 30).map((r, i) =>
    `Review ${i + 1} (${r.rating || 'N/A'}/5): ${r.title ? r.title + ' - ' : ''}${r.text || 'No text'}`
  ).join('\n');

  const prompt = `Analyze the following customer reviews for the product "${productTitle}" and provide a structured sentiment analysis.

Reviews:
${reviewTexts}

Respond in this exact JSON format:
{
  "overallSentiment": "positive" | "neutral" | "negative",
  "score": <number 0-100, where 100 is most positive>,
  "pros": [<up to 5 key positive points as short strings>],
  "cons": [<up to 5 key negative points as short strings>],
  "summary": "<2-3 sentence summary of overall customer opinion>"
}

Be objective and base your analysis solely on the review content.`;

  try {
    const result = await chatCompletion([
      { role: 'system', content: 'You are a product review analyst. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 800,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(result.message.content);
    return {
      overallSentiment: parsed.overallSentiment || 'neutral',
      score: Math.max(0, Math.min(100, parsed.score || 50)),
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 5) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 5) : [],
      summary: parsed.summary || '',
    };
  } catch (err) {
    logger.error(`Sentiment analysis error: ${err.message}`);
    // Fallback: simple calculation from ratings
    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 3), 0) / reviews.length;
    return {
      overallSentiment: avgRating >= 3.5 ? 'positive' : avgRating >= 2.5 ? 'neutral' : 'negative',
      score: Math.round((avgRating / 5) * 100),
      pros: [],
      cons: [],
      summary: `Based on ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)}/5.`,
    };
  }
};

module.exports = { analyzeSentiment };

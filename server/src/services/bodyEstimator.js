const { chatCompletion } = require('./openaiService');
const logger = require('../middleware/logger');

const estimateBodyFromImage = async (imagePath) => {
  try {
    const fs = require('fs').promises;
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const result = await chatCompletion([
      {
        role: 'system',
        content: 'You are a body measurement estimation AI. Given a full-body photo, estimate approximate body measurements. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this full-body photo and estimate the following body measurements in centimeters. Make reasonable estimates based on body proportions visible in the image.

Respond in this exact JSON format:
{
  "height": <number in cm>,
  "chest": <number in cm>,
  "waist": <number in cm>,
  "hip": <number in cm>,
  "shoulder": <number in cm>,
  "bodyType": "slim" | "average" | "athletic" | "plus",
  "confidence": <number 0-100>
}`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ], {
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(result.message.content);
    return {
      height: parsed.height || 170,
      chest: parsed.chest || 95,
      waist: parsed.waist || 80,
      hip: parsed.hip || 95,
      shoulder: parsed.shoulder || 45,
      bodyType: parsed.bodyType || 'average',
      confidence: parsed.confidence || 50,
    };
  } catch (err) {
    logger.error(`Body estimation error: ${err.message}`);
    // Return default average measurements
    return {
      height: 170,
      chest: 95,
      waist: 80,
      hip: 95,
      shoulder: 45,
      bodyType: 'average',
      confidence: 0,
    };
  }
};

module.exports = { estimateBodyFromImage };

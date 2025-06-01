import { OpenAI } from 'openai';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the prompt from the request body
    const { prompt } = req.body;

    // Define the base prompt for category generation
    const basePrompt = "Generate a creative category for a word guessing game called Chameleon. " +
      "Return a JSON object with 'category' (the name of the category) and 'words' (an array of exactly 30 interesting words or phrases that belong to this category). " +
      "The words should be recognizable by most people, but can be specific to the category. " +
      "Make sure all items are related to the category. " +
      "Return ONLY the JSON object without any explanation or additional text.";
    
    const userPrompt = prompt ? 
      `${basePrompt} The category should be related to: ${prompt}` : 
      basePrompt;

    // Call OpenAI API
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a creative assistant generating content for a word game." },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message.content;
    
    if (!content) {
      return res.status(500).json({ error: "No content in OpenAI response" });
    }

    // Parse the JSON response
    try {
      // Extract JSON if the response has any extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate the response format
      if (!parsedResponse.category || !Array.isArray(parsedResponse.words) || parsedResponse.words.length < 8) {
        return res.status(500).json({ error: "Invalid response format from OpenAI" });
      }

      // Ensure we have exactly 30 words, truncate if more, or use defaults if less
      const words = parsedResponse.words.slice(0, 30);
      
      const result = {
        category: parsedResponse.category,
        words: words.length >= 8 ? words : [...words, ...Array(30 - words.length).fill("").map((_, i) => `Item ${i + words.length + 1}`)]
      };

      return res.status(200).json(result);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.log("Response content:", content);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error) {
    console.error("Error generating category with OpenAI:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

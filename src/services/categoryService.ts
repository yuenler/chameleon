import { categories as defaultCategories } from './gameService';

// Interface for the API response
interface CategoryResponse {
  category: string;
  words: string[];
}

/**
 * Call the Vercel serverless API to generate a custom category
 * 
 * @param prompt Optional user prompt to guide generation
 * @returns Object containing category name and words array, or null on error
 */
export const generateAICategory = async (prompt?: string): Promise<CategoryResponse | null> => {
  try {
    const response = await fetch('/api/generate-category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate category');
    }

    const data = await response.json();
    return data as CategoryResponse;
  } catch (error) {
    console.error('Error generating AI category:', error);
    return null;
  }
};

/**
 * Get the list of all default categories
 * 
 * @returns Object mapping category names to arrays of words
 */
export const getDefaultCategories = () => {
  return defaultCategories;
};

/**
 * Get a random category from the default categories
 * 
 * @returns Object containing category name and words array
 */
export const getRandomCategory = (): CategoryResponse => {
  const categoryNames = Object.keys(defaultCategories);
  const randomCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)];
  
  return {
    category: randomCategory,
    words: defaultCategories[randomCategory as keyof typeof defaultCategories]
  };
};

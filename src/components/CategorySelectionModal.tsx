import React, { useState, useEffect } from 'react';
import { generateAICategory, getRandomCategory, getDefaultCategories } from '../services/categoryService';
import { motion } from 'framer-motion';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string, words: string[]) => void;
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectCategory 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // We set the generated category but don't need to use it directly as it's passed to the parent
  const [, setGeneratedCategory] = useState<{ category: string; words: string[] } | null>(null);
  
  // Load available categories when the modal opens
  useEffect(() => {
    if (isOpen) {
      const categories = Object.keys(getDefaultCategories());
      setCategoryOptions(categories);
      setSelectedCategory(categories.length > 0 ? categories[0] : '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectRandom = () => {
    const randomCategory = getRandomCategory();
    onSelectCategory(randomCategory.category, randomCategory.words);
    onClose();
  };
  
  const handleSelectSpecificCategory = () => {
    if (!selectedCategory) return;
    
    const categories = getDefaultCategories();
    const words = categories[selectedCategory as keyof typeof categories];
    onSelectCategory(selectedCategory, words);
    onClose();
  };

  const handleGenerateCategory = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAICategory(prompt);
      
      if (result) {
        setGeneratedCategory(result);
        onSelectCategory(result.category, result.words);
        onClose();
      } else {
        setError('Failed to generate category. Please try again or use a default category.');
      }
    } catch (err) {
      setError('An error occurred while generating the category');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Select Category Type</h2>
        
        <div className="mb-6 space-y-4">
          {/* Option 1: Random Category */}
          <button
            onClick={handleSelectRandom}
            className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-left">
                <h3 className="font-semibold text-lg">Random Category</h3>
                <p className="text-gray-600 text-sm">Let us pick a random category and word</p>
              </div>
              <span className="text-primary-500">→</span>
            </div>
          </button>
          
          {/* Option 2: Choose Specific Category */}
          <div className="w-full p-4 border border-gray-300 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Choose Category</h3>
            <p className="text-gray-600 text-sm mb-3">Select a specific category from the list</p>
            
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleSelectSpecificCategory}
              className="w-full py-2 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
            >
              Use Selected Category
            </button>
          </div>

          {/* Option 3: AI Generated Category */}
          <div className="w-full p-4 border border-gray-300 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">AI-Generated Category</h3>
            <p className="text-gray-600 text-sm mb-3">Generate a unique category using AI</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Optional: Guide the AI with a prompt
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Sci-fi movies' or 'Exotic fruits'"
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for a completely random category
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-3">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateCategory}
              disabled={isGenerating}
              className={`w-full py-2 px-4 rounded-md ${
                isGenerating 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CategorySelectionModal;

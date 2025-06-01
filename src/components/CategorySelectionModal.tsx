import React, { useState, useEffect } from 'react';
import { generateAICategory, getRandomCategory, getDefaultCategories } from '../services/categoryService';
import { motion, AnimatePresence } from 'framer-motion';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string, words: string[], showWordBank: boolean) => void;
}

type Step = 'initial' | 'specific' | 'ai';

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectCategory 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('initial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showWordBank, setShowWordBank] = useState(false);
  // We set the generated category but don't need to use it directly as it's passed to the parent
  const [, setGeneratedCategory] = useState<{ category: string; words: string[] } | null>(null);
  
  // Load available categories when the modal opens
  useEffect(() => {
    if (isOpen) {
      const categories = Object.keys(getDefaultCategories());
      setCategoryOptions(categories);
      setSelectedCategory(categories.length > 0 ? categories[0] : '');
      setCurrentStep('initial');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectRandom = () => {
    const randomCategory = getRandomCategory();
    onSelectCategory(randomCategory.category, randomCategory.words, showWordBank);
    onClose();
  };
  
  const handleSelectSpecificCategory = () => {
    if (!selectedCategory) return;
    
    const categories = getDefaultCategories();
    const words = categories[selectedCategory as keyof typeof categories];
    onSelectCategory(selectedCategory, words, showWordBank);
    onClose();
  };

  const handleGenerateCategory = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAICategory(prompt);
      
      if (result) {
        setGeneratedCategory(result);
        onSelectCategory(result.category, result.words, showWordBank);
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
  
  const handleGoBack = () => {
    setCurrentStep('initial');
    setError(null);
  };

  // Shared word bank toggle for all steps
  const wordBankToggle = (
    <div className="mb-4 flex items-center">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={showWordBank}
          onChange={(e) => setShowWordBank(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <span className="ml-2 text-gray-700">Show word bank to all players</span>
      </label>
      <div className="ml-1 group relative">
        <span className="text-gray-500 cursor-help">ⓘ</span>
        <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          When enabled, all players (including the Chameleon) will see all possible words for the selected category.
        </div>
      </div>
    </div>
  );

  // Shared modal container
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {currentStep === 'initial' && (
            <motion.div
              key="initial-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-4">Select Category Type</h2>
              
              {wordBankToggle}
              
              <div className="mb-6 space-y-3">
                {/* Option 1: Random Category */}
                <button
                  onClick={handleSelectRandom}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                <button
                  onClick={() => setCurrentStep('specific')}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">Choose Category</h3>
                      <p className="text-gray-600 text-sm">Select a specific category from the list</p>
                    </div>
                    <span className="text-primary-500">→</span>
                  </div>
                </button>

                {/* Option 3: AI Generated Category */}
                <button
                  onClick={() => setCurrentStep('ai')}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">AI-Generated Category</h3>
                      <p className="text-gray-600 text-sm">Generate a unique category using AI</p>
                    </div>
                    <span className="text-primary-500">→</span>
                  </div>
                </button>
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
          )}

          {currentStep === 'specific' && (
            <motion.div
              key="specific-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <button 
                  onClick={handleGoBack}
                  className="mr-3 text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <h2 className="text-xl font-bold">Choose a Category</h2>
              </div>
              
              {wordBankToggle}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select a category
                </label>
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
              
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectSpecificCategory}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                >
                  Select This Category
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'ai' && (
            <motion.div
              key="ai-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <button 
                  onClick={handleGoBack}
                  className="mr-3 text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <h2 className="text-xl font-bold">Generate with AI</h2>
              </div>
              
              {wordBankToggle}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional: Guide the AI with a prompt
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Things you might find in a gym bag'"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for a completely random category
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCategory}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-md ${
                    isGenerating 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isGenerating ? 'Generating...' : 'Generate Category'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CategorySelectionModal;

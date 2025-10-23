import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { clothingAPI } from '../api';

const AddClothing = () => {
  const user = useSelector(selectUser);
  const fileInputRef = useRef(null);
  
  // State for image upload
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
  const [inputMode, setInputMode] = useState('ai'); // 'ai' or 'manual'
  
  // State for metadata
  const [metadata, setMetadata] = useState(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState(null);
  
  // State for embedding
  const [embedding, setEmbedding] = useState(null);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  const [embeddingError, setEmbeddingError] = useState(null);
  
  // State for form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Cleanup uploaded images when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (metadata && Array.isArray(metadata)) {
        // Clean up all uploaded images
        const cleanupPromises = metadata.map(async (meta) => {
          if (meta?.publicId) {
            try {
              await clothingAPI.deleteImage(meta.publicId);
              console.log('Cleaned up image:', meta.publicId);
            } catch (error) {
              console.error('Failed to cleanup image:', meta.publicId, error);
            }
          }
        });
        await Promise.all(cleanupPromises);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [metadata]);

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (uploadMode === 'single') {
        const file = files[0];
        setSelectedImages([file]);
        setImagePreviews([URL.createObjectURL(file)]);
      } else {
        setSelectedImages(files);
        setImagePreviews(files.map(file => URL.createObjectURL(file)));
      }
      setMetadata(null);
      setEmbedding(null);
      setMetadataError(null);
      setEmbeddingError(null);
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Handle metadata changes for single item
  const handleMetadataChange = (field, value) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  // Handle metadata changes for multiple items
  const handleMultipleMetadataChange = (index, field, value) => {
    setMetadata(prev => {
      const newMetadata = [...prev];
      newMetadata[index] = { ...newMetadata[index], [field]: value };
      return newMetadata;
    });
  };

  // Create manual metadata
  const handleCreateManualMetadata = () => {
    if (selectedImages.length === 0) return;
    
    if (uploadMode === 'single') {
      // Create empty metadata for single item
      const emptyMetadata = {
        category: '',
        subcategory: '',
        color: { primary: '', secondary: '' },
        formality: '',
        season: '',
        description: '',
        brand: '',
        size: '',
        material: '',
        condition: 'good',
        tags: []
      };
      setMetadata(emptyMetadata);
    } else {
      // Create empty metadata for each item
      const emptyMetadataArray = selectedImages.map(() => ({
        category: '',
        subcategory: '',
        color: { primary: '', secondary: '' },
        formality: '',
        season: '',
        description: '',
        brand: '',
        size: '',
        material: '',
        condition: 'good',
        tags: []
      }));
      setMetadata(emptyMetadataArray);
    }
    
    // Auto-generate embedding for manual mode
    setTimeout(() => {
      handleGenerateEmbedding();
    }, 100);
  };

  // Generate metadata using Gemini
  const handleGenerateMetadata = async () => {
    if (selectedImages.length === 0) return;
    
    setIsGeneratingMetadata(true);
    setMetadataError(null);
    
    try {
      if (uploadMode === 'single') {
        const response = await clothingAPI.generateMetadata(selectedImages[0]);
        if (response.success) {
          setMetadata(response.data);
        } else {
          setMetadataError('Failed to generate metadata');
        }
      } else {
        // For multiple images, use batch processing
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });
        
        const response = await clothingAPI.generateBatchMetadata(formData);
        if (response.success) {
          const allMetadata = response.data.successful.map(item => item.data);
          setMetadata(allMetadata);
        } else {
          setMetadataError('Failed to generate metadata for multiple images');
        }
      }
    } catch (error) {
      console.error('Metadata generation error:', error);
      
      // Handle specific error types
      if (error.message.includes('Cloudinary service temporarily unavailable') || 
          error.message.includes('Network connectivity issue') ||
          error.message.includes('Use Manual mode to add clothing items without image upload') ||
          error.message.includes('Cloudinary timeout') ||
          error.message.includes('Request Timeout')) {
        setMetadataError('Image upload service is temporarily unavailable. Please switch to Manual mode to add clothing without images.');
      } else if (error.message.includes('Failed to upload image to Cloudinary')) {
        setMetadataError('Failed to upload images. Please check your internet connection and try again.');
      } else {
        setMetadataError('Error generating metadata: ' + error.message);
      }
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // Generate embedding
  const handleGenerateEmbedding = async () => {
    if (!metadata) return;
    
    setIsGeneratingEmbedding(true);
    setEmbeddingError(null);
    
    try {
      if (uploadMode === 'single') {
        const response = await clothingAPI.generateEmbedding(metadata);
        if (response.success) {
          setEmbedding(response.data);
        } else {
          setEmbeddingError('Failed to generate embedding');
        }
      } else {
        // For multiple images, generate embedding for each metadata
        const embeddingPromises = metadata.map(meta => 
          meta ? clothingAPI.generateEmbedding(meta) : Promise.resolve({ success: false })
        );
        const responses = await Promise.all(embeddingPromises);
        const allEmbeddings = responses.map(res => res.success ? res.data : null);
        setEmbedding(allEmbeddings);
      }
    } catch (error) {
      setEmbeddingError('Error generating embedding: ' + error.message);
    } finally {
      setIsGeneratingEmbedding(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedImages.length === 0 || !metadata || !user) return;
    
    // Validate required fields
    if (uploadMode === 'single') {
      if (!metadata.category) {
        setSubmitError('Category is required');
        return;
      }
    } else {
      const missingCategories = metadata.filter((meta, index) => !meta?.category);
      if (missingCategories.length > 0) {
        setSubmitError(`Category is required for all items`);
        return;
      }
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (uploadMode === 'single') {
        // Single item upload
        const formData = new FormData();
        formData.append('image', selectedImages[0]);
        formData.append('userId', user._id);
        formData.append('metadata', JSON.stringify(metadata));
        formData.append('metadataSource', inputMode === 'ai' ? 'gemini' : 'manual');
        formData.append('generateEmbedding', 'true');
        
        const response = await clothingAPI.createClothingItem(formData);
        if (response.success) {
          setSuccess(true);
          // Reset form
          setSelectedImages([]);
          setImagePreviews([]);
          setMetadata(null);
          setEmbedding(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setSubmitError('Failed to create clothing item');
        }
      } else {
        // Multiple items upload with progress tracking
        setUploadProgress({ current: 0, total: selectedImages.length });
        
        const uploadPromises = selectedImages.map(async (image, index) => {
          const formData = new FormData();
          formData.append('image', image);
          formData.append('userId', user._id);
          formData.append('metadata', JSON.stringify(metadata[index]));
          formData.append('metadataSource', inputMode === 'ai' ? 'gemini' : 'manual');
          formData.append('generateEmbedding', 'true');
          
          const response = await clothingAPI.createClothingItem(formData);
          
          // Update progress
          setUploadProgress(prev => ({ 
            current: prev.current + 1, 
            total: prev.total 
          }));
          
          return response;
        });
        
        const responses = await Promise.all(uploadPromises);
        const successCount = responses.filter(res => res.success).length;
        
        if (successCount === selectedImages.length) {
          setSuccess(true);
          // Reset form
          setSelectedImages([]);
          setImagePreviews([]);
          setMetadata(null);
          setEmbedding(null);
          setUploadProgress({ current: 0, total: 0 });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setSubmitError(`Only ${successCount} out of ${selectedImages.length} items were uploaded successfully`);
        }
      }
    } catch (error) {
      setSubmitError('Error creating clothing item: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form and clear all data
  const handleReset = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setMetadata(null);
    setEmbedding(null);
    setMetadataError(null);
    setEmbeddingError(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {uploadMode === 'single' ? 'Clothing Item Added!' : 'Clothing Items Added!'}
          </h1>
          <p className="text-gray-400 mb-6">
            {uploadMode === 'single' 
              ? 'Your clothing item has been successfully added to your wardrobe.'
              : `Your ${selectedImages.length} clothing items have been successfully added to your wardrobe.`
            }
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
          >
            Add {uploadMode === 'single' ? 'Another Item' : 'More Items'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Add New Clothing Item</h1>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Mode:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  uploadMode === 'single' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {uploadMode === 'single' ? 'Single Item' : 'Multiple Items'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  inputMode === 'ai' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {inputMode === 'ai' ? 'AI Generated' : 'Manual Entry'}
                </span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">1. Upload Image</h2>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Upload Mode:</span>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setUploadMode('single')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          uploadMode === 'single' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('multiple')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          uploadMode === 'multiple' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Multiple
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Input Mode:</span>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setInputMode('ai')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          inputMode === 'ai' 
                            ? 'bg-green-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('manual')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          inputMode === 'manual' 
                            ? 'bg-green-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={uploadMode === 'multiple'}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {uploadMode === 'single' ? 'Choose Image' : 'Choose Images'}
                </button>
                {selectedImages.length > 0 && (
                  <div className="flex items-center space-x-3">
                    {inputMode === 'ai' ? (
                      <button
                        type="button"
                        onClick={handleGenerateMetadata}
                        disabled={isGeneratingMetadata}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingMetadata ? 'Generating...' : 'Generate Metadata'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateManualMetadata}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create Manual Form
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-600"
                        />
                        {uploadMode === 'multiple' && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {selectedImages[index]?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
              )}
              
              {metadataError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <div className="text-red-400 text-sm mb-2">{metadataError}</div>
                  {(metadataError.includes('temporarily unavailable') || 
                    metadataError.includes('internet connection') ||
                    metadataError.includes('upload service')) && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMetadataError(null);
                          if (inputMode === 'ai') {
                            handleGenerateMetadata();
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                      {metadataError.includes('switch to Manual mode') && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('manual');
                            setMetadataError(null);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Switch to Manual Mode
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Help Section */}
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-400 text-lg">💡</div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-300 mb-2">Input Mode Help</h3>
                    <div className="text-xs text-gray-300 space-y-1">
                      <div><strong>AI Mode:</strong> Upload images and let Gemini AI automatically generate metadata (category, colors, formality, etc.)</div>
                      <div><strong>Manual Mode:</strong> Enter all clothing details manually without AI assistance - perfect for precise control</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            {metadata && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">2. Review & Edit Metadata</h2>
                {uploadMode === 'single' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                      <select
                        value={metadata.category || ''}
                        onChange={(e) => handleMetadataChange('category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                      >
                        <option value="">Select category</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="dress">Dress</option>
                        <option value="outerwear">Outerwear</option>
                        <option value="shoes">Shoes</option>
                        <option value="accessories">Accessories</option>
                        <option value="underwear">Underwear</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                      <input
                        type="text"
                        value={metadata.subcategory || ''}
                        onChange={(e) => handleMetadataChange('subcategory', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., t-shirt, jeans, sneakers"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                      <input
                        type="text"
                        value={metadata.color?.primary || ''}
                        onChange={(e) => handleMetadataChange('color', { ...metadata.color, primary: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., red, blue, black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                      <input
                        type="text"
                        value={metadata.color?.secondary || ''}
                        onChange={(e) => handleMetadataChange('color', { ...metadata.color, secondary: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., white, gray"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Formality</label>
                      <select
                        value={metadata.formality || ''}
                        onChange={(e) => handleMetadataChange('formality', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select formality</option>
                        <option value="casual">Casual</option>
                        <option value="business-casual">Business Casual</option>
                        <option value="business">Business</option>
                        <option value="formal">Formal</option>
                        <option value="semi-formal">Semi-formal</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Season</label>
                      <select
                        value={metadata.season || ''}
                        onChange={(e) => handleMetadataChange('season', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select season</option>
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="autumn">Autumn</option>
                        <option value="winter">Winter</option>
                        <option value="all-season">All Season</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
                      <input
                        type="text"
                        value={metadata.brand || ''}
                        onChange={(e) => handleMetadataChange('brand', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., Nike, Zara, H&M"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                      <input
                        type="text"
                        value={metadata.size || ''}
                        onChange={(e) => handleMetadataChange('size', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., M, L, 10, 42"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Material</label>
                      <input
                        type="text"
                        value={metadata.material || ''}
                        onChange={(e) => handleMetadataChange('material', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., cotton, polyester, leather"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                      <select
                        value={metadata.condition || 'good'}
                        onChange={(e) => handleMetadataChange('condition', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {metadata.map((itemMetadata, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-white">Item {index + 1}</h3>
                          <div className="flex items-center space-x-2">
                            <img
                              src={imagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-600"
                            />
                            <span className="text-sm text-gray-400">{selectedImages[index]?.name}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                            <select
                              value={itemMetadata?.category || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              required
                            >
                              <option value="">Select category</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="dress">Dress</option>
                              <option value="outerwear">Outerwear</option>
                              <option value="shoes">Shoes</option>
                              <option value="accessories">Accessories</option>
                              <option value="underwear">Underwear</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                            <input
                              type="text"
                              value={itemMetadata?.subcategory || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'subcategory', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., t-shirt, jeans, sneakers"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                            <input
                              type="text"
                              value={itemMetadata?.color?.primary || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'color', { ...itemMetadata?.color, primary: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., red, blue, black"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                            <input
                              type="text"
                              value={itemMetadata?.color?.secondary || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'color', { ...itemMetadata?.color, secondary: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., white, gray"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Formality</label>
                            <select
                              value={itemMetadata?.formality || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'formality', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                              <option value="">Select formality</option>
                              <option value="casual">Casual</option>
                              <option value="business-casual">Business Casual</option>
                              <option value="business">Business</option>
                              <option value="formal">Formal</option>
                              <option value="semi-formal">Semi-formal</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Season</label>
                            <select
                              value={itemMetadata?.season || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'season', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                              <option value="">Select season</option>
                              <option value="spring">Spring</option>
                              <option value="summer">Summer</option>
                              <option value="autumn">Autumn</option>
                              <option value="winter">Winter</option>
                              <option value="all-season">All Season</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
                            <input
                              type="text"
                              value={itemMetadata?.brand || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'brand', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., Nike, Zara, H&M"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                            <input
                              type="text"
                              value={itemMetadata?.size || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'size', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., M, L, 10, 42"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Material</label>
                            <input
                              type="text"
                              value={itemMetadata?.material || ''}
                              onChange={(e) => handleMultipleMetadataChange(index, 'material', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="e.g., cotton, polyester, leather"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                            <select
                              value={itemMetadata?.condition || 'good'}
                              onChange={(e) => handleMultipleMetadataChange(index, 'condition', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                              <option value="excellent">Excellent</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                          <textarea
                            value={itemMetadata?.description || ''}
                            onChange={(e) => handleMultipleMetadataChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="AI-generated or manual description"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {uploadMode === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={metadata.description || ''}
                      onChange={(e) => handleMetadataChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="AI-generated or manual description"
                    />
                  </div>
                )}
                
                {!embedding && (
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleGenerateEmbedding}
                      disabled={isGeneratingEmbedding}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingEmbedding ? 'Generating Embedding...' : 'Generate Vector Embedding'}
                    </button>
                    {inputMode === 'manual' && (
                      <span className="text-sm text-gray-400">
                        Embedding will be generated from your manual input
                      </span>
                    )}
                  </div>
                )}
                
                {embeddingError && (
                  <div className="text-red-400 text-sm">{embeddingError}</div>
                )}
                
                {embedding && (
                  <div className="text-green-400 text-sm">✓ Vector embedding generated successfully</div>
                )}
              </div>
            )}

            {/* Submit Section */}
            {metadata && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">3. Save to Wardrobe</h2>
                
                {/* Upload Summary */}
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Upload Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Items:</span>
                      <span className="text-white ml-2">{selectedImages.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Mode:</span>
                      <span className="text-white ml-2">{uploadMode === 'single' ? 'Single' : 'Multiple'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Input:</span>
                      <span className="text-white ml-2">{inputMode === 'ai' ? 'AI Generated' : 'Manual Entry'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400 ml-2">Ready to Upload</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || !embedding}
                      className="px-6 py-3 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50"
                    >
                      {isSubmitting 
                        ? 'Saving...' 
                        : uploadMode === 'single' 
                          ? 'Add to Wardrobe' 
                          : `Add ${selectedImages.length} Items to Wardrobe`
                      }
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Progress Indicator for Multiple Uploads */}
                  {isSubmitting && uploadMode === 'multiple' && uploadProgress.total > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Uploading Items</span>
                        <span className="text-sm text-gray-400">
                          {uploadProgress.current} / {uploadProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(uploadProgress.current / uploadProgress.total) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {submitError && (
                  <div className="text-red-400 text-sm">{submitError}</div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClothing;
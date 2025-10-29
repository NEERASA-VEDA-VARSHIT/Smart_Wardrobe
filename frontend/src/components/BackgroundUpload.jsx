import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { clothingAPI } from '../api';

const BackgroundUpload = () => {
  const user = useSelector(selectUser);
  const fileInputRef = useRef(null);
  
  // State for background processing
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, uploading, processing, completed, failed
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Polling for status updates
  useEffect(() => {
    let interval;
    
    if (processingId && processingStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/background/status/${processingId}`, {
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.success) {
            setProcessingStatus(data.data.status);
            setProgress(data.data.progress);
            setStatusMessage(data.data.message);
            
            if (data.data.status === 'completed') {
              setResult(data.data);
              setIsUploading(false);
            } else if (data.data.status === 'failed') {
              setError(data.data.error || 'Processing failed');
              setIsUploading(false);
            }
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processingId, processingStatus]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setProcessingStatus('uploading');
    setProgress(10);
    setStatusMessage('Uploading image...');
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch('/api/background/upload-and-process', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProcessingId(data.data.processingId);
        setProcessingStatus('processing');
        setProgress(30);
        setStatusMessage('Analyzing image with AI...');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      setProcessingStatus('failed');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setIsUploading(false);
    setProcessingId(null);
    setProcessingStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (processingStatus) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    switch (processingStatus) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Clothing Item</h2>
      
      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-6">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full h-64 object-contain rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* Progress Section */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {statusMessage}
            </span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Processing Steps */}
          <div className="mt-4 space-y-2">
            <div className={`flex items-center text-sm ${processingStatus === 'uploading' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${processingStatus === 'uploading' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              Uploading image to cloud storage
            </div>
            <div className={`flex items-center text-sm ${processingStatus === 'processing' ? 'text-yellow-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${processingStatus === 'processing' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
              AI analyzing clothing details
            </div>
            <div className={`flex items-center text-sm ${processingStatus === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${processingStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Saving to your wardrobe
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {result && processingStatus === 'completed' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                Your clothing item has been added to your wardrobe with AI-generated metadata.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {!isUploading && selectedFile && (
          <button
            onClick={handleUpload}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload & Analyze
          </button>
        )}
        
        {(processingStatus === 'completed' || processingStatus === 'failed') && (
          <button
            onClick={resetUpload}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Upload Another
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload your image (up to 10MB)</li>
          <li>• AI analyzes clothing details in the background</li>
          <li>• Processing takes about 30 seconds</li>
          <li>• Item is automatically added to your wardrobe</li>
        </ul>
      </div>
    </div>
  );
};

export default BackgroundUpload;

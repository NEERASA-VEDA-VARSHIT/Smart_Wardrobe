import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShareLinkModal = ({ collection, isOpen, onClose, onTogglePublic }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/collections/shared/${collection?.shareLink}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !collection) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4">Share Collection</h2>
          <p className="text-gray-400 mb-6">
            Share "{collection.name}" with others using this link
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <motion.button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </motion.button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Share Options</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={collection.isPublic}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="public" className="text-sm text-gray-300">
                  Make collection public (anyone with link can view)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="suggestions"
                  checked={true}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="suggestions" className="text-sm text-gray-300">
                  Allow outfit suggestions
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareLinkModal;

import React, { useState } from 'react';

const resolveRole = (item) => (item?.metadata?.subcategory || item?.metadata?.category || '').toLowerCase();

const OutfitCard = ({ outfit, onAccept, onRegenerate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const items = outfit?.items || [];
  const roles = { top: null, bottom: null };
  items.forEach((it) => {
    const cat = resolveRole(it);
    if (!roles.top && ['top','shirt','t-shirt','tee','blouse','sweater','hoodie','kurta'].some(k=>cat.includes(k))) roles.top = it;
    else if (!roles.bottom && ['bottom','pants','jeans','trouser','trousers','skirt','shorts','chinos','cargo'].some(k=>cat.includes(k))) roles.bottom = it;
  });

  const ordered = [roles.top, roles.bottom].filter(Boolean);

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col gap-4">
      {/* Title and Match Score */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{outfit?.title || 'Recommended Outfit'}</h3>
        {typeof outfit?.match_score === 'number' && (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
            {outfit.match_score}% Match
          </span>
        )}
      </div>

      {/* Images Section - Side by Side */}
      <div className="flex gap-4 justify-center">
        {['Top', 'Bottom'].map((label, idx) => {
          const item = ordered[idx];
          return (
            <div key={`${outfit?.title}-${label}`} className="flex flex-col items-center gap-2">
              <img
                src={item?.imageUrl || 'https://via.placeholder.com/180x180/374151/9CA3AF?text=No+Image'}
                alt={item?.metadata?.subcategory || item?.metadata?.category || label}
                className="w-32 h-32 rounded-xl object-cover border-2 border-gray-600 shadow-lg"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/180x180/374151/9CA3AF?text=No+Image'; }}
              />
              <span className="text-xs text-gray-400 font-medium">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Details Section */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {outfit?.occasion && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs">Occasion: {outfit.occasion}</span>
          )}
          {outfit?.weather && (
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-md text-xs">Weather: {outfit.weather}</span>
          )}
        </div>
        
        {outfit?.reasoning && (
          <p className="text-gray-300 text-sm italic leading-relaxed">
            {outfit.reasoning}
          </p>
        )}
        
        {outfit?.style_tips && (
          <p className="text-gray-400 text-sm mt-2">
            💡 {outfit.style_tips}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2 pt-4 border-t border-gray-700">
        <button 
          onClick={() => setShowDetails(true)} 
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
        >
          👀 View Details
        </button>
        {onRegenerate && (
          <button 
            onClick={onRegenerate} 
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            🪄 Regenerate
          </button>
        )}
        <button
          onClick={() => onAccept && onAccept(ordered.map(i => i?.id).filter(Boolean))}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          🧾 Mark as Worn
        </button>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-11/12 max-w-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="text-lg font-semibold">{outfit?.title || 'Outfit Details'}</div>
              <button onClick={() => setShowDetails(false)} className="text-gray-300 hover:text-white">✖</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {ordered.map((it, i) => (
                <div key={`detail-${i}`}>
                  <img src={it?.imageUrl} alt={it?.metadata?.subcategory || 'Item'} className="w-full h-44 object-cover rounded-md border border-gray-700" />
                  <div className="mt-2 text-xs text-gray-300">{it?.metadata?.category} {it?.metadata?.subcategory ? `• ${it.metadata.subcategory}` : ''}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-line">
              {outfit?.reasoning}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitCard;



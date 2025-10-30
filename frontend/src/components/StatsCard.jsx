import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, change, changeType, icon, gradient = false }) => {
  const changeColorClass = changeType === 'positive' 
    ? 'text-green-600 bg-green-50 border border-green-100' 
    : 'text-red-600 bg-red-50 border border-red-100';

  const cardClass = gradient 
    ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20' 
    : 'bg-white border border-gray-100 shadow-lg';

  const textColorClass = gradient ? 'text-white' : 'text-gray-900';
  const subtitleColorClass = gradient ? 'text-blue-50' : 'text-gray-500';

  return (
    <div className={`${cardClass} rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${subtitleColorClass} mb-2`}>{title}</p>
          <p className={`text-3xl font-bold ${textColorClass} mb-4 group-hover:scale-105 transition-transform duration-200`}>{value}</p>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${gradient ? 'bg-white/20 text-white backdrop-blur-sm' : changeColorClass}`}>
            {changeType === 'positive' ? (
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
            )}
            {change}
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${gradient ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-50 to-gray-100'} group-hover:scale-110 transition-transform duration-200`}>
          <div className={`${gradient ? 'text-white' : 'text-gray-700'}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

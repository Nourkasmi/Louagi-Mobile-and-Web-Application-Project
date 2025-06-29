// src/components/dashboard/StatCard.js
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, change, changeType, icon: Icon, color, subtitle }) => (
    <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <div className="relative bg-white backdrop-blur-xl bg-opacity-70 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {change && (
                        <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${changeType === 'positive' ? 'text-green-700 bg-green-100' :
                                changeType === 'negative' ? 'text-red-700 bg-red-100' :
                                    'text-gray-700 bg-gray-100'
                            }`}>
                            {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {change}
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10`}>
                    <Icon className={`w-8 h-8 bg-gradient-to-r ${color} bg-clip-text text-transparent`} />
                </div>
            </div>
        </div>
    </div>
);

export default StatCard;
import React from 'react';

const StatCard = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    color = 'primary'
}) => {
    const colorClasses = {
        primary: 'text-blue-600',
        green: 'text-green-600',
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        red: 'text-red-600'
    };

    const changeClasses = {
        positive: 'text-green-600 bg-green-50',
        negative: 'text-red-600 bg-red-50',
        neutral: 'text-gray-600 bg-gray-50'
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                        {title}
                    </p>
                    <p className={`text-3xl font-bold ${colorClasses[color]}`}>
                        {value}
                    </p>
                    {change && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${changeClasses[changeType]}`}>
                            {changeType === 'positive' && '↗️'}
                            {changeType === 'negative' && '↘️'}
                            {change}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="p-3 rounded-full bg-gray-50">
                        <Icon className={`h-6 w-6 ${colorClasses[color]}`} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
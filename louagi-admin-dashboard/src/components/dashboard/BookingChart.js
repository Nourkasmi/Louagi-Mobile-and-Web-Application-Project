// src/components/dashboard/BookingChart.js
import React from 'react';
import { BarChart3 } from 'lucide-react';

const BookingChart = ({ chartData }) => (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
            <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Last 7 days</span>
            </div>
        </div>
        <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.map((day, index) => (
                <div key={day.name} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-300 hover:shadow-lg"
                        style={{ height: `${(day.bookings / 100) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{day.name}</span>
                    <span className="text-xs font-medium text-gray-900">{day.bookings}</span>
                </div>
            ))}
        </div>
    </div>
);

export default BookingChart;
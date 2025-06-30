// src/components/stations/AddStationModal.js
import React, { useState } from 'react';
import {
    Plus,
    XCircle,
    Building,
    MapPin,
    Phone,
    Activity,
    Wifi,
    Coffee,
    Shield
} from 'lucide-react';

const AddStationModal = ({ showModal, onClose, onSubmit, saveLoading }) => {
    const [newStation, setNewStation] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        capacity: 50,
        contactPhone: '',
        contactEmail: '',
        amenities: {
            wifi: false,
            toilets: false,
            foodCourt: false,
            security: false
        },
        isActive: true
    });

    const handleInputChange = (field, value) => {
        setNewStation(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAmenityChange = (amenity, checked) => {
        setNewStation(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [amenity]: checked
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await onSubmit(newStation);
        if (result?.success) {
            // Reset form
            setNewStation({
                name: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                capacity: 50,
                contactPhone: '',
                contactEmail: '',
                amenities: {
                    wifi: false,
                    toilets: false,
                    foodCourt: false,
                    security: false
                },
                isActive: true
            });
        }
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Add New Station</h2>
                                <p className="text-blue-100 text-sm">Create a new transportation hub</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Station Information Card */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <div className="flex items-center space-x-2 mb-4">
                                <Building className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Station Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Station Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStation.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="e.g., Central Bus Station"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Capacity *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="1000"
                                        value={newStation.capacity}
                                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Address *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStation.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="123 Main Street, Downtown"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newStation.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Tunis"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State/Region *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newStation.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Tunis"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Postal Code *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newStation.zipCode}
                                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Card */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <div className="flex items-center space-x-2 mb-4">
                                <Phone className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                                <span className="text-sm text-gray-500">(Optional)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={newStation.contactPhone}
                                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="+216 XX XXX XXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={newStation.contactEmail}
                                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="station@louagi.tn"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Amenities & Status Card */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <div className="flex items-center space-x-2 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Amenities & Status</h3>
                            </div>

                            {/* Amenities */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Available Amenities
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.entries(newStation.amenities).map(([amenity, checked]) => (
                                        <label key={amenity} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex items-center space-x-2">
                                                {amenity === 'wifi' && <Wifi className="w-4 h-4 text-blue-500" />}
                                                {amenity === 'toilets' && <Building className="w-4 h-4 text-gray-500" />}
                                                {amenity === 'foodCourt' && <Coffee className="w-4 h-4 text-orange-500" />}
                                                {amenity === 'security' && <Shield className="w-4 h-4 text-green-500" />}
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {amenity === 'foodCourt' ? 'Food Court' : amenity}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                                <div className="flex items-center space-x-3">
                                    <Activity className="w-5 h-5 text-green-500" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">Station Status</span>
                                        <p className="text-xs text-gray-500">Set whether this station is immediately operational</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newStation.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                        {newStation.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            * Required fields must be completed
                        </p>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saveLoading}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                            >
                                {saveLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Creating Station...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>Create Station</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStationModal;
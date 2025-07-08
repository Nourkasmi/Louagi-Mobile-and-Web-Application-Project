// src/components/stations/AddStationModal.js
import React, { useState } from 'react';
import {
    Plus, X, Building, MapPin, Phone, Activity, Wifi, Coffee, Shield
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
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-end"
            style={{ overscrollBehavior: 'contain' }} // This helps on some browsers
        >
            {/* Bottom Sheet */}
            <div
                className="
                    w-full
                    bg-white
                    rounded-t-2xl
                    shadow-2xl
                    max-h-[95vh]
                    overflow-y-auto
                    p-6
                    relative
                "
                style={{
                    boxSizing: 'border-box',
                    // fallback if tailwind doesn't apply right!
                    maxHeight: '95vh',
                    overflowY: 'auto',
                }}
            >
                {/* Close button */}
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Station
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        aria-label="Close"
                        disabled={saveLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* --- STATION INFO --- */}
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <Building className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Station Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Station Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newStation.name}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Central Bus Station"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Capacity *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="1000"
                                    value={newStation.capacity}
                                    onChange={e => handleInputChange('capacity', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="50"
                                />
                            </div>
                        </div>
                    </div>
                    {/* --- LOCATION DETAILS --- */}
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Address *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newStation.address}
                                    onChange={e => handleInputChange('address', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="123 Main Street, Downtown"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStation.city}
                                        onChange={e => handleInputChange('city', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tunis"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State/Region *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStation.state}
                                        onChange={e => handleInputChange('state', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tunis"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newStation.zipCode}
                                        onChange={e => handleInputChange('zipCode', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="1000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* --- CONTACT --- */}
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <Phone className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                            <span className="text-sm text-gray-500">(Optional)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={newStation.contactPhone}
                                    onChange={e => handleInputChange('contactPhone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+216 XX XXX XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={newStation.contactEmail}
                                    onChange={e => handleInputChange('contactEmail', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="station@louagi.tn"
                                />
                            </div>
                        </div>
                    </div>
                    {/* --- AMENITIES & STATUS --- */}
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Amenities & Status</h3>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Available Amenities
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(newStation.amenities).map(([amenity, checked]) => (
                                    <label key={amenity} className="flex items-center space-x-2 p-2 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={e => handleAmenityChange(amenity, e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {amenity === 'wifi' && <Wifi className="w-4 h-4 text-blue-500" />}
                                        {amenity === 'toilets' && <Building className="w-4 h-4 text-gray-500" />}
                                        {amenity === 'foodCourt' && <Coffee className="w-4 h-4 text-orange-500" />}
                                        {amenity === 'security' && <Shield className="w-4 h-4 text-green-500" />}
                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                            {amenity === 'foodCourt' ? 'Food Court' : amenity}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={newStation.isActive}
                                onChange={e => handleInputChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                Active station
                            </label>
                        </div>
                    </div>
                    {/* --- BUTTONS --- */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={saveLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2"
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
                </form>
            </div>
        </div>
    );
};

export default AddStationModal;

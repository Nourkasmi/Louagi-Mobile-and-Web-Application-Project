// src/pages/ProfilePage.js - New Profile Page Component
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    Edit,
    Save,
    X,
    Activity,
    Key,
    Eye,
    EyeOff
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

const ProfilePage = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editedUser, setEditedUser] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset to original values if cancelling
            setEditedUser({
                username: user?.username || '',
                email: user?.email || '',
                phone: user?.phone || ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        try {
            // Here you would make an API call to update the profile
            console.log('Saving profile:', editedUser);
            alert('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        try {
            // Here you would make an API call to change the password
            console.log('Changing password');
            alert('Password changed successfully!');
            setShowChangePassword(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Profile Settings"
                subtitle="Manage your account information and preferences"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                        <button
                            onClick={handleEditToggle}
                            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isEditing 
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                        >
                            {isEditing ? (
                                <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Picture */}
                        <div className="md:col-span-2 flex items-center space-x-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900">{user?.username}</h4>
                                <p className="text-gray-600 flex items-center">
                                    <Shield className="w-4 h-4 mr-1" />
                                    Administrator
                                </p>
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedUser.username}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                                    <User className="w-4 h-4 text-gray-400 mr-2" />
                                    <span>{user?.username}</span>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedUser.email}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                    <span>{user?.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editedUser.phone}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter phone number"
                                />
                            ) : (
                                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                    <span>{user?.phone || 'Not set'}</span>
                                </div>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="capitalize">{user?.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* Account Information */}
                <div className="space-y-6">
                    {/* Account Details */}
                    <div className="bg-white rounded-lg shadow border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">Joined</span>
                                </div>
                                <span className="text-sm font-medium">{formatDate(user?.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Activity className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">Last Login</span>
                                </div>
                                <span className="text-sm font-medium">{formatDate(user?.lastLogin)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm text-gray-600">Status</span>
                                </div>
                                <span className="text-sm font-medium text-green-600">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-lg shadow border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                        
                        {!showChangePassword ? (
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleChangePassword}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Update Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setPasswordData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
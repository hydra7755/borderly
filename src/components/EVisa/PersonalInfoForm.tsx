import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Define a type for the application data
type ApplicationData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  [key: string]: any;
};

interface PersonalInfoFormProps {
  data: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  data,
  onUpdate,
  onNext,
  onCancel
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof typeof data, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof typeof data, string>> = {};
    
    // Required fields
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!data.gender) newErrors.gender = 'Gender is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    if (!data.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!data.passportNumber.trim()) newErrors.passportNumber = 'Passport number is required';
    if (!data.passportIssueDate) newErrors.passportIssueDate = 'Passport issue date is required';
    if (!data.passportExpiryDate) newErrors.passportExpiryDate = 'Passport expiry date is required';
    
    // Email validation
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (data.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Passport expiry date must be in the future
    if (data.passportExpiryDate) {
      const expiryDate = new Date(data.passportExpiryDate);
      if (expiryDate <= new Date()) {
        newErrors.passportExpiryDate = 'Passport must not be expired';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Personal Information
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name*
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={data.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>
          
          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name*
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={data.lastName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
          
          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date of Birth*
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={data.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
            )}
          </div>
          
          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender*
            </label>
            <select
              id="gender"
              name="gender"
              value={data.gender}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number*
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={data.phone}
              onChange={handleChange}
              placeholder="+1 (234) 567-8901"
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Passport Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passport Number */}
            <div>
              <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passport Number*
              </label>
              <input
                type="text"
                id="passportNumber"
                name="passportNumber"
                value={data.passportNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.passportNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.passportNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.passportNumber}</p>
              )}
            </div>
            
            {/* Passport Issue Date */}
            <div>
              <label htmlFor="passportIssueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Issue Date*
              </label>
              <input
                type="date"
                id="passportIssueDate"
                name="passportIssueDate"
                value={data.passportIssueDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.passportIssueDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.passportIssueDate && (
                <p className="mt-1 text-sm text-red-500">{errors.passportIssueDate}</p>
              )}
            </div>
            
            {/* Passport Expiry Date */}
            <div>
              <label htmlFor="passportExpiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date*
              </label>
              <input
                type="date"
                id="passportExpiryDate"
                name="passportExpiryDate"
                value={data.passportExpiryDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.passportExpiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.passportExpiryDate && (
                <p className="mt-1 text-sm text-red-500">{errors.passportExpiryDate}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          
          <motion.button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next Step
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoForm; 
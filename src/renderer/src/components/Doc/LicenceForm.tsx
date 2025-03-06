/* eslint-disable prettier/prettier */
import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useGoogleMapsScript } from '../../utils/mapsLoader';

interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  physicalAddress: string;
  idNumber: string;
  companyName: string;
  tradeProfession: string;
  workAddress: string;
  workNumber: string;
}

interface LicenceFormData extends FormData {
  section: string;
  make: string;
  model: string;
  serialNumber: string;
  caliber: string;
}

interface LicenceProps {
  onUpdate: (data: LicenceFormData) => void;
  onSubmit: () => void;
}

export default function Licence({ onUpdate, onSubmit }: LicenceProps): React.JSX.Element {
  const [formData, setFormData] = useState<LicenceFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    physicalAddress: '',
    idNumber: '',
    companyName: '',
    tradeProfession: '',
    workAddress: '',
    workNumber: '',
    section: '',
    make: '',
    model: '',
    serialNumber: '',
    caliber: ''
  });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const physicalAddressRef = useRef<HTMLInputElement>(null);
  const workAddressRef = useRef<HTMLInputElement>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const steps = [
    { title: 'Client Information', fields: ['fullName', 'phoneNumber', 'email', 'idNumber', 'physicalAddress'] },
    { title: 'Work Information', fields: ['companyName', 'tradeProfession', 'workAddress', 'workNumber'] },
    { title: 'Firearm Details', fields: ['section', 'make', 'model', 'serialNumber', 'caliber'] }
  ];

  const initAutocomplete = useCallback((): void => {
    [physicalAddressRef, workAddressRef].forEach((ref) => {
      if (!ref.current || !window.google?.maps?.places) return;

      const autocomplete = new window.google.maps.places.Autocomplete(ref.current, {
        types: ['address'],
        componentRestrictions: { country: 'ZA' },
        fields: ['address_components', 'formatted_address']
      });

      ref.current.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.formatted_address) return;

        const fieldName = ref === physicalAddressRef ? 'physicalAddress' : 'workAddress';
        const updatedData = { ...formData, [fieldName]: place.formatted_address };
        setFormData(updatedData);
        onUpdate(updatedData);
      });
    });
  }, [formData, onUpdate]);

  useGoogleMapsScript(initAutocomplete);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const handleNext = (): void => {
    // Check if all fields in current step are filled
    const currentFields = steps[currentStep].fields;
    const allFieldsFilled = currentFields.every(field => formData[field as keyof LicenceFormData].trim() !== '');
    
    if (!allFieldsFilled) {
      alert('Please fill in all fields before proceeding');
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = (): void => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const allFieldsFilled = Object.values(formData).every(value => value.trim() !== '');
    
    if (!allFieldsFilled) {
      alert('Please fill in all fields before submitting');
      return;
    }
    
    onUpdate(formData);
    onSubmit();
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 5000);
  };

  const renderStep = (): JSX.Element => {
    const currentFields = steps[currentStep].fields;
    return (
      <div className="space-y-6">
        {currentFields.includes('fullName') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('email') && currentFields.includes('idNumber') && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('companyName') && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Trade or Profession <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tradeProfession"
                value={formData.tradeProfession}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('workAddress') && (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="col-span-1">
              <label className="block text-stone-300 mb-1 text-sm">
                Work Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workAddress"
                value={formData.workAddress}
                onChange={handleChange}
                ref={workAddressRef}
                placeholder="Start typing an address..."
                autoComplete="off"
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('workNumber') && (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="col-span-1">
              <label className="block text-stone-300 mb-1 text-sm">
                Work Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="workNumber"
                value={formData.workNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('physicalAddress') && (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="col-span-1">
              <label className="block text-stone-300 mb-1 text-sm">
                Physical Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="physicalAddress"
                value={formData.physicalAddress}
                onChange={handleChange}
                ref={physicalAddressRef}
                placeholder="Start typing an address..."
                autoComplete="off"
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('section') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              >
                <option value="">Select Section</option>
                <option value="Section 13">Section 13</option>
                <option value="Section 15">Section 15</option>
                <option value="Section 16">Section 16</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Make <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('model') && currentFields.includes('serialNumber') && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {currentFields.includes('caliber') && (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="col-span-1">
                <label className="block text-stone-300 mb-1 text-sm">
                Caliber <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="caliber"
                value={formData.caliber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Navigation */}
      <div className="text-stone-300 text-sm text-center">
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Current Step Content */}
      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 text-sm font-medium text-stone-300 bg-stone-700/50 rounded-lg hover:bg-stone-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="flex items-center px-4 py-2 text-sm font-medium text-stone-300 bg-stone-700/50 rounded-lg hover:bg-stone-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="w-5 h-5 ml-2" />
          </button>
        ) : (
          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Submit Form
          </button>
        )}
      </div>

      {/* Add success alert */}
      {showSuccessAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* ... success alert content from ScriptForm.tsx ... */}
        </div>
      )}
    </form>
  );
}

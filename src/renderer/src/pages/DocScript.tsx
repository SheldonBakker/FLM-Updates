/* eslint-disable prettier/prettier */
import { useState, useCallback } from 'react';
import Competency from '../components/Doc/ScriptForm';
import Licence from '../components/Doc/LicenceForm';
import DeceasedEstate from '../components/Doc/DeceasedEstateForm';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import React from 'react';

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
  section?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  caliber?: string;
  executorFullName?: string;
  executorNumber?: string;
  executorPhysicalAddress?: string;
}

export default function DocScript(): React.JSX.Element {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formType, setFormType] = useState<'select' | 'competency' | 'licence' | 'deceased' | null>(null);
  const [submittedFormType, setSubmittedFormType] = useState<string | null>(null);

  const validateAndSetFiles = (files: File[]): void => {
    const validFiles = Array.from(files).filter(file => 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setFileError(null);
    } else {
      setSelectedFiles([]);
      setFileError("Only DOCX files are allowed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFormDataUpdate = (data: FormData): void => {
    setFormData(data);
  };

  const handleFormSubmit = (): void => {
    setSubmittedFormType(
      formType === 'competency' ? 'Competency Form' :
      formType === 'licence' ? 'Licence Form' :
      formType === 'deceased' ? 'Deceased Estate Form' : null
    );
  };

  const handleProcessDocument = async (): Promise<void> => {
    if (selectedFiles.length === 0 || !formData) return;

    try {
      for (const selectedFile of selectedFiles) {
        // Process each file individually
        const arrayBuffer = await selectedFile.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true
        });

        const templateData = Object.fromEntries(
          Object.entries({
            Name: formData.fullName,
            Number: formData.phoneNumber,
            Cell: formData.phoneNumber,
            Email: formData.email,
            Address: formData.physicalAddress,
            ID: formData.idNumber,
            Company: formData.companyName,
            Trade: formData.tradeProfession,
            WorkA: formData.workAddress,
            WorkC: formData.workNumber,
            Section: formData.section,
            Make: formData.make,
            Model: formData.model,
            SerialNumber: formData.serialNumber,
            Caliber: formData.caliber,
            ExecutorName: formData.executorFullName,
            ExecutorNumber: formData.executorNumber,
            ExecutorAddress: formData.executorPhysicalAddress
          }).filter(([, value]) => value?.trim() !== '')
        );

        doc.setData(templateData);
        doc.render();

        const output = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const url = window.URL.createObjectURL(output);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formData.fullName.replace(/\s+/g, '_')}_${selectedFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setFileError('Error processing document. Please try again.');
    }
  };

  // Use React.memo to memoize the component
  const MemoizedCompetency = React.memo(Competency);
  const MemoizedLicence = React.memo(Licence);
  const MemoizedDeceasedEstate = React.memo(DeceasedEstate);

  // Use useCallback to memoize callback functions
  const memoizedHandleFormDataUpdate = useCallback(handleFormDataUpdate, []);
  const memoizedHandleFormSubmit = useCallback(handleFormSubmit, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* New Document Button */}
        <div className="w-1/4">
          <button
            onClick={() => setFormType('select')}
            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            New Document
          </button>
        </div>

        {/* Form Selection Modal */}
        {formType === 'select' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-800/90 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/30 shadow-2xl w-full max-w-2xl relative">
              <button
                onClick={() => setFormType(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">Select Document Type</h2>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setFormType('competency')}
                  className="p-6 bg-stone-700/50 rounded-lg text-left hover:bg-stone-600/50 transition-colors"
                >
                  <h3 className="text-lg font-medium text-white">Competency</h3>
                  <p className="text-sm text-stone-400 mt-1">For standard competency certificates</p>
                </button>
                <button
                  onClick={() => setFormType('licence')}
                  className="p-6 bg-stone-700/50 rounded-lg text-left hover:bg-stone-600/50 transition-colors"
                >
                  <h3 className="text-lg font-medium text-white">Licence</h3>
                  <p className="text-sm text-stone-400 mt-1">For firearm licences with additional details</p>
                </button>
                <button
                  onClick={() => setFormType('deceased')}
                  className="p-6 bg-stone-700/50 rounded-lg text-left hover:bg-stone-600/50 transition-colors"
                >
                  <h3 className="text-lg font-medium text-white">Deceased Estate</h3>
                  <p className="text-sm text-stone-400 mt-1">For deceased estate processing</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modals */}
        {formType && formType !== 'select' && !submittedFormType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-800/90 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/30 shadow-2xl w-full max-w-2xl relative">
              <button
                onClick={() => setFormType(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {formType === 'competency' && (
                <MemoizedCompetency 
                  onUpdate={memoizedHandleFormDataUpdate}
                  onSubmit={memoizedHandleFormSubmit}
                />
              )}
              {formType === 'licence' && (
                <MemoizedLicence 
                  onUpdate={memoizedHandleFormDataUpdate}
                  onSubmit={memoizedHandleFormSubmit}
                />
              )}
              {formType === 'deceased' && (
                <MemoizedDeceasedEstate 
                  onUpdate={memoizedHandleFormDataUpdate}
                  onSubmit={memoizedHandleFormSubmit}
                />
              )}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div className="w-1/2">
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-700/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Upload Document</h2>
            
            {submittedFormType && (
              <div className="mb-6 p-4 bg-stone-700/30 rounded-lg flex justify-between items-center">
                <p className="text-stone-300">
                  <span className="font-medium text-orange-500">Submitted:</span> {submittedFormType}
                </p>
                <button
                  onClick={() => {
                    setSubmittedFormType(null);
                    setFormData(null);
                    setSelectedFiles([]);
                    setFormType(null);
                  }}
                  className="text-stone-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-orange-500 bg-stone-700/20'
                  : 'border-stone-600/50 hover:bg-stone-700/10'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".docx"
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg
                  className="mx-auto h-12 w-12 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-stone-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop.
                </p>
                <p className="text-xs text-stone-400">DOCX files only</p>
              </label>
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <p key={index} className="text-sm text-stone-300">
                      Selected file: {file.name}
                    </p>
                  ))}
                </div>
              )}
              {fileError && (
                <p className="mt-4 text-sm text-red-400">{fileError}</p>
              )}
            </div>
            <button
              onClick={handleProcessDocument}
              disabled={selectedFiles.length === 0 || !formData}
              className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Process Document
            </button>
            <p className="text-xs text-stone-400 mt-2 text-center">Streamline document generation workflows.</p>
          </div>
        </div>

        {/* Placeholder Index Container */}
        <div className="w-1/4 bg-stone-800/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-700/30 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Template Placeholders</h2>
          <div className="space-y-3 text-sm text-stone-300">
            <div>
              <h3 className="font-medium text-orange-400 mb-1">Personal Info</h3>
              <p>{"{Name}"} - Full Name</p>
              <p>{"{Cell}"} - Phone Number</p>
              <p>{"{Email}"} - Email Address</p>
              <p>{"{Address}"} - Physical Address</p>
              <p>{"{ID}"} - ID Number</p>
            </div>
            <div>
              <h3 className="font-medium text-orange-400 mb-1">Professional Info</h3>
              <p>{"{Company}"} - Company Name</p>
              <p>{"{Trade}"} - Trade/Profession</p>
              <p>{"{WorkA}"} - Work Address</p>
              <p>{"{WorkC}"} - Work Contact</p>
            </div>
            <div>
              <h3 className="font-medium text-orange-400 mb-1">Firearm Details</h3>
              <p>{"{Section}"} - Firearm Section</p>
              <p>{"{Make}"} - Firearm Make</p>
              <p>{"{Model}"} - Firearm Model</p>
              <p>{"{SerialNumber}"} - Serial Number</p>
              <p>{"{Caliber}"} - Caliber</p>
            </div>
            <div>
              <h3 className="font-medium text-orange-400 mb-1">Executor Info</h3>
              <p>{"{ExecutorName}"} - Executor Name</p>
              <p>{"{ExecutorNumber}"} - Executor Phone</p>
              <p>{"{ExecutorAddress}"} - Executor Address</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* eslint-disable prettier/prettier */
import React from 'react';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  file?: File;
}

interface ChecklistProps {
  initialItems?: ChecklistItem[];
}

const Checklist: React.FC<ChecklistProps> = ({ initialItems }): JSX.Element => {
  const [clientName, setClientName] = React.useState<string>('');
  const [saveLocation, setSaveLocation] = React.useState<string>(
    localStorage.getItem('saveLocation') || ''
  );
  const [items, setItems] = React.useState<ChecklistItem[]>(initialItems || [
    { id: '1', label: 'Completed Mandate Form', checked: false },
    { id: '2', label: 'Copy of ID', checked: false },
    { id: '3', label: '3 Character References', checked: false },
    { id: '4', label: 'Proof of Address', checked: false },
    { id: '5', label: 'Proficiency Certificate', checked: false },
    { id: '6', label: 'Statement of Results', checked: false },
    { id: '7', label: 'Proof of Payment', checked: false }
  ]);

  const handleCheck = (id: string): void => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked, file: !item.checked ? item.file : undefined } : item
    ));
  };

  const handleFileValidation = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  const handleDrop = (id: string) => (e: React.DragEvent<HTMLLIElement>): void => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !handleFileValidation(file)) {
      alert('Invalid file type or size (max 5MB, PDF/JPEG/PNG only)');
      return;
    }
    if (file) {
      const extension = file.name.split('.').pop();
      const newFileName = `${clientName}_${items.find(item => item.id === id)?.label.replace(/ /g, '_')}.${extension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });
      
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, checked: true, file: renamedFile } : item
      ));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>): void => {
    e.preventDefault();
  };

  const handleSelectLocation = async (): Promise<void> => {
    const result = await window.electronAPI.showOpenDialog({
      title: 'Select Save Location',
      properties: ['openDirectory', 'createDirectory']
    }) as Electron.OpenDialogReturnValue;

    if (!result.canceled && result.filePaths[0]) {
      const location = result.filePaths[0];
      setSaveLocation(location);
      localStorage.setItem('saveLocation', location);
    }
  };

  const handleZip = async (): Promise<void> => {
    if (!clientName) {
      alert('Please enter client name');
      return;
    }

    if (!saveLocation) {
      alert('Please select a save location');
      return;
    }

    const zip = new JSZip();
    items.forEach(item => {
      if (item.file) {
        zip.file(item.file.name, item.file);
      }
    });

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const fullPath = path.join(saveLocation, `${clientName}_documents.zip`);
    await fs.promises.writeFile(fullPath, content);
    alert(`Documents saved to: ${fullPath}`);
  };

  const allChecked = items.every(item => item.checked);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">New Competency Checklist</h2>
      <div className="mb-4">
        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
          Client Name
        </label>
        <input
          type="text"
          id="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          placeholder="Enter client name"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Save Location
        </label>
        <div className="mt-1 flex">
          <input
            type="text"
            value={saveLocation}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Select save location"
          />
          <button
            onClick={handleSelectLocation}
            className="px-4 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600"
          >
            Browse
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li 
            key={item.id} 
            className="flex items-center p-2 border rounded hover:bg-gray-50"
            onDrop={handleDrop(item.id)}
            onDragOver={handleDragOver}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleCheck(item.id)}
              className="w-5 h-5 mr-2"
            />
            <span className={item.checked ? 'line-through text-gray-500' : 'text-gray-700'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      {allChecked && (
        <button
          onClick={handleZip}
          className="mt-4 w-full bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
        >
          Zip Documents
        </button>
      )}
    </div>
  );
};

export default Checklist;

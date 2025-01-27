/* eslint-disable prettier/prettier */
import { memo, useState } from 'react'
import { Client, License } from '../types'
import { DashboardIcons } from './icons/DashboardIcons'
import { Dialog } from './Dialog'

interface ClientCardProps {
  client: Client
  onEditClient: (client: Client) => void
  onAddLicense: (clientId: string) => void
  onEditLicense: (license: License, clientId: string) => void
  onDeleteLicense: (licenseId: string, clientId: string) => void
}

function ClientCard({ client, onEditClient, onAddLicense, onEditLicense, onDeleteLicense }: ClientCardProps): JSX.Element {
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; licenseId: string }>({
    isOpen: false,
    licenseId: ''
  });

  const handleDelete = (licenseId: string): void => {
    setDialogState({ isOpen: true, licenseId });
  };

  const handleConfirmDelete = (): void => {
    onDeleteLicense(dialogState.licenseId, client.id);
    setDialogState({ isOpen: false, licenseId: '' });
  };

  return (
    <>
      <div className="px-2 py-1">
        <div className="bg-stone-700/60 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-orange-500/20">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-white">Client Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => onEditClient(client)}
                className="p-2 hover:bg-stone-600 rounded-lg transition-colors"
              >
                <DashboardIcons.Edit className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onAddLicense(client.id)}
                className="p-2 hover:bg-stone-600 rounded-lg transition-colors"
              >
                <DashboardIcons.Add className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-stone-300">
              <p className="flex items-center gap-2">
                <span className="text-orange-400">Name:</span>
                {client.first_name.toUpperCase()} {client.last_name.toUpperCase()}
                <button
                  onClick={() => navigator.clipboard.writeText(`${client.first_name} ${client.last_name}`)}
                  className="hover:text-white transition-colors"
                  title="Copy name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-400">Email:</span>
                {client.email}
                <button
                  onClick={() => navigator.clipboard.writeText(client.email)}
                  className="hover:text-white transition-colors"
                  title="Copy email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-400">Phone:</span>
                {client.phone}
                <button
                  onClick={() => navigator.clipboard.writeText(client.phone)}
                  className="hover:text-white transition-colors"
                  title="Copy phone"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-400">ID Number:</span>
                {client.id_number}
                <button
                  onClick={() => navigator.clipboard.writeText(client.id_number)}
                  className="hover:text-white transition-colors"
                  title="Copy ID number"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-400">Address:</span>
                {client.address}
                <button
                  onClick={() => navigator.clipboard.writeText(client.address)}
                  className="hover:text-white transition-colors"
                  title="Copy address"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Licences</h3>
              <div className="space-y-2">
                {client.gun_licences
                  .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                  .map((license) => (
                  <div key={license.id} className="relative p-3 bg-stone-800/50 rounded-lg">
                    <button
                      onClick={() => onEditLicense(license, client.id)}
                      className="absolute top-3 right-3 p-2 hover:bg-stone-700 rounded-lg transition-colors"
                    >
                      <DashboardIcons.Edit className="w-4 h-4 text-white/70" />
                    </button>

                    <div className="space-y-1 pr-12">
                      <p className="text-white/90">
                        {license.make?.toUpperCase() || 'N/A'} {license.model?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-stone-400">
                        Type: {license.type?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-stone-400">
                        Caliber: {license.caliber?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-stone-400">
                        Serial Number: {license.serial_number?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-stone-400">
                        Section: {license.section?.toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-sm text-stone-400">
                        Stock Code: {license.stock_code?.toUpperCase() || 'N/A'}
                      </p>
                      {license.barrel_serial && (
                        <p className="text-sm text-stone-400">
                          Barrel: {license.barrel_make?.toUpperCase() || 'N/A'} - {license.barrel_serial.toUpperCase()}
                        </p>
                      )}
                      {license.receiver_serial && (
                        <p className="text-sm text-stone-400">
                          Receiver: {license.receiver_make?.toUpperCase() || 'N/A'} - {license.receiver_serial.toUpperCase()}
                        </p>
                      )}
                      {license.frame_serial && (
                        <p className="text-sm text-stone-400">
                          Frame: {license.frame_make?.toUpperCase() || 'N/A'} - {license.frame_serial.toUpperCase()}
                        </p>
                      )}
                      <p className="text-sm text-stone-400 flex items-center gap-2">
                        <span className="text-orange-400">Expiry Date:</span>
                        {new Date(license.expiry_date).toISOString().split('T')[0]}
                        {(() : JSX.Element => {
                          const today = new Date();
                          const expiryDate = new Date(license.expiry_date);
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                          if (daysUntilExpiry < 0) {
                            return (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-500">Expired {Math.abs(daysUntilExpiry)} days ago</span>
                              </span>
                            );
                          } else if (daysUntilExpiry <= 130) {
                            return (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-yellow-500">Expires in {daysUntilExpiry} days</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-500">Expires in {daysUntilExpiry} days</span>
                              </span>
                            );
                          }
                        })()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(license.id)}
                      className="absolute bottom-3 right-3 p-2 hover:bg-stone-700 rounded-lg transition-colors"
                    >
                      <DashboardIcons.Delete className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        isOpen={dialogState.isOpen}
        title="Delete License"
        message="Are you sure you want to delete this license? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogState({ isOpen: false, licenseId: '' })}
      />
    </>
  )
}

export default memo(ClientCard) 
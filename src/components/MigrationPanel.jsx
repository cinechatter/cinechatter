/**
 * Migration Panel Component
 *
 * UI for migrating data from localStorage to Supabase
 * Can be added to admin settings panel
 */

import React, { useState, useEffect } from 'react';
import { Upload, Download, Database, HardDrive, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import migrationService from '../services/migrationService';
import storageService from '../services/storageService';

const MigrationPanel = () => {
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [storageType, setStorageType] = useState('');

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    const needed = await migrationService.needsMigration();
    setMigrationNeeded(needed);
    setStorageType(storageService.getBackendType());
  };

  const handleMigration = async () => {
    if (!window.confirm('This will migrate all data from localStorage to Supabase. Continue?')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrationService.migrateAll();
      setMigrationResult(result);

      if (result.success) {
        // Refresh migration status
        await checkMigrationStatus();
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error.message}`
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleBackupDownload = async () => {
    const success = await migrationService.downloadLocalStorageBackup();
    if (success) {
      alert('✅ Backup downloaded successfully!');
    } else {
      alert('❌ Backup download failed. Check console for details.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Data Migration</h3>
      </div>

      {/* Current Storage Type */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {storageType === 'localStorage' ? (
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          <span className="font-semibold text-gray-800 dark:text-white">
            Current Storage: {storageType === 'localStorage' ? 'Browser Storage' : 'Supabase Database'}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {storageType === 'localStorage'
            ? '⚠️ Development mode - Data is stored in your browser only'
            : '✅ Production mode - Data is persisted in Supabase database'}
        </p>
      </div>

      {/* Migration Status */}
      {migrationNeeded && storageType === 'supabase' && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Migration Available
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You have data in localStorage that can be migrated to Supabase for permanent storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          migrationResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {migrationResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${
                migrationResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              } mb-1`}>
                {migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}
              </p>
              <p className={`text-sm ${
                migrationResult.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {migrationResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleMigration}
          disabled={migrating || !migrationNeeded || storageType !== 'supabase'}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            migrating || !migrationNeeded || storageType !== 'supabase'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          {migrating ? 'Migrating...' : 'Migrate to Supabase'}
        </button>

        <button
          onClick={handleBackupDownload}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Backup
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• <strong>Development:</strong> Data is stored in browser localStorage (temporary)</li>
          <li>• <strong>Production:</strong> Data is stored in Supabase database (permanent)</li>
          <li>• <strong>Migration:</strong> Move your dev data to production database</li>
          <li>• <strong>Backup:</strong> Download your data as JSON file for safekeeping</li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationPanel;

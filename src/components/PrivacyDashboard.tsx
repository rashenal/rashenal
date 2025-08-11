// Privacy Dashboard - Visual interface for encryption and data privacy management
// Educational component showing how personal data is protected

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  RefreshCw,
  FileText,
  Heart,
  Brain,
  User,
  Activity,
  Database,
  Settings,
  Copy,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { privacyEncryption, DATA_CLASSIFICATIONS, type SensitivityLevel } from '../lib/PrivacyEncryption';

interface EncryptionStatus {
  initialized: boolean;
  hasKeys: boolean;
  encryptedFieldsCount: number;
  keyAge?: string;
  lastRotated?: string;
}

interface DataExample {
  fieldName: string;
  originalData: any;
  encryptedData?: any;
  sensitivity: SensitivityLevel;
  isEncrypted: boolean;
}

export default function PrivacyDashboard() {
  const { user } = useUser();
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    initialized: false,
    hasKeys: false,
    encryptedFieldsCount: 0
  });
  
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'keys' | 'learn'>('overview');
  const [dataExamples, setDataExamples] = useState<DataExample[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['health']));
  const [encryptionProcess, setEncryptionProcess] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadEncryptionStatus();
    generateDataExamples();
  }, [user]);

  const loadEncryptionStatus = () => {
    const status = privacyEncryption.getStatus();
    setEncryptionStatus(status);
  };

  const generateDataExamples = () => {
    // Generate example data for Elizabeth Harvey
    const examples: DataExample[] = [
      {
        fieldName: 'blood_pressure',
        originalData: { systolic: 120, diastolic: 80, pulse: 72, timestamp: '2025-08-09T10:30:00Z' },
        sensitivity: 'highly_sensitive',
        isEncrypted: false
      },
      {
        fieldName: 'medications',
        originalData: ['Vitamin D 2000IU daily', 'Omega-3 1000mg twice daily'],
        sensitivity: 'highly_sensitive',
        isEncrypted: false
      },
      {
        fieldName: 'mental_health_notes',
        originalData: 'Feeling focused and energized today. Meditation helped with morning anxiety.',
        sensitivity: 'highly_sensitive',
        isEncrypted: false
      },
      {
        fieldName: 'full_name',
        originalData: 'Elizabeth Harvey',
        sensitivity: 'sensitive',
        isEncrypted: false
      },
      {
        fieldName: 'daily_habits',
        originalData: { meditation: true, exercise: true, water_intake: 2.5, sleep_hours: 7.5 },
        sensitivity: 'private',
        isEncrypted: false
      },
      {
        fieldName: 'username',
        originalData: 'elizabeth_harvey',
        sensitivity: 'public',
        isEncrypted: false
      }
    ];

    setDataExamples(examples);
  };

  const initializeEncryption = async () => {
    if (!user) return;
    
    setIsInitializing(true);
    setEncryptionProcess([]);

    const result = await privacyEncryption.initialize(user.id);
    
    if (result.success) {
      setEncryptionProcess(result.educationalInfo);
      loadEncryptionStatus();
      
      // Auto-encrypt sensitive data examples
      await encryptSensitiveExamples();
    }

    setIsInitializing(false);
  };

  const encryptSensitiveExamples = async () => {
    const updatedExamples = await Promise.all(
      dataExamples.map(async (example) => {
        if (example.sensitivity !== 'public' && !example.isEncrypted) {
          const result = await privacyEncryption.encryptData(
            example.originalData,
            example.fieldName,
            example.sensitivity
          );

          if (result.isActuallyEncrypted) {
            return {
              ...example,
              encryptedData: result.encrypted,
              isEncrypted: true
            };
          }
        }
        return example;
      })
    );

    setDataExamples(updatedExamples);
  };

  const toggleEncryption = async (index: number) => {
    const example = dataExamples[index];
    const updatedExamples = [...dataExamples];

    if (example.isEncrypted && example.encryptedData) {
      // Decrypt
      const result = await privacyEncryption.decryptData(example.encryptedData);
      if (result.success) {
        updatedExamples[index] = {
          ...example,
          isEncrypted: false,
          encryptedData: undefined
        };
        setEncryptionProcess(result.process);
      }
    } else {
      // Encrypt
      const result = await privacyEncryption.encryptData(
        example.originalData,
        example.fieldName,
        example.sensitivity
      );

      if (result.isActuallyEncrypted) {
        updatedExamples[index] = {
          ...example,
          encryptedData: result.encrypted,
          isEncrypted: true
        };
        setEncryptionProcess(result.process);
      }
    }

    setDataExamples(updatedExamples);
  };

  const rotateKeys = async () => {
    if (!user) return;
    
    const result = await privacyEncryption.rotateKeys(user.id);
    if (result.success) {
      loadEncryptionStatus();
      alert(`Keys rotated successfully! ${result.reEncryptedCount} fields re-encrypted.`);
    }
  };

  const exportKeys = () => {
    const keys = privacyEncryption.exportKeys();
    if (keys) {
      console.log('Exported keys (for demonstration):', keys);
      alert('Keys exported to console (for demonstration). In production, this would download a secure backup file.');
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSensitivityIcon = (sensitivity: SensitivityLevel) => {
    switch (sensitivity) {
      case 'highly_sensitive':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'sensitive':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'private':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'public':
        return <Activity className="h-4 w-4 text-green-500" />;
    }
  };

  const getSensitivityColor = (sensitivity: SensitivityLevel) => {
    switch (sensitivity) {
      case 'highly_sensitive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sensitive':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'private':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'public':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Encryption Status Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Encryption Status</h2>
              <p className="text-sm text-gray-600">Your personal data protection status</p>
            </div>
          </div>
          {encryptionStatus.initialized ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-green-700 font-medium">Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <span className="text-yellow-700 font-medium">Not Initialized</span>
            </div>
          )}
        </div>

        {!encryptionStatus.initialized ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Initialize Encryption</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Generate your personal encryption keys to protect sensitive health and personal data.
                  Your private key never leaves your device.
                </p>
                <button
                  onClick={initializeEncryption}
                  disabled={isInitializing}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {isInitializing ? 'Initializing...' : 'Initialize Encryption'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Encrypted Fields</span>
                <Database className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {encryptionStatus.encryptedFieldsCount}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Key Age</span>
                <Key className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {encryptionStatus.keyAge || '0 days'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Protection Level</span>
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                AES-256
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Classification Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Classification</h3>
        <div className="space-y-3">
          {['highly_sensitive', 'sensitive', 'private', 'public'].map((level) => {
            const count = DATA_CLASSIFICATIONS.filter(c => c.sensitivity === level).length;
            return (
              <div key={level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getSensitivityIcon(level as SensitivityLevel)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {level.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {level === 'highly_sensitive' && 'Medical records, health metrics, mental health data'}
                      {level === 'sensitive' && 'Personal identifiable information'}
                      {level === 'private' && 'Behavioral data, habits, conversations'}
                      {level === 'public' && 'Username, avatar, public profile'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">fields</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encryption Process Log */}
      {encryptionProcess.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Encryption Process</h3>
          <div className="space-y-2">
            {encryptionProcess.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const DataTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Interactive Encryption Demo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Click the lock icon to see how your data is encrypted and decrypted in real-time.
              This demonstrates how your sensitive health data is protected.
            </p>
          </div>
        </div>
      </div>

      {dataExamples.map((example, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getSensitivityIcon(example.sensitivity)}
              <div>
                <h3 className="font-medium text-gray-900">
                  {example.fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getSensitivityColor(example.sensitivity)}`}>
                  {example.sensitivity.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleEncryption(index)}
              disabled={!encryptionStatus.initialized}
              className={`p-2 rounded-lg transition-colors ${
                example.isEncrypted 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={example.isEncrypted ? 'Click to decrypt' : 'Click to encrypt'}
            >
              {example.isEncrypted ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {example.isEncrypted ? 'Encrypted Data' : 'Original Data'}
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {example.isEncrypted && example.encryptedData
                    ? JSON.stringify(example.encryptedData, null, 2)
                    : JSON.stringify(example.originalData, null, 2)
                  }
                </pre>
              </div>
            </div>

            {example.isEncrypted && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Encryption Details</h4>
                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="font-medium">AES-256-GCM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Key ID:</span>
                    <span className="font-medium font-mono text-xs">
                      {example.encryptedData?.keyId || 'MOCK_KEY'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Secure</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const KeysTab = () => {
    const keys = privacyEncryption.exportKeys();
    
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Critical Security Information</h3>
              <p className="text-sm text-red-700 mt-1">
                Never share your private key or recovery phrase with anyone, including Rashenal support.
                These keys are your only way to decrypt your personal data.
              </p>
            </div>
          </div>
        </div>

        {keys ? (
          <>
            {/* Public Key */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Public Key</h3>
              <p className="text-sm text-gray-600 mb-4">
                This key can be shared with others to allow them to encrypt data for you.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Key Fingerprint: {keys.fingerprint}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(keys.publicKey)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <pre className="font-mono text-xs text-gray-800 break-all">
                  {keys.publicKey}
                </pre>
              </div>
            </div>

            {/* Recovery Phrase */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recovery Phrase</h3>
                <button
                  onClick={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
                  className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  {showRecoveryPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showRecoveryPhrase ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Write these words down and store them in a safe place. They can recover your encryption keys.
              </p>

              {showRecoveryPhrase ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {keys.recoveryPhrase.map((word, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded px-3 py-2">
                        <span className="text-xs text-gray-500">{index + 1}.</span>
                        <span className="ml-2 font-medium text-gray-900">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click "Show" to reveal recovery phrase</p>
                </div>
              )}
            </div>

            {/* Key Management Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Management</h3>
              <div className="space-y-3">
                <button
                  onClick={exportKeys}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Export Keys</p>
                      <p className="text-sm text-gray-600">Download encrypted backup</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                <button
                  onClick={rotateKeys}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Rotate Keys</p>
                      <p className="text-sm text-gray-600">Generate new encryption keys</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Keys Generated</h3>
            <p className="text-gray-600 mb-4">Initialize encryption to generate your keys</p>
            <button
              onClick={initializeEncryption}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Initialize Encryption
            </button>
          </div>
        )}
      </div>
    );
  };

  const LearnTab = () => (
    <div className="space-y-6">
      {/* How It Works */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Encryption Works</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Key Generation</h4>
              <p className="text-sm text-gray-600 mt-1">
                When you initialize encryption, Rashenal generates a unique key pair using cryptographically secure random numbers.
                Your private key never leaves your device.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Data Classification</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your data is automatically classified by sensitivity level. Health data and PII are marked as highly sensitive
                and always encrypted before storage.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Encryption Process</h4>
              <p className="text-sm text-gray-600 mt-1">
                Sensitive data is encrypted using AES-256-GCM, a military-grade encryption standard. Each piece of data
                gets a unique initialization vector (IV) for maximum security.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Secure Storage</h4>
              <p className="text-sm text-gray-600 mt-1">
                Encrypted data is stored in Rashenal's database. Even if someone gains access to the database,
                they cannot read your data without your private key.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">5</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Decryption</h4>
              <p className="text-sm text-gray-600 mt-1">
                When you access your data, it's decrypted locally in your browser using your private key.
                The decrypted data is never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why This Matters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Privacy Matters for Health Data</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Medical Privacy</h4>
              <p className="text-sm text-gray-600">
                Your health data is deeply personal. Blood pressure, medications, and mental health notes
                should only be accessible by you and those you explicitly trust.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Data Sovereignty</h4>
              <p className="text-sm text-gray-600">
                You own your data. With client-side encryption, you maintain complete control over who can
                access your information, even from the service provider.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">AI Training Protection</h4>
              <p className="text-sm text-gray-600">
                Your encrypted data cannot be used for AI training without your explicit consent. Your personal
                patterns and health insights remain private.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Best Practices</h3>
        <div className="space-y-3">
          {[
            'Never share your private key or recovery phrase with anyone',
            'Write down your recovery phrase and store it in a secure location',
            'Use a strong, unique password for your Rashenal account',
            'Enable two-factor authentication when available',
            'Regularly export and backup your encryption keys',
            'Rotate your encryption keys every 90 days',
            'Review data access permissions regularly'
          ].map((practice, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{practice}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Encryption</h1>
        </div>
        <p className="text-gray-600">
          Protect your personal health data with military-grade encryption. Your data, your keys, your control.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'data', label: 'Data Examples', icon: Database },
            { id: 'keys', label: 'Key Management', icon: Key },
            { id: 'learn', label: 'Learn More', icon: Info }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'data' && <DataTab />}
      {activeTab === 'keys' && <KeysTab />}
      {activeTab === 'learn' && <LearnTab />}
    </div>
  );
}
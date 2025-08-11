'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Toast from '@/components/Toast';
import { Key, Copy, Check, Eye, EyeOff, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';

export default function ApiKeyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchApiKeys();
  }, [session, status, router]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/api-keys');
      const data = await response.json();
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setGenerating(true);
    try {
      console.log('Generating API key with data:', formData);
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (response.ok) {
        setApiKeys([data, ...apiKeys]);
        setFormData({ name: '' });
        setShowForm(false);
        showToast('API key generated successfully!', 'success');
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
        showToast('Error generating API key: ' + errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      showToast('Error generating API key: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const deleteApiKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key._id !== id));
        showToast('API key deleted successfully!', 'success');
      } else {
        const data = await response.json();
        showToast('Error deleting API key: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      showToast('Error deleting API key', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      showToast('API key copied to clipboard!', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Error copying to clipboard', 'error');
    }
  };

  const toggleKeyVisibility = (keyId) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateApiKey();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <DashboardLayout activeTab="apikey">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate and manage your API keys for integrations.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate API Key
          </button>
        </div>

        {/* Generate API Key Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New API Key</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    API Key Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production API Key"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-600 text-gray-900"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <Key className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
                <p className="text-sm text-gray-500">
                  Manage your API keys for secure access to your account.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading API keys...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You haven't generated any API keys yet. Generate one to start using our API.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First API Key
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Key className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="text-sm font-medium text-gray-900">{apiKey.name}</h4>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex-1 relative">
                            <input
                              type={showKeys[apiKey._id] ? 'text' : 'password'}
                              value={apiKey.key}
                              readOnly
                              className="block w-full pr-20 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm text-gray-900"
                            />
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(apiKey._id)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showKeys[apiKey._id] ? (
                                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            {copiedKey === apiKey.key ? (
                              <>
                                <Check className="h-4 w-4 mr-1 text-green-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created {new Date(apiKey.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteApiKey(apiKey._id)}
                        disabled={deleting === apiKey._id}
                        className="ml-4 text-red-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete API key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Keep your API keys secure and never share them publicly</li>
                  <li>If compromised, delete the key and generate a new one immediately</li>
                  <li>Use environment variables to store API keys in production</li>
                  <li>Each API key provides full access to your account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
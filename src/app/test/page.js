'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testApiKeyGeneration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test API Key' }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
          <a href="/login" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Test Page</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="text-sm overflow-auto text-gray-900">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
          
          <div className="space-y-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Authentication & User Creation'}
            </button>
            
            <button
              onClick={testApiKeyGeneration}
              disabled={loading}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Key Generation'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="text-sm overflow-auto text-gray-900">
              {JSON.stringify(testResult, null, 2)}
            </pre>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2 text-sm">
            <p>✅ If authentication test passes, you can now generate API keys</p>
            <p>✅ If API key generation test passes, everything is working</p>
            <p>✅ Go to <a href="/dashboard/apikey" className="text-blue-600 hover:underline">API Keys page</a> to use the feature</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
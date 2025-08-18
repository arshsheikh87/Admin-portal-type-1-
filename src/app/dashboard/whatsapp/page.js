'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { MessageSquare, Send, Phone, Clock, CheckCircle, XCircle, QrCode, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';

export default function WhatsAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    message: ''
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Initialize WhatsApp service
    initializeWhatsAppService();
    fetchMessages();
    checkWhatsAppStatus();
  }, [session, status, router]);

  // Poll WhatsApp status when connecting
  useEffect(() => {
    let interval;
    if (connecting || whatsappStatus === 'qr_ready') {
      interval = setInterval(checkWhatsAppStatus, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connecting, whatsappStatus]);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect');
      const data = await response.json();

      console.log('WhatsApp status response:', data);
      setWhatsappStatus(data.status);

      if (data.qrCode && data.qrCode !== qrCodeData) {
        setQrCodeData(data.qrCode);
        generateQRCode(data.qrCode);
      }

      if (data.status === 'connected') {
        setConnecting(false);
        setQrCodeData(null);
        setQrCodeImage(null);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      // Set status to disconnected on error
      setWhatsappStatus('disconnected');
    }
  };

  const generateQRCode = async (qrData) => {
    try {
      const qrImage = await QRCode.toDataURL(qrData);
      setQrCodeImage(qrImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const connectToWhatsApp = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST'
      });
      const data = await response.json();

      if (response.ok) {
        setWhatsappStatus(data.status);
      } else {
        alert('Error connecting to WhatsApp: ' + data.error);
        setConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
      alert('Error connecting to WhatsApp');
      setConnecting(false);
    }
  };

  const retryConnection = async () => {
    setConnecting(true);
    try {
      // First try to disconnect if there's an existing connection
      if (whatsappStatus !== 'disconnected') {
        await disconnectWhatsApp();
      }

      // Wait a moment before reconnecting
      setTimeout(async () => {
        await connectToWhatsApp();
      }, 1000);
    } catch (error) {
      console.error('Error retrying connection:', error);
      setConnecting(false);
    }
  };

  const initializeWhatsAppService = async () => {
    try {
      await fetch('/api/init');
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'DELETE'
      });

      if (response.ok) {
        setWhatsappStatus('disconnected');
        setQrCodeData(null);
        setQrCodeImage(null);
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (whatsappStatus !== 'connected') {
      alert('Please connect to WhatsApp first');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([data.savedMessage, ...messages]);
        setFormData({ phoneNumber: '', message: '' });
        alert('Message sent successfully!');
      } else {
        alert('Error sending message: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const getWhatsAppStatusDisplay = () => {
    switch (whatsappStatus) {
      case 'connected':
        return { text: 'Connected', color: 'text-green-600', bg: 'bg-green-100', icon: <Wifi className="h-5 w-5" /> };
      case 'connecting':
      case 'initializing':
        return { text: 'Connecting...', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock className="h-5 w-5" /> };
      case 'qr_ready':
        return { text: 'QR Code Ready', color: 'text-blue-600', bg: 'bg-blue-100', icon: <QrCode className="h-5 w-5" /> };
      case 'qr_expired':
        return { text: 'QR Code Expired', color: 'text-orange-600', bg: 'bg-orange-100', icon: <XCircle className="h-5 w-5" /> };
      case 'auth_failed':
        return { text: 'Authentication Failed', color: 'text-red-600', bg: 'bg-red-100', icon: <XCircle className="h-5 w-5" /> };
      case 'error':
        return { text: 'Connection Error', color: 'text-red-600', bg: 'bg-red-100', icon: <XCircle className="h-5 w-5" /> };
      default:
        return { text: 'Disconnected', color: 'text-gray-600', bg: 'bg-gray-100', icon: <WifiOff className="h-5 w-5" /> };
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

  if (!session) return null;

  const statusDisplay = getWhatsAppStatusDisplay();

  return (
    <DashboardLayout activeTab="whatsapp">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect to WhatsApp and send messages to your contacts.
          </p>
        </div>

        {/* WhatsApp Connection Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>
                  {statusDisplay.icon}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">WhatsApp Status</h3>
                  <p className={`text-sm font-medium ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </p>
                  {/* Debug info - remove this in production */}
                  <p className="text-xs text-gray-400 mt-1">
                    Raw status: {whatsappStatus}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                {/* Show connect button for any non-connected state */}
                {whatsappStatus !== 'connected' && whatsappStatus !== 'connecting' && whatsappStatus !== 'qr_ready' && (
                  <button
                    onClick={connectToWhatsApp}
                    disabled={connecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    {connecting ? 'Connecting...' : 'Connect to WhatsApp'}
                  </button>
                )}

                {whatsappStatus === 'connected' && (
                  <button
                    onClick={disconnectWhatsApp}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Disconnect
                  </button>
                )}

                {/* Retry button for failed states */}
                {(whatsappStatus === 'auth_failed' || whatsappStatus === 'error') && (
                  <button
                    onClick={retryConnection}
                    disabled={connecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    {connecting ? 'Retrying...' : 'Retry Connection'}
                  </button>
                )}

                {/* Retry button for QR code timeout or expired states */}
                {whatsappStatus === 'qr_expired' && (
                  <button
                    onClick={retryConnection}
                    disabled={connecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {connecting ? 'Refreshing...' : 'Refresh QR Code'}
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Display */}
            {whatsappStatus === 'qr_ready' && qrCodeImage && (
              <div className="mt-6 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-blue-900 mb-4">
                    Scan QR Code with WhatsApp
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Open WhatsApp on your phone and scan this QR code to connect
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={qrCodeImage}
                      alt="WhatsApp QR Code"
                      className="border-4 border-white shadow-lg rounded-lg"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    The connection will be established automatically once scanned
                  </p>
                </div>
              </div>
            )}

            {/* Connection Instructions */}
            {whatsappStatus === 'connecting' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Connecting to WhatsApp...
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please wait while we establish the connection. A QR code will appear shortly.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error States with Retry Options */}
            {(whatsappStatus === 'auth_failed' || whatsappStatus === 'error') && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Connection Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        {whatsappStatus === 'auth_failed'
                          ? 'Authentication failed. Please try connecting again.'
                          : 'An error occurred while connecting. Please try again.'
                        }
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={retryConnection}
                        disabled={connecting}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Wifi className="h-4 w-4 mr-2" />
                        {connecting ? 'Retrying...' : 'Retry Connection'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Expired State */}
            {whatsappStatus === 'qr_expired' && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      QR Code Expired
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>The QR code has expired. Please refresh to get a new one.</p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={retryConnection}
                        disabled={connecting}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {connecting ? 'Refreshing...' : 'Refresh QR Code'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Send Message Form - Only show when connected */}
        {whatsappStatus === 'connected' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-6">
                <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Send WhatsApp Message</h3>
                  <p className="text-sm text-gray-500">
                    Send a message to any WhatsApp number.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-600 text-gray-900"
                      placeholder="+1234567890"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Example: +918130626713
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-600 text-gray-900"
                    placeholder="Enter your message here..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Message History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Message History</h3>

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages</h3>
                <p className="text-sm text-gray-500">
                  {whatsappStatus === 'connected'
                    ? "You haven't sent any messages yet. Send your first message above."
                    : "Connect to WhatsApp first to send messages."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {message.phoneNumber}
                          </span>
                          <div className="ml-2 flex items-center">
                            {getStatusIcon(message.status)}
                            <span className="ml-1 text-xs text-gray-500">
                              {getStatusText(message.status)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{message.message}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-blue-400">ℹ️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About WhatsApp Integration
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This integration uses WhatsApp Web.js to connect to your WhatsApp account.
                  Scan the QR code with your phone to authenticate and start sending messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Coins,
  CreditCard,
  Zap,
  Star,
  Check,
  ArrowRight,
  Gift,
  Sparkles,
  Crown,
  ShoppingCart
} from 'lucide-react';

export default function Credits() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Credit packages with different tiers
  const creditPackages = [
    {
      id: 'starter',
      name: '100 Credits',
      credits: 100,
      price: 9.50,
      originalPrice: 10.00,
      discount: 17,
      popular: false,
      icon: Zap,
      color: 'blue',
      features: ['Perfect for beginners', 'Basic API access', '30-day validity']
    },
    {
      id: 'popular',
      name: '525 Credits',
      credits: 525,
      price: 29.00,
      originalPrice: 35.00,
      discount: 17,
      popular: true,
      icon: Star,
      color: 'red',
      features: ['Most popular choice', 'Priority support', '60-day validity', 'Bonus 25 credits']
    },
    {
      id: 'value',
      name: '1125 Credits',
      credits: 1125,
      price: 55.00,
      originalPrice: 65.00,
      discount: 15,
      popular: false,
      icon: Crown,
      color: 'purple',
      features: ['Great value', 'Premium support', '90-day validity', 'Bonus 125 credits']
    },
    {
      id: 'mega',
      name: '1650 Credits',
      credits: 1650,
      price: 50.00,
      originalPrice: 60.00,
      discount: 16,
      popular: false,
      icon: Sparkles,
      color: 'orange',
      features: ['Best savings', 'VIP support', '120-day validity', 'Bonus 150 credits']
    },
    {
      id: 'ultimate',
      name: '3400 Credits',
      credits: 3400,
      price: 100.00,
      originalPrice: 120.00,
      discount: 16,
      popular: false,
      icon: Gift,
      color: 'green',
      features: ['Maximum value', 'Dedicated support', '180-day validity', 'Bonus 400 credits']
    },
    {
      id: 'enterprise',
      name: '7000 Credits',
      credits: 7000,
      price: 200.00,
      originalPrice: 240.00,
      discount: 16,
      popular: false,
      icon: Crown,
      color: 'gold',
      features: ['Enterprise level', '24/7 support', '365-day validity', 'Bonus 1000 credits']
    }
  ];

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchCurrentCredits();

    // Handle Stripe redirect results
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');

    if (success && sessionId) {
      // Verify payment and add credits manually if webhook failed
      verifyPayment(sessionId);
    } else if (success) {
      alert('Payment successful! Your credits should be added shortly.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (canceled) {
      alert('Payment was canceled.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [session, status, router]);

  const fetchCurrentCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCurrentCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const verifyPayment = async (sessionId) => {
    try {
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Payment successful! ${data.message}`);
        fetchCurrentCredits(); // Refresh credits
      } else {
        console.error('Payment verification failed:', data.error);
        alert('Payment completed but there was an issue adding credits. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Payment completed but verification failed. Please contact support.');
    } finally {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setShowPayment(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          credits: selectedPackage.credits,
          price: selectedPackage.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <DashboardLayout activeTab="credits">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-500 via-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">ADMIN PORTAL CREDITS</h1>
                <p className="text-blue-100 text-lg">Power up your API usage with our credit packages</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end mb-2">
                  <Coins className="h-6 w-6 text-yellow-300 mr-2" />
                  <span className="text-2xl font-bold">{currentCredits.toLocaleString()}</span>
                </div>
                <p className="text-blue-100">Current Balance</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 transform translate-x-16 -translate-y-8">
            <div className="w-64 h-64 bg-white opacity-5 rounded-full"></div>
          </div>
        </div>

        {/* Credit Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => {
            const IconComponent = pkg.icon;
            const isSelected = selectedPackage?.id === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${pkg.popular
                  ? 'border-red-500 ring-2 ring-red-200 bg-gradient-to-br from-red-50 to-pink-50'
                  : isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Package Icon */}
                  <div className={`inline-flex p-3 rounded-lg mb-4 ${pkg.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    pkg.color === 'red' ? 'bg-red-100 text-red-600' :
                      pkg.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        pkg.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                          pkg.color === 'green' ? 'bg-green-100 text-green-600' :
                            'bg-yellow-100 text-yellow-600'
                    }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Package Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>

                  {/* Discount Badge */}
                  {pkg.discount > 0 && (
                    <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold mb-3">
                      Discount {pkg.discount}%
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">${pkg.price.toFixed(2)}</span>
                      {pkg.originalPrice > pkg.price && (
                        <span className="text-lg text-gray-400 line-through">${pkg.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${isSelected
                      ? 'bg-blue-600 text-white'
                      : pkg.popular
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Selected
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Select Package
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Section */}
        {showPayment && selectedPackage && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Information</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package:</span>
                      <span className="font-medium">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credits:</span>
                      <span className="font-medium">{selectedPackage.credits.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${selectedPackage.price.toFixed(2)}</span>
                    </div>
                    {selectedPackage.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({selectedPackage.discount}%):</span>
                        <span>-${(selectedPackage.originalPrice - selectedPackage.price).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${selectedPackage.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      After purchase, you'll have {(currentCredits + selectedPackage.credits).toLocaleString()} total credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

                  <div className="space-y-3">
                    <button className="w-full p-4 border-2 border-orange-500 rounded-lg bg-orange-50 flex items-center justify-center text-orange-700 font-semibold">
                      <span className="mr-2">🛒</span>
                      BUY NOW
                    </button>

                    <button className="w-full p-4 border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-semibold">
                      <span className="mr-2">💳</span>
                      Buy with PayPal
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowPayment(false)}
                    className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>🔒 Secure payment powered by industry-standard encryption</p>
                  <p className="mt-1">Your payment information is safe and secure</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
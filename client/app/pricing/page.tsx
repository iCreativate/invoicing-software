'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      price: isAnnual ? 29 : 39,
      period: isAnnual ? '/month (billed annually)' : '/month',
      features: [
        'Up to 5 team members',
        '100 invoices per month',
        'Basic invoicing & payments',
        'Client management',
        'Email support',
        'Mobile app access',
        'Basic reporting',
      ],
      cta: 'Start Free Trial',
      popular: false,
      gradient: 'from-gray-500 to-gray-600',
    },
    {
      name: 'Professional',
      description: 'For growing businesses that need more',
      price: isAnnual ? 79 : 99,
      period: isAnnual ? '/month (billed annually)' : '/month',
      features: [
        'Up to 25 team members',
        'Unlimited invoices',
        'Advanced invoicing & payments',
        'Payroll management (up to 10 employees)',
        'Banking integration',
        'AI invoice generation',
        'Advanced reporting & analytics',
        'Priority support',
        'Custom branding',
        'API access',
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced needs',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited team members',
        'Unlimited everything',
        'Full payroll engine',
        'Multi-company management',
        'Advanced banking integration',
        'AI automation suite',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations',
        'On-premise deployment option',
        'SLA guarantee',
        'Training & onboarding',
      ],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'from-purple-600 to-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full bg-gradient-to-br from-blue-50 via-indigo-50 via-white to-purple-50 overflow-x-hidden" data-responsive-fill>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 min-w-0">
            <Link href="/" className="flex items-center space-x-2 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg sm:text-xl">T</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
                Timely
              </h1>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                Home
              </Link>
              <Link href="#features" className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                Features
              </Link>
              <Link href="/pricing" className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                Pricing
              </Link>
              <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
                Login
              </Link>
              <Link
                href="/register"
                className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                Get Started
              </Link>
            </div>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-3 py-4 space-y-2">
              <Link href="/" className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="#features" className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
              <Link href="/pricing" className="block px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">Pricing</Link>
              <Link href="/login" className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link href="/register" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold mt-4" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 break-words">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Choose the perfect plan for your business. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 flex-wrap">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Save 25%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 min-w-0">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl min-w-0 ${
                plan.popular
                  ? 'border-blue-500 md:scale-105 lg:scale-110'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    {typeof plan.price === 'number' ? (
                      <>
                        <span className="text-5xl font-black text-gray-900">R{plan.price}</span>
                        <span className="text-gray-600 ml-2">{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                    )}
                  </div>
                  {typeof plan.price === 'number' && isAnnual && (
                    <p className="text-sm text-gray-500 mt-1">
                      Save R{plan.price * 12 - plan.price * 12 * 0.75} per year
                    </p>
                  )}
                </div>

                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/register'}
                  className={`block w-full text-center py-4 rounded-xl font-bold transition-all duration-300 mb-6 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: 'Can I change plans later?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, debit cards, and bank transfers. Enterprise customers can also pay via invoice.',
              },
              {
                question: 'Is there a setup fee?',
                answer: 'No, there are no setup fees or hidden charges. You only pay for your chosen plan.',
              },
              {
                question: 'What happens after my free trial?',
                answer: 'After your 14-day free trial, you\'ll be automatically moved to your selected plan. You can cancel anytime during the trial without being charged.',
              },
              {
                question: 'Do you offer discounts for annual plans?',
                answer: 'Yes! Annual plans save you 25% compared to monthly billing. That\'s 3 months free!',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Timely to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              Start Free Trial
            </Link>
            <Link
              href="#contact"
              className="inline-block bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-200 border-2 border-white/30"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Timely</h3>
            </div>
            <p className="mb-6 text-gray-300">Modern Finance, Payroll & Operations Platform</p>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Timely. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


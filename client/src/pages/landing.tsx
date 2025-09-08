import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Users, Clock, Check, Mail, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      // Stay on landing page after logout
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || user?.email}
                </span>
                {user?.isAdmin ? (
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    size="sm"
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Admin Panel
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/home'}
                    size="sm"
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Dashboard
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-red-600 px-4 py-2"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/login'}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-6 py-3"
              >
                {t('auth.teacherSignIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-8">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
            Concern2Care
          </h1>
          
          {/* Tagline */}
          <p className="text-2xl text-gray-700 mb-2 font-medium px-2">
            {t('landing.tagline')}
          </p>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight px-2">
              {t('landing.mainHeading')}
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed px-2 max-w-3xl mx-auto">
              {t('landing.description')}
            </p>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg px-12 py-4 rounded-xl font-medium shadow-lg"
            >
              🔐 {t('landing.secureLogin')}
            </Button>
            
            <p className="text-sm text-gray-500 mt-6 px-2">
              {t('landing.ferpaCompliant')}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-12 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.instantAI')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.instantAIDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.documentation')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.documentationDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.collaboration')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.collaborationDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.saveTime')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.saveTimeDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-xl text-gray-600 mb-2">{t('pricing.subtitle')}</p>
            <p className="text-gray-600">{t('pricing.description')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Plan: 1-200 Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">{t('pricing.popular')}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.standardPlan')}</h3>
              <p className="text-gray-600 mb-4">{t('pricing.standardRange')}</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$10<span className="text-lg text-gray-600">/teacher/month</span></div>
                <p className="text-gray-600">{t('pricing.annual')}</p>
                <p className="text-green-600 font-medium">{t('pricing.save10')}</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.aiRecommendations')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.supportRequests')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.pdfGeneration')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.emailSharing')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.prioritySupport')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.analytics')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.bulkManagement')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.training')}</li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>

            {/* Enterprise Plan: 200+ Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.enterprise')}</h3>
              <p className="text-gray-600 mb-4">{t('pricing.enterpriseRange')}</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">{t('pricing.custom')}</div>
                <p className="text-gray-600">{t('pricing.customPricing')}</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.everythingInStandard')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.accountManager')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.whiteLabel')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.apiAccess')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.customDevelopment')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.reporting')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.support24')}</li>
                <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />{t('pricing.features.onsiteSupport')}</li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>
          </div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What's Included</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Core Features</h3>
              <ul className="space-y-2">
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />AI-powered intervention recommendations</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />Professional PDF report generation</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />Email sharing and collaboration tools</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />20 support requests per teacher per month</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Security & Support</h3>
              <ul className="space-y-2">
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />Secure data storage and privacy protection</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />Regular feature updates and improvements</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" />Customer support and training resources</li>
              </ul>
            </div>

          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Student Support?</h2>
          <p className="text-xl text-purple-100 mb-8">Join thousands of educators using AI-powered tools to better support their students. Get a personalized quote for your school today.</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4">Get Your Quote</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-gray-400 mb-4">
            <Mail className="w-4 h-4 inline mr-2" />
            Questions? Email us at sales@remynd.online
          </p>
          <p className="text-gray-500 text-sm mb-2">© 2025 Concern2Care. Built for educators, by educators.</p>
          <p className="text-gray-600 text-sm">Powered by ReMynd Student Services</p>
        </div>
      </footer>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Users, Clock, Check, Mail, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.isAdmin) {
        window.location.replace('/admin');
      } else {
        window.location.replace('/home');
      }
    }
  }, [isLoading, isAuthenticated, user]);

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
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-green-200 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-pink-200 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-blue-200 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-32 right-1/3 w-20 h-20 bg-indigo-200 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  Welcome, {user?.firstName || user?.email?.split('@')[0]}
                </span>
                {user?.isAdmin ? (
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    size="sm"
                    variant="outline"
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    Admin
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/home'}
                    size="sm"
                    variant="outline"
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    Dashboard
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-red-600 px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/login'}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
              >
                {t('auth.teacherSignIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 sm:mb-8">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
            Concern2Care
          </h1>
          
          {/* Tagline */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-2 font-medium px-2">
            {t('landing.tagline')}
          </p>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="relative z-10 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              {t('landing.mainHeading')}
            </h2>
            
            <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 leading-relaxed px-2 max-w-3xl mx-auto">
              {t('landing.description')}
            </p>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-medium shadow-lg w-full sm:w-auto"
            >
              🔐 {t('landing.secureLogin')}
            </Button>
            
            <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 px-2">
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
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-2">{t('pricing.subtitle')}</p>
            <p className="text-sm sm:text-base text-gray-600">{t('pricing.description')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Standard Plan: 1-200 Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-purple-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">{t('pricing.popular')}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('pricing.standardPlan')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.standardRange')}</p>
              <div className="mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">$10<span className="text-base sm:text-lg text-gray-600">/teacher/month</span></div>
                <p className="text-sm sm:text-base text-gray-600">{t('pricing.annual')}</p>
                <p className="text-sm sm:text-base text-green-600 font-medium">{t('pricing.save10')}</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.aiRecommendations')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.supportRequests')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.pdfGeneration')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.emailSharing')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.prioritySupport')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.analytics')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.bulkManagement')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.training')}</span></li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>

            {/* Enterprise Plan: 200+ Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('pricing.enterprise')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.enterpriseRange')}</p>
              <div className="mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{t('pricing.custom')}</div>
                <p className="text-sm sm:text-base text-gray-600">{t('pricing.customPricing')}</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.everythingInStandard')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.accountManager')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.whiteLabel')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.apiAccess')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.customDevelopment')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.reporting')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.support24')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.onsiteSupport')}</span></li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>
          </div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('included.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('included.coreFeatures')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.aiRecommendations')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.pdfGeneration')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.emailSharing')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.supportRequests')}</span></li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('included.securitySupport')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.secureStorage')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.updates')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.customerSupport')}</span></li>
              </ul>
            </div>

          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-lg sm:text-xl text-purple-100 mb-6 sm:mb-8">{t('cta.subtitle')}</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto">{t('cta.getQuote')}</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            <Mail className="w-4 h-4 inline mr-2" />
{t('cta.questions')}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mb-2">{t('footer.copyright')}</p>
          <p className="text-gray-600 text-xs sm:text-sm">{t('footer.poweredBy')}</p>
        </div>
      </footer>
    </div>
  );
}
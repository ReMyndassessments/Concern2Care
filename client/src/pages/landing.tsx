import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <Button 
            onClick={() => window.location.href = '/login'}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-6 py-3"
          >
            Teacher Sign In
          </Button>
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
            A Teacher Tool for Differentiation and Classroom Interventions
          </p>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight px-2">
              Adapt Any Lesson. Support Every Learner.
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed px-2 max-w-3xl mx-auto">
              Trusted, AI-powered strategies for academic, behavioral, and social-emotional needs. Teachers get practical tools to adapt instruction in the moment. Administrators get stronger capacity, consistent support, and better outcomes for every student.
            </p>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg px-12 py-4 rounded-xl font-medium shadow-lg"
            >
              🔐 Secure Teacher Login
            </Button>
            
            <p className="text-sm text-gray-500 mt-6 px-2">
              FERPA compliant • Evidence-based strategies • Trusted by educators
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile Responsive */}
      <section className="relative z-10 py-12 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.instantAI', 'Instant AI Recommendations')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.instantAIDesc', 'Get research-based intervention strategies in seconds')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.documentation', 'Professional Documentation')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.documentationDesc', 'Generate comprehensive PDF reports for meetings')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.collaboration', 'Seamless Collaboration')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.collaborationDesc', 'Share support requests with your team effortlessly')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.saveTime', 'Save Time Daily')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.saveTimeDesc', 'Reduce documentation time by up to 75%')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile Responsive */}
      <section className="relative z-10 py-12 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-2">
              {t('pricing.title', 'Simple, Transparent Pricing')}
            </h2>
            <p className="text-xl md:text-2xl text-purple-600 font-semibold mb-4">
              {t('pricing.subtitle', 'Just $10 per teacher per month')}
            </p>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              {t('pricing.description', 'Empower your entire teaching staff with AI-powered student support tools. No hidden fees, no complicated tiers.')}
            </p>
          </div>

          {/* Pricing Tiers - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
            {/* Small School */}
            <Card className="relative border-2 border-gray-200 hover:border-purple-300 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">{t('pricing.smallSchool', 'Small School')}</CardTitle>
                <p className="text-sm text-gray-600">{t('pricing.smallSchoolRange', '1-20 Teachers')}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-purple-600">$10</span>
                  <span className="text-gray-600">{t('pricing.perTeacherMonth', '/teacher/month')}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('pricing.annual', 'Annual: $108/teacher/year')}<br />
                    <span className="text-green-600 font-medium">{t('pricing.save10', 'Save 10% annually')}</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.aiRecommendations', 'Full AI-powered recommendations')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.supportRequests', '20 support requests per teacher/month')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.pdfGeneration', 'PDF report generation')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.emailSharing', 'Email sharing capabilities')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.basicSupport', 'Basic onboarding support')}</li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted', 'Get Started')}</Button>
              </CardContent>
            </Card>

            {/* Medium School */}
            <Card className="relative border-2 border-blue-300 hover:border-blue-400 transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">{t('pricing.popular', 'Popular')}</span>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">{t('pricing.mediumSchool', 'Medium School')}</CardTitle>
                <p className="text-sm text-gray-600">{t('pricing.mediumSchoolRange', '21-50 Teachers')}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-blue-600">$10</span>
                  <span className="text-gray-600">{t('pricing.perTeacherMonth', '/teacher/month')}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('pricing.annual', 'Annual: $108/teacher/year')}<br />
                    <span className="text-green-600 font-medium">{t('pricing.save10', 'Save 10% annually')}</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.everythingInSmall', 'Everything in Small School')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />{t('pricing.features.prioritySupport', 'Priority customer support')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />{t('pricing.features.analytics', 'Advanced analytics dashboard')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />{t('pricing.features.bulkManagement', 'Bulk teacher management')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />{t('pricing.features.training', 'Custom training sessions')}</li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">{t('pricing.getStarted', 'Get Started')}</Button>
              </CardContent>
            </Card>

            {/* Large School */}
            <Card className="relative border-2 border-emerald-300 hover:border-emerald-400 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">{t('pricing.largeSchool', 'Large School')}</CardTitle>
                <p className="text-sm text-gray-600">{t('pricing.largeSchoolRange', '51-200 Teachers')}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-emerald-600">$10</span>
                  <span className="text-gray-600">{t('pricing.perTeacherMonth', '/teacher/month')}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('pricing.annual', 'Annual: $108/teacher/year')}<br />
                    <span className="text-green-600 font-medium">{t('pricing.save10', 'Save 10% annually')}</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.everythingInMedium', 'Everything in Medium School')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />{t('pricing.features.accountManager', 'Dedicated account manager')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />{t('pricing.features.integrations', 'Custom integrations')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />{t('pricing.features.reporting', 'Advanced reporting suite')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />{t('pricing.features.support24', '24/7 priority support')}</li>
                </ul>
                <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">{t('pricing.getStarted', 'Get Started')}</Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="relative border-2 border-gray-300 hover:border-gray-400 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">{t('pricing.enterprise', 'Enterprise')}</CardTitle>
                <p className="text-sm text-gray-600">{t('pricing.enterpriseRange', '200+ Teachers')}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-600">{t('pricing.custom', 'Custom')}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('pricing.customPricing', 'Annual: Custom pricing')}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />{t('pricing.features.everythingInLarge', 'Everything in Large School')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />{t('pricing.features.whiteLabel', 'White-label solutions')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />{t('pricing.features.apiAccess', 'API access')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />{t('pricing.features.customDevelopment', 'Custom feature development')}</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />{t('pricing.features.onsiteSupport', 'On-site training & support')}</li>
                </ul>
                <Button className="w-full mt-6 bg-gray-600 hover:bg-gray-700">{t('pricing.getStarted', 'Get Started')}</Button>
              </CardContent>
            </Card>
          </div>

          {/* Real School Examples */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">{t('pricing.realExamples', 'Real School Examples')}</h3>
            <p className="text-center text-gray-600 mb-8">{t('pricing.savingsDescription', 'See how much your school could save with annual billing')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <h4 className="text-xl font-bold mb-4">{t('pricing.examples.teachers25', '25 Teachers')}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.monthly', 'Monthly')}</p>
                    <p className="text-2xl font-bold text-gray-900">$250</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.annualLabel', 'Annual')}</p>
                    <p className="text-2xl font-bold text-green-600">$2,700</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">{t('pricing.annualSavings300', 'Annual Savings: $300')}</p>
                <p className="text-sm text-gray-600 mt-2">{t('pricing.supportRequests500', 'Monthly Support Requests: 500 total')}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h4 className="text-xl font-bold mb-4">{t('pricing.examples.teachers75', '75 Teachers')}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.monthly', 'Monthly')}</p>
                    <p className="text-2xl font-bold text-gray-900">$750</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.annualLabel', 'Annual')}</p>
                    <p className="text-2xl font-bold text-green-600">$8,100</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">{t('pricing.annualSavings900', 'Annual Savings: $900')}</p>
                <p className="text-sm text-gray-600 mt-2">{t('pricing.supportRequests1500', 'Monthly Support Requests: 1,500 total')}</p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <h4 className="text-xl font-bold mb-4">{t('pricing.examples.teachers150', '150 Teachers')}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.monthly', 'Monthly')}</p>
                    <p className="text-2xl font-bold text-gray-900">$1,500</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('pricing.annualLabel', 'Annual')}</p>
                    <p className="text-2xl font-bold text-green-600">$16,200</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">{t('pricing.annualSavings1800', 'Annual Savings: $1,800')}</p>
                <p className="text-sm text-gray-600 mt-2">{t('pricing.supportRequests3000', 'Monthly Support Requests: 3,000 total')}</p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  {t('pricing.whatsIncluded', 'What\'s Included')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.aiRecommendations', 'AI-powered intervention recommendations')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.pdfReports', 'Professional PDF report generation')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.emailSharing', 'Email sharing and collaboration tools')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.supportRequests', '20 support requests per teacher per month')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.secureStorage', 'Secure data storage and privacy protection')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.updates', 'Regular feature updates and improvements')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />{t('pricing.included.support', 'Customer support and training resources')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-6 h-6 text-blue-500 mr-2" />
                  {t('pricing.flexibleTerms', 'Flexible Terms')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.billing', 'Monthly or annual billing options')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.discount', '10% discount for annual subscriptions')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.addRemove', 'Add or remove teachers anytime')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.cancel', 'Cancel with 30-day notice')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.prorated', 'Prorated billing for mid-cycle changes')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.volume', 'Volume discounts for 100+ teachers')}</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />{t('pricing.terms.enterprise', 'Custom enterprise solutions available')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* ROI Comparison Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-200">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">{t('comparison.title', 'Why Schools Choose Concern2Care')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                {t('comparison.subtitle', 'Better outcomes, better value than other education technology solutions')}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowComparison(!showComparison)}
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 hover:from-purple-600 hover:to-blue-700 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
              >
                <BarChart3 className="w-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {showComparison ? t('comparison.hide', 'Hide') : t('comparison.view', 'View')} {t('comparison.roiComparison', 'ROI Comparison')}
              </Button>
            </div>

            {showComparison && (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 animate-in slide-in-from-top duration-300">
                {/* Mobile-First Responsive Comparison */}
                <div className="block sm:hidden space-y-4">
                  {/* Mobile Card Layout */}
                  <div className="grid gap-4">
                    {/* Per Student Cost */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('comparison.perStudentCost', 'Per Student Cost (Annual)')}</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.magicSchool', 'Magic School')}</div>
                          <div className="font-medium text-gray-600">$12.00</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.concern2care', 'Concern2Care')}</div>
                          <div className="font-semibold text-green-600">$4.80</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.betterTogether', 'Better Together')}</div>
                          <div className="font-semibold text-blue-600">$16.80</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Per Teacher Cost */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('comparison.perTeacherCost', 'Per Teacher Cost (Annual)')}</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.magicSchool', 'Magic School')}</div>
                          <div className="font-medium text-gray-600">$300</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.concern2care', 'Concern2Care')}</div>
                          <div className="font-semibold text-green-600">$120</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.betterTogether', 'Better Together')}</div>
                          <div className="font-semibold text-blue-600">$420</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pricing Model */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('comparison.pricingModel', 'Pricing Model')}</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.magicSchool', 'Magic School')}</div>
                          <div className="font-medium text-gray-600">{t('comparison.enrollmentBased', 'Enrollment-based')}</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.concern2care', 'Concern2Care')}</div>
                          <div className="font-semibold text-green-600">{t('comparison.staffBased', 'Staff-based')}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.betterTogether', 'Better Together')}</div>
                          <div className="font-semibold text-blue-600">{t('comparison.balanced', 'Balanced')}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Predictability */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('comparison.predictability', 'Predictability')}</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.magicSchool', 'Magic School')}</div>
                          <div className="font-medium text-gray-600">{t('comparison.medium', 'Medium')}</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.concern2care', 'Concern2Care')}</div>
                          <div className="font-semibold text-green-600">{t('comparison.high', 'High')}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.betterTogether', 'Better Together')}</div>
                          <div className="font-semibold text-blue-600">{t('comparison.mediumHigh', 'Medium-High')}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary Benefit */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('comparison.primaryBenefit', 'Primary Benefit')}</h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.magicSchool', 'Magic School')}</div>
                          <div className="font-medium text-gray-600">{t('comparison.teacherEfficiency', 'Teacher efficiency')}</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.concern2care', 'Concern2Care')}</div>
                          <div className="font-semibold text-green-600">{t('comparison.studentWellbeing', 'Student wellbeing & retention')}</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">{t('comparison.betterTogether', 'Better Together')}</div>
                          <div className="font-semibold text-blue-600">{t('comparison.completeImpact', 'Complete staff + student impact')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border-collapse bg-gray-50 rounded-lg">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                        <th className="px-3 py-3 text-left font-semibold rounded-tl-lg text-sm">{t('comparison.metric', 'Metric')}</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">{t('comparison.magicSchool', 'Magic School')}</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">{t('comparison.concern2care', 'Concern2Care')}</th>
                        <th className="px-3 py-3 text-center font-semibold rounded-tr-lg text-sm">{t('comparison.betterTogether', 'Better Together')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-3 font-medium">{t('comparison.perStudentCost', 'Per Student Cost (Annual)')}</td>
                        <td className="px-3 py-3 text-center text-gray-600">$12.00</td>
                        <td className="px-3 py-3 text-center text-green-600 font-semibold">$4.80</td>
                        <td className="px-3 py-3 text-center text-blue-600 font-semibold">$16.80</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-white">
                        <td className="px-3 py-3 font-medium">{t('comparison.perTeacherCost', 'Per Teacher Cost (Annual)')}</td>
                        <td className="px-3 py-3 text-center text-gray-600">$300</td>
                        <td className="px-3 py-3 text-center text-green-600 font-semibold">$120</td>
                        <td className="px-3 py-3 text-center text-blue-600 font-semibold">$420</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-3 font-medium">{t('comparison.pricingModel', 'Pricing Model')}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{t('comparison.enrollmentBased', 'Enrollment-based')}</td>
                        <td className="px-3 py-3 text-center text-green-600">{t('comparison.staffBased', 'Staff-based')}</td>
                        <td className="px-3 py-3 text-center text-blue-600">{t('comparison.balanced', 'Balanced')}</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-white">
                        <td className="px-3 py-3 font-medium">{t('comparison.predictability', 'Predictability')}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{t('comparison.medium', 'Medium')}</td>
                        <td className="px-3 py-3 text-center text-green-600">{t('comparison.high', 'High')}</td>
                        <td className="px-3 py-3 text-center text-blue-600">{t('comparison.mediumHigh', 'Medium-High')}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3 font-medium">{t('comparison.primaryBenefit', 'Primary Benefit')}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{t('comparison.teacherEfficiency', 'Teacher efficiency')}</td>
                        <td className="px-3 py-3 text-center text-green-600">{t('comparison.studentWellbeing', 'Student wellbeing & retention')}</td>
                        <td className="px-3 py-3 text-center text-blue-600">{t('comparison.completeImpact', 'Complete staff + student impact')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ROI Example - Three Scenarios */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-700 text-base">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {t('comparison.magicSchoolOnly', 'Magic School Only')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{t('comparison.annualCost1200', 'Annual Cost (1,200 students):')}</span>
                          <span className="font-semibold">$14,400</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.studentRetentionImpact', 'Student Retention Impact:')}</span>
                          <span className="text-gray-500">{t('comparison.notImpacted', 'Not impacted')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.teacherEfficiencyLabel', 'Teacher Efficiency:')}</span>
                          <span className="font-semibold text-gray-600">{t('comparison.strong', 'Strong')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">{t('comparison.netRoi', 'Net ROI:')}</span>
                          <span className="font-bold text-gray-600">{t('comparison.low', 'Low')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-green-700 text-base">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {t('comparison.concern2careOnly', 'Concern2Care Only')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{t('comparison.annualCost50', 'Annual Cost (50 teachers):')}</span>
                          <span className="font-semibold text-green-600">$6,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.if5Students', 'If 5 students retained:')}</span>
                          <span className="font-semibold text-green-600">$50,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.counselorCaseload', 'Counselor Caseload:')}</span>
                          <span className="font-semibold text-green-600">{t('comparison.reduction1015', '10-15% reduction')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">{t('comparison.netRoi', 'Net ROI:')}</span>
                          <span className="font-bold text-green-600">{t('comparison.return10x', '≈ 10× Return')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50 ring-2 ring-blue-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-700 text-base">
                        <Star className="w-4 h-4 mr-2" />
                        {t('comparison.betterTogether', 'Better Together')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{t('comparison.combinedAnnualCost', 'Combined Annual Cost:')}</span>
                          <span className="font-semibold text-blue-600">$20,160</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.studentRetentionValue', 'Student Retention Value:')}</span>
                          <span className="font-semibold text-blue-600">$50,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('comparison.completeCoverage', 'Complete Coverage:')}</span>
                          <span className="font-semibold text-blue-600">{t('comparison.staffStudents', 'Staff + Students')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">{t('comparison.netRoi', 'Net ROI:')}</span>
                          <span className="font-bold text-blue-600">{t('comparison.return78x', '≈ 7-8× Return')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Value Beyond Cost */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4">{t('comparison.valueBeyondCost', 'Value Beyond Cost Savings')}</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-green-700 mb-3">{t('comparison.concern2careImpact', '✅ Concern2Care Impact')}</h5>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>{t('comparison.impact.researchBased', '• Research-based Tier 2 intervention strategies')}</li>
                        <li>{t('comparison.impact.reducesCaseloads', '• Reduces counselor caseloads & prevents burnout')}</li>
                        <li>{t('comparison.impact.improvesRetention', '• Improves student retention & graduation rates')}</li>
                        <li>{t('comparison.impact.comprehensive', '• Comprehensive: academic, behavioral, social-emotional')}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-600 mb-3">{t('comparison.magicSchoolScope', '📝 Magic School Scope')}</h5>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>{t('comparison.scope.productivity', '• Teacher productivity tools')}</li>
                        <li>{t('comparison.scope.lessonPlanning', '• Lesson planning & grading assistance')}</li>
                        <li>{t('comparison.scope.limitedSupport', '• Limited student support capabilities')}</li>
                        <li>{t('comparison.scope.noIntervention', '• Does not address Tier 2/3 intervention needs')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Better Together Highlight */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <h4 className="font-semibold mb-4 text-center">{t('comparison.betterTogetherEcosystem', '🤝 Better Together: Complete AI Ecosystem')}</h4>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="font-semibold">{t('comparison.magicSchoolAlone', 'Magic School Alone')}</div>
                      <div className="text-sm text-blue-100">{t('comparison.magicSchoolDesc', 'Great for teacher productivity, but doesn\'t impact student outcomes or retention')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{t('comparison.concern2careAlone', 'Concern2Care Alone')}</div>
                      <div className="text-sm text-blue-100">{t('comparison.concern2careDesc', 'Lower cost, high systemic ROI via retention, SEL, and reduced counselor burnout')}</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-lg p-3">
                      <div className="font-semibold text-yellow-200">{t('comparison.bothTogether', 'Both Together')}</div>
                      <div className="text-sm text-blue-100">{t('comparison.bothDesc', 'Complete coverage: teacher efficiency + student wellbeing for under $17/student/year')}</div>
                    </div>
                  </div>
                  <div className="text-center border-t border-white/20 pt-4">
                    <h5 className="font-semibold mb-2">{t('comparison.leadershipPitch', 'Leadership Pitch')}</h5>
                    <p className="text-blue-100">
                      {t('comparison.leadershipDesc', 'For under $17 per student per year, you can cover both teacher efficiency AND student wellbeing. That\'s a complete AI ecosystem supporting staff and students — without breaking your budget.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">{t('cta.title', 'Ready to Transform Student Support?')}</h3>
            <p className="text-xl mb-6 opacity-90">
              {t('cta.subtitle', 'Join thousands of educators using AI-powered tools to better support their students. Get a personalized quote for your school today.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3"
                onClick={() => window.location.href = 'mailto:sales@remynd.online?subject=Concern2Care Quote Request'}
              >
                {t('cta.getQuote', 'Get Your Quote')}
              </Button>
              <div className="flex items-center text-white/90">
                <Mail className="w-5 h-5 mr-2" />
                <span>{t('cta.questions', 'Questions? Email us at sales@remynd.online')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            {t('footer.copyright', '© 2025 Concern2Care. Built for educators, by educators.')}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t('footer.poweredBy', 'Powered by ReMynd Student Services')}
          </p>
        </div>
      </footer>
    </div>
  );
}

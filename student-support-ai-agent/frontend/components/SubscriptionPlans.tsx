import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Sparkles, Mail, AlertTriangle, Shield, Users, Copy, CheckCircle, Check, ArrowRight, Calculator, CreditCard, Clock, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function SubscriptionPlans() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(text);
      setTimeout(() => setCopiedEmail(null), 2000);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: `Please manually copy: ${text}`,
        variant: "destructive"
      });
    }
  };

  const handleEmailContact = () => {
    const email = 'sales@remynd.online';
    const subject = 'School-Wide Subscription Inquiry - Concern2Care';
    const body = `Hello,

I'm interested in a school-wide subscription for Concern2Care. Please contact me with:

- A quote for [NUMBER_OF_TEACHERS] teachers
- Onboarding and training options
- Payment methods

Thank you!`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Opening Email Client",
        description: "Your email client should open with a pre-filled message."
      });
      
      setTimeout(() => setIsContactDialogOpen(false), 1000);
      
    } catch (error) {
      console.error('Error opening email client:', error);
      toast({
        title: "Email Client Error",
        description: "Please use the copy button to get the email address.",
        variant: "destructive"
      });
    }
  };

  const pricingTiers = [
    {
      name: "Small School",
      range: "1-20 Teachers",
      monthlyRate: "$10",
      annualRate: "$108",
      savings: "10%",
      features: [
        "Full AI-powered recommendations",
        "20 support requests per teacher/month",
        "PDF report generation",
        "Email sharing capabilities",
        "Basic onboarding support"
      ],
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      name: "Medium School",
      range: "21-50 Teachers",
      monthlyRate: "$10",
      annualRate: "$108",
      savings: "10%",
      features: [
        "Everything in Small School",
        "Priority customer support",
        "Advanced analytics dashboard",
        "Bulk teacher management",
        "Custom training sessions"
      ],
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      name: "Large School",
      range: "51-200 Teachers",
      monthlyRate: "$10",
      annualRate: "$108",
      savings: "10%",
      features: [
        "Everything in Medium School",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced reporting suite",
        "24/7 priority support"
      ],
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50"
    },
    {
      name: "Enterprise",
      range: "200+ Teachers",
      monthlyRate: "Custom",
      annualRate: "Custom",
      savings: "Contact Us",
      features: [
        "Everything in Large School",
        "White-label solutions",
        "API access",
        "Custom feature development",
        "On-site training & support"
      ],
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    }
  ];

  const sampleCalculations = [
    {
      teachers: 25,
      monthly: 250,
      annual: 2700,
      requests: 500,
      savings: 300,
      icon: Calculator,
      color: "blue"
    },
    {
      teachers: 75,
      monthly: 750,
      annual: 8100,
      requests: 1500,
      savings: 900,
      icon: Users,
      color: "purple"
    },
    {
      teachers: 150,
      monthly: 1500,
      annual: 16200,
      requests: 3000,
      savings: 1800,
      icon: GraduationCap,
      color: "emerald"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Instant AI Recommendations",
      description: "Get research-based intervention strategies in seconds",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Professional Documentation",
      description: "Generate comprehensive PDF reports for meetings",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Seamless Collaboration",
      description: "Share support requests with your team effortlessly",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Clock,
      title: "Save Time Daily",
      description: "Reduce documentation time by up to 75%",
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 relative">
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl shadow-2xl mb-4 sm:mb-6 transform hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-2 font-medium">
              Just $10 per teacher per month
            </p>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Empower your entire teaching staff with AI-powered student support tools. No hidden fees, no complicated tiers.
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${benefit.gradient} rounded-xl shadow-lg mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing Tiers */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Choose Your School Size
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Same great price per teacher, with additional features as your school grows
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`border-0 bg-gradient-to-br ${tier.bgGradient} shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 relative`}>
                <CardHeader className={`bg-gradient-to-r ${tier.gradient} text-white rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6`}>
                  <CardTitle className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-sm opacity-90">{tier.range}</p>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center mb-6">
                    <div className="mb-3">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">{tier.monthlyRate}</span>
                      {tier.monthlyRate !== "Custom" && <span className="text-gray-600 text-sm">/teacher/month</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      Annual: <span className="font-semibold">{tier.annualRate}</span>
                      {tier.annualRate !== "Custom" && <span>/teacher/year</span>}
                    </div>
                    {tier.savings !== "Contact Us" && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        Save {tier.savings} annually
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => setIsContactDialogOpen(true)}
                    className={`w-full bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white shadow-lg rounded-xl py-3 font-semibold transition-all duration-200 transform hover:scale-105`}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sample Calculations */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Real School Examples
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              See how much your school could save with annual billing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {sampleCalculations.map((calc, index) => {
              const Icon = calc.icon;
              const colorClasses = {
                blue: { gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", text: "text-blue-700" },
                purple: { gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", text: "text-purple-700" },
                emerald: { gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-50 to-teal-50", text: "text-emerald-700" }
              }[calc.color];

              return (
                <Card key={index} className={`border-0 bg-gradient-to-br ${colorClasses.bg} shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                  <CardHeader className={`bg-gradient-to-r ${colorClasses.gradient} text-white rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6`}>
                    <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      {calc.teachers} Teachers
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Monthly</div>
                        <div className="text-lg font-bold text-gray-900">${calc.monthly.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Annual</div>
                        <div className="text-lg font-bold text-gray-900">${calc.annual.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500 mb-1">Annual Savings</div>
                      <div className={`text-lg font-bold ${colorClasses.text}`}>
                        ${calc.savings.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Monthly Support Requests</div>
                      <div className="text-sm font-semibold text-gray-700">
                        {calc.requests.toLocaleString()} total
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-2xl sm:rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-3">
                {[
                  "AI-powered intervention recommendations",
                  "Professional PDF report generation",
                  "Email sharing and collaboration tools",
                  "20 support requests per teacher per month",
                  "Secure data storage and privacy protection",
                  "Regular feature updates and improvements",
                  "Customer support and training resources"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-2xl sm:rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                Flexible Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-3">
                {[
                  "Monthly or annual billing options",
                  "10% discount for annual subscriptions",
                  "Add or remove teachers anytime",
                  "Cancel with 30-day notice",
                  "Prorated billing for mid-cycle changes",
                  "Volume discounts for 100+ teachers",
                  "Custom enterprise solutions available"
                ].map((term, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{term}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Ready to Transform Student Support?
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                  Join thousands of educators using AI-powered tools to better support their students. Get a personalized quote for your school today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl rounded-xl sm:rounded-2xl py-4 sm:py-6 px-6 sm:px-8 text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
                        <Mail className="mr-2 h-5 w-5" />
                        Get Your Quote
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl mx-4">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                          Contact Sales
                        </DialogTitle>
                        <DialogDescription>
                          Get in touch for a school-wide subscription quote.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-900">Sales Email:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard('sales@remynd.online', 'Sales email')}
                              className="h-8 px-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              {copiedEmail === 'sales@remynd.online' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <p className="text-blue-800 font-mono text-sm">sales@remynd.online</p>
                        </div>
                      </div>
                      <DialogFooter className="pt-4">
                        <div className="grid grid-cols-1 gap-4 w-full">
                          <Button
                            onClick={handleEmailContact}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Open Email Client
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            If your email client doesn't open, use the copy button above.
                          </p>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-600">
                      Questions? Email us at{' '}
                      <button 
                        onClick={() => copyToClipboard('sales@remynd.online', 'Sales email')}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        sales@remynd.online
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

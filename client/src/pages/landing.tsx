import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText, Users, Clock, Shield, CheckCircle, Star, Mail } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Floating Geometric Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full opacity-60"></div>
        <div className="absolute top-32 right-1/3 w-16 h-16 bg-emerald-200 rounded-full opacity-70"></div>
        <div className="absolute top-48 right-1/4 w-20 h-20 bg-pink-200 rounded-full opacity-60"></div>
        <div className="absolute bottom-1/3 left-1/5 w-18 h-18 bg-blue-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/5 w-14 h-14 bg-purple-200 rounded-full opacity-60"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold"
          >
            Teacher Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-8">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Concern2Care
          </h1>
          
          {/* Tagline */}
          <p className="text-2xl text-gray-700 mb-2 font-medium">
            Stronger Tools for Teachers. Smarter Support for Students.
          </p>
          
          {/* Attribution */}
          <p className="text-sm text-gray-500 mb-16">
            from Remynd
          </p>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
              Get instant AI-powered strategies for academic,<br />
              behavioral, and social-emotional needs
            </h2>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg px-12 py-4 rounded-xl font-medium shadow-lg"
            >
              🔐 Secure Teacher Login
            </Button>
            
            <p className="text-sm text-gray-500 mt-6">
              FERPA compliant • Evidence-based strategies • Trusted by educators
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant AI Recommendations</h3>
              <p className="text-gray-600">
                Get research-based intervention strategies in seconds
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Documentation</h3>
              <p className="text-gray-600">
                Generate comprehensive PDF reports for meetings
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless Collaboration</h3>
              <p className="text-gray-600">
                Share support requests with your team effortlessly
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save Time Daily</h3>
              <p className="text-gray-600">
                Reduce documentation time by up to 75%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-2xl text-purple-600 font-semibold mb-4">
              Just $10 per teacher per month
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Empower your entire teaching staff with AI-powered student support tools. No hidden fees, no complicated tiers.
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Small School */}
            <Card className="relative border-2 border-gray-200 hover:border-purple-300 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">Small School</CardTitle>
                <p className="text-sm text-gray-600">1-20 Teachers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-purple-600">$10</span>
                  <span className="text-gray-600">/teacher/month</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Annual: $108/teacher/year<br />
                    <span className="text-green-600 font-medium">Save 10% annually</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Full AI-powered recommendations</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />20 support requests per teacher/month</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />PDF report generation</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Email sharing capabilities</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Basic onboarding support</li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">Get Started</Button>
              </CardContent>
            </Card>

            {/* Medium School */}
            <Card className="relative border-2 border-blue-300 hover:border-blue-400 transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Popular</span>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">Medium School</CardTitle>
                <p className="text-sm text-gray-600">21-50 Teachers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-blue-600">$10</span>
                  <span className="text-gray-600">/teacher/month</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Annual: $108/teacher/year<br />
                    <span className="text-green-600 font-medium">Save 10% annually</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Everything in Small School</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />Priority customer support</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />Advanced analytics dashboard</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />Bulk teacher management</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-blue-500 mr-2" />Custom training sessions</li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </CardContent>
            </Card>

            {/* Large School */}
            <Card className="relative border-2 border-emerald-300 hover:border-emerald-400 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">Large School</CardTitle>
                <p className="text-sm text-gray-600">51-200 Teachers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-emerald-600">$10</span>
                  <span className="text-gray-600">/teacher/month</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Annual: $108/teacher/year<br />
                    <span className="text-green-600 font-medium">Save 10% annually</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Everything in Medium School</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />Dedicated account manager</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />Custom integrations</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />Advanced reporting suite</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-emerald-500 mr-2" />24/7 priority support</li>
                </ul>
                <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="relative border-2 border-gray-300 hover:border-gray-400 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">Enterprise</CardTitle>
                <p className="text-sm text-gray-600">200+ Teachers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-600">Custom</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Annual: Custom pricing
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Everything in Large School</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />White-label solutions</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />API access</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />Custom feature development</li>
                  <li className="flex items-center"><Star className="w-4 h-4 text-gray-500 mr-2" />On-site training & support</li>
                </ul>
                <Button className="w-full mt-6 bg-gray-600 hover:bg-gray-700">Get Started</Button>
              </CardContent>
            </Card>
          </div>

          {/* Real School Examples */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Real School Examples</h3>
            <p className="text-center text-gray-600 mb-8">See how much your school could save with annual billing</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <h4 className="text-xl font-bold mb-4">25 Teachers</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900">$250</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual</p>
                    <p className="text-2xl font-bold text-green-600">$2,700</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">Annual Savings: $300</p>
                <p className="text-sm text-gray-600 mt-2">Monthly Support Requests: 500 total</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h4 className="text-xl font-bold mb-4">75 Teachers</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900">$750</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual</p>
                    <p className="text-2xl font-bold text-green-600">$8,100</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">Annual Savings: $900</p>
                <p className="text-sm text-gray-600 mt-2">Monthly Support Requests: 1,500 total</p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <h4 className="text-xl font-bold mb-4">150 Teachers</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900">$1,500</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual</p>
                    <p className="text-2xl font-bold text-green-600">$16,200</p>
                  </div>
                </div>
                <p className="text-green-600 font-semibold">Annual Savings: $1,800</p>
                <p className="text-sm text-gray-600 mt-2">Monthly Support Requests: 3,000 total</p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />AI-powered intervention recommendations</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />Professional PDF report generation</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />Email sharing and collaboration tools</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />20 support requests per teacher per month</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />Secure data storage and privacy protection</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />Regular feature updates and improvements</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-3" />Customer support and training resources</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-6 h-6 text-blue-500 mr-2" />
                  Flexible Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Monthly or annual billing options</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />10% discount for annual subscriptions</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Add or remove teachers anytime</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Cancel with 30-day notice</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Prorated billing for mid-cycle changes</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Volume discounts for 100+ teachers</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-500 mr-3" />Custom enterprise solutions available</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Student Support?</h3>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of educators using AI-powered tools to better support their students. Get a personalized quote for your school today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3"
                onClick={() => window.location.href = 'mailto:sales@remynd.online?subject=Concern2Care Quote Request'}
              >
                Get Your Quote
              </Button>
              <div className="flex items-center text-white/90">
                <Mail className="w-5 h-5 mr-2" />
                <span>Questions? Email us at sales@remynd.online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2025 Concern2Care. Built for educators, by educators.
          </p>
        </div>
      </footer>
    </div>
  );
}

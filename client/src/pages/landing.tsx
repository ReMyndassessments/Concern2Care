import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, FileText, Share, Clock, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Concern2Care</h1>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-brand-blue hover:bg-brand-dark-blue"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue rounded-2xl mb-6">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transform Student Support with AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Concern2Care helps K-12 teachers document student concerns and instantly receive 
              evidence-based intervention strategies, reducing documentation time while improving student outcomes.
            </p>
          </div>

          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-brand-dark-blue text-lg px-8 py-3"
          >
            Get Started Today
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Trusted by educators nationwide • FERPA compliant • Evidence-based strategies
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Student Support
            </h3>
            <p className="text-lg text-gray-600">
              Streamline your intervention process with powerful, easy-to-use tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-brand-blue" />
                </div>
                <CardTitle>Quick Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Structured forms make it easy to document student concerns with 
                  first name + last initial only for FERPA compliance.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-green" />
                </div>
                <CardTitle>AI-Powered Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get 3-5 evidence-based Tier 2 intervention strategies in under 3 seconds, 
                  tailored to your specific concern.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-amber/10 rounded-lg flex items-center justify-center mb-4">
                  <Share className="h-6 w-6 text-brand-amber" />
                </div>
                <CardTitle>Easy Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generate professional PDF reports and share them securely with 
                  counselors, psychologists, and other support staff.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-brand-blue" />
                </div>
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Reduce documentation time from hours to minutes while maintaining 
                  professional quality and evidence-based recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-brand-green" />
                </div>
                <CardTitle>FERPA Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Built with student privacy in mind. All data is encrypted and 
                  anonymized with only first name + last initial stored.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-amber/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-brand-amber" />
                </div>
                <CardTitle>Professional Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generate branded PDF reports with all concern details, interventions, 
                  and follow-up questions for your records.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Student Support Process?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of educators who are saving time and improving student outcomes with Concern2Care.
          </p>
          
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-brand-blue hover:bg-gray-50 text-lg px-8 py-3"
          >
            Start Free Trial
          </Button>
          
          <p className="text-blue-200 text-sm mt-4">
            $10/month per teacher • 20 support requests included • No setup fees
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Concern2Care</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2025 Concern2Care. All rights reserved. Built for educators, by educators.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Heart, FileText, Users, Share2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Concern2Care</h1>
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
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue rounded-3xl mb-8">
            <Heart className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Student<br />Support for K-12 Teachers
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Document student concerns and instantly receive evidence-based intervention strategies. 
            Reduce paperwork, improve outcomes.
          </p>

          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-brand-dark-blue text-lg px-10 py-4 rounded-xl"
          >
            Start Free Today
          </Button>

          <p className="text-sm text-gray-500 mt-6">
            Trusted by educators • FERPA compliant • Evidence-based strategies
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for student support
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools designed specifically for K-12 educators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Documentation</h3>
              <p className="text-gray-600">
                Structured forms make documenting student concerns fast and FERPA-compliant with 
                just first name + last initial.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-brand-green" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Intervention Strategies</h3>
              <p className="text-gray-600">
                Get 3-5 evidence-based Tier 2 intervention recommendations in under 3 seconds, 
                tailored to your specific concern.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-brand-amber/10 rounded-2xl flex items-center justify-center mb-6">
                <Share2 className="h-7 w-7 text-brand-amber" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Collaboration</h3>
              <p className="text-gray-600">
                Generate professional PDF reports and share them securely with counselors, 
                psychologists, and support staff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your student support process?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join educators who are saving time and improving student outcomes.
          </p>
          
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-brand-blue hover:bg-gray-50 text-lg px-10 py-4 rounded-xl"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Concern2Care</span>
          </div>
          <p className="text-gray-600">
            © 2025 Concern2Care. Built for educators, by educators.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-brand-dark-blue"
          >
            Sign In
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
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg px-12 py-4 rounded-xl font-medium"
            >
              Get Started Free
            </Button>
            
            <p className="text-sm text-gray-500 mt-6">
              FERPA compliant • Evidence-based strategies • Trusted by educators
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-purple-500 rounded-lg"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Documentation</h3>
              <p className="text-gray-600">
                Document student concerns in minutes with structured, FERPA-compliant forms.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Receive evidence-based Tier 2 intervention strategies in under 3 seconds.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Sharing</h3>
              <p className="text-gray-600">
                Generate professional reports to share with counselors and support staff.
              </p>
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

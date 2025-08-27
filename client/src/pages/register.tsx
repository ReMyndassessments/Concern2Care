import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Coffee, CheckCircle, ArrowLeft, Mail, User, Shield, Heart } from "lucide-react";
import { useLocation } from "wouter";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [primaryGrade, setPrimaryGrade] = useState("");
  const [primarySubject, setPrimarySubject] = useState("");
  const [teacherType, setTeacherType] = useState("Classroom Teacher");
  const [supportRequestsLimit, setSupportRequestsLimit] = useState(20);
  const [, setLocation] = useLocation();

  const handleBuyMeACoffeeSubscription = () => {
    // This would normally redirect to Buy Me a Coffee subscription page
    // For now, we'll show what the integration would look like
    window.open('https://www.buymeacoffee.com/concern2care/membership', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardHeader className="text-center pb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Individual Teacher Subscription
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Join Concern2Care for $10/month/teacher
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Benefits Section */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                What You Get
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">AI-Generated Differentiation Strategies</p>
                    <p className="text-sm text-gray-600">Get personalized teaching adjustments for student needs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">AI-Generated Tier 2 Interventions</p>
                    <p className="text-sm text-gray-600">Evidence-based intervention strategies for student concerns</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">PDF Report Generation</p>
                    <p className="text-sm text-gray-600">Professional documentation for meetings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Email Report Sharing</p>
                    <p className="text-sm text-gray-600">Send reports directly to student support or when necessary</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Follow-up Questions</p>
                    <p className="text-sm text-gray-600">Ask AI for clarification on strategies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Information Form - Matches Admin Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Teacher Information</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="mt-1"
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="mt-1"
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="mt-1"
                    required
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="mt-1"
                    required
                    data-testid="input-password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="school">School *</Label>
                  <Input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Enter school name"
                    className="mt-1"
                    required
                    data-testid="input-school"
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolDistrict">School District</Label>
                  <Input
                    id="schoolDistrict"
                    type="text"
                    value={schoolDistrict}
                    onChange={(e) => setSchoolDistrict(e.target.value)}
                    placeholder="Enter school district (optional for private/standalone schools)"
                    className="mt-1"
                    data-testid="input-school-district"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryGrade">Primary Grade *</Label>
                    <Input
                      id="primaryGrade"
                      type="text"
                      value={primaryGrade}
                      onChange={(e) => setPrimaryGrade(e.target.value)}
                      placeholder="e.g., 3rd Grade, K-5"
                      className="mt-1"
                      required
                      data-testid="input-primary-grade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primarySubject">Primary Subject *</Label>
                    <Input
                      id="primarySubject"
                      type="text"
                      value={primarySubject}
                      onChange={(e) => setPrimarySubject(e.target.value)}
                      placeholder="e.g., Mathematics, ELA"
                      className="mt-1"
                      required
                      data-testid="input-primary-subject"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacherType">Teacher Type *</Label>
                    <select
                      id="teacherType"
                      value={teacherType}
                      onChange={(e) => setTeacherType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                      required
                      data-testid="select-teacher-type"
                    >
                      <option value="Classroom Teacher">Classroom Teacher</option>
                      <option value="Special Education Teacher">Special Education Teacher</option>
                      <option value="ESL Teacher">ESL Teacher</option>
                      <option value="Reading Specialist">Reading Specialist</option>
                      <option value="Math Specialist">Math Specialist</option>
                      <option value="Counselor">Counselor</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="requestLimit">Request Limit</Label>
                    <Input
                      id="requestLimit"
                      type="number"
                      min="1"
                      value={supportRequestsLimit}
                      onChange={(e) => setSupportRequestsLimit(parseInt(e.target.value) || 20)}
                      className="mt-1"
                      data-testid="input-request-limit"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Button */}
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Coffee className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-semibold text-orange-800">$10/month</span>
                </div>
                <p className="text-sm text-gray-600">
                  Cancel anytime • FERPA compliant • Secure payment
                </p>
              </div>
              
              <Button
                onClick={handleBuyMeACoffeeSubscription}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 text-lg shadow-lg"
                data-testid="button-subscribe"
              >
                <Coffee className="h-6 w-6 mr-3" />
                Subscribe with Buy Me a Coffee
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>🔒 All student data is kept confidential and secure</span>
              </div>
              <p className="text-xs text-gray-500">
                FERPA compliant • Individual teacher subscription • No school admin required
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Back Navigation */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-gray-600 hover:text-purple-600 text-sm bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation('/login')}
            className="text-gray-600 hover:text-purple-600 text-sm bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2"
            data-testid="button-back-login"
          >
            Already have an account? Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
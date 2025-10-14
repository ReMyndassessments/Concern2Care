import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Coffee, CheckCircle, ArrowLeft, Mail, User, Shield, Heart, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/language-switcher";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [primaryGrade, setPrimaryGrade] = useState("");
  const [primarySubject, setPrimarySubject] = useState("");
  const [teacherType, setTeacherType] = useState("Classroom Teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const handleRegistrationAndPayment = async () => {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !school || !primaryGrade || !primarySubject) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit registration to backend
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          firstName,
          lastName,
          email,
          password,
          school,
          schoolDistrict,
          primaryGrade,
          primarySubject,
          teacherType,
        },
      });

      // Show success message
      toast({
        title: "Registration Submitted!",
        description: "Please complete payment to activate your account. You'll be redirected to Buy Me a Coffee.",
      });

      // Wait a moment for user to see the message
      setTimeout(() => {
        // Open Buy Me a Coffee payment page
        window.open('https://buymeacoffee.com/remyndtimetrack/e/467997', '_blank');
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
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
              {t('register.title')}
            </CardTitle>
            <p className="text-gray-600 text-lg">
              {t('register.subtitle')}
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Benefits Section */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                {t('register.whatYouGet')}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{t('register.aiDifferentiation')}</p>
                    <p className="text-sm text-gray-600">{t('register.aiDifferentiationDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{t('register.aiBehaviorSupport')}</p>
                    <p className="text-sm text-gray-600">{t('register.aiBehaviorSupportDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{t('register.pdfReports')}</p>
                    <p className="text-sm text-gray-600">{t('register.pdfReportsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{t('register.emailSharing')}</p>
                    <p className="text-sm text-gray-600">{t('register.emailSharingDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{t('register.followUp')}</p>
                    <p className="text-sm text-gray-600">{t('register.followUpDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Information Form - Matches Admin Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('register.teacherInfo')}</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('register.firstName')}</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('register.firstNamePlaceholder')}
                      className="mt-1"
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('register.lastName')}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('register.lastNamePlaceholder')}
                      className="mt-1"
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">{t('register.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('register.emailPlaceholder')}
                    className="mt-1"
                    required
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">{t('register.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('register.passwordPlaceholder')}
                    className="mt-1"
                    required
                    data-testid="input-password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="school">{t('register.school')}</Label>
                  <Input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder={t('register.schoolPlaceholder')}
                    className="mt-1"
                    required
                    data-testid="input-school"
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolDistrict">{t('register.schoolDistrict')}</Label>
                  <Input
                    id="schoolDistrict"
                    type="text"
                    value={schoolDistrict}
                    onChange={(e) => setSchoolDistrict(e.target.value)}
                    placeholder={t('register.schoolDistrictPlaceholder')}
                    className="mt-1"
                    data-testid="input-school-district"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryGrade">{t('register.primaryGrade')}</Label>
                    <Input
                      id="primaryGrade"
                      type="text"
                      value={primaryGrade}
                      onChange={(e) => setPrimaryGrade(e.target.value)}
                      placeholder={t('register.primaryGradePlaceholder')}
                      className="mt-1"
                      required
                      data-testid="input-primary-grade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primarySubject">{t('register.primarySubject')}</Label>
                    <Input
                      id="primarySubject"
                      type="text"
                      value={primarySubject}
                      onChange={(e) => setPrimarySubject(e.target.value)}
                      placeholder={t('register.primarySubjectPlaceholder')}
                      className="mt-1"
                      required
                      data-testid="input-primary-subject"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="teacherType">{t('register.teacherType')}</Label>
                  <select
                    id="teacherType"
                    value={teacherType}
                    onChange={(e) => setTeacherType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                    required
                    data-testid="select-teacher-type"
                  >
                    <option value="Classroom Teacher">{t('register.teacherTypeClassroom')}</option>
                    <option value="Special Education Teacher">{t('register.teacherTypeSpecialEd')}</option>
                    <option value="ESL Teacher">{t('register.teacherTypeESL')}</option>
                    <option value="Reading Specialist">{t('register.teacherTypeReadingSpecialist')}</option>
                    <option value="Math Specialist">{t('register.teacherTypeMathSpecialist')}</option>
                    <option value="Counselor">{t('register.teacherTypeCounselor')}</option>
                    <option value="Administrator">{t('register.teacherTypeAdministrator')}</option>
                    <option value="Other">{t('register.teacherTypeOther')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subscription Button */}
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Coffee className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-semibold text-orange-800">{t('register.pricePerMonth')}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {t('register.subscriptionDetails')}
                </p>
              </div>
              
              <Button
                onClick={handleRegistrationAndPayment}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 text-lg shadow-lg disabled:opacity-50"
                data-testid="button-subscribe"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coffee className="h-6 w-6 mr-3" />
                    {t('register.subscribeButton')}
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>{t('register.securityNotice')}</span>
              </div>
              <p className="text-xs text-gray-500">
                {t('register.complianceNotice')}
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
            {t('register.backToHome')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation('/login')}
            className="text-gray-600 hover:text-purple-600 text-sm bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2"
            data-testid="button-back-login"
          >
            {t('register.alreadyHaveAccount')}
          </Button>
        </div>
      </div>
    </div>
  );
}
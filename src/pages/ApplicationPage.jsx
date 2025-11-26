import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen } from 'lucide-react';
import { applications, supabase } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';

const ApplicationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',

    // Step 2: Islamic Background & Motivation
    islamicBackground: '',
    canReadQuran: '',
    tajweedLevel: '',
    hasStudiedArabic: '',
    arabicLevel: '',
    motivation: '', // Combined: why interested + goals

    // Step 3: Availability Preferences
    preferredDays: [], // Array of selected days
    preferredTimes: [], // Array of selected time slots
    timezone: 'Pacific/Auckland', // Default NZ timezone
    availabilityNotes: '' // Additional notes about availability
  });

  const handleChange = (e) => {
    const value = e.target.type === 'radio' ? e.target.value : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Handle checkbox arrays (for days and times)
  const handleCheckboxChange = (name, value) => {
    const currentArray = formData[name];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    setFormData({
      ...formData,
      [name]: newArray
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.gender) {
          toast.error('Please fill in all required personal information');
          return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        break;
      case 2:
        if (!formData.canReadQuran) {
          toast.error('Please indicate if you can read the Quran');
          return false;
        }
        if (formData.canReadQuran === 'true' && !formData.tajweedLevel) {
          toast.error('Please specify your Tajweed level');
          return false;
        }
        if (!formData.hasStudiedArabic) {
          toast.error('Please indicate if you have studied Arabic');
          return false;
        }
        if (formData.hasStudiedArabic === 'true' && !formData.arabicLevel) {
          toast.error('Please specify your Arabic level');
          return false;
        }
        if (!formData.motivation.trim()) {
          toast.error('Please tell us why you want to join this program');
          return false;
        }
        break;
      case 3:
        if (formData.preferredDays.length === 0) {
          toast.error('Please select at least one preferred day for classes');
          return false;
        }
        if (formData.preferredTimes.length === 0) {
          toast.error('Please select at least one preferred time slot for classes');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        can_read_quran: formData.canReadQuran === 'true',
        tajweed_level: formData.canReadQuran === 'true' ? formData.tajweedLevel : null,
        has_studied_arabic: formData.hasStudiedArabic === 'true',
        arabic_level: formData.hasStudiedArabic === 'true' ? formData.arabicLevel : null,
        motivation: formData.motivation + (formData.islamicBackground ? `\n\nIslamic Background: ${formData.islamicBackground}` : ''),
        preferred_days: formData.preferredDays,
        preferred_times: formData.preferredTimes,
        timezone: formData.timezone,
        availability_notes: formData.availabilityNotes || null,
        status: 'pending'
      };

      const { data: newApplication, error: applicationError } = await applications.create(applicationData);

      if (applicationError) {
        toast.error('Failed to submit application');
        console.error(applicationError);
        return;
      }

      setSubmitted(true);
      toast.success('Application submitted successfully!');

      // Send confirmation email to applicant (non-blocking)
      console.log('Sending confirmation email to:', formData.email);
      supabase.functions.invoke('send-application-confirmation', {
        body: {
          applicantData: {
            full_name: formData.fullName,
            email: formData.email
          }
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Failed to send confirmation email:', error);
        } else {
          console.log('Confirmation email sent successfully:', data);
        }
      }).catch(error => {
        console.error('Error invoking email function:', error);
      });

      // Send notification email to admin (non-blocking)
      if (newApplication?.id) {
        console.log('Sending admin notification for application:', newApplication.id);
        supabase.functions.invoke('send-application-notification', {
          body: {
            applicationId: newApplication.id
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Failed to send admin notification:', error);
          } else {
            console.log('Admin notification sent successfully:', data);
          }
        }).catch(error => {
          console.error('Error invoking admin notification function:', error);
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information' },
    { number: 2, title: 'Background & Motivation' },
    { number: 3, title: 'Class Availability' }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for applying to the <strong>2-Year Essential Islamic Studies Course</strong> at Al-Falaah Academy.
              </p>
              <p className="text-gray-600 mb-6">
                We've received your application and will review it shortly.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-emerald-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-emerald-800 text-left space-y-1">
                  <li>• Our admin team will review your application</li>
                  <li>• Once approved, you'll be enrolled as a student</li>
                  <li>• You'll receive an email at <strong>{formData.email}</strong> with your student details</li>
                  <li>• Payment instructions ($300/year - pay in full or up to 4 installments per year) will be provided</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Link to="/" className="flex items-center text-emerald-600 hover:text-emerald-700">
              <BookOpen className="h-6 w-6 mr-2" />
              <span className="text-xl font-bold">Al-Falaah</span>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Student Application</h1>
            <p className="text-gray-600 mt-2">2-Year Essential Islamic Studies Course</p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-sm text-emerald-900">
                <span className="font-semibold">$300/year</span> • 2 years • Personalized learning
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.number
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

                <Input
                  label="Full Name"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+64 21 123 4567"
                />

                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Male
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Female
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Background & Motivation */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Background & Motivation</h2>

                <Textarea
                  label="Tell us about your Islamic background (optional)"
                  name="islamicBackground"
                  value={formData.islamicBackground}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Your Islamic education journey so far..."
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Can you read the Quran? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canReadQuran"
                        value="true"
                        checked={formData.canReadQuran === 'true'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canReadQuran"
                        value="false"
                        checked={formData.canReadQuran === 'false'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.canReadQuran === 'true' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tajweed Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tajweedLevel"
                      value={formData.tajweedLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select level</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have you studied Arabic? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasStudiedArabic"
                        value="true"
                        checked={formData.hasStudiedArabic === 'true'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasStudiedArabic"
                        value="false"
                        checked={formData.hasStudiedArabic === 'false'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.hasStudiedArabic === 'true' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arabic Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="arabicLevel"
                      value={formData.arabicLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select level</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                )}

                <Textarea
                  label="Why are you interested in this program and what do you hope to achieve?"
                  name="motivation"
                  required
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about your motivation and learning goals..."
                />
              </div>
            )}

            {/* Step 3: Class Availability */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Availability</h2>
                <p className="text-gray-600 mb-6">
                  Help us schedule your personalized classes by indicating your preferred days and times.
                  Classes are one-on-one (2 hours per week).
                </p>

                {/* Preferred Days */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Days <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all days that work for you</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label
                        key={day}
                        className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.preferredDays.includes(day)
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-gray-300 hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferredDays.includes(day)}
                          onChange={() => handleCheckboxChange('preferredDays', day)}
                          className="sr-only"
                        />
                        <span className="font-medium">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Times */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Time Slots <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all time slots that work for you (NZ time)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'Morning', label: 'Morning (6:00 AM - 12:00 PM)', emoji: '🌅' },
                      { value: 'Afternoon', label: 'Afternoon (12:00 PM - 5:00 PM)', emoji: '☀️' },
                      { value: 'Evening', label: 'Evening (5:00 PM - 9:00 PM)', emoji: '🌆' },
                      { value: 'Night', label: 'Night (9:00 PM - 12:00 AM)', emoji: '🌙' }
                    ].map(time => (
                      <label
                        key={time.value}
                        className={`flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.preferredTimes.includes(time.value)
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-gray-300 hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferredTimes.includes(time.value)}
                          onChange={() => handleCheckboxChange('preferredTimes', time.value)}
                          className="sr-only"
                        />
                        <span className="text-xl mr-3">{time.emoji}</span>
                        <span className="font-medium">{time.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Timezone */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pacific/Auckland">New Zealand (Pacific/Auckland)</option>
                    <option value="Australia/Sydney">Australia - Sydney</option>
                    <option value="Australia/Melbourne">Australia - Melbourne</option>
                    <option value="Pacific/Fiji">Fiji</option>
                    <option value="Asia/Dubai">Dubai</option>
                    <option value="Asia/Riyadh">Saudi Arabia</option>
                    <option value="Europe/London">United Kingdom</option>
                    <option value="America/New_York">USA - Eastern</option>
                    <option value="America/Los_Angeles">USA - Pacific</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <Textarea
                  label="Additional Availability Notes (Optional)"
                  name="availabilityNotes"
                  value={formData.availabilityNotes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any specific scheduling preferences or constraints we should know about..."
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}

              <div className="ml-auto">
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationPage;

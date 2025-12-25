import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Clock, Globe } from 'lucide-react';
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
    // Program Selection
    program: '', // 'essentials' or 'tajweed'

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

  const [currentNZTime, setCurrentNZTime] = useState('');
  const [currentUserTime, setCurrentUserTime] = useState('');

  // Update current times every minute
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const nzTime = now.toLocaleTimeString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const userTime = now.toLocaleTimeString('en-US', {
        timeZone: formData.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentNZTime(nzTime);
      setCurrentUserTime(userTime);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [formData.timezone]);

  // Get time range in user's timezone
  const getTimeRangeInUserTimezone = (nzStartHour, nzEndHour) => {
    // Convert NZ hour to user's timezone
    const convertHour = (hour) => {
      // Handle hour 24 as midnight of next day
      const actualHour = hour === 24 ? 0 : hour;
      const dayOffset = hour === 24 ? 1 : 0;

      // Create a date in NZ timezone (using January 15, 2025 as reference for NZDT)
      const nzDate = new Date(2025, 0, 15 + dayOffset, actualHour, 0, 0);

      // Get the time string in NZ timezone
      const nzTimeString = nzDate.toLocaleString('en-US', {
        timeZone: 'Pacific/Auckland',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse it back to get UTC time
      const [datePart, timePart] = nzTimeString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hourStr, minute, second] = timePart.split(':');
      const nzDateParsed = new Date(year, month - 1, day, parseInt(hourStr), parseInt(minute), parseInt(second));

      // Now convert to user's timezone
      const userTimeString = nzDateParsed.toLocaleString('en-US', {
        timeZone: formData.timezone,
        hour: 'numeric',
        hour12: false
      });

      const userHour = parseInt(userTimeString);
      return userHour;
    };

    const userStartHour = convertHour(nzStartHour);
    const userEndHour = convertHour(nzEndHour);

    const formatHour = (hour) => {
      // Normalize hour to 0-23 range
      const normalizedHour = hour % 24;
      const period = normalizedHour >= 12 ? 'PM' : 'AM';
      const displayHour = normalizedHour === 0 ? 12 : normalizedHour > 12 ? normalizedHour - 12 : normalizedHour;
      return `${displayHour}:00 ${period}`;
    };

    // Handle day boundary crossing
    let timeRange = `${formatHour(userStartHour)} - ${formatHour(userEndHour)}`;

    // Check if we cross midnight
    if (userStartHour > userEndHour || (userStartHour === userEndHour && nzStartHour !== nzEndHour)) {
      timeRange += ' (next day)';
    }

    return timeRange;
  };

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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.program) {
          toast.error('Please select a program');
          return false;
        }
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.gender) {
          toast.error('Please fill in all required personal information');
          return false;
        }
        // Validate name is not just spaces
        if (formData.fullName.trim().length < 2) {
          toast.error('Please enter a valid full name (at least 2 characters)');
          return false;
        }
        // Validate phone number
        const phoneRegex = /^[\d\s\+\-\(\)]{8,}$/;
        if (!phoneRegex.test(formData.phone)) {
          toast.error('Please enter a valid phone number (at least 8 digits)');
          return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        // Validate date of birth
        const age = calculateAge(formData.dateOfBirth);
        if (age === null) {
          toast.error('Please enter a valid date of birth');
          return false;
        }
        if (age < 14) {
          toast.error('Applicant must be at least 14 years old');
          return false;
        }
        if (age > 100) {
          toast.error('Please enter a valid date of birth (age cannot exceed 100 years)');
          return false;
        }
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        if (birthDate > today) {
          toast.error('Date of birth cannot be in the future');
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
        program: formData.program,
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

      console.log('[ApplicationPage] Submitting application data:', applicationData);

      const { data: newApplication, error: applicationError } = await applications.create(applicationData);

      console.log('[ApplicationPage] Response received:', { data: newApplication, error: applicationError });

      if (applicationError) {
        toast.error(`Failed to submit application: ${applicationError.message || 'Unknown error'}`);
        console.error('[ApplicationPage] Application error:', applicationError);
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
            email: formData.email,
            program: formData.program
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
    const programName = formData.program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
    const paymentInfo = formData.program === 'tajweed'
      ? 'One-time payment of $120 NZD'
      : 'Monthly ($25/month) or Annual ($275/year) payment options';

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for applying to the <strong>{programName}</strong> at The FastTrack Madrasah.
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
                  <li>• Payment instructions ({paymentInfo}) will be provided</li>
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
            <Link to="/">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </button>
            </Link>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-sm sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                {/* <span className="text-xs text-gray-500 font-arabic">الفلاح</span> */}
              </div>
            </Link>
          </div>
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Application</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">The FastTrack Madrasah Programs</p>
            {formData.program && (
              <div className="mt-4 inline-flex items-center px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg max-w-full">
                <div className="text-xs sm:text-sm text-emerald-900 text-center">
                  {formData.program === 'tajweed' ? (
                    <>
                      <span className="font-semibold">Tajweed Program</span> • 6 months • $120 NZD
                    </>
                  ) : (
                    <>
                      <span className="font-semibold block sm:inline">Essential Arabic & Islamic Studies</span>
                      <span className="hidden sm:inline"> • </span>
                      <span className="block sm:inline">2 years • $25-$275/payment</span>
                    </>
                  )}
                </div>
              </div>
            )}
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Program Selection & Personal Information</h2>

                {/* Program Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Your Program <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Tajweed Program */}
                    <label
                      className={`relative flex flex-col p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.program === 'tajweed'
                          ? 'border-emerald-600 bg-emerald-50 shadow-md'
                          : 'border-gray-300 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value="tajweed"
                        checked={formData.program === 'tajweed'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start mb-3">
                        <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 mt-1 flex-shrink-0 ${formData.program === 'tajweed' ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-bold mb-1 break-words ${formData.program === 'tajweed' ? 'text-emerald-900' : 'text-gray-900'}`}>
                            Tajweed Mastery Program
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">Build a strong foundation with the Qur'an through precision recitation</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Duration: 6 months (24 weeks)</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">💰</span>
                          <span className="break-words">One-time payment: $120 NZD</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="mr-2 flex-shrink-0">📚</span>
                          <span>Personalized one-on-one learning</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">⏱️</span>
                          <span className="break-words">2 sessions/week (1 hour + 30 min)</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Total Cost:</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-700">$120 NZD (one-time)</p>
                        </div>
                      </div>
                      {formData.program === 'tajweed' && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                        </div>
                      )}
                    </label>
                     {/* Essential Arabic & Islamic Studies Program */}
                    <label
                      className={`relative flex flex-col p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.program === 'essentials'
                          ? 'border-emerald-600 bg-emerald-50 shadow-md'
                          : 'border-gray-300 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value="essentials"
                        checked={formData.program === 'essentials'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start mb-3">
                        <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 mt-1 flex-shrink-0 ${formData.program === 'essentials' ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-bold mb-1 break-words ${formData.program === 'essentials' ? 'text-emerald-900' : 'text-gray-900'}`}>
                            Essential Arabic & Islamic Studies Program
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">Master Arabic linguistics and Islamic sciences for direct comprehension</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Duration: 2 years (24 months)</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">💰</span>
                          <span className="break-words">Monthly: $25 NZD/month or Annual: $275 NZD/year</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="mr-2 flex-shrink-0">📚</span>
                          <span>Personalized one-on-one learning</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">⏱️</span>
                          <span className="break-words">2 sessions/week (2 hours + 30 min)</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Total Cost:</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-700">Monthly: $600 | Annual: $550</p>
                        </div>
                      </div>
                      {formData.program === 'essentials' && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                </div>

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
                  label="WhatsApp Contact"
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
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferred Class Timings</h2>
                <p className="text-gray-600 mb-6">
                  Help us schedule your personalized classes by indicating your preferred days and times.
                </p>

                {/* Timezone Selection - Moved to top */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Your Timezone <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label="🌏 Pacific / Oceania">
                      <option value="Pacific/Auckland">New Zealand</option>
                      <option value="Australia/Sydney">Australia - Sydney</option>
                      <option value="Australia/Melbourne">Australia - Melbourne</option>
                      <option value="Australia/Brisbane">Australia - Brisbane</option>
                      <option value="Australia/Perth">Australia - Perth</option>
                      <option value="Pacific/Fiji">Fiji</option>
                      <option value="Pacific/Tongatapu">Tonga</option>
                      <option value="Pacific/Samoa">Samoa</option>
                    </optgroup>

                    <optgroup label="🌏 Asia - East & Southeast">
                      <option value="Asia/Tokyo">Japan</option>
                      <option value="Asia/Seoul">South Korea</option>
                      <option value="Asia/Shanghai">China</option>
                      <option value="Asia/Hong_Kong">Hong Kong</option>
                      <option value="Asia/Singapore">Singapore</option>
                      <option value="Asia/Kuala_Lumpur">Malaysia</option>
                      <option value="Asia/Jakarta">Indonesia - Jakarta</option>
                      <option value="Asia/Manila">Philippines</option>
                      <option value="Asia/Bangkok">Thailand</option>
                      <option value="Asia/Ho_Chi_Minh">Vietnam</option>
                    </optgroup>

                    <optgroup label="🌏 Asia - South & Central">
                      <option value="Asia/Karachi">Pakistan</option>
                      <option value="Asia/Kolkata">India</option>
                      <option value="Asia/Dhaka">Bangladesh</option>
                      <option value="Asia/Colombo">Sri Lanka</option>
                      <option value="Asia/Kathmandu">Nepal</option>
                      <option value="Asia/Tashkent">Uzbekistan</option>
                    </optgroup>

                    <optgroup label="🕌 Middle East">
                      <option value="Asia/Riyadh">Saudi Arabia</option>
                      <option value="Asia/Dubai">UAE</option>
                      <option value="Asia/Qatar">Qatar</option>
                      <option value="Asia/Kuwait">Kuwait</option>
                      <option value="Asia/Bahrain">Bahrain</option>
                      <option value="Asia/Muscat">Oman</option>
                      <option value="Asia/Tehran">Iran</option>
                      <option value="Asia/Baghdad">Iraq</option>
                      <option value="Asia/Damascus">Syria</option>
                      <option value="Asia/Beirut">Lebanon</option>
                      <option value="Asia/Jerusalem">Palestine/Israel</option>
                      <option value="Asia/Amman">Jordan</option>
                      <option value="Europe/Istanbul">Turkey</option>
                    </optgroup>

                    <optgroup label="🌍 Africa">
                      <option value="Africa/Cairo">Egypt</option>
                      <option value="Africa/Johannesburg">South Africa</option>
                      <option value="Africa/Lagos">Nigeria</option>
                      <option value="Africa/Nairobi">Kenya</option>
                      <option value="Africa/Casablanca">Morocco</option>
                      <option value="Africa/Tunis">Tunisia</option>
                      <option value="Africa/Algiers">Algeria</option>
                      <option value="Africa/Tripoli">Libya</option>
                      <option value="Africa/Khartoum">Sudan</option>
                    </optgroup>

                    <optgroup label="🇪🇺 Europe">
                      <option value="Europe/London">United Kingdom</option>
                      <option value="Europe/Paris">France</option>
                      <option value="Europe/Berlin">Germany</option>
                      <option value="Europe/Rome">Italy</option>
                      <option value="Europe/Madrid">Spain</option>
                      <option value="Europe/Amsterdam">Netherlands</option>
                      <option value="Europe/Brussels">Belgium</option>
                      <option value="Europe/Vienna">Austria</option>
                      <option value="Europe/Stockholm">Sweden</option>
                      <option value="Europe/Oslo">Norway</option>
                      <option value="Europe/Copenhagen">Denmark</option>
                      <option value="Europe/Warsaw">Poland</option>
                      <option value="Europe/Moscow">Russia - Moscow</option>
                    </optgroup>

                    <optgroup label="🌎 North America">
                      <option value="America/New_York">USA - Eastern (New York)</option>
                      <option value="America/Chicago">USA - Central (Chicago)</option>
                      <option value="America/Denver">USA - Mountain (Denver)</option>
                      <option value="America/Los_Angeles">USA - Pacific (Los Angeles)</option>
                      <option value="America/Anchorage">USA - Alaska</option>
                      <option value="Pacific/Honolulu">USA - Hawaii</option>
                      <option value="America/Toronto">Canada - Eastern (Toronto)</option>
                      <option value="America/Vancouver">Canada - Pacific (Vancouver)</option>
                      <option value="America/Mexico_City">Mexico</option>
                    </optgroup>

                    <optgroup label="🌎 Central & South America">
                      <option value="America/Sao_Paulo">Brazil - São Paulo</option>
                      <option value="America/Buenos_Aires">Argentina</option>
                      <option value="America/Santiago">Chile</option>
                      <option value="America/Lima">Peru</option>
                      <option value="America/Bogota">Colombia</option>
                      <option value="America/Caracas">Venezuela</option>
                    </optgroup>
                  </select>

                  {/* Current Time Display */}
                  {formData.timezone !== 'Pacific/Auckland' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Time Difference:</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Your Time</div>
                          <div className="font-semibold text-gray-900">{currentUserTime}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">NZ Time</div>
                          <div className="font-semibold text-gray-900">{currentNZTime}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                  <p className="text-sm text-gray-500 mb-3">
                    Select all time slots that work for you
                    {formData.timezone !== 'Pacific/Auckland' && ' (times shown in your timezone and NZ time)'}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'Morning', nzStart: 6, nzEnd: 12, label: 'Morning', emoji: '🌅' },
                      { value: 'Afternoon', nzStart: 12, nzEnd: 17, label: 'Afternoon', emoji: '☀️' },
                      { value: 'Evening', nzStart: 17, nzEnd: 21, label: 'Evening', emoji: '🌆' },
                      { value: 'Night', nzStart: 21, nzEnd: 24, label: 'Night', emoji: '🌙' }
                    ].map(time => {
                      const userTimeRange = formData.timezone !== 'Pacific/Auckland'
                        ? getTimeRangeInUserTimezone(time.nzStart, time.nzEnd)
                        : null;

                      return (
                        <label
                          key={time.value}
                          className={`flex items-start px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.preferredTimes.includes(time.value)
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-gray-300 hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.preferredTimes.includes(time.value)}
                            onChange={() => handleCheckboxChange('preferredTimes', time.value)}
                            className="sr-only"
                          />
                          <span className="text-xl mr-3 mt-0.5">{time.emoji}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{time.label}</div>
                            {formData.timezone !== 'Pacific/Auckland' ? (
                              <div className="mt-1 space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-700 font-medium">Your time:</span>
                                  <span className="text-emerald-900">{userTimeRange}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">NZ time:</span>
                                  <span className="text-gray-700">
                                    {time.nzStart === 12 ? '12:00' : `${time.nzStart > 12 ? time.nzStart - 12 : time.nzStart}:00`} {time.nzStart >= 12 ? 'PM' : 'AM'} -
                                    {time.nzEnd === 12 ? ' 12:00' : ` ${time.nzEnd > 12 ? time.nzEnd - 12 : time.nzEnd}:00`} {time.nzEnd >= 12 ? 'PM' : 'AM'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 mt-1">
                                {time.nzStart === 12 ? '12:00' : `${time.nzStart > 12 ? time.nzStart - 12 : time.nzStart}:00`} {time.nzStart >= 12 ? 'PM' : 'AM'} -
                                {time.nzEnd === 12 ? ' 12:00' : ` ${time.nzEnd > 12 ? time.nzEnd - 12 : time.nzEnd}:00`} {time.nzEnd >= 12 ? 'PM' : 'AM'}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
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

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Clock, Globe } from 'lucide-react';
import TimezoneSelect from 'react-timezone-select';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { applications, supabase } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

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
    referralSource: '',
    referralSourceOther: '',

    // Step 2: Islamic Background & Motivation
    islamicBackground: '',
    canReadQuran: '',
    tajweedLevel: '',
    hasStudiedArabic: '',
    arabicLevel: '',
    motivation: '', // Combined: why interested + goals

    // Step 3: Availability Preferences
    preferredDays: [], // Array of selected days
    preferredTimes: [], // Array of selected time slots with NZ time ranges
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect user's timezone
    availabilityNotes: '' // Additional notes about availability
  });

  const [currentNZTime, setCurrentNZTime] = useState('');
  const [currentUserTime, setCurrentUserTime] = useState('');

  // Update current times every minute using date-fns-tz
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const nzTime = formatInTimeZone(now, 'Pacific/Auckland', 'h:mm a');
      const userTime = formatInTimeZone(now, formData.timezone, 'h:mm a');
      setCurrentNZTime(nzTime);
      setCurrentUserTime(userTime);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [formData.timezone]);

  // Get time range in user's timezone using date-fns-tz
  const getTimeRangeInUserTimezone = (nzStartHour, nzEndHour) => {
    // Use current date to properly account for DST
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // Create dates in NZ timezone
    const nzStartStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(nzStartHour).padStart(2, '0')}:00:00`;
    const nzEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(nzEndHour === 24 ? 0 : nzEndHour).padStart(2, '0')}:00:00`;

    // Convert to user's timezone
    const userStartTime = formatInTimeZone(
      toDate(nzStartStr, { timeZone: 'Pacific/Auckland' }),
      formData.timezone,
      'h:mm a'
    );

    const userEndTime = formatInTimeZone(
      toDate(nzEndStr, { timeZone: 'Pacific/Auckland' }),
      formData.timezone,
      'h:mm a'
    );

    // Check if date changes
    const startDate = formatInTimeZone(
      toDate(nzStartStr, { timeZone: 'Pacific/Auckland' }),
      formData.timezone,
      'yyyy-MM-dd'
    );

    const endDate = formatInTimeZone(
      toDate(nzEndStr, { timeZone: 'Pacific/Auckland' }),
      formData.timezone,
      'yyyy-MM-dd'
    );

    if (startDate !== endDate) {
      return `${userStartTime} - ${userEndTime} (next day)`;
    }

    return `${userStartTime} - ${userEndTime}`;
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
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.gender || !formData.referralSource) {
          toast.error('Please fill in all required personal information');
          return false;
        }
        if (formData.referralSource === 'other' && !formData.referralSourceOther?.trim()) {
          toast.error('Please specify how you heard about us');
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
      // Convert preferred times to include both NZ and user timezone info
      const timeSlots = [
        { value: 'Morning', nzStart: 6, nzEnd: 12 },
        { value: 'Afternoon', nzStart: 12, nzEnd: 17 },
        { value: 'Evening', nzStart: 17, nzEnd: 21 },
        { value: 'Night', nzStart: 21, nzEnd: 24 }
      ];

      const preferredTimesWithConversion = formData.preferredTimes.map(timeValue => {
        const slot = timeSlots.find(s => s.value === timeValue);
        if (!slot) return timeValue;

        const userTimeRange = getTimeRangeInUserTimezone(slot.nzStart, slot.nzEnd);
        const nzTimeRange = `${slot.nzStart === 12 ? '12:00' : `${slot.nzStart > 12 ? slot.nzStart - 12 : slot.nzStart}:00`} ${slot.nzStart >= 12 ? 'PM' : 'AM'} - ${slot.nzEnd === 12 ? '12:00' : `${slot.nzEnd > 12 ? slot.nzEnd - 12 : slot.nzEnd}:00`} ${slot.nzEnd >= 12 ? 'PM' : 'AM'}`;

        return {
          slot: timeValue,
          nz_time: nzTimeRange,
          user_time: userTimeRange,
          nz_hours: `${slot.nzStart}-${slot.nzEnd}`
        };
      });

      const applicationData = {
        program: formData.program,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        referral_source: formData.referralSource === 'other'
          ? `Other: ${formData.referralSourceOther}`
          : formData.referralSource,
        can_read_quran: formData.canReadQuran === 'true',
        tajweed_level: formData.canReadQuran === 'true' ? formData.tajweedLevel : null,
        has_studied_arabic: formData.hasStudiedArabic === 'true',
        arabic_level: formData.hasStudiedArabic === 'true' ? formData.arabicLevel : null,
        motivation: formData.motivation + (formData.islamicBackground ? `\n\nIslamic Background: ${formData.islamicBackground}` : ''),
        preferred_days: formData.preferredDays,
        preferred_times: preferredTimesWithConversion,
        timezone: formData.timezone,
        availability_notes: formData.availabilityNotes || null,
        status: 'pending'
      };

      console.log('[ApplicationPage] Submitting application data:', applicationData);

      const { data: newApplication, error: applicationError } = await applications.create(applicationData);

      console.log('[ApplicationPage] Response received:', { data: newApplication, error: applicationError });

      if (applicationError) {
        const errorMessage = applicationError.message || applicationError.error_description || 'Unknown error';
        toast.error(`Failed to submit application: ${errorMessage}`);
        console.error('[ApplicationPage] Application error:', applicationError);
        console.error('[ApplicationPage] Full error details:', JSON.stringify(applicationError, null, 2));
        setLoading(false);
        return;
      }

      if (!newApplication) {
        toast.error('Failed to submit application: No data returned');
        console.error('[ApplicationPage] No application data returned');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false); // Reset loading immediately after success
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
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information' },
    { number: 2, title: 'Background & Motivation' },
    { number: 3, title: 'Class Availability' }
  ];

  if (submitted) {
    const program = PROGRAMS[formData.program];
    const programName = program?.name || formData.program;
    const paymentInfo = program?.pricing.type === 'one-time'
      ? `One-time payment of ${program.pricing.displayPrice}`
      : `Monthly (${program.pricing.displayPriceMonthly}) or Annual (${program.pricing.displayPriceAnnual}) payment options`;

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
                <span className="text-sm sm:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm sm:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                {/* <span className="text-xs text-gray-500 font-arabic">الفلاح</span> */}
              </div>
            </Link>
          </div>
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Application</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">The FastTrack Madrasah Programs</p>
            {formData.program && PROGRAMS[formData.program] && (
              <div className="mt-4 inline-flex items-center px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg max-w-full">
                <div className="text-xs sm:text-sm text-emerald-900 text-center">
                  {formData.program === PROGRAM_IDS.TAJWEED ? (
                    <>
                      <span className="font-semibold">{PROGRAMS[formData.program].name}</span> • {PROGRAMS[formData.program].duration.display} • {PROGRAMS[formData.program].pricing.displayPrice}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold block sm:inline">{PROGRAMS[formData.program].name}</span>
                      <span className="hidden sm:inline"> • </span>
                      <span className="block sm:inline">{PROGRAMS[formData.program].duration.display} • {PROGRAMS[formData.program].pricing.displayPriceMonthly}-{PROGRAMS[formData.program].pricing.displayPriceAnnual}</span>
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
                    Select Your Track <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Tajweed Track */}
                    <label
                      className={`relative flex flex-col p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.program === PROGRAM_IDS.TAJWEED
                          ? 'border-emerald-600 bg-emerald-50 shadow-md'
                          : 'border-gray-300 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={PROGRAM_IDS.TAJWEED}
                        checked={formData.program === PROGRAM_IDS.TAJWEED}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start mb-3">
                        <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 mt-1 flex-shrink-0 ${formData.program === PROGRAM_IDS.TAJWEED ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-bold mb-1 break-words ${formData.program === PROGRAM_IDS.TAJWEED ? 'text-emerald-900' : 'text-gray-900'}`}>
                            {PROGRAMS[PROGRAM_IDS.TAJWEED].name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">Build a strong foundation with the Qur'an through precision recitation</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Duration: {PROGRAMS[PROGRAM_IDS.TAJWEED].duration.display} ({PROGRAMS[PROGRAM_IDS.TAJWEED].duration.displayWeeks})</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">💰</span>
                          <span className="break-words">One-time payment: {PROGRAMS[PROGRAM_IDS.TAJWEED].pricing.displayPrice}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="mr-2 flex-shrink-0">📚</span>
                          <span>Personalized one-on-one learning</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">⏱️</span>
                          <span className="break-words">2 sessions/week ({PROGRAMS[PROGRAM_IDS.TAJWEED].schedule.session1.duration.toLowerCase()} + {PROGRAMS[PROGRAM_IDS.TAJWEED].schedule.session2.duration})</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Total Cost:</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-700">{PROGRAMS[PROGRAM_IDS.TAJWEED].pricing.displayPrice} (one-time)</p>
                        </div>
                      </div>
                      {formData.program === PROGRAM_IDS.TAJWEED && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                        </div>
                      )}
                    </label>
                     {/* Essential Arabic & Islamic Studies Track */}
                    <label
                      className={`relative flex flex-col p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.program === PROGRAM_IDS.ESSENTIALS
                          ? 'border-emerald-600 bg-emerald-50 shadow-md'
                          : 'border-gray-300 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={PROGRAM_IDS.ESSENTIALS}
                        checked={formData.program === PROGRAM_IDS.ESSENTIALS}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start mb-3">
                        <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 mt-1 flex-shrink-0 ${formData.program === PROGRAM_IDS.ESSENTIALS ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-bold mb-1 break-words ${formData.program === PROGRAM_IDS.ESSENTIALS ? 'text-emerald-900' : 'text-gray-900'}`}>
                            {PROGRAMS[PROGRAM_IDS.ESSENTIALS].name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">Master Arabic linguistics and Islamic sciences for direct comprehension</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Duration: {PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.display} ({PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.months} months)</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">💰</span>
                          <span className="break-words">Monthly: ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.monthly} NZD/month or Annual: ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.annual} NZD/year</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="mr-2 flex-shrink-0">📚</span>
                          <span>Personalized one-on-one learning</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2 flex-shrink-0">⏱️</span>
                          <span className="break-words">2 sessions/week ({PROGRAMS[PROGRAM_IDS.ESSENTIALS].schedule.session1.duration.toLowerCase()} + {PROGRAMS[PROGRAM_IDS.ESSENTIALS].schedule.session2.duration})</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Total Cost:</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-700">Monthly: ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.monthly * PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.months} | Annual: ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.annual * PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.years}</p>
                        </div>
                      </div>
                      {formData.program === PROGRAM_IDS.ESSENTIALS && (
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about us? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'whatsapp', label: 'WhatsApp Group' },
                      { value: 'facebook', label: 'Facebook' },
                      { value: 'instagram', label: 'Instagram' },
                      { value: 'friends', label: 'Friends / Family' },
                      { value: 'masjid', label: 'Masjid / Islamic Center' },
                      { value: 'search', label: 'Google Search' },
                      { value: 'other', label: 'Other' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="referralSource"
                          value={option.value}
                          checked={formData.referralSource === option.value}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {formData.referralSource === 'other' && (
                    <div className="mt-3">
                      <Input
                        label="Please specify"
                        name="referralSourceOther"
                        value={formData.referralSourceOther}
                        onChange={handleChange}
                        placeholder="How did you hear about us?"
                        required
                      />
                    </div>
                  )}
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

                {/* Timezone Selection - Professional Component */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Your Timezone <span className="text-red-500">*</span>
                  </label>
                  <TimezoneSelect
                    value={formData.timezone}
                    onChange={(tz) => setFormData({ ...formData, timezone: tz.value })}
                    className="timezone-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#d1d5db',
                        borderRadius: '0.5rem',
                        padding: '0.125rem',
                        '&:hover': {
                          borderColor: '#10b981'
                        }
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        '&:active': {
                          backgroundColor: '#059669'
                        }
                      })
                    }}
                  />

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

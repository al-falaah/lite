import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Globe } from 'lucide-react';
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

      // Add timeout to prevent infinite hang on slow/blocked connections
      const timeoutMs = 30000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), timeoutMs)
      );

      let result;
      try {
        result = await Promise.race([
          applications.create(applicationData),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.error('[ApplicationPage] Request timed out:', timeoutError);
        toast.error('Request timed out. Please check your connection and try again.');
        setLoading(false);
        return;
      }

      const { data: newApplication, error: applicationError } = result;

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6" />
            <span className="text-sm font-semibold text-gray-900 hidden sm:inline">The FastTrack Madrasah</span>
          </Link>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Select your program</h1>
              <p className="text-sm text-gray-500 mb-6">Choose the track that matches your current level.</p>

              {/* Program Selection - Order: QARI (Track 1), TMP (Track 2), EASI (Track 3) */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Your Track <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {/* QARI Track - Track 1 */}
                    <label
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.program === PROGRAM_IDS.QARI
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={PROGRAM_IDS.QARI}
                        checked={formData.program === PROGRAM_IDS.QARI}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        formData.program === PROGRAM_IDS.QARI
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.program === PROGRAM_IDS.QARI && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-semibold text-gray-900">{PROGRAMS[PROGRAM_IDS.QARI].shortName}</h3>
                          <span className="text-sm text-gray-500">{PROGRAMS[PROGRAM_IDS.QARI].name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {PROGRAMS[PROGRAM_IDS.QARI].duration.display} · {PROGRAMS[PROGRAM_IDS.QARI].pricing.displayPrice}
                        </p>
                      </div>
                    </label>

                    {/* Tajweed Track - Track 2 */}
                    <label
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.program === PROGRAM_IDS.TAJWEED
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 bg-white'
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
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        formData.program === PROGRAM_IDS.TAJWEED
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.program === PROGRAM_IDS.TAJWEED && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-semibold text-gray-900">{PROGRAMS[PROGRAM_IDS.TAJWEED].shortName}</h3>
                          <span className="text-sm text-gray-500">{PROGRAMS[PROGRAM_IDS.TAJWEED].name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {PROGRAMS[PROGRAM_IDS.TAJWEED].duration.display} · {PROGRAMS[PROGRAM_IDS.TAJWEED].pricing.displayPrice}
                        </p>
                      </div>
                    </label>

                    {/* Essential Arabic & Islamic Studies Track - Track 3 */}
                    <label
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.program === PROGRAM_IDS.ESSENTIALS
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 bg-white'
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
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        formData.program === PROGRAM_IDS.ESSENTIALS
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.program === PROGRAM_IDS.ESSENTIALS && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-semibold text-gray-900">{PROGRAMS[PROGRAM_IDS.ESSENTIALS].shortName}</h3>
                          <span className="text-sm text-gray-500">{PROGRAMS[PROGRAM_IDS.ESSENTIALS].name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.display} · ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.monthly}/month or ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].pricing.annual}/year
                        </p>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    <a href="/programs" target="_blank" className="text-emerald-600 hover:text-emerald-700 underline">View program details</a> to learn more about each track.
                  </p>
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Your details</h2>
                  <p className="text-sm text-gray-500 mb-4">We'll use this to contact you about your application.</p>
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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Your background</h1>
              <p className="text-sm text-gray-500 mb-6">Tell us about your learning journey so far.</p>

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
                    Can you read the Qur'an? <span className="text-red-500">*</span>
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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Class schedule</h1>
              <p className="text-sm text-gray-500 mb-6">When are you available for classes?</p>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time Slots <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select all that apply{formData.timezone !== 'Pacific/Auckland' && '. Times shown in your timezone.'}
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: 'Morning', nzStart: 6, nzEnd: 12, label: 'Morning' },
                      { value: 'Afternoon', nzStart: 12, nzEnd: 17, label: 'Afternoon' },
                      { value: 'Evening', nzStart: 17, nzEnd: 21, label: 'Evening' },
                      { value: 'Night', nzStart: 21, nzEnd: 24, label: 'Night' }
                    ].map(time => {
                      const userTimeRange = formData.timezone !== 'Pacific/Auckland'
                        ? getTimeRangeInUserTimezone(time.nzStart, time.nzEnd)
                        : null;
                      const nzTimeDisplay = `${time.nzStart === 12 ? '12:00' : `${time.nzStart > 12 ? time.nzStart - 12 : time.nzStart}:00`} ${time.nzStart >= 12 ? 'PM' : 'AM'} - ${time.nzEnd === 12 ? '12:00' : `${time.nzEnd > 12 ? time.nzEnd - 12 : time.nzEnd}:00`} ${time.nzEnd >= 12 ? 'PM' : 'AM'}`;
                      const isSelected = formData.preferredTimes.includes(time.value);

                      return (
                        <label
                          key={time.value}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange('preferredTimes', time.value)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <span className="font-medium text-gray-900">{time.label}</span>
                            <span className="text-gray-500 ml-2 text-sm">
                              {formData.timezone !== 'Pacific/Auckland' ? userTimeRange : nzTimeDisplay}
                            </span>
                            {formData.timezone !== 'Pacific/Auckland' && (
                              <span className="text-gray-400 text-xs ml-2">(NZ: {nzTimeDisplay})</span>
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

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1 sm:flex-none">
                  Back
                </Button>
              )}
              <Button
                type={currentStep === 3 ? 'submit' : 'button'}
                onClick={currentStep < 3 ? nextStep : undefined}
                disabled={loading}
                className={currentStep === 1 ? 'w-full' : 'flex-1 sm:flex-none sm:ml-auto'}
              >
                {currentStep < 3 ? 'Continue' : (loading ? 'Submitting...' : 'Submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationPage;

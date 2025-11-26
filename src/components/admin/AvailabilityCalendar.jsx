import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { applications, classSchedules } from '../../services/supabase';
import Card from '../common/Card';

const AvailabilityCalendar = () => {
  const [applicants, setApplicants] = useState([]);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'booked', 'pending', 'available'

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Morning', 'Afternoon', 'Evening', 'Night'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load both applications and scheduled classes
      const [appsResponse, schedulesResponse] = await Promise.all([
        applications.getAll(),
        classSchedules.getScheduled()
      ]);

      if (appsResponse.error) {
        console.error('Error loading applicants:', appsResponse.error);
      } else {
        // Filter only applicants with availability data
        const applicantsWithAvailability = appsResponse.data.filter(
          app => app.preferred_days && app.preferred_days.length > 0
        );
        setApplicants(applicantsWithAvailability);
      }

      if (schedulesResponse.error) {
        console.error('Error loading schedules:', schedulesResponse.error);
      } else {
        setScheduledClasses(schedulesResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter applicants based on search and filters
  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDay = selectedDay === 'all' ||
                      (app.preferred_days && app.preferred_days.includes(selectedDay));

    const matchesTime = selectedTime === 'all' ||
                       (app.preferred_times && app.preferred_times.includes(selectedTime));

    return matchesSearch && matchesDay && matchesTime;
  });

  // Get scheduled classes for a specific day/time slot
  const getScheduledClassesForSlot = (day, time) => {
    return scheduledClasses.filter(schedule => {
      const scheduleDay = schedule.day_of_week;
      const scheduleTime = schedule.class_time;

      if (scheduleDay !== day) return false;

      // Map time to hour ranges
      const timeRanges = {
        'Morning': { start: 6, end: 12 },
        'Afternoon': { start: 12, end: 17 },
        'Evening': { start: 17, end: 21 },
        'Night': { start: 21, end: 24 }
      };

      if (scheduleTime && timeRanges[time]) {
        const [hour] = scheduleTime.split(':').map(Number);
        return hour >= timeRanges[time].start && hour < timeRanges[time].end;
      }

      return false;
    });
  };

  // Get pending applicants for a specific day/time slot
  const getPendingApplicantsForSlot = (day, time) => {
    return applicants.filter(app =>
      app.status === 'pending' &&
      app.preferred_days?.includes(day) &&
      app.preferred_times?.includes(time)
    );
  };

  // Get ALL applicants (any status) for a specific day/time slot
  const getAllApplicantsForSlot = (day, time) => {
    return applicants.filter(app =>
      app.preferred_days?.includes(day) &&
      app.preferred_times?.includes(time)
    );
  };

  // Get smart slot status: determines if slot is booked, has pending apps, or is available
  const getSlotStatus = (day, time) => {
    const scheduledCount = getScheduledClassesForSlot(day, time).length;
    const pendingCount = getPendingApplicantsForSlot(day, time).length;

    if (scheduledCount > 0) {
      return { type: 'booked', count: scheduledCount, pendingCount };
    } else if (pendingCount > 0) {
      return { type: 'pending', count: pendingCount, pendingCount };
    } else {
      return { type: 'available', count: 0, pendingCount: 0 };
    }
  };

  // Get smart color coding based on slot status
  const getSlotColor = (day, time) => {
    const status = getSlotStatus(day, time);

    if (status.type === 'booked') {
      // Blue shades for booked slots
      if (status.count === 1) return 'bg-blue-100 text-blue-800 border-blue-300';
      if (status.count <= 2) return 'bg-blue-200 text-blue-900 border-blue-400';
      if (status.count <= 4) return 'bg-blue-300 text-blue-950 border-blue-500';
      return 'bg-blue-400 text-white border-blue-600';
    } else if (status.type === 'pending') {
      // Amber/yellow shades for pending applications
      if (status.count === 1) return 'bg-amber-100 text-amber-800 border-amber-300';
      if (status.count <= 2) return 'bg-amber-200 text-amber-900 border-amber-400';
      if (status.count <= 4) return 'bg-amber-300 text-amber-950 border-amber-500';
      return 'bg-amber-400 text-white border-amber-600';
    } else {
      // Green/gray for available slots
      return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </Card>
    );
  }

  // Calculate summary statistics
  const getStats = () => {
    const totalSlots = days.length * times.length;
    let bookedSlots = 0;
    let pendingSlots = 0;
    let availableSlots = 0;

    days.forEach(day => {
      times.forEach(time => {
        const status = getSlotStatus(day, time);
        if (status.type === 'booked') bookedSlots++;
        else if (status.type === 'pending') pendingSlots++;
        else availableSlots++;
      });
    });

    return {
      total: totalSlots,
      booked: bookedSlots,
      pending: pendingSlots,
      available: availableSlots,
      totalBookings: scheduledClasses.length,
      totalPending: applicants.filter(app => app.status === 'pending').length
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-emerald-600" />
            Smart Availability Calendar
          </h2>
          <p className="text-gray-600 mt-1">
            View current bookings, pending applications, and your availability at a glance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-amber-600">{stats.totalPending}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Booked Slots</p>
              <p className="text-2xl font-bold text-blue-600">{stats.booked}/{stats.total}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Slots</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}/{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Day Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
            >
              <option value="all">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
            >
              <option value="all">All Times</option>
              {times.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Smart Heat Map Calendar */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Availability Heat Map</h3>
        <p className="text-sm text-gray-600 mb-4">
          Blue = Current bookings, Yellow = Pending applications, Green = Available
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Time / Day
                </th>
                {days.map(day => (
                  <th key={day} className="border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => (
                <tr key={time}>
                  <td className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    {time}
                  </td>
                  {days.map(day => {
                    const status = getSlotStatus(day, time);
                    const scheduledForSlot = getScheduledClassesForSlot(day, time);
                    const pendingForSlot = getPendingApplicantsForSlot(day, time);
                    const colorClass = getSlotColor(day, time);

                    return (
                      <td
                        key={day}
                        className={`border-2 px-3 py-5 text-center text-sm font-semibold ${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}
                        title={
                          status.type === 'booked'
                            ? `${status.count} scheduled class(es)${status.pendingCount > 0 ? ` + ${status.pendingCount} pending` : ''}`
                            : status.type === 'pending'
                            ? `${status.count} pending application(s)`
                            : 'Available slot'
                        }
                      >
                        {status.type === 'booked' && (
                          <div>
                            <div className="text-lg font-bold flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {status.count}
                            </div>
                            <div className="text-xs mt-1 opacity-90">
                              {scheduledForSlot.slice(0, 2).map(s => s.students?.full_name?.split(' ')[0] || 'Student').join(', ')}
                              {status.count > 2 && ` +${status.count - 2}`}
                            </div>
                            {status.pendingCount > 0 && (
                              <div className="text-xs mt-1 bg-amber-200 rounded px-1 py-0.5 inline-block">
                                +{status.pendingCount} pending
                              </div>
                            )}
                          </div>
                        )}
                        {status.type === 'pending' && (
                          <div>
                            <div className="text-lg font-bold flex items-center justify-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {status.count}
                            </div>
                            <div className="text-xs mt-1 opacity-90">
                              {pendingForSlot.slice(0, 2).map(app => app.full_name?.split(' ')[0]).join(', ')}
                              {status.count > 2 && ` +${status.count - 2}`}
                            </div>
                          </div>
                        )}
                        {status.type === 'available' && (
                          <div className="text-lg">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold text-gray-700">Legend:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-200 border-2 border-blue-400 rounded flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-900" />
              </div>
              <div>
                <div className="font-medium text-blue-900">Current Bookings</div>
                <div className="text-gray-600 text-xs">Scheduled classes with students</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-200 border-2 border-amber-400 rounded flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-900" />
              </div>
              <div>
                <div className="font-medium text-amber-900">Pending Applications</div>
                <div className="text-gray-600 text-xs">New applicants interested in this slot</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 border-2 border-green-200 rounded flex items-center justify-center">
                <span className="text-green-700 font-bold">-</span>
              </div>
              <div>
                <div className="font-medium text-green-900">Available</div>
                <div className="text-gray-600 text-xs">No bookings or applications</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Bookings List */}
      {scheduledClasses.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Current Bookings ({scheduledClasses.length})
            </h3>
          </div>

          <div className="space-y-3">
            {scheduledClasses.map(schedule => (
              <div key={schedule.id} className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">{schedule.students?.full_name || 'Student'}</h4>
                    <p className="text-sm text-blue-700">{schedule.students?.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Day:</span>{' '}
                        <span className="text-blue-900">{schedule.day_of_week}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Time:</span>{' '}
                        <span className="text-blue-900">{schedule.class_time || 'TBD'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Type:</span>{' '}
                        <span className="text-blue-900">{schedule.class_type === 'main' ? 'Main (2hr)' : 'Short (30min)'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Year {schedule.academic_year}, Week {schedule.week_number}</span>
                      </div>
                    </div>
                    {schedule.meeting_link && (
                      <a
                        href={schedule.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline inline-block"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {schedule.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Applications List */}
      {filteredApplicants.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
              {filteredApplicants.length === applicants.length ? 'All Pending Applications' : 'Filtered Applications'} ({filteredApplicants.length})
            </h3>
          </div>

          <div className="space-y-3">
            {filteredApplicants.map(app => (
              <div key={app.id} className={`border-2 rounded-lg p-4 hover:opacity-80 transition-colors ${
                app.status === 'pending'
                  ? 'border-amber-200 bg-amber-50'
                  : app.status === 'approved'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      app.status === 'pending' ? 'text-amber-900' :
                      app.status === 'approved' ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {app.full_name}
                    </h4>
                    <p className="text-sm text-gray-600">{app.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Days:</span>{' '}
                        <span className="text-gray-900">{app.preferred_days?.join(', ') || 'Not specified'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Times:</span>{' '}
                        <span className="text-gray-900">{app.preferred_times?.join(', ') || 'Not specified'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Timezone:</span>{' '}
                        <span className="text-gray-900">{app.timezone || 'Pacific/Auckland'}</span>
                      </div>
                    </div>
                    {app.availability_notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        Note: {app.availability_notes}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'pending' ? 'bg-amber-600 text-white' :
                    app.status === 'approved' ? 'bg-green-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {app.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredApplicants.length === 0 && scheduledClasses.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No bookings or applications to display
          </div>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityCalendar;

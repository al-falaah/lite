import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, Filter } from 'lucide-react';
import { applications } from '../../services/supabase';
import Card from '../common/Card';

const AvailabilityCalendar = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Morning', 'Afternoon', 'Evening', 'Night'];

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const { data, error } = await applications.getAll();

      if (error) {
        console.error('Error loading applicants:', error);
        return;
      }

      // Filter only applicants with availability data
      const applicantsWithAvailability = data.filter(
        app => app.preferred_days && app.preferred_days.length > 0
      );

      setApplicants(applicantsWithAvailability);
    } catch (error) {
      console.error('Error loading applicants:', error);
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

  // Get count of applicants available for each day/time combination
  const getAvailabilityCount = (day, time) => {
    return applicants.filter(app =>
      app.preferred_days?.includes(day) &&
      app.preferred_times?.includes(time)
    ).length;
  };

  // Get applicants available for specific day/time
  const getAvailableApplicants = (day, time) => {
    return applicants.filter(app =>
      app.preferred_days?.includes(day) &&
      app.preferred_times?.includes(time)
    );
  };

  // Get intensity color based on count
  const getIntensityColor = (count) => {
    if (count === 0) return 'bg-gray-50 text-gray-400';
    if (count === 1) return 'bg-emerald-100 text-emerald-700';
    if (count <= 3) return 'bg-emerald-200 text-emerald-800';
    if (count <= 5) return 'bg-emerald-300 text-emerald-900';
    return 'bg-emerald-400 text-emerald-950';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-emerald-600" />
            Availability Calendar
          </h2>
          <p className="text-gray-600 mt-1">
            View when applicants are available for classes
          </p>
        </div>
        <div className="text-sm text-gray-600 flex items-center">
          <Users className="h-4 w-4 mr-1" />
          {applicants.length} applicants with availability
        </div>
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

      {/* Heat Map Calendar */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Heat Map</h3>
        <p className="text-sm text-gray-600 mb-4">Darker colors indicate more applicants available</p>

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
                    const count = getAvailabilityCount(day, time);
                    const applicantsForSlot = getAvailableApplicants(day, time);

                    return (
                      <td
                        key={day}
                        className={`border border-gray-200 px-4 py-6 text-center text-sm font-semibold ${getIntensityColor(count)} cursor-pointer hover:opacity-80 transition-opacity`}
                        title={`${count} applicant(s) available`}
                      >
                        <div className="text-lg">{count || '-'}</div>
                        {count > 0 && (
                          <div className="text-xs mt-1 opacity-75">
                            {applicantsForSlot.slice(0, 2).map(app => app.full_name?.split(' ')[0]).join(', ')}
                            {count > 2 && ` +${count - 2}`}
                          </div>
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
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-gray-600">Availability:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-100 border border-emerald-200 rounded"></div>
            <span>1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-200 border border-emerald-300 rounded"></div>
            <span>2-3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-300 border border-emerald-400 rounded"></div>
            <span>4-5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-400 border border-emerald-500 rounded"></div>
            <span>6+</span>
          </div>
        </div>
      </Card>

      {/* Filtered Applicants List */}
      {filteredApplicants.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {filteredApplicants.length === applicants.length ? 'All Applicants' : 'Filtered Applicants'} ({filteredApplicants.length})
          </h3>

          <div className="space-y-3">
            {filteredApplicants.map(app => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{app.full_name}</h4>
                    <p className="text-sm text-gray-600">{app.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Days:</span>{' '}
                        {app.preferred_days?.join(', ') || 'Not specified'}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Times:</span>{' '}
                        {app.preferred_times?.join(', ') || 'Not specified'}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Timezone:</span>{' '}
                        {app.timezone || 'Pacific/Auckland'}
                      </div>
                    </div>
                    {app.availability_notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        Note: {app.availability_notes}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredApplicants.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No applicants match the current filters
          </div>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityCalendar;

// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
  }
});

// Export URL and key for use in Edge Function calls
export { supabaseUrl, supabaseAnonKey };

// Auth helpers
export const auth = {
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`
    });
    return { data, error };
  },

  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }
};

// Profile helpers
export const profiles = {
  get: async (userId) => {
    try {
      console.log('[profiles.get] Starting query for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      console.log('[profiles.get] Query completed. Data:', data, 'Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[profiles.get] Exception:', err);
      return { data: null, error: err };
    }
  },

  update: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  create: async (profile) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  }
};

// Student helpers
export const students = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  create: async (student) => {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    return { data, error };
  },

  update: async (studentId, updates) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();
    return { data, error };
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getById: async (studentId) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        enrollments (
          id,
          program,
          enrolled_date,
          status
        )
      `)
      .eq('id', studentId)
      .single();
    return { data, error };
  },

  // Withdrawal management
  withdraw: async (studentId, withdrawalData) => {
    const { data, error } = await supabase
      .from('students')
      .update({
        status: 'withdrawn',
        withdrawal_date: withdrawalData.withdrawal_date || new Date().toISOString().split('T')[0],
        withdrawal_reason: withdrawalData.withdrawal_reason,
        withdrawal_type: withdrawalData.withdrawal_type || 'voluntary'
      })
      .eq('id', studentId)
      .select()
      .single();
    return { data, error };
  },

  calculateRefund: async (studentId) => {
    const { data, error } = await supabase.rpc('calculate_refund', {
      p_student_id: studentId
    });
    return { data, error };
  },

  processRefund: async (studentId, refundAmount) => {
    const { data, error } = await supabase
      .from('students')
      .update({
        eligible_for_refund: true,
        refund_amount: refundAmount,
        refund_processed: false
      })
      .eq('id', studentId)
      .select()
      .single();
    return { data, error };
  },

  markRefundProcessed: async (studentId) => {
    const { data, error } = await supabase
      .from('students')
      .update({
        refund_processed: true
      })
      .eq('id', studentId)
      .select()
      .single();
    return { data, error };
  }
};

// Application helpers
export const applications = {
  create: async (application) => {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    return { data, error };
  },

  get: async (studentId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getById: async (applicationId) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        students!applications_student_id_fkey (
          *,
          profiles!students_user_id_fkey (
            full_name,
            email,
            phone
          )
        )
      `)
      .eq('id', applicationId)
      .single();
    return { data, error };
  },

  getAll: async (status = null) => {
    let query = supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    return { data, error };
  },

  update: async (applicationId, updates) => {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();
    return { data, error };
  },

  // Invite token management
  generateInviteToken: () => {
    // Generate a secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  createInvite: async (applicationId) => {
    const token = applications.generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const { data, error } = await supabase
      .from('applications')
      .update({
        invite_token: token,
        invite_sent_at: new Date().toISOString(),
        invite_expires_at: expiresAt.toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    return { data, error };
  },

  validateInviteToken: async (token) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'approved')
      .is('account_created_at', null)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Check if token is expired
    const expiresAt = new Date(data.invite_expires_at);
    if (expiresAt < new Date()) {
      return { data: null, error: { message: 'Invite token has expired' } };
    }

    return { data, error: null };
  }
};

// Payment helpers
export const payments = {
  getByStudent: async (studentId) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });
    return { data, error };
  },

  getOverdue: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students!payments_student_id_fkey (
          *,
          profiles!students_user_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', today);
    return { data, error };
  },

  update: async (paymentId, updates) => {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();
    return { data, error };
  },

  create: async (payment) => {
    const { data, error} = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    return { data, error };
  },

  // Upload proof of payment
  uploadProof: async (paymentId, file, bankReference) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${paymentId}-${Date.now()}.${fileExt}`;
    const filePath = `payment-proofs/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('payment-documents')
      .upload(filePath, file);

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment-documents')
      .getPublicUrl(filePath);

    // Update payment record
    const { data, error } = await supabase
      .from('payments')
      .update({
        proof_of_payment_url: publicUrl,
        payment_method: 'bank_transfer',
        bank_reference: bankReference,
        status: 'pending_verification'
      })
      .eq('id', paymentId)
      .select()
      .single();

    return { data, error };
  },

  // Admin verify payment
  verifyPayment: async (paymentId, verifiedBy, notes = null) => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'verified',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', paymentId)
      .select()
      .single();
    return { data, error };
  },

  // Admin reject payment
  rejectPayment: async (paymentId, notes) => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        admin_notes: notes
      })
      .eq('id', paymentId)
      .select()
      .single();
    return { data, error };
  },

  // Get payments pending verification
  getPendingVerification: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students (
          id,
          student_id,
          full_name,
          email,
          phone,
          balance_remaining
        ),
        enrollments (
          id,
          program,
          payment_type,
          total_fees,
          total_paid,
          balance_remaining
        )
      `)
      .eq('status', 'pending')
      .not('proof_of_payment_url', 'is', null)
      .order('created_at', { ascending: false});
    return { data, error };
  }
};

// Lesson notes helpers
export const lessonNotes = {
  getByCohort: async (cohortId) => {
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('lesson_number', { ascending: true });
    return { data, error };
  },

  create: async (lessonNote) => {
    const { data, error } = await supabase
      .from('lesson_notes')
      .insert(lessonNote)
      .select()
      .single();
    return { data, error };
  },

  delete: async (lessonId) => {
    const { error } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('id', lessonId);
    return { error };
  }
};

// Attendance helpers
export const attendance = {
  mark: async (attendanceRecord) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceRecord, {
        onConflict: 'student_id,date'
      })
      .select()
      .single();
    return { data, error };
  },

  getByStudent: async (studentId, startDate, endDate) => {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    return { data, error };
  }
};

// Class schedules helpers
export const classSchedules = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(`
        *,
        students (
          id,
          student_id,
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getByStudent: async (studentId) => {
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('student_id', studentId)
      .order('academic_year', { ascending: true })
      .order('week_number', { ascending: true});
    return { data, error };
  },

  getByStudentId: async (studentId) => {
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('student_id', studentId)
      .order('day_of_week', { ascending: true })
      .order('class_time', { ascending: true });
    return { data, error };
  },

  getScheduled: async () => {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(`
        *,
        students (
          id,
          student_id,
          full_name,
          email,
          phone
        )
      `)
      // Don't filter by status - we need ALL classes (scheduled AND completed) for week progression
      .order('academic_year', { ascending: true })
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
      .order('class_time', { ascending: true });
    return { data, error };
  },

  create: async (schedule) => {
    const { data, error } = await supabase
      .from('class_schedules')
      .insert(schedule)
      .select()
      .single();
    return { data, error };
  },

  update: async (scheduleId, updates) => {
    const { data, error } = await supabase
      .from('class_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();
    return { data, error };
  },

  delete: async (scheduleId) => {
    const { error } = await supabase
      .from('class_schedules')
      .delete()
      .eq('id', scheduleId);
    return { error };
  }
};

// Payment settings helpers (bank account details)
export const paymentSettings = {
  getActive: async () => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    return { data, error };
  },

  update: async (settingsId, updates) => {
    const { data, error } = await supabase
      .from('payment_settings')
      .update(updates)
      .eq('id', settingsId)
      .select()
      .single();
    return { data, error };
  }
};

// Notifications helpers
export const notifications = {
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  },

  markAsRead: async (notificationId) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  },

  create: async (notification) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    return { data, error };
  }
};

// Storage helpers
export const storage = {
  upload: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  delete: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { error };
  }
};

// Teacher helpers
export const teachers = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getById: async (teacherId) => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();
    return { data, error };
  },

  getByStaffId: async (staffId) => {
    const { data, error} = await supabase
      .from('teachers')
      .select('*')
      .eq('staff_id', staffId)
      .single();
    return { data, error };
  },

  getByAuthUserId: async (authUserId) => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    return { data, error };
  },

  create: async (teacher) => {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacher)
      .select()
      .single();
    return { data, error };
  },

  update: async (teacherId, updates) => {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', teacherId)
      .select()
      .single();
    return { data, error };
  },

  delete: async (teacherId) => {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', teacherId);
    return { error };
  },

  // Get teacher with assigned students count
  getWithStats: async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        assignments:teacher_student_assignments(count)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

// Teacher-Student Assignment helpers
export const teacherAssignments = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('teacher_student_assignments')
      .select(`
        *,
        teacher:teachers(*),
        student:students(*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getByTeacher: async (teacherId, status = 'assigned') => {
    let query = supabase
      .from('teacher_student_assignments')
      .select(`
        *,
        student:students(*)
      `)
      .eq('teacher_id', teacherId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });
    return { data, error };
  },

  getByStudent: async (studentId, status = 'assigned') => {
    let query = supabase
      .from('teacher_student_assignments')
      .select(`
        *,
        teacher:teachers(*)
      `)
      .eq('student_id', studentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });
    return { data, error };
  },

  assign: async (teacherId, studentId, program, notes = null) => {
    const { data, error } = await supabase
      .from('teacher_student_assignments')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        program,
        status: 'assigned',
        notes
      })
      .select()
      .single();
    return { data, error };
  },

  remove: async (assignmentId) => {
    const { data, error } = await supabase
      .from('teacher_student_assignments')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select()
      .single();
    return { data, error };
  },

  delete: async (assignmentId) => {
    const { error } = await supabase
      .from('teacher_student_assignments')
      .delete()
      .eq('id', assignmentId);
    return { error };
  }
};
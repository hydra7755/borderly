import { supabase } from '../supabase/client';
import authService from './auth';

export interface UpcomingTrip {
  id: string;
  destination: string;
  departure_date: string;
  return_date: string;
  dates?: string;
  status?: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    uploaded: string;
  }[];
}

const TRIPS_STORAGE_KEY = 'travelscore_trips';

const getStoredTrips = (userId: string): UpcomingTrip[] => {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, UpcomingTrip[]>;
    return all[userId] ?? [];
  } catch {
    return [];
  }
};

const saveStoredTrips = (userId: string, trips: UpcomingTrip[]) => {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, UpcomingTrip[]>) : {};
    all[userId] = trips;
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
};

const formatTripDates = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.toLocaleString('default', { month: 'short' });
  const endMonth = end.toLocaleString('default', { month: 'short' });

  if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
};

const mapRowToTrip = (row: any): UpcomingTrip => {
  const departure = row.start_date?.split('T')[0] ?? row.start_date ?? row.departure_date ?? '';
  const returnDate = row.end_date?.split('T')[0] ?? row.end_date ?? row.return_date ?? '';
  return {
    id: row.id,
    destination: row.destination,
    departure_date: departure,
    return_date: returnDate,
    dates: row.dates ?? (departure && returnDate ? formatTripDates(departure, returnDate) : undefined),
    status: row.status ?? 'Planned',
    documents: row.documents ?? [],
  };
};

const ensureUserProfile = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
  try {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) || 'User',
      },
      { onConflict: 'id' }
    );
  } catch {
    // Profile sync is best-effort; trips can still save locally
  }
};

const tripsService = {
  async getUserTrips(): Promise<{ trips: UpcomingTrip[]; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { trips: [], error: authError || new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('upcoming_trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (!error && data?.length) {
        return { trips: data.map(mapRowToTrip), error: null };
      }

      const stored = getStoredTrips(user.id);
      return { trips: stored, error: error && stored.length === 0 ? error : null };
    } catch (error) {
      return { trips: [], error: error as Error };
    }
  },

  async createTrip(trip: Omit<UpcomingTrip, 'id'>): Promise<{ trip: UpcomingTrip | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { trip: null, error: authError || new Error('Not authenticated') };
      }

      await ensureUserProfile(user);

      const { data, error } = await supabase
        .from('upcoming_trips')
        .insert({
          user_id: user.id,
          destination: trip.destination,
          start_date: trip.departure_date,
          end_date: trip.return_date || null,
          status: trip.status?.toLowerCase() ?? 'planned',
        })
        .select()
        .single();

      if (!error && data) {
        return { trip: mapRowToTrip(data), error: null };
      }

      const fallbackTrip: UpcomingTrip = {
        id: crypto.randomUUID(),
        destination: trip.destination,
        departure_date: trip.departure_date,
        return_date: trip.return_date,
        dates: trip.dates,
        status: trip.status ?? 'Planned',
        documents: [],
      };

      const stored = getStoredTrips(user.id);
      saveStoredTrips(user.id, [...stored, fallbackTrip]);

      return { trip: fallbackTrip, error: null };
    } catch (error) {
      return { trip: null, error: error as Error };
    }
  },

  async deleteTrip(tripId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { success: false, error: authError || new Error('Not authenticated') };
      }

      const { error } = await supabase
        .from('upcoming_trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user.id);

      const stored = getStoredTrips(user.id).filter((t) => t.id !== tripId);
      saveStoredTrips(user.id, stored);

      return { success: !error, error: error ?? null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  async updateTripStatus(
    tripId: string,
    status: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { success: false, error: authError || new Error('Not authenticated') };
      }

      const { error } = await supabase
        .from('upcoming_trips')
        .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
        .eq('id', tripId)
        .eq('user_id', user.id);

      const stored = getStoredTrips(user.id).map((t) =>
        t.id === tripId ? { ...t, status } : t
      );
      saveStoredTrips(user.id, stored);

      return { success: !error, error: error ?? null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },
};

export default tripsService;

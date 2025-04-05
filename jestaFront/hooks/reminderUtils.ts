import * as Calendar from 'expo-calendar';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';



interface ReminderData {
  calendarEventId?: string;
  lastScheduledAt?: string;
  lastSeenServiceHash?: string;
}


const generateServiceHash = (service: any): string => {
  const data = {
    title: service.title,
    location: service.location,
    start: service.date_time_range?.[0],
    end: service.date_time_range?.[1],
    description: service.description,
    offered_payment: service.offered_payment,
    tags: service.tags,
  };
  return JSON.stringify(data);
};



const getReminderStorageKey = (serviceId: number) => `reminder_${serviceId}`;

export const saveReminderIds = async (serviceId: number, data: ReminderData) => {
  try {
    await AsyncStorage.setItem(getReminderStorageKey(serviceId), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save reminder ID:', e);
  }
};

export const getReminderIds = async (serviceId: number): Promise<ReminderData | null> => {
  try {
    const data = await AsyncStorage.getItem(getReminderStorageKey(serviceId));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get reminder ID:', e);
    return null;
  }
};

export const removeReminderIds = async (serviceId: number) => {
  try {
    await AsyncStorage.removeItem(getReminderStorageKey(serviceId));
  } catch (e) {
    console.error('Failed to remove reminder ID:', e);
  }
};

export const cancelReminders = async (serviceId: number) => {
  const data = await getReminderIds(serviceId);
  if (!data?.calendarEventId) return;

  try {
    await Calendar.deleteEventAsync(data.calendarEventId);
  } catch (e: any) {
    if (e?.message?.includes('could not be deleted')) {
      console.warn(`Calendar event ${data.calendarEventId} could not be deleted (already removed or restricted)`);
    } else {
      console.error('Failed to cancel calendar event:', e);
    }
  }

  await removeReminderIds(serviceId);
};


export const isReminderOutdated = async (service: any): Promise<boolean> => {
  const reminder = await getReminderIds(service.id);

  if (!reminder?.lastSeenServiceHash) {
    return false;
  }

  const currentHash = generateServiceHash(service);
  const isOutdated = currentHash !== reminder.lastSeenServiceHash;



  return isOutdated;
};



export const scheduleServiceReminders = async (service: any) => {
  const startTime = new Date(service.date_time_range[0]);
  const endTime = new Date(service.date_time_range[1]);

  if (!Device.isDevice || isNaN(startTime.getTime())) return;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const modifiable = calendars.find(cal => cal.allowsModifications);
  if (!modifiable) return;

  const existing = await getReminderIds(service.id);
  if (existing?.calendarEventId) {
    try {
      const existingEvent = await Calendar.getEventAsync(existing.calendarEventId);
      if (existingEvent) {
        console.log('Event already exists, skipping duplicate creation.');
        return; 
      }
    } catch (e) {
      console.log('Previous event not found, continuing to create a new one.');
    }
  }

  const notes = `
📌 ${service.title}
📍 Location: ${service.location}
🕒 ${startTime.toLocaleString()} - ${endTime.toLocaleString()}
💰 ${service.offered_payment > 0 ? `₪${service.offered_payment}` : service.is_volunteering ? 'Volunteering' : 'Free'}
🏷️ Tags: ${(service.tags || []).join(', ')}

📝 ${service.description || 'No description provided.'}
  `.trim();

  const eventId = await Calendar.createEventAsync(modifiable.id, {
    title: service.title,
    startDate: startTime,
    endDate: endTime,
    location: service.location,
    notes,
    timeZone: 'UTC',
    alarms: [
      { relativeOffset: -60 },        // 1 hour before
      { relativeOffset: -24 * 60 },   // 1 day before
    ],
  });

  await saveReminderIds(service.id, {
    calendarEventId: eventId,
    lastScheduledAt: new Date().toISOString(),
    lastSeenServiceHash: generateServiceHash(service),
  });
};


  

export const updateReminders = async (service: any) => {
  const existing = await getReminderIds(service.id);

  const currentHash = generateServiceHash(service);
  if (existing?.lastSeenServiceHash === currentHash) {
    console.log("Reminder already matches current service — skipping update.");
    return; 
  }

  if (existing?.calendarEventId) {
    try {
      await Calendar.deleteEventAsync(existing.calendarEventId);
    } catch (e) {
      console.warn("Failed to delete previous calendar event:", e?.message || e);
    }
  }

  await scheduleServiceReminders(service);
};

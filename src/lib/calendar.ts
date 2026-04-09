import * as Calendar from "expo-calendar";
import { Platform, Alert } from "react-native";

interface GameEvent {
  title: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  venue?: string | null;
  sport: string;
  notes?: string;
}

async function getOrCreateCalendar(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Denied", "Calendar access is needed to export games.");
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  const dayloCalendar = calendars.find((c) => c.title === "Daylo Games");
  if (dayloCalendar) return dayloCalendar.id;

  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    const newId = await Calendar.createCalendarAsync({
      title: "Daylo Games",
      color: "#F97316",
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendar.source.id,
      source: defaultCalendar.source,
      name: "Daylo Games",
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newId;
  } else {
    const sources = calendars.filter(
      (c) => c.source?.isLocalAccount || c.source?.name === "Default"
    );
    const source = sources.length > 0 ? sources[0].source : calendars[0]?.source;
    if (!source) return null;

    const newId = await Calendar.createCalendarAsync({
      title: "Daylo Games",
      color: "#F97316",
      entityType: Calendar.EntityTypes.EVENT,
      source,
      name: "Daylo Games",
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newId;
  }
}

function parseDateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function exportGameToCalendar(game: GameEvent): Promise<boolean> {
  try {
    const calendarId = await getOrCreateCalendar();
    if (!calendarId) return false;

    const startDate = parseDateTime(game.date, game.timeStart);
    const endDate = parseDateTime(game.date, game.timeEnd);

    await Calendar.createEventAsync(calendarId, {
      title: `${game.sport.charAt(0).toUpperCase() + game.sport.slice(1)} Game — ${game.title}`,
      startDate,
      endDate,
      location: game.venue || undefined,
      notes: game.notes || `Daylo scheduled game`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
    });

    Alert.alert("Exported", "Game has been added to your Daylo Games calendar.");
    return true;
  } catch (error) {
    console.error("Calendar export error:", error);
    Alert.alert("Error", "Failed to export game to calendar.");
    return false;
  }
}

export async function exportMultipleGames(games: GameEvent[]): Promise<number> {
  const calendarId = await getOrCreateCalendar();
  if (!calendarId) return 0;

  let count = 0;
  for (const game of games) {
    try {
      const startDate = parseDateTime(game.date, game.timeStart);
      const endDate = parseDateTime(game.date, game.timeEnd);

      await Calendar.createEventAsync(calendarId, {
        title: `${game.sport.charAt(0).toUpperCase() + game.sport.slice(1)} Game — ${game.title}`,
        startDate,
        endDate,
        location: game.venue || undefined,
        notes: game.notes || `Daylo scheduled game`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
      });
      count++;
    } catch (error) {
      console.error("Failed to export game:", error);
    }
  }

  Alert.alert("Exported", `${count} game${count !== 1 ? "s" : ""} added to your calendar.`);
  return count;
}

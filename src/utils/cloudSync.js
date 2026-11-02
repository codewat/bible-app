import { 
  getBookmarks, 
  getHighlights, 
  getNotes, 
  saveMergedUserData 
} from './storage';
import { 
  fetchCloudUserData, 
  saveCloudUserData, 
  subscribeToCloudUserData 
} from './firebase';

// Helper to merge two maps by timestamp
function mergeMapsByDate(localMap = {}, cloudMap = {}, dateKey = 'savedAt') {
  const merged = { ...cloudMap };

  for (const [key, localItem] of Object.entries(localMap)) {
    const cloudItem = cloudMap[key];
    if (!cloudItem) {
      merged[key] = localItem;
    } else {
      const localTime = new Date(localItem[dateKey] || 0).getTime();
      const cloudTime = new Date(cloudItem[dateKey] || 0).getTime();
      merged[key] = localTime >= cloudTime ? localItem : cloudItem;
    }
  }

  return merged;
}

// Initial Sync when user logs in: merges local and cloud, updates both
export async function performInitialSync(userId) {
  if (!userId) return null;

  try {
    const localBookmarks = getBookmarks();
    const localHighlights = getHighlights();
    const localNotes = getNotes();

    const cloudData = await fetchCloudUserData(userId);

    const mergedBookmarks = mergeMapsByDate(localBookmarks, cloudData?.bookmarks, 'savedAt');
    const mergedHighlights = mergeMapsByDate(localHighlights, cloudData?.highlights, 'updatedAt');
    const mergedNotes = mergeMapsByDate(localNotes, cloudData?.notes, 'updatedAt');

    const mergedAll = {
      bookmarks: mergedBookmarks,
      highlights: mergedHighlights,
      notes: mergedNotes,
    };

    // Save to local storage
    saveMergedUserData(mergedAll);

    // Save to Firestore cloud
    await saveCloudUserData(userId, mergedAll);

    return mergedAll;
  } catch (err) {
    console.error('Initial sync error:', err);
    return null;
  }
}

// Push local changes to cloud
export async function pushToCloud(userId, data) {
  if (!userId) return;
  try {
    await saveCloudUserData(userId, data);
  } catch (err) {
    console.error('Failed to push data to cloud:', err);
  }
}

// Subscribe to real-time updates from cloud (e.g. from another device)
export function startRealtimeCloudSync(userId, onUpdate) {
  if (!userId) return () => {};

  return subscribeToCloudUserData(userId, (cloudData) => {
    if (!cloudData) return;

    const localBookmarks = getBookmarks();
    const localHighlights = getHighlights();
    const localNotes = getNotes();

    const mergedBookmarks = mergeMapsByDate(localBookmarks, cloudData.bookmarks, 'savedAt');
    const mergedHighlights = mergeMapsByDate(localHighlights, cloudData.highlights, 'updatedAt');
    const mergedNotes = mergeMapsByDate(localNotes, cloudData.notes, 'updatedAt');

    const merged = {
      bookmarks: mergedBookmarks,
      highlights: mergedHighlights,
      notes: mergedNotes,
    };

    saveMergedUserData(merged);
    onUpdate(merged);
  });
}


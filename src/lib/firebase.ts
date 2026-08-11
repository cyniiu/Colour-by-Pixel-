import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PixelArtwork, SavedProgress } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database instance with custom Database ID if present
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// Authentication helper (Anonymous auth for zero-friction auto cloud sync)
export function ensureAuthenticated(onUserReady: (user: User | { uid: string }) => void) {
  return onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      onUserReady(currentUser);
    } else {
      try {
        const userCred = await signInAnonymously(auth);
        onUserReady(userCred.user);
      } catch (err: any) {
        if (err?.code === 'auth/admin-restricted-operation' || err?.message?.includes('admin-restricted-operation')) {
          console.info('Firebase anonymous auth is disabled; operating in local device storage mode.');
        } else {
          console.warn('Anonymous sign in unavailable, operating in local storage mode:', err);
        }
        let localUid = localStorage.getItem('pixel_guest_uid');
        if (!localUid) {
          localUid = 'local_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
          localStorage.setItem('pixel_guest_uid', localUid);
        }
        onUserReady({ uid: localUid });
      }
    }
  });
}

// Sync All User Progress to Cloud
export async function syncProgressToCloud(userId: string, artworkId: string, progress: SavedProgress) {
  if (!userId || !auth.currentUser) return;
  try {
    const ref = doc(db, 'users', userId, 'progress', artworkId);
    await setDoc(ref, {
      paintedGrid: progress.paintedGrid,
      isCompleted: progress.isCompleted,
      timeSpentSeconds: progress.timeSpentSeconds || 0,
      lastModified: progress.lastModified || Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error(`Error saving cloud progress for artwork ${artworkId}:`, err);
  }
}

// Fetch All Progress from Cloud
export async function fetchAllProgressFromCloud(userId: string): Promise<Record<string, SavedProgress>> {
  if (!userId || !auth.currentUser) return {};
  try {
    const colRef = collection(db, 'users', userId, 'progress');
    const snapshot = await getDocs(colRef);
    const result: Record<string, SavedProgress> = {};
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        result[docSnap.id] = docSnap.data() as SavedProgress;
      }
    });
    return result;
  } catch (err) {
    console.error('Error fetching cloud progress:', err);
    return {};
  }
}

// Delete Progress from Cloud
export async function deleteProgressFromCloud(userId: string, artworkId: string) {
  if (!userId || !auth.currentUser) return;
  try {
    const ref = doc(db, 'users', userId, 'progress', artworkId);
    await deleteDoc(ref);
  } catch (err) {
    console.error(`Error deleting cloud progress for artwork ${artworkId}:`, err);
  }
}

// Save Custom Artwork to Cloud
export async function saveCustomArtworkToCloud(userId: string, artwork: PixelArtwork) {
  if (!userId || !auth.currentUser) return;
  try {
    const ref = doc(db, 'users', userId, 'customArtworks', artwork.id);
    await setDoc(ref, artwork, { merge: true });
  } catch (err) {
    console.error(`Error saving custom artwork ${artwork.id} to cloud:`, err);
  }
}

// Fetch Custom Artworks from Cloud
export async function fetchCustomArtworksFromCloud(userId: string): Promise<PixelArtwork[]> {
  if (!userId || !auth.currentUser) return [];
  try {
    const colRef = collection(db, 'users', userId, 'customArtworks');
    const snapshot = await getDocs(colRef);
    const artworks: PixelArtwork[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        artworks.push(docSnap.data() as PixelArtwork);
      }
    });
    return artworks;
  } catch (err) {
    console.error('Error fetching custom artworks from cloud:', err);
    return [];
  }
}

// Delete Custom Artwork from Cloud
export async function deleteCustomArtworkFromCloud(userId: string, artworkId: string) {
  if (!userId || !auth.currentUser) return;
  try {
    const ref = doc(db, 'users', userId, 'customArtworks', artworkId);
    await deleteDoc(ref);
    await deleteProgressFromCloud(userId, artworkId);
  } catch (err) {
    console.error(`Error deleting custom artwork ${artworkId} from cloud:`, err);
  }
}

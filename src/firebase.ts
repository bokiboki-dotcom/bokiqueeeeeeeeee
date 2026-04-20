import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, increment, where, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => auth.signOut();

export interface UserProfile {
  uid: string;
  accountId: string; // Unique user ID (like @user123)
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  totalFocusTime: number;
  totalQuizzesSolved: number;
  createdAt: string;
  title?: string;
  titles?: string[];
  currentIcon?: string;
  purchasedIcons?: string[];
  currentColor?: string;
  purchasedColors?: string[];
  achievements?: string[];
  isPrivate?: boolean;
  streak?: number;
  lastDate?: string;
}

export const syncUserProfile = async (user: FirebaseUser) => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Generate a unique 6-digit numeric ID for RPG feel
    const accountId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newProfile: UserProfile = {
      uid: user.uid,
      accountId: accountId,
      displayName: user.displayName || '名もなき冒険者',
      photoURL: user.photoURL || '',
      xp: 0,
      level: 1,
      totalFocusTime: 0,
      totalQuizzesSolved: 0,
      createdAt: new Date().toISOString(),
      title: '新人',
      titles: ['新人'],
      currentIcon: 'Sword',
      purchasedIcons: ['Sword'],
      currentColor: '#F59E0B',
      purchasedColors: ['#F59E0B'],
      achievements: [],
      isPrivate: false
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
  
  const existingProfile = userDoc.data() as UserProfile;
  let needsUpdate = false;
  const updates: any = {};

  // Fallback for existing users without new fields
  if (!existingProfile.accountId) {
    updates.accountId = Math.floor(100000 + Math.random() * 900000).toString();
    existingProfile.accountId = updates.accountId;
    needsUpdate = true;
  }
  if (!existingProfile.titles) {
    updates.titles = [existingProfile.title || '新人'];
    existingProfile.titles = updates.titles;
    needsUpdate = true;
  }
  if (!existingProfile.purchasedIcons) {
    updates.purchasedIcons = [existingProfile.currentIcon || 'Sword'];
    existingProfile.purchasedIcons = updates.purchasedIcons;
    needsUpdate = true;
  }
  if (!existingProfile.purchasedColors) {
    updates.purchasedColors = [existingProfile.currentColor || '#F59E0B'];
    existingProfile.purchasedColors = updates.purchasedColors;
    needsUpdate = true;
  }
  if (existingProfile.isPrivate === undefined) {
    updates.isPrivate = false;
    existingProfile.isPrivate = false;
    needsUpdate = true;
  }

  if (!existingProfile.achievements) {
    updates.achievements = [];
    existingProfile.achievements = updates.achievements;
    needsUpdate = true;
  }
  if (existingProfile.streak === undefined) {
    updates.streak = 0;
    existingProfile.streak = 0;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await updateDoc(userRef, updates);
  }
  
  return existingProfile;
};

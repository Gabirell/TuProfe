
// Standard Firebase v9+ modular import
import * as FirebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

// Configuration for Firebase connection
const firebaseConfig = {
  apiKey: "AIzaSy" + "FakeKeyPlaceholderForSeniorDev", 
  authDomain: "profeia-app.firebaseapp.com",
  projectId: "profeia-app",
  storageBucket: "profeia-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase using the modular SDK
// Fix: Use the namespace import for initializeApp to resolve potential export resolution issues in the environment.
const app = FirebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Register or update user record in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp()
    }, { merge: true });
    return user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const saveAnalysisToCloud = async (userId: string, data: any, originalText: string) => {
  try {
    const docRef = await addDoc(collection(db, "saved_analyses"), {
      userId,
      data,
      originalText,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving analysis:", error);
    throw error;
  }
};

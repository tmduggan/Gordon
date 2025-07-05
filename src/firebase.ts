import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBuxTa1BC-QdKY4DtMWKzNNorjHfkbEXik',
  authDomain: 'food-tracker-19c9d.firebaseapp.com',
  projectId: 'food-tracker-19c9d',
  storageBucket: 'food-tracker-19c9d.appspot.com',
  messagingSenderId: '961928172022',
  appId: '1:961928172022:web:9a85ac5ae45a10de35b7d7',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut }; 
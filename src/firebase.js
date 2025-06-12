import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBuxTa1BC-QdKY4DtMWKzNNorjHfkbEXik",
    authDomain: "food-tracker-19c9d.firebaseapp.com",
    projectId: "food-tracker-19c9d",
    storageBucket: "food-tracker-19c9d.appspot.com",
    messagingSenderId: "961928172022",
    appId: "1:961928172022:web:9a85ac5ae45a10de35b7d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

export { db }; 
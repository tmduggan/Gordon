import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuxTa1BC-QdKY4DtMWKzNNorjHfkbEXik",
  authDomain: "food-tracker-19c9d.firebaseapp.com",
  projectId: "food-tracker-19c9d",
  storageBucket: "food-tracker-19c9d.appspot.com",
  messagingSenderId: "961928172022",
  appId: "1:961928172022:web:9a85ac5ae45a10de35b7d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const foodsQuery = query(collection(db, 'foods'), where('label', '==', 'Banana'));
    const existing = await getDocs(foodsQuery);
    console.log('Query succeeded:', existing.docs.map(doc => doc.data()));
  } catch (err) {
    console.error('Query failed:', err);
  }
}

test(); 
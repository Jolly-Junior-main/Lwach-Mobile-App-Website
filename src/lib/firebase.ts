import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJbJkcEbJOfiugVmFLnhZ6KrMRTHYryUk",
  authDomain: "intrepid-envoy-wtxfk.firebaseapp.com",
  projectId: "intrepid-envoy-wtxfk",
  storageBucket: "intrepid-envoy-wtxfk.firebasestorage.app",
  messagingSenderId: "533237225947",
  appId: "1:533237225947:web:9be8b6d9dccba5872caffe",
  firestoreDatabaseId: "ai-studio-16d87ddd-e57f-4c82-aea6-e9b87a2b7eea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  writeBatch
};

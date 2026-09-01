// js/firebase-config.js

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCXyKSTlmlzkYnH2LW408cVVWV1CPvlfBo",
    authDomain: "cmfilings-6a37c.firebaseapp.com",
    projectId: "cmfilings-6a37c",
    storageBucket: "cmfilings-6a37c.firebasestorage.app",
    messagingSenderId: "138705123778",
    appId: "1:138705123778:web:9561bff9f0f5d89bb6fe5b",
    measurementId: "G-09DM4NZF8D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export for all BizOdit modules
export {
    app,
    auth,
    db,
    storage,
    firebaseConfig
};
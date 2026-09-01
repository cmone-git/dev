import {firebaseConfig} from './firebase-config.js';
export function firebaseConfigured(){return !Object.values(firebaseConfig).some(v=>String(v).includes('YOUR_'))}
export function currentUser(){return window.firebase?.auth?.().currentUser||null}
export async function signOut(){try{if(window.firebase?.auth)await window.firebase.auth().signOut()}catch(e){}location.href='./signin.html'}

// firebase.js - Firebase configuration and database functions

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, set, push, get, remove, update, child } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcOdm4X3UC4AKrt_cqU9lCU00jqZ58FAM",
  authDomain: "final-instructions.firebaseapp.com",
  databaseURL: "https://final-instructions-default-rtdb.firebaseio.com",
  projectId: "final-instructions",
  storageBucket: "final-instructions.firebasestorage.app",
  messagingSenderId: "5552628099",
  appId: "1:5552628099:web:d7b714785180efc9d016b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Database references
const tracksRef = ref(database, 'tracks');
const instructionsRef = ref(database, 'instructions');

// Tracks functions
export async function getAllTracks() {
  const snapshot = await get(tracksRef);
  return snapshot.exists() ? snapshot.val() : {};
}

export async function getTrack(trackId) {
  const snapshot = await get(child(tracksRef, trackId));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveTrack(track, trackId = null) {
  if (trackId) {
    return update(child(tracksRef, trackId), track);
  } else {
    return push(tracksRef, track);
  }
}

export async function deleteTrack(trackId) {
  return remove(child(tracksRef, trackId));
}

// Instructions functions
export async function getAllInstructions() {
  const snapshot = await get(instructionsRef);
  return snapshot.exists() ? snapshot.val() : {};
}

export async function getInstruction(instructionId) {
  const snapshot = await get(child(instructionsRef, instructionId));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveInstruction(instruction, instructionId = null) {
  if (instructionId) {
    return update(child(instructionsRef, instructionId), instruction);
  } else {
    return push(instructionsRef, instruction);
  }
}

export async function deleteInstruction(instructionId) {
  return remove(child(instructionsRef, instructionId));
}

// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Make sure to import all these, as they are used in this file
import { firebaseConfig, users, CURRENT_ROUND, SUBMISSION_DEADLINE, VOTING_DEADLINE } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // db is defined here

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isBefore(dateStr) {
  return todayDate() <= parseDate(dateStr);
}

async function getSubmittedUsers() {
  const snap = await getDocs(query(collection(db, "books"), where("round", "==", CURRENT_ROUND)));
  const submitted = new Set();
  snap.forEach(doc => submitted.add(doc.data().userId));
  return submitted;
}

async function getVotedUsers() {
  const snap = await getDocs(query(collection(db, "votes"), where("round", "==", CURRENT_ROUND)));
  const voted = new Set();
  snap.forEach(doc => voted.add(doc.data().userId));
  return voted;
}

export async function initApp() {
  const container = document.getElementById("app");
  const route = window.location.hash;

  // If specifically going to books view
  if (route === "#books") {
    const mod = await import('./views/books.js');
    mod.renderBooks(container, db);
    return;
  }

  // Default behavior for main app (no hash or empty hash)
  const submitted = await getSubmittedUsers();
  const voted = await getVotedUsers();

  if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
    const mod = await import('./views/nomination.js?v=${Date.now()}');
    mod.renderNomination(container, db);
  } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
    const mod = await import('./views/voting.js?v=${Date.now()}');
    // Pass db, users, CURRENT_ROUND, VOTING_DEADLINE to renderVoting
    mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
  } else {
    const mod = await import('./views/results.js?v=${Date.now()}');
    mod.renderResults(container, db); // Pass db to results view too
  }
}

// Back button from Books view
export async function goToMain() {
  const container = document.getElementById("app");
  
  const submitted = await getSubmittedUsers();
  const voted = await getVotedUsers();

  if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
    const mod = await import('./views/nomination.js?v=${Date.now()}');
    mod.renderNomination(container, db);
  } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
    const mod = await import('./views/voting.js?v=${Date.now()}');
    mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
  } else {
    const mod = await import('./views/results.js?v=${Date.now()}');
    mod.renderResults(container, db);
  }
}

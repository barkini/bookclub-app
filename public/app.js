// app.js - Debug version
console.log('app.js: Starting to load...');

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

console.log('app.js: Firebase imports successful');

// Make sure to import all these, as they are used in this file
import { firebaseConfig, users, CURRENT_ROUND, SUBMISSION_DEADLINE, VOTING_DEADLINE } from './config.js';

console.log('app.js: Config imports successful', { users, CURRENT_ROUND, SUBMISSION_DEADLINE, VOTING_DEADLINE });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('app.js: Firebase initialized');

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
  console.log('app.js: Getting submitted users...');
  try {
    const snap = await getDocs(query(collection(db, "books"), where("round", "==", CURRENT_ROUND)));
    const submitted = new Set();
    snap.forEach(doc => submitted.add(doc.data().userId));
    console.log('app.js: Submitted users:', Array.from(submitted));
    return submitted;
  } catch (error) {
    console.error('app.js: Error getting submitted users:', error);
    throw error;
  }
}

async function getVotedUsers() {
  console.log('app.js: Getting voted users...');
  try {
    const snap = await getDocs(query(collection(db, "votes"), where("round", "==", CURRENT_ROUND)));
    const voted = new Set();
    snap.forEach(doc => voted.add(doc.data().userId));
    console.log('app.js: Voted users:', Array.from(voted));
    return voted;
  } catch (error) {
    console.error('app.js: Error getting voted users:', error);
    throw error;
  }
}

export async function initApp() {
  console.log('app.js: initApp() called');
  
  try {
    const container = document.getElementById("app");
    const route = window.location.hash;

    console.log('app.js: Current route:', route);

    // If specifically going to books view
    if (route === "#books") {
      console.log('app.js: Loading books view...');
      const mod = await import('./views/books.js');
      await mod.renderBooks(container, db);
      console.log('app.js: Books view loaded');
      return;
    }

    // Default behavior for main app (no hash or empty hash)
    console.log('app.js: Getting user submission/voting status...');
    const submitted = await getSubmittedUsers();
    const voted = await getVotedUsers();

    console.log('app.js: Status check:', {
      submittedCount: submitted.size,
      totalUsers: users.length,
      votedCount: voted.size,
      submissionDeadlineValid: isBefore(SUBMISSION_DEADLINE),
      votingDeadlineValid: isBefore(VOTING_DEADLINE)
    });

    if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
      console.log('app.js: Loading nomination view...');
      const mod = await import('./views/nomination.js');
      await mod.renderNomination(container, db);
      console.log('app.js: Nomination view loaded');
    } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
      console.log('app.js: Loading voting view...');
      const mod = await import('./views/voting.js');
      await mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
      console.log('app.js: Voting view loaded');
    } else {
      console.log('app.js: Loading results view...');
      const mod = await import('./views/results.js');
      await mod.renderResults(container, db);
      console.log('app.js: Results view loaded');
    }
    
    console.log('app.js: initApp() completed successfully');
  } catch (error) {
    console.error('app.js: Error in initApp:', error);
    const container = document.getElementById("app");
    container.innerHTML = `
      <div class="book-block error" style="text-align: center;">
        <h2>🚫 Error Loading App</h2>
        <p>There was an error loading the book club app: ${error.message}</p>
        <p style="font-size: 0.9rem; margin-top: 1rem; color: #666;">Check the browser console for more details.</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">
          🔄 Refresh Page
        </button>
      </div>
    `;
    throw error;
  }
}

// Back button from Books view
export async function goToMain() {
  console.log('app.js: goToMain() called');
  
  try {
    const container = document.getElementById("app");
    
    const submitted = await getSubmittedUsers();
    const voted = await getVotedUsers();

    if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
      const mod = await import('./views/nomination.js');
      await mod.renderNomination(container, db);
    } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
      const mod = await import('./views/voting.js');
      await mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
    } else {
      const mod = await import('./views/results.js');
      await mod.renderResults(container, db);
    }
    
    console.log('app.js: goToMain() completed successfully');
  } catch (error) {
    console.error('app.js: Error in goToMain:', error);
    const container = document.getElementById("app");
    container.innerHTML = `
      <div class="book-block error" style="text-align: center;">
        <h2>🚫 Navigation Error</h2>
        <p>There was an error navigating: ${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">
          🔄 Refresh Page
        </button>
      </div>
    `;
    throw error;
  }
}

console.log('app.js: Module loaded successfully');

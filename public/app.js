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
  try {
    const container = document.getElementById("app");
    const route = window.location.hash;

    // If specifically going to books view
    if (route === "#books") {
      const mod = await import('./views/books.js');
      await mod.renderBooks(container, db);
      return;
    }

    // Default behavior for main app (no hash or empty hash)
    const submitted = await getSubmittedUsers();
    const voted = await getVotedUsers();

    if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
      const mod = await import(`./views/nomination.js?v=${Date.now()}`);
      await mod.renderNomination(container, db);
    } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
      const mod = await import(`./views/voting.js?v=${Date.now()}`);
      // Pass db, users, CURRENT_ROUND, VOTING_DEADLINE to renderVoting
      await mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
    } else {
      const mod = await import(`./views/results.js?v=${Date.now()}`);
      await mod.renderResults(container, db); // Pass db to results view too
    }
  } catch (error) {
    console.error('Error in initApp:', error);
    const container = document.getElementById("app");
    container.innerHTML = `
      <div class="book-block error" style="text-align: center;">
        <h2>🚫 Error Loading App</h2>
        <p>There was an error loading the book club app: ${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

// Back button from Books view
export async function goToMain() {
  try {
    const container = document.getElementById("app");
    
    const submitted = await getSubmittedUsers();
    const voted = await getVotedUsers();

    if (submitted.size < users.length && isBefore(SUBMISSION_DEADLINE)) {
      const mod = await import(`./views/nomination.js?v=${Date.now()}`);
      await mod.renderNomination(container, db);
    } else if (submitted.size === users.length && voted.size < users.length && isBefore(VOTING_DEADLINE)) {
      const mod = await import(`./views/voting.js?v=${Date.now()}`);
      await mod.renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, voted);
    } else {
      const mod = await import(`./views/results.js?v=${Date.now()}`);
      await mod.renderResults(container, db);
    }
  } catch (error) {
    console.error('Error in goToMain:', error);
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
  }
}

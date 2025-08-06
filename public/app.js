import { renderNominations } from "./views/nominations.js";
import { renderVoting } from "./views/voting.js";
import { renderResults } from "./views/results.js";
import { renderBooks } from "./views/books.js";
import { CURRENT_ROUND, SUBMISSION_DEADLINE, VOTING_DEADLINE, users } from "./config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const appElement = document.getElementById("app");

// Utility: show loading
function showLoading() {
  appElement.innerHTML = "<p>Loading...</p>";
}

// Utility: format timestamp for display
function formatDate(ts) {
  const date = ts.toDate();
  return date.toLocaleString("default", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Main routing logic based on URL hash
async function loadView() {
  showLoading();

  const hash = window.location.hash;

  if (hash === "#nominations") {
    renderNominations(db);
  } else if (hash === "#voting") {
    const booksRef = collection(db, "books");
    const snapshot = await getDocs(query(booksRef, where("round", "==", CURRENT_ROUND)));
    const books = snapshot.docs.map(doc => doc.data());

    // Deduplicate books by title
    const dedupedBooks = Array.from(new Map(books.map(book => [book.title, book])).values());

    const votesRef = collection(db, "votes");
    const voteSnapshot = await getDocs(query(votesRef, where("round", "==", CURRENT_ROUND)));

    // Get users who already voted
    const votedUsersSet = new Set(voteSnapshot.docs.map(doc => doc.data().userId));

    renderVoting(db, dedupedBooks, users, votedUsersSet);
  } else if (hash === "#results") {
    const votesRef = collection(db, "votes");
    const snapshot = await getDocs(query(votesRef, where("round", "==", CURRENT_ROUND)));
    const votes = snapshot.docs.map(doc => doc.data());
    renderResults(votes);
  } else if (hash === "#books") {
    renderBooks(db);
  } else {
    // Default view — show countdowns and phase
    const now = new Date();
    const submissionDeadline = new Date(SUBMISSION_DEADLINE);
    const votingDeadline = new Date(VOTING_DEADLINE);

    let content = "";

    if (now < submissionDeadline) {
      const daysLeft = Math.ceil((submissionDeadline - now) / (1000 * 60 * 60 * 24));
      content += `<h2>📚 Submissions are open!</h2>`;
      content += `<p>${daysLeft} day(s) left to submit your books.</p>`;
      content += `<a href="#nominations">Submit Now</a>`;
    } else if (now < votingDeadline) {
      const daysLeft = Math.ceil((votingDeadline - now) / (1000 * 60 * 60 * 24));
      content += `<h2>🗳 Voting is open!</h2>`;
      content += `<p>${daysLeft} day(s) left to vote.</p>`;
      content += `<a href="#voting">Vote Now</a>`;
    } else {
      content += `<h2>🎉 Results coming soon!</h2>`;
      content += `<a href="#results">View Results</a>`;
    }

    appElement.innerHTML = content;
  }
}

// Set up view loader
window.addEventListener("hashchange", loadView);
window.addEventListener("load", loadView);


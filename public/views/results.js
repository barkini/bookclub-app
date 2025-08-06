// views/results.js

import { CURRENT_ROUND } from "../config.js";

const appElement = document.getElementById("app");

export function renderResults(votes) {
  if (!votes || votes.length === 0) {
    appElement.innerHTML = `
      <div class="book-block">
        <h2>📊 No Votes Yet</h2>
        <p>Votes will appear here once voting begins.</p>
      </div>
    `;
    return;
  }

  // Tally votes
  const tally = {};

  votes.forEach((vote) => {
    vote.votes.forEach((book) => {
      tally[book] = (tally[book] || 0) + 1;
    });
  });

  // Convert tally to sortable array
  const sortedBooks = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  // Identify max votes to detect ties
  const maxVotes = sortedBooks[0][1];
  const topBooks = sortedBooks.filter(([_, count]) => count === maxVotes);

  let html = `
    <div class="book-block">
      <h2>🎉 Results</h2>
      <p>Total voters: ${votes.length}</p>
      <ul>
  `;

  sortedBooks.forEach(([title, count]) => {
    const isWinner = count === maxVotes;
    html += `
      <li style="margin-bottom: 1rem;">
        <strong>${title}</strong>: ${count} vote${count !== 1 ? "s" : ""}
        ${isWinner ? " 🏆" : ""}
      </li>
    `;
  });

  html += `
      </ul>
    </div>
  `;

  appElement.innerHTML = html;
}


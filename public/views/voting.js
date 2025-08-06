// views/voting.js

import { CURRENT_ROUND, VOTING_DEADLINE } from "../config.js";

const appElement = document.getElementById("app");

export function renderVoting(db, books, users, votedUsersSet) {
  const now = new Date();
  const deadline = new Date(VOTING_DEADLINE);

  if (now > deadline) {
    appElement.innerHTML = `
      <div class="book-block">
        <h2>🛑 Voting Closed</h2>
        <p>The voting period has ended.</p>
        <a href="#results">View Results</a>
      </div>
    `;
    return;
  }

  let html = `
    <div class="book-block">
      <h2>🗳 Vote for Your Favorites</h2>
      <form id="voting-form">
        <label for="userId">Your Name</label>
        <select id="userId" required>
          <option value="" disabled selected>Select your name</option>
          ${users
            .filter((user) => !votedUsersSet.has(user))
            .map((user) => `<option value="${user}">${user}</option>`)
            .join("")}
        </select>

        <label for="votes">Select Book(s)</label>
  `;

  books.forEach((book, index) => {
    html += `
      <div class="book-item">
        <label>
          <input type="checkbox" name="votes" value="${book.title}" />
          <a href="${book.url}" target="_blank" rel="noopener noreferrer">
            <strong>${book.title}</strong> by ${book.author}
          </a>
        </label>
      </div>
    `;
  });

  html += `
        <button type="submit">Submit Vote</button>
      </form>
      <div id="form-status"></div>
    </div>
  `;

  appElement.innerHTML = html;

  const form = document.getElementById("voting-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = document.getElementById("userId").value;
    const selectedBooks = Array.from(
      document.querySelectorAll('input[name="votes"]:checked')
    ).map((input) => input.value);

    const status = document.getElementById("form-status");

    if (selectedBooks.length === 0) {
      status.innerHTML = `<p class="error">⚠️ Please select at least one book.</p>`;
      return;
    }

    try {
      const votesRef = db.collection("votes");

      // Check if user already voted
      const existing = await votesRef
        .where("userId", "==", userId)
        .where("round", "==", CURRENT_ROUND)
        .get();

      if (!existing.empty) {
        status.innerHTML = `<p class="error">⚠️ You have already voted.</p>`;
        return;
      }

      await votesRef.add({
        userId,
        votes: selectedBooks,
        round: CURRENT_ROUND,
        timestamp: new Date(),
      });

      status.innerHTML = `<p class="success">✅ Your votes were submitted!</p>`;
      form.reset();
    } catch (err) {
      console.error("Error submitting vote:", err);
      status.innerHTML = `<p class="error">❌ Something went wrong. Please try again.</p>`;
    }
  });
}


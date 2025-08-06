// views/nominations.js

import { CURRENT_ROUND, SUBMISSION_DEADLINE, users } from "../config.js";

const appElement = document.getElementById("app");

export function renderNominations(db) {
  appElement.innerHTML = "<p>Loading nominations...</p>";

  const now = new Date();
  const deadline = new Date(SUBMISSION_DEADLINE);

  if (now > deadline) {
    appElement.innerHTML = `
      <div class="book-block">
        <h2>🛑 Submissions Closed</h2>
        <p>The deadline for submitting books has passed.</p>
        <a href="#voting">Go to Voting</a>
      </div>
    `;
    return;
  }

  let html = `
    <div class="book-block">
      <h2>📚 Submit Your Book(s)</h2>
      <form id="nomination-form">
        <label for="userId">Your Name</label>
        <select id="userId" required>
          <option value="" disabled selected>Select your name</option>
          ${users.map((user) => `<option value="${user}">${user}</option>`).join("")}
        </select>

        <label for="book1">Book 1 (Goodreads URL)</label>
        <input type="url" id="book1" name="book1" placeholder="https://www.goodreads.com/..." required />

        <label for="book2">Book 2 (optional)</label>
        <input type="url" id="book2" name="book2" placeholder="https://www.goodreads.com/..." />

        <label for="book3">Book 3 (optional)</label>
        <input type="url" id="book3" name="book3" placeholder="https://www.goodreads.com/..." />

        <button type="submit">Submit</button>
      </form>
      <div id="form-status"></div>
    </div>
  `;

  appElement.innerHTML = html;

  const form = document.getElementById("nomination-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = document.getElementById("userId").value;
    const bookUrls = [
      document.getElementById("book1").value.trim(),
      document.getElementById("book2").value.trim(),
      document.getElementById("book3").value.trim(),
    ].filter(Boolean);

    const status = document.getElementById("form-status");
    status.innerHTML = `<p>⏳ Submitting...</p>`;

    try {
      const booksRef = db.collection("books");

      // Prevent duplicate submissions
      const existingSnapshot = await booksRef
        .where("userId", "==", userId)
        .where("round", "==", CURRENT_ROUND)
        .get();

      if (!existingSnapshot.empty) {
        status.innerHTML = `<p class="error">⚠️ You already submitted books for this round.</p>`;
        return;
      }

      for (const url of bookUrls) {
        const res = await fetch(url);
        const html = await res.text();

        // Extract metadata from Goodreads page
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;
        const author = doc.querySelector('meta[name="author"]')?.content || "Unknown";

        await booksRef.add({
          title: ogTitle || "Untitled",
          author,
          url,
          userId,
          round: CURRENT_ROUND,
          timestamp: new Date(),
        });
      }

      status.innerHTML = `<p class="success">✅ Books submitted successfully!</p>`;
      form.reset();
    } catch (err) {
      console.error(err);
      status.innerHTML = `<p class="error">❌ Something went wrong. Please try again.</p>`;
    }
  });
}


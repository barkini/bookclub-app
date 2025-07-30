// views/nomination.js
import { users, CURRENT_ROUND, VOTING_DEADLINE } from '../config.js';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Helper to get users who already submitted books
async function getSubmittedUsers(db) {
  const snap = await getDocs(query(collection(db, "books"), where("round", "==", CURRENT_ROUND)));
  const submitted = new Set();
  snap.forEach(doc => submitted.add(doc.data().userId));
  return submitted;
}

// Helper to send email via webhook (optional — can be removed later)
function sendVotingReadyEmail() {
  // Placeholder for webhook, if you add one in future
}

export async function renderNomination(container, db) {
  const submittedUsers = await getSubmittedUsers(db);
  const usersLeft = users.filter(u => !submittedUsers.has(u));

  container.innerHTML = `
    <h1>📚 Book club nominations</h1>
    <p>Select your name, paste the Goodreads link, wait a moment for title & author to appear, then hit submit!</p>
    <div class="nav"><a href="#books">📖 View Books We’ve Read</a></div>
    <form id="nomForm">
      <label>Your name:</label>
      <select id="userSelect" required>
        <option value="">-- Select --</option>
        ${usersLeft.map(u => `<option value="${u}">${u}</option>`).join("")}
      </select>
      ${[1, 2, 3].map(i => `
        <div class="book-block">
          <label>Goodreads Link #${i}</label>
          <input type="url" id="url${i}" placeholder="https://www.goodreads.com/book/..." />
          <label>Title</label>
          <input type="text" id="title${i}" readonly />
          <label>Author</label>
          <input type="text" id="author${i}" readonly />
        </div>
      `).join("")}
      <button type="submit">Submit</button>
    </form>
    <div id="msg" style="margin-top:1rem;"></div>
  `;

  // Add listener to auto-fetch book title + author from Goodreads
  for (let i of [1, 2, 3]) {
    const urlInput = document.getElementById(`url${i}`);
    urlInput.addEventListener("blur", async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      const { title, author } = await fetchBookMeta(url);
      document.getElementById(`title${i}`).value = title;
      document.getElementById(`author${i}`).value = author;
    });
  }

  document.getElementById("nomForm").addEventListener("submit", async e => {
    e.preventDefault();
    const userId = document.getElementById("userSelect").value;
    if (!userId) return alert("Select your name");

    const books = [];
    for (let i of [1, 2, 3]) {
      const url = document.getElementById(`url${i}`).value.trim();
      const title = document.getElementById(`title${i}`).value.trim();
      const author = document.getElementById(`author${i}`).value.trim();
      if (url) books.push({ goodreads: url, title, author });
    }
    if (!books.length) return alert("Add at least one book.");

    await Promise.all(books.map(b =>
      addDoc(collection(db, "books"), {
        ...b, userId, round: CURRENT_ROUND, timestamp: serverTimestamp()
      })
    ));

    const newSubmitted = await getSubmittedUsers(db);
    if (newSubmitted.size === users.length) {
      sendVotingReadyEmail(); // Replace this with webhook if needed
    }

    document.getElementById("msg").textContent = "Submitted! Refresh the page to continue.";
  });
}

// Tries to get book title & author from Goodreads
async function fetchBookMeta(url) {
  try {
    const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);
    const response = await fetch(proxy);
    const data = await response.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");

    const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || "";
    let title = ogTitle, author = "";

    const byIndex = ogTitle.toLowerCase().lastIndexOf("by ");
    if (byIndex !== -1) {
      title = ogTitle.substring(0, byIndex).trim();
      author = ogTitle.substring(byIndex + 3).trim();
    }

    // Fallback: Try JSON-LD
    const jsonLdTag = [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .map(tag => tag.textContent)
      .find(txt => txt.includes('"@type":"Book"'));
    if (jsonLdTag) {
      const json = JSON.parse(jsonLdTag);
      if (!author) {
        if (Array.isArray(json.author)) {
          author = json.author[0]?.name || "";
        } else if (json.author?.name) {
          author = json.author.name;
        }
      }
    }

    return { title, author };
  } catch (e) {
    console.warn("Couldn’t fetch metadata:", e);
    return { title: "", author: "" };
  }
}


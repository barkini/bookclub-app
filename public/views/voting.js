// views/voting.js
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export async function renderVoting(container, db, users, CURRENT_ROUND, VOTING_DEADLINE, votedUsersSet) {
  container.innerHTML = `<p>Loading voting options...</p>`;

  const usersWhoHaveNotVoted = users.filter(user => !votedUsersSet.has(user));

  const booksSnap = await getDocs(
    query(collection(db, "books"), where("round", "==", CURRENT_ROUND))
  );

  const uniqueBooksMap = new Map();
  booksSnap.forEach((docSnap) => {
    const book = docSnap.data();
    if (!uniqueBooksMap.has(book.goodreads)) {
      uniqueBooksMap.set(book.goodreads, {
        id: docSnap.id,
        title: book.title,
        author: book.author,
        goodreads: book.goodreads,
      });
    }
  });

  const books = Array.from(uniqueBooksMap.values());

  // Replace "Loading..." content with actual form
  container.innerHTML = `
    <h1>🗳️ Vote for Books</h1>
    <p><strong>Deadline:</strong> ${VOTING_DEADLINE}</p>
    <form id="voteForm">
      <label>Your name:</label>
      <select id="voter">
        <option value="">-- Select --</option>
        ${usersWhoHaveNotVoted.map((u) => `<option value="${u}">${u}</option>`).join("")}
      </select>
      <div id="bookList" style="margin-top: 1rem;"></div>
      <button type="submit" disabled>Submit Vote</button>
    </form>
    <p id="msg" style="margin-top: 1rem; display: none;"></p>
  `;

  const voterSelect = document.getElementById("voter");
  const bookList = document.getElementById("bookList");
  const voteForm = document.getElementById("voteForm");
  const submitButton = voteForm.querySelector("button");
  const msg = document.getElementById("msg");

  const showMessage = (text, type = 'success') => {
    msg.textContent = text;
    msg.style.display = 'block';
    msg.className = '';
    msg.classList.add('show');
    if (type === 'error') {
      msg.style.borderColor = '#ff4d4f';
      msg.style.backgroundColor = '#fff0f0';
      msg.style.color = '#a61d24';
    } else {
      msg.style.borderColor = '#52c41a';
      msg.style.backgroundColor = '#f6ffed';
      msg.style.color = '#389e0d';
    }
    setTimeout(() => {
      msg.classList.remove('show');
      msg.textContent = '';
      msg.style.display = 'none';
      msg.style.borderColor = '';
      msg.style.backgroundColor = '';
      msg.style.color = '';
    }, 5000);
  };

  voterSelect.addEventListener("change", () => {
    const selectedUser = voterSelect.value;
    msg.style.display = 'none';
    msg.textContent = '';
    submitButton.disabled = true;

    if (!selectedUser) {
      bookList.innerHTML = '';
      return;
    }

    bookList.innerHTML = books
      .map(
        (b) => `
        <div class="book-item">
          <label>
            <input type="checkbox" value="${b.id}" />
            <a href="${b.goodreads}" target="_blank"><strong>${b.title}</strong></a> by ${b.author}
          </label>
        </div>
      `
      )
      .join("");
    submitButton.disabled = false;
  });

  voteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = voterSelect.value;
    if (!userId) {
      showMessage("Please select your name.", 'error');
      return;
    }

    if (votedUsersSet.has(userId)) {
      showMessage(`🚫 ${userId}, you have already voted for this round.`, 'error');
      submitButton.disabled = true;
      voterSelect.disabled = true;
      return;
    }

    const selectedVotes = [
      ...bookList.querySelectorAll("input:checked"),
    ].map((cb) => cb.value);

    if (selectedVotes.length < 1) {
      showMessage("Please vote for at least one book.", 'error');
      return;
    }

    submitButton.disabled = true;
    voterSelect.disabled = true;

    try {
      await setDoc(doc(db, "votes", `round_${CURRENT_ROUND}_user_${userId}`), {
        userId,
        round: CURRENT_ROUND,
        votes: selectedVotes,
        timestamp: serverTimestamp(),
      });

      showMessage("✅ Your vote was recorded! Thank you.", 'success');
      votedUsersSet.add(userId);
    } catch (error) {
      console.error("Error recording vote:", error);
      showMessage("An error occurred while recording your vote. Please try again.", 'error');
      submitButton.disabled = false;
      voterSelect.disabled = false;
    }
  });
}


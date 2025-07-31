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
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); padding: 0.5rem 1.5rem; border-radius: 20px; margin-bottom: 1rem;">
        <span style="color: white; font-size: 1.5rem;">📥</span>
      </div>
      <p style="font-size: 1.2rem; color: #666; margin: 0;">Loading voting options...</p>
    </div>
  `;

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
    <div style="text-align: center; margin-bottom: 2rem;">
      <h1 style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.8rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
        🗳️ Vote for Books
      </h1>
      <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">Round ${CURRENT_ROUND}</p>
      <div style="background: linear-gradient(135deg, #fff3e0, #fff8f0); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #ff9800; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.1);">
        <p style="margin: 0; font-size: 1.1rem; color: #e65100; font-weight: 600;">
          ⏰ <strong>Deadline:</strong> ${VOTING_DEADLINE}
        </p>
      </div>
      <div class="nav" style="margin-bottom: 2rem;">
        <a href="#books" style="background: var(--primary-color); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);" 
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.4)'" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(134, 89, 192, 0.3)'">
          📖 View Books We've Read
        </a>
      </div>
    </div>

    <form id="voteForm" style="max-width: 700px; margin: 0 auto;">
      <div class="book-block" style="background: linear-gradient(135deg, #fefefe, #fafafa); border: 2px solid #e9ecef; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <label style="font-size: 1.1rem; font-weight: 600; color: var(--secondary-color); display: block; margin-bottom: 0.5rem;">Your name:</label>
        <select id="voter" style="background: white; border: 2px solid #ddd; transition: border-color 0.3s ease;" 
                onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#ddd'">
          <option value="">-- Select your name --</option>
          ${usersWhoHaveNotVoted.map((u) => `<option value="${u}">${u}</option>`).join("")}
        </select>
      </div>

      <div id="bookList" style="margin-top: 1.5rem;"></div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button type="submit" disabled style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border: none; padding: 1rem 2.5rem; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(134, 89, 192, 0.3); opacity: 0.6;"
                onmouseover="if(!this.disabled) { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(134, 89, 192, 0.4)' }"
                onmouseout="if(!this.disabled) { this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.3)' }">
          🗳️ Submit Vote
        </button>
      </div>
    </form>
    
    <div id="msg" style="margin-top: 2rem; padding: 1.5rem; border-radius: 12px; text-align: center; font-weight: 600; display: none;"></div>
  `;

  const voterSelect = document.getElementById("voter");
  const bookList = document.getElementById("bookList");
  const voteForm = document.getElementById("voteForm");
  const submitButton = voteForm.querySelector("button");
  const msg = document.getElementById("msg");

  const showMessage = (text, type = 'success') => {
    msg.textContent = text;
    msg.style.display = 'block';
    
    if (type === 'error') {
      msg.style.background = 'linear-gradient(135deg, #ffe6e6, #fff0f0)';
      msg.style.borderLeft = '4px solid #ff4d4f';
      msg.style.color = '#a61d24';
    } else {
      msg.style.background = 'linear-gradient(135deg, #e6ffe6, #f0fff0)';
      msg.style.borderLeft = '4px solid #52c41a';
      msg.style.color = '#389e0d';
    }

    setTimeout(() => {
      msg.style.display = 'none';
    }, 5000);
  };

  voterSelect.addEventListener("change", () => {
    const selectedUser = voterSelect.value;
    msg.style.display = 'none';
    
    if (!selectedUser) {
      bookList.innerHTML = '';
      submitButton.disabled = true;
      submitButton.style.opacity = '0.6';
      return;
    }

    bookList.innerHTML = `
      <div class="book-block" style="background: linear-gradient(135deg, #fefefe, #fafafa); border: 2px solid #e9ecef; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative;">
        <div style="position: absolute; top: -10px; left: 20px; background: var(--primary-color); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);">
          Choose Your Books
        </div>
        <div style="margin-top: 1.5rem;">
          <p style="color: #666; margin-bottom: 1.5rem; font-size: 1rem; text-align: center;">
            Select all the books you'd like to vote for:
          </p>
          ${books
            .map(
              (b) => `
              <div class="book-item" style="margin-bottom: 1rem; padding: 1rem; background: white; border: 2px solid #f0f0f0; border-radius: 10px; transition: all 0.3s ease; cursor: pointer;"
                   onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(134, 89, 192, 0.15)'"
                   onmouseout="this.style.borderColor='#f0f0f0'; this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                   onclick="this.querySelector('input').click()">
                <label style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                  <input type="checkbox" value="${b.id}" style="margin-right: 15px; transform: scale(1.3); accent-color: var(--primary-color); flex-shrink: 0;" />
                  <div>
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem;">
                      <a href="${b.goodreads}" target="_blank" style="color: var(--primary-color); text-decoration: none; transition: color 0.3s ease;"
                         onmouseover="this.style.color='var(--secondary-color)'"
                         onmouseout="this.style.color='var(--primary-color)'"
                         onclick="event.stopPropagation()">
                        ${b.title}
                      </a>
                    </div>
                    <div style="color: #666; font-size: 1rem;">
                      by <strong>${b.author}</strong>
                    </div>
                  </div>
                </label>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `;
    
    submitButton.disabled = false;
    submitButton.style.opacity = '1';
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
      submitButton.style.opacity = '0.6';
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

    // Show loading state
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = "🗳️ Recording Vote...";
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';
    voterSelect.disabled = true;

    try {
      await setDoc(doc(db, "votes", `round_${CURRENT_ROUND}_user_${userId}`), {
        userId,
        round: CURRENT_ROUND,
        votes: selectedVotes,
        timestamp: serverTimestamp(),
      });

      showMessage("🎉 Your vote was recorded! Thank you for participating.", 'success');
      votedUsersSet.add(userId);
    } catch (error) {
      console.error("Error recording vote:", error);
      showMessage("An error occurred while recording your vote. Please try again.", 'error');
      submitButton.innerHTML = originalText;
      submitButton.disabled = false;
      submitButton.style.opacity = '1';
      voterSelect.disabled = false;
    }
  });
}

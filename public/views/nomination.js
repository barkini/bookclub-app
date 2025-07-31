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
    <div style="text-align: center; margin-bottom: 2rem;">
      <h1 style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.8rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
        📚 Book Club Nominations
      </h1>
      <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">Round ${CURRENT_ROUND}</p>
      <div style="background: linear-gradient(135deg, #e8f4fd, #f0f8ff); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-color); margin-bottom: 2rem; box-shadow: 0 4px 12px rgba(134, 89, 192, 0.1);">
        <p style="margin: 0; font-size: 1.1rem; color: var(--secondary-color); line-height: 1.6;">
          ✨ Select your name, paste the Goodreads link, wait for title & author to appear, then submit!
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

    <form id="nomForm" style="max-width: 600px; margin: 0 auto;">
      <div class="book-block" style="background: linear-gradient(135deg, #fefefe, #fafafa); border: 2px solid #e9ecef; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <label style="font-size: 1.1rem; font-weight: 600; color: var(--secondary-color); display: block; margin-bottom: 0.5rem;">Your name:</label>
        <select id="userSelect" required style="background: white; border: 2px solid #ddd; transition: border-color 0.3s ease;" 
                onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#ddd'">
          <option value="">-- Select your name --</option>
          ${usersLeft.map(u => `<option value="${u}">${u}</option>`).join("")}
        </select>
      </div>

      ${[1, 2, 3].map(i => `
        <div class="book-block" style="background: linear-gradient(135deg, #fefefe, #fafafa); border: 2px solid #e9ecef; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative;">
          <div style="position: absolute; top: -10px; left: 20px; background: var(--primary-color); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);">
            Book #${i}
          </div>
          <div style="margin-top: 1rem;">
            <label style="font-size: 1rem; font-weight: 600; color: var(--secondary-color); display: block; margin-bottom: 0.5rem;">Goodreads Link</label>
            <input type="url" id="url${i}" placeholder="https://www.goodreads.com/book/..." 
                   style="background: white; border: 2px solid #ddd; transition: all 0.3s ease;" 
                   onfocus="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='0 0 0 3px rgba(134, 89, 192, 0.1)'" 
                   onblur="this.style.borderColor='#ddd'; this.style.boxShadow='none'" />
            
            <label style="font-size: 1rem; font-weight: 600; color: var(--secondary-color); display: block; margin-bottom: 0.5rem;">Title</label>
            <input type="text" id="title${i}" readonly 
                   style="background: #f8f9fa; border: 2px solid #e9ecef; color: #495057;" />
            
            <label style="font-size: 1rem; font-weight: 600; color: var(--secondary-color); display: block; margin-bottom: 0.5rem;">Author</label>
            <input type="text" id="author${i}" readonly 
                   style="background: #f8f9fa; border: 2px solid #e9ecef; color: #495057;" />
          </div>
        </div>
      `).join("")}

      <div style="text-align: center; margin-top: 2rem;">
        <button type="submit" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border: none; padding: 1rem 2.5rem; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(134, 89, 192, 0.3);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(134, 89, 192, 0.4)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.3)'">
          ✨ Submit Nominations
        </button>
      </div>
    </form>
    
    <div id="msg" style="margin-top: 2rem; padding: 1.5rem; border-radius: 12px; text-align: center; font-weight: 600; display: none;"></div>
  `;

  // Add listener to auto-fetch book title + author from Goodreads
  for (let i of [1, 2, 3]) {
    const urlInput = document.getElementById(`url${i}`);
    urlInput.addEventListener("blur", async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      
      // Show loading state
      const titleInput = document.getElementById(`title${i}`);
      const authorInput = document.getElementById(`author${i}`);
      titleInput.value = "Loading...";
      authorInput.value = "Loading...";
      
      const { title, author } = await fetchBookMeta(url);
      titleInput.value = title;
      authorInput.value = author;
    });
  }

  document.getElementById("nomForm").addEventListener("submit", async e => {
    e.preventDefault();
    const userId = document.getElementById("userSelect").value;
    if (!userId) {
      showMessage("Please select your name", 'error');
      return;
    }

    const books = [];
    for (let i of [1, 2, 3]) {
      const url = document.getElementById(`url${i}`).value.trim();
      const title = document.getElementById(`title${i}`).value.trim();
      const author = document.getElementById(`author${i}`).value.trim();
      if (url) books.push({ goodreads: url, title, author });
    }
    if (!books.length) {
      showMessage("Please add at least one book", 'error');
      return;
    }

    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "📚 Submitting...";
    submitBtn.disabled = true;

    try {
      await Promise.all(books.map(b =>
        addDoc(collection(db, "books"), {
          ...b, userId, round: CURRENT_ROUND, timestamp: serverTimestamp()
        })
      ));

      const newSubmitted = await getSubmittedUsers(db);
      if (newSubmitted.size === users.length) {
        sendVotingReadyEmail(); // Replace this with webhook if needed
      }

      showMessage("🎉 Nominations submitted successfully! Refresh the page to continue.", 'success');
    } catch (error) {
      console.error("Error submitting nominations:", error);
      showMessage("Error submitting nominations. Please try again.", 'error');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  function showMessage(text, type = 'success') {
    const msg = document.getElementById("msg");
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
  }
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
    console.warn("Couldn't fetch metadata:", e);
    return { title: "", author: "" };
  }
}

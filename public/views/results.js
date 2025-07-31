<div style="margin-top: 2rem; text-align: center; padding: 1rem; background-color: #f8f9fa; border-radius: 8px;">
        <h3 style="color: var(--secondary-color); margin-top: 0;">Round ${CURRENT_ROUND} Complete!</h3>
        <p style="margin: 0.5rem 0; font-size: 1.1rem;">
          Total votes cast: <strong>${votesSnap.size}</strong>
        </p>
        <p style="margin: 0.5rem 0;">
          Happy reading! 📚
        </p>
      </div>

      <div class="book-block" style="margin-top: 2rem; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid var(--primary-color);">
        <h3 style="color: var(--secondary-color); margin-top: 0; text-align: center;">🚀 Ready for the Next Round?</h3>
        <button onclick="showNextRoundForm()" style="width: // views/results.js
import { CURRENT_ROUND } from '../config.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export async function renderResults(container, db) {
  container.innerHTML = `<p>Loading results...</p>`;

  try {
    // Get all books for the current round
    const booksSnap = await getDocs(
      query(collection(db, "books"), where("round", "==", CURRENT_ROUND))
    );

    // Get all votes for the current round
    const votesSnap = await getDocs(
      query(collection(db, "votes"), where("round", "==", CURRENT_ROUND))
    );

    // Create a map of books by their document ID
    const booksMap = new Map();
    booksSnap.forEach((docSnap) => {
      const book = docSnap.data();
      booksMap.set(docSnap.id, {
        id: docSnap.id,
        title: book.title,
        author: book.author,
        goodreads: book.goodreads,
        nominatedBy: book.userId,
        votes: 0
      });
    });

    // Count votes for each book
    votesSnap.forEach((voteDoc) => {
      const voteData = voteDoc.data();
      voteData.votes.forEach(bookId => {
        if (booksMap.has(bookId)) {
          booksMap.get(bookId).votes++;
        }
      });
    });

    // Convert to array and sort by votes (descending)
    const rankedBooks = Array.from(booksMap.values())
      .sort((a, b) => b.votes - a.votes);

    // Find the maximum votes to identify winners
    const maxVotes = rankedBooks.length > 0 ? rankedBooks[0].votes : 0;
    const winners = rankedBooks.filter(book => book.votes === maxVotes);

    // Select winner (random if there's a tie)
    const winner = winners.length > 0 
      ? winners[Math.floor(Math.random() * winners.length)]
      : null;

    // Render the results
    container.innerHTML = `
      <h1>🏆 Book Club Results</h1>
      <div class="nav" style="margin-bottom: 2rem; text-align: center;">
        <a href="#books" style="background: var(--primary-color); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);" 
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.4)'" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(134, 89, 192, 0.3)'">
          📖 View Books We've Read
        </a>
      </div>
      
      ${winner ? `
        <div class="book-block" style="background: linear-gradient(135deg, #ffd700, #ffed4e); border: none; text-align: center; box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3); position: relative; overflow: hidden;">
          <div style="position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%); background-size: 20px 20px; background-position: 0 0, 10px 10px; opacity: 0.3;"></div>
          <div style="position: relative; z-index: 1;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <span style="font-size: 2.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🏆</span>
              <h2 style="color: #b8860b; margin: 0; font-size: 2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Winner!</h2>
              <span style="font-size: 2.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🎉</span>
            </div>
            <h3 style="margin: 1rem 0; font-size: 1.8rem; line-height: 1.3;">
              <a href="${winner.goodreads}" target="_blank" style="color: #8b4513; text-decoration: none; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.1); display: inline-block; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                ${winner.title}
              </a>
            </h3>
            <p style="font-size: 1.3rem; margin: 1rem 0; color: #8b4513; font-weight: 500;">
              by <strong>${winner.author}</strong>
            </p>
            <div style="background: rgba(255,255,255,0.3); padding: 1rem; border-radius: 12px; margin: 1.5rem 0; backdrop-filter: blur(10px);">
              <p style="margin: 0.5rem 0; color: #8b4513; font-size: 1.1rem;">
                Nominated by: <strong style="font-size: 1.2rem; color: #b8860b;">${winner.nominatedBy}</strong>
              </p>
              <p style="font-size: 1.4rem; font-weight: bold; margin: 1rem 0 0.5rem; color: #b8860b; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                ${winner.votes} vote${winner.votes !== 1 ? 's' : ''}
              </p>
            </div>
            ${winners.length > 1 ? `
              <p style="font-size: 0.95rem; color: #8b4513; font-style: italic; margin-top: 1rem; opacity: 0.8;">
                ${winners.length > 2 ? `${winners.length}-way tie` : 'Tie'} - randomly selected winner
              </p>
            ` : ''}
          </div>
        </div>
      ` : `
        <div class="book-block" style="text-align: center;">
          <h2>No votes recorded yet</h2>
          <p>Results will appear once voting is complete.</p>
        </div>
      `}

      ${rankedBooks.length > 0 ? `
        <h2>📊 Full Rankings</h2>
        <div style="margin-top: 1.5rem;">
          ${rankedBooks.map((book, index) => {
            const isWinner = winners.some(w => w.id === book.id);
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            return `
              <div class="book-block" 
                   style="${isWinner ? 'border-left: 5px solid #ffd700; background: linear-gradient(135deg, #fffef7, #fffffb); box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);' : 'border-left: 3px solid #e9ecef;'}">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 200px;">
                    <h3 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-size: 1.3rem; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">${medal}</span>
                      <a href="${book.goodreads}" target="_blank" 
                         style="color: ${isWinner ? '#b8860b' : 'var(--primary-color)'}; font-weight: ${isWinner ? 'bold' : 'normal'}; text-decoration: none; transition: all 0.2s ease;">
                        ${book.title}
                      </a>
                    </h3>
                    <p style="margin: 0.2rem 0; color: ${isWinner ? '#8b7355' : '#555'}; font-size: ${isWinner ? '1.05rem' : '1rem'};">
                      by <strong>${book.author}</strong>
                    </p>
                  </div>
                  <div style="text-align: right; min-width: 100px;">
                    <div style="font-size: ${isWinner ? '1.8rem' : '1.5rem'}; font-weight: bold; color: ${isWinner ? '#b8860b' : 'var(--primary-color)'}; 
                                filter: ${isWinner ? 'drop-shadow(0 1px 2px rgba(184, 134, 11, 0.2))' : 'none'};">
                      ${book.votes}
                    </div>
                    <div style="font-size: 0.9rem; color: ${isWinner ? '#8b7355' : '#666'};">
                      vote${book.votes !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div style="margin-top: 2rem; text-align: center; padding: 1rem; background-color: #f8f9fa; border-radius: 8px;">
        <h3 style="color: var(--secondary-color); margin-top: 0;">Round ${CURRENT_ROUND} Complete!</h3>
        <p style="margin: 0.5rem 0; font-size: 1.1rem;">
          Total votes cast: <strong>${votesSnap.size}</strong>
        </p>
        <p style="margin: 0.5rem 0;">
          Happy reading! 📚
        </p>
      </div>
    `;

  } catch (error) {
    console.error("Error loading results:", error);
    container.innerHTML = `
      <h1>🏆 Book Club Results</h1>
      <div class="book-block" style="text-align: center; border-color: #ff4d4f; background-color: #fff0f0;">
        <h2 style="color: #a61d24;">Error Loading Results</h2>
        <p>There was an error loading the results. Please try refreshing the page.</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

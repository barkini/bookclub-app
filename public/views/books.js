// views/books.js
import { CURRENT_ROUND } from '../config.js';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export async function renderBooks(container, db) {
  container.innerHTML = `<p>Loading book history...</p>`;

  try {
    // Get all votes from previous rounds (not current round)
    const votesSnap = await getDocs(
      query(collection(db, "votes"), where("round", "<", CURRENT_ROUND))
    );

    // Get all books from all rounds
    const booksSnap = await getDocs(collection(db, "books"));

    // Create maps for easy lookup
    const booksMap = new Map();
    const roundData = new Map();

    // Process all books
    booksSnap.forEach((docSnap) => {
      const book = docSnap.data();
      booksMap.set(docSnap.id, {
        id: docSnap.id,
        title: book.title,
        author: book.author,
        goodreads: book.goodreads,
        nominatedBy: book.userId,
        round: book.round,
        votes: 0
      });

      if (!roundData.has(book.round)) {
        roundData.set(book.round, {
          round: book.round,
          books: [],
          totalVotes: 0
        });
      }
    });

    // Process votes
    votesSnap.forEach((voteDoc) => {
      const voteData = voteDoc.data();
      const round = voteData.round;
      
      if (roundData.has(round)) {
        roundData.get(round).totalVotes++;
      }

      voteData.votes.forEach(bookId => {
        if (booksMap.has(bookId)) {
          booksMap.get(bookId).votes++;
        }
      });
    });

    // Group books by round and find winners
    booksMap.forEach(book => {
      if (roundData.has(book.round)) {
        roundData.get(book.round).books.push(book);
      }
    });

    // Sort rounds and find winners for each
    const sortedRounds = Array.from(roundData.values())
      .filter(roundInfo => roundInfo.round < CURRENT_ROUND) // Only show completed rounds
      .sort((a, b) => b.round - a.round); // Most recent first

    sortedRounds.forEach(roundInfo => {
      // Sort books by votes and find winner(s)
      roundInfo.books.sort((a, b) => b.votes - a.votes);
      const maxVotes = roundInfo.books.length > 0 ? roundInfo.books[0].votes : 0;
      roundInfo.winner = roundInfo.books.find(book => book.votes === maxVotes);
    });

    if (sortedRounds.length === 0) {
      container.innerHTML = `
        <h1>📖 Books We've Read</h1>
        <div class="nav">
          <a href="#" onclick="location.reload()">🔄 Back to Main</a>
        </div>
        <div class="book-block" style="text-align: center;">
          <h2>No completed rounds yet</h2>
          <p>Books will appear here after the first round is complete!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <h1>📖 Books We've Read</h1>
      <div class="nav" style="margin-bottom: 2rem; text-align: center;">
      <a href="javascript:void(0)" onclick="goToMain()" style="background: var(--primary-color); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);" 
   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.4)'" 
   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(134, 89, 192, 0.3)'">
  🔄 Back to current phase
</a>
      </div>
      
      <div style="margin-bottom: 2rem; text-align: center;">
        <p style="font-size: 1.1rem; color: var(--secondary-color);">
          Our book club history across <strong>${sortedRounds.length}</strong> round${sortedRounds.length !== 1 ? 's' : ''}
        </p>
      </div>

      ${sortedRounds.map(roundInfo => `
        <div class="book-block" style="margin-bottom: 2rem;">
          <h2 style="color: var(--primary-color); margin-top: 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <span>Round ${roundInfo.round}</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: #666;">
              ${roundInfo.totalVotes} vote${roundInfo.totalVotes !== 1 ? 's' : ''} cast
            </span>
          </h2>
          
          ${roundInfo.winner ? `
            <div style="background: linear-gradient(135deg, #e8f5e8, #f0fff0); padding: 1rem; border-radius: 6px; border-left: 4px solid #28a745; margin-bottom: 1rem;">
              <h3 style="margin: 0 0 0.5rem 0; color: #155724; display: flex; align-items: center; gap: 0.5rem;">
                <span>🏆</span>
                <a href="${roundInfo.winner.goodreads}" target="_blank" style="color: #155724;">
                  ${roundInfo.winner.title}
                </a>
              </h3>
              <p style="margin: 0.2rem 0; color: #155724;">
                by <strong>${roundInfo.winner.author}</strong>
              </p>
              <p style="margin: 0.2rem 0; font-size: 0.9rem; color: #6c757d;">
                Nominated by ${roundInfo.winner.nominatedBy} • ${roundInfo.winner.votes} vote${roundInfo.winner.votes !== 1 ? 's' : ''}
              </p>
            </div>
          ` : ''}

          ${roundInfo.books.length > 1 ? `
            <details ${roundInfo.books.length <= 5 ? 'open' : ''}>
              <summary style="cursor: pointer; font-weight: bold; color: var(--secondary-color); margin-bottom: 1rem;">
                ${roundInfo.books.length > 1 ? `All ${roundInfo.books.length} Books from Round ${roundInfo.round}` : ''}
              </summary>
              <div style="margin-left: 1rem;">
                ${roundInfo.books.map((book, index) => {
                  const rank = index + 1;
                  const isWinner = book.id === roundInfo.winner?.id;
                  return `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee; ${isWinner ? 'opacity: 0.7;' : ''}">
                      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                        <div>
                          <span style="font-weight: bold; color: #666; margin-right: 0.5rem;">${rank}.</span>
                          <a href="${book.goodreads}" target="_blank" style="color: var(--primary-color);">
                            ${book.title}
                          </a>
                          <span style="color: #666;"> by ${book.author}</span>
                          <div style="font-size: 0.8rem; color: #999; margin-left: 1.2rem;">
                            Nominated by ${book.nominatedBy}
                          </div>
                        </div>
                        <div style="text-align: right; color: #666; font-size: 0.9rem;">
                          ${book.votes} vote${book.votes !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          ` : ''}
        </div>
      `).join('')}

      <div style="margin-top: 2rem; text-align: center; padding: 1rem; background-color: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0; color: #666;">
          Keep reading! 📚✨
        </p>
      </div>
    `;

  } catch (error) {
    console.error("Error loading books:", error);
    container.innerHTML = `
      <h1>📖 Books We've Read</h1>
      <div class="nav">
        <a href="#" onclick="location.reload()">🔄 Back to Main</a>
      </div>
      <div class="book-block" style="text-align: center; border-color: #ff4d4f; background-color: #fff0f0;">
        <h2 style="color: #a61d24;">Error Loading Books</h2>
        <p>There was an error loading the book history. Please try refreshing the page.</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

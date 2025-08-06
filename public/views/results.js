// views/results.js
import { CURRENT_ROUND } from '../config.js';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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

    // Find the maximum votes to identify potential winners
    const maxVotes = rankedBooks.length > 0 ? rankedBooks[0].votes : 0;
    const potentialWinners = rankedBooks.filter(book => book.votes === maxVotes);

    // Check if we already have a stored winner for this round
    let winner = null;
    let isRandomlySelected = false;
    
    if (potentialWinners.length > 0) {
      const roundDoc = await getDoc(doc(db, "rounds", `round_${CURRENT_ROUND}`));
      
      if (roundDoc.exists() && roundDoc.data().winner) {
        // Winner already stored
        const winnerId = roundDoc.data().winner;
        winner = booksMap.get(winnerId);
        isRandomlySelected = roundDoc.data().isRandomlySelected || false;
      } else {
        // First time determining winner - store it
        winner = potentialWinners[Math.floor(Math.random() * potentialWinners.length)];
        isRandomlySelected = potentialWinners.length > 1;
        
        // Store the winner in database
        await setDoc(doc(db, "rounds", `round_${CURRENT_ROUND}`), {
          round: CURRENT_ROUND,
          winner: winner.id,
          isRandomlySelected: isRandomlySelected,
          totalVotes: votesSnap.size,
          completedAt: serverTimestamp()
        });
      }
    }

    // Check if next round already exists
    const nextRoundExists = await checkNextRoundExists(db);

    // Render the results
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.8rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
          🏆 Book Club Results
        </h1>
        <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">Round ${CURRENT_ROUND}</p>
        <div class="nav" style="margin-bottom: 2rem;">
          <a href="#books" style="background: var(--primary-color); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(134, 89, 192, 0.3);" 
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.4)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(134, 89, 192, 0.3)'">
            📖 View Books We've Read
          </a>
        </div>
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
              ${isRandomlySelected ? `
                <p style="font-size: 0.95rem; color: #8b4513; font-style: italic; margin-top: 1rem; opacity: 0.8;">
                  ${potentialWinners.length > 2 ? `${potentialWinners.length}-way tie` : 'Tie'} - winner selected randomly
                </p>
              ` : ''}
            </div>
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
            const isWinner = winner && book.id === winner.id;
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

      ${!nextRoundExists ? `
        <div class="book-block" style="margin-top: 2rem; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid var(--primary-color);">
          <h3 style="color: var(--secondary-color); margin-top: 0; text-align: center;">🚀 Ready for the Next Round?</h3>
          <div style="text-align: center;">
            <button onclick="showNextRoundForm()" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(134, 89, 192, 0.3);"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(134, 89, 192, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(134, 89, 192, 0.3)'">
              🎯 Start Next Round
            </button>
          </div>
          
          <div id="nextRoundForm" style="display: none; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #ddd;">
            <h4 style="color: var(--secondary-color); margin-bottom: 1rem;">Set Up Round ${CURRENT_ROUND + 1}</h4>
            <div style="display: grid; gap: 1rem; max-width: 500px; margin: 0 auto;">
              <div>
                <label style="display: block; font-weight: 600; color: var(--secondary-color); margin-bottom: 0.5rem;">
                  Submission Deadline:
                </label>
                <input type="date" id="submissionDeadline" style="width: 100%; padding: 0.7rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; color: var(--secondary-color); margin-bottom: 0.5rem;">
                  Voting Deadline:
                </label>
                <input type="date" id="votingDeadline" style="width: 100%; padding: 0.7rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; color: var(--secondary-color); margin-bottom: 0.5rem;">
                  Discussion Date (optional):
                </label>
                <input type="date" id="discussionDate" style="width: 100%; padding: 0.7rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;" />
              </div>
              <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
                <button onclick="createNextRound()" style="background: #28a745; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;"
                        onmouseover="this.style.backgroundColor='#218838'"
                        onmouseout="this.style.backgroundColor='#28a745'">
                  ✅ Create Round ${CURRENT_ROUND + 1}
                </button>
                <button onclick="hideNextRoundForm()" style="background: #6c757d; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;"
                        onmouseover="this.style.backgroundColor='#5a6268'"
                        onmouseout="this.style.backgroundColor='#6c757d'">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="book-block" style="margin-top: 2rem; background: linear-gradient(135deg, #e8f5e8, #f0fff0); border: 2px solid #28a745; text-align: center;">
          <h3 style="color: #155724; margin-top: 0;">✅ Next Round Already Set Up</h3>
          <p style="color: #155724; margin: 0;">
            Round ${CURRENT_ROUND + 1} is ready to go! Update your config.js file to move to the next round.
          </p>
        </div>
      `}
    `;

    // Add the JavaScript functions to window for global access
    window.showNextRoundForm = showNextRoundForm;
    window.hideNextRoundForm = hideNextRoundForm;
    window.createNextRound = () => createNextRound(db);

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

// Helper function to check if next round config exists
async function checkNextRoundExists(db) {
  try {
    const nextRoundDoc = await getDoc(doc(db, "config", `round_${CURRENT_ROUND + 1}`));
    return nextRoundDoc.exists();
  } catch (error) {
    console.error("Error checking next round:", error);
    return false;
  }
}

// UI functions for next round management
function showNextRoundForm() {
  document.getElementById('nextRoundForm').style.display = 'block';
  
  // Set default dates (1 week and 2 weeks from now)
  const today = new Date();
  const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
  
  document.getElementById('submissionDeadline').value = oneWeek.toISOString().split('T')[0];
  document.getElementById('votingDeadline').value = twoWeeks.toISOString().split('T')[0];
  document.getElementById('discussionDate').value = threeWeeks.toISOString().split('T')[0];
}

function hideNextRoundForm() {
  document.getElementById('nextRoundForm').style.display = 'none';
}

async function createNextRound(db) {
  const submissionDeadline = document.getElementById('submissionDeadline').value;
  const votingDeadline = document.getElementById('votingDeadline').value;
  const discussionDate = document.getElementById('discussionDate').value;
  
  if (!submissionDeadline || !votingDeadline) {
    alert('Please set both submission and voting deadlines');
    return;
  }
  
  if (new Date(submissionDeadline) >= new Date(votingDeadline)) {
    alert('Voting deadline must be after submission deadline');
    return;
  }
  
  try {
    // Store next round configuration
    await setDoc(doc(db, "config", `round_${CURRENT_ROUND + 1}`), {
      round: CURRENT_ROUND + 1,
      submissionDeadline: submissionDeadline,
      votingDeadline: votingDeadline,
      discussionDate: discussionDate || null,
      createdAt: serverTimestamp(),
      createdFromRound: CURRENT_ROUND
    });
    
    // Show success message and update UI
    document.getElementById('nextRoundForm').innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h3 style="color: #28a745; margin-bottom: 1rem;">✅ Round ${CURRENT_ROUND + 1} Created!</h3>
        <p style="color: #155724; margin-bottom: 1rem;">
          Next round configuration has been saved to the database.
        </p>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
          <strong>Next Steps:</strong>
          <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>Update your <code>config.js</code> file:</li>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem; font-family: monospace; font-size: 0.9rem;">
              <li>CURRENT_ROUND: ${CURRENT_ROUND + 1}</li>
              <li>SUBMISSION_DEADLINE: "${submissionDeadline}"</li>
              <li>VOTING_DEADLINE: "${votingDeadline}"</li>
            </ul>
            <li>Refresh the page to start Round ${CURRENT_ROUND + 1}</li>
          </ol>
        </div>
        <button onclick="location.reload()" style="background: var(--primary-color); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
          🔄 Refresh Page
        </button>
      </div>
    `;
    
  } catch (error) {
    console.error("Error creating next round:", error);
    alert('Error creating next round. Please try again.');
  }
}

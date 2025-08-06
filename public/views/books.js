// views/books.js

const appElement = document.getElementById("app");

export function renderBooks(db) {
  appElement.innerHTML = "<p>Loading books...</p>";

  const booksRef = db.collection("books");

  booksRef
    .where("round", "==", 0)
    .get()
    .then((querySnapshot) => {
      const books = querySnapshot.docs.map((doc) => doc.data());

      if (books.length === 0) {
        appElement.innerHTML = "<p>No books found for this round.</p>";
        return;
      }

      let html = `<h2>📚 All Book Submissions</h2>`;
      html += `<div class="book-block">`;

      books.forEach((book) => {
        html += `
          <p>
            <a href="${book.url}" target="_blank" rel="noopener noreferrer">
              <strong>${book.title}</strong>
            </a>
            <br>
            <span>submitted by <code>${book.userId}</code></span>
          </p>
          <hr>
        `;
      });

      html += `</div>`;
      appElement.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error fetching books:", error);
      appElement.innerHTML = `
        <div class="error">
          <p>⚠️ Failed to load books. Please try again later.</p>
        </div>
      `;
    });
}


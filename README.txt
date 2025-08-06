# 📚 Book Club Web App

A beautiful, modern web application for managing book club nominations, voting, and results. Built with vanilla JavaScript and Firebase, featuring a stunning purple-themed UI with smooth animations and professional polish.

---

## ✨ Features

### 🎯 **Complete Book Club Workflow**

* **Nominations Phase**: Members submit 1–3 book suggestions with automatic Goodreads metadata fetching
* **Voting Phase**: Anonymous voting system with multi-book selection
* **Results Phase**: Clean winner announcement with tie-handling
* **Optional Extension**: Multi-round history support via Firestore queries

### 🎨 **Premium Visual Design**

* Gradient-based purple theme with clean typography
* Smooth hover animations and transitions
* Responsive layout with subtle glassmorphism elements
* Mobile-friendly with consistent design system

### ✨ **Functionality Highlights**

* **Smart Metadata**: Book title & author auto-fetched from Goodreads via OpenGraph tags
* **Real-time Data**: Firebase Firestore backend
* **Config-based Rounds**: Easily manage phases via `config.js`
* **Discreet Tie Handling**: Automatically handles tied votes with random selection (persistent)

---

## 🛠️ Tech Stack

* **Frontend**: Vanilla JavaScript (ES6+ modules), HTML5, CSS3
* **Backend**: Firebase Firestore (NoSQL)
* **Styling**: Custom CSS (Grid, Flexbox, CSS variables)
* **APIs**: Goodreads metadata scraped via CORS proxy
* **Architecture**: Modular, view-based file structure

---

## 📁 Project Structure

```
book-club-app/
├── public/
│   ├── index.html              # Main HTML file with theme and layout
│   ├── app.js                  # Routing and view logic
│   ├── config.example.js       # Firebase config template
│   ├── views/
│   │   ├── nominations.js      # Book submission form
│   │   ├── voting.js           # Voting interface
│   │   ├── results.js          # Winner display
│   │   └── books.js            # Optional: Book archive display
├── firestore.rules             # Firebase Firestore security rules
├── firestore.indexes.json      # Firestore indexes
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/bookclub-app.git
cd bookclub-app
```

### 2. Set Up Firebase

1. Create a new Firebase project: [Firebase Console](https://console.firebase.google.com/)
2. Enable **Cloud Firestore**
3. Copy your Firebase config object

### 3. Configure the App

1. Copy the config template:

```bash
cp public/config.example.js public/config.js
```

2. Fill it in with your Firebase config and round info:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

export const users = ["Ada", "Leo", "Niko"];
export const CURRENT_ROUND = 1;
export const SUBMISSION_DEADLINE = "2025-09-01";
export const VOTING_DEADLINE = "2025-09-05";
```

### 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Run Locally

```bash
npx http-server . -p 8000
```

Then open:
📍 [http://localhost:8000/public/index.html](http://localhost:8000/public/index.html)

---

## 📱 How to Use

### For Members:

1. **Nominations**: Choose your name, paste Goodreads URLs, and submit up to 3 books
2. **Voting**: Select your name and vote for as many books as you like
3. **Results**: View the winner and see full rankings

### For Organizers:

1. Update `public/config.js` for each new round
2. Track deadlines and phase changes automatically
3. All data is stored in Firestore (export or extend as needed)

---

## 🎨 Design Philosophy

* **User-first**: Intuitive, responsive, fast
* **Visual delight**: Gradients, glassmorphism, smooth microinteractions
* **Clean code**: Modular JavaScript with zero frameworks
* **Minimal setup**: No build system, just Firebase + static files

---

## 🔧 Customization

### Styling

* Modify colors and effects via `:root` CSS variables in `index.html`
* Tweak animations and box shadows in the `.book-block`, `.nav`, and `button` styles

### Functionality

* Add login with Firebase Auth
* Track book history by user or round
* Extend Goodreads scraping for more metadata
* Send notifications via Email/Webhook (Firebase Functions)

---

## 🔒 Security Notes

**Default Setup:**
Permissive Firestore rules suitable for small, trusted friend groups and local use.

**Important for Public Use:**

* ✅ Add Firebase Authentication
* ✅ Lock Firestore rules to logged-in users only
* ✅ Never push `config.js` (use `.gitignore` to keep it private)

🔗 [Learn more about Firestore Security Rules](https://firebase.google.com/docs/rules)

---

## 🤝 Contributing

Contributions are welcome — especially around:

* UX/UI polish
* Round history tracking
* Multi-group support
* Auth and access control

Open a PR or issue if you'd like to help!

---

## 📄 License

MIT License — free to use, remix, and share.
Please credit the original project if reused publicly.

---

## 🙏 Acknowledgments

* 🔸 **Firebase** for backend simplicity
* 📘 **Goodreads** for the book data (via OpenGraph scraping)
* 🌐 **AllOrigins** for solving CORS
* 💅 **Modern CSS** for making web apps beautiful

---

**Made with 💜 for book lovers everywhere.**

> *A smooth, private way to run your book club without noisy group chats or clunky spreadsheets.*


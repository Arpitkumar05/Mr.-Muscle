import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAfKqzkvYzCSefuyrItBmJe8i4k5ZEupxk",
  authDomain: "mr-muscle-53f7b.firebaseapp.com",
  projectId: "mr-muscle-53f7b",
  storageBucket: "mr-muscle-53f7b.firebasestorage.app",
  messagingSenderId: "876513171038",
  appId: "1:876513171038:web:7043e4133a4667406d86cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const state = {
  hp: 3.0,
  rank: 0.0,
  streak: 0,
  tasksDone: new Set(),
  timer: null,
  timeLeft: 10 * 60 // in seconds
};

const el = {
  hpBar: document.querySelector('.hp-fill'),
  rankBar: document.querySelector('.rank-fill'),
  hpText: document.getElementById('hp-text'),
  rankText: document.getElementById('rank-text'),
  timer: document.getElementById('timer'),
  taskCards: document.querySelectorAll('.task-card'),
  startBtn: document.getElementById('start-btn'),
  modal: document.getElementById('confirm-modal'),
  yesBtn: document.getElementById('confirm-yes'),
  noBtn: document.getElementById('confirm-no'),
  currentRank: document.getElementById('current-rank'),
  streakValue: document.getElementById('streak-value')
};

function getRankLetter(rankIndex) {
  const ranks = ['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  return ranks[Math.min(rankIndex, ranks.length - 1)];
}

onAuthStateChanged(auth, async user => {
  const loggedInUserId = localStorage.getItem('loggedInUserId');
  if (!loggedInUserId) return console.log("User Id not Found in Local storage");

  try {
    const docRef = doc(db, "users", loggedInUserId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      document.getElementById('loggedUserFName').innerText = userData.firstName;
      document.getElementById('loggedUserLName').innerText = userData.lastName;
      document.getElementById('loggedUserEmail').innerText = userData.email;
    } else {
      console.log("No document found matching id");
    }
  } catch (err) {
    console.error("Error getting document:", err);
  }
});

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('loggedInUserId');
  signOut(auth)
    .then(() => window.location.href = 'index.html')
    .catch(err => console.error('Error signing out:', err));
});

function loadState() {
  const saved = JSON.parse(localStorage.getItem('dailyQuest')) || {};
  state.hp = saved.hp ?? 3.0;
  state.rank = saved.rank ?? 0.0;
  state.streak = saved.streak ?? 0;
  state.tasksDone = new Set(saved.tasksDone || []);
  updateUI();
}

function saveState() {
  localStorage.setItem('dailyQuest', JSON.stringify({
    hp: state.hp,
    rank: state.rank,
    streak: state.streak,
    tasksDone: [...state.tasksDone]
  }));
}

function updateUI() {
  el.hpBar.style.width = `${(state.hp / 3) * 100}%`;
  el.rankBar.style.width = `${Math.min(state.rank * 100, 100)}%`;
  el.hpText.textContent = `${state.hp.toFixed(1)}/3`;
  el.rankText.textContent = `${(state.rank * 100).toFixed(0)}%`;
  el.currentRank.textContent = getRankLetter(Math.floor(state.rank * 26));
  el.streakValue.textContent = state.streak;
  el.taskCards.forEach(card => {
    const id = card.dataset.taskId;
    card.classList.toggle('completed', state.tasksDone.has(id));
  });
}

el.taskCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!state.timer) return;
    const id = card.dataset.taskId;
    state.tasksDone.has(id)
      ? state.tasksDone.delete(id)
      : state.tasksDone.add(id);
    updateUI();
    saveState();
  });
});

function startTimer() {
  el.startBtn.textContent = 'Complete Quest';
  state.timer = setInterval(() => {
    state.timeLeft--;
    const m = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const s = String(state.timeLeft % 60).padStart(2, '0');
    el.timer.textContent = `${m}:${s}`;
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      failQuest();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(state.timer);
  state.timer = null;
  state.timeLeft = 10 * 60;
  el.timer.textContent = '10:00';
  el.startBtn.textContent = 'Start Your Quest';
}

function completeQuest() {
  clearInterval(state.timer);
  if (state.tasksDone.size === 4) {
    if (state.rank < 1) {
      state.rank = Math.min(1, state.rank + 1 / 26);
    }
    if (state.hp < 3) {
      state.hp = Math.min(3, state.hp + 1 / 20 * 3);
    }
    state.streak++;
    if (state.rank >= 1 && state.rank < 1.01) return rankUp();
  } else {
    if (state.rank < 1) {
      state.hp = Math.max(state.hp - 1, 0);
      state.streak = 0;
      if (state.hp <= 0) return showModal();
    }
  }
  postQuestReset();
}

function rankUp() {
  state.rank = 1.01;
  alert('🎉 Congratulations, you ranked up!');
  postQuestReset();
}

function failQuest() {
  state.streak = 0;
  if (state.rank < 1) {
    state.hp = Math.max(state.hp - 1, 0);
    if (state.hp <= 0) showModal();
  }
  postQuestReset();
}

function showModal() {
  el.modal.classList.remove('hidden');
}

el.yesBtn.addEventListener('click', () => {
  postQuestReset();
  el.modal.classList.add('hidden');
});
el.noBtn.addEventListener('click', () => {
  el.modal.classList.add('hidden');
});

function postQuestReset() {
  resetTimer();
  state.tasksDone.clear();
  saveState();
  updateUI();
}

el.startBtn.addEventListener('click', () => {
  state.timer ? completeQuest() : startTimer();
});

loadState();

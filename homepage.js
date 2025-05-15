import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "mr-muscle-53f7b.firebaseapp.com",
  projectId: "mr-muscle-53f7b",
  storageBucket: "mr-muscle-53f7b.appspot.com",
  messagingSenderId: "...",
  appId: "..."
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
  timeLeft: 10 * 60,
  questDay: 1
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

// Ranks A–Z
function getRankLetter(rankIndex) {
  const ranks = ['Z','Y','X','W','V','U','T','S','R','Q','P','O','N','M','L','K','J','I','H','G','F','E','D','C','B','A'];
  return ranks[Math.min(rankIndex, ranks.length - 1)];
}

// Render task counts
function renderTasks() {
  const reps = 5 * state.questDay;
  const km = (0.5 * state.questDay).toFixed(1);
  const map = { pushup: reps, situps: reps, squats: reps, run: km };
  el.taskCards.forEach(card => {
    const id = card.dataset.taskId;
    card.querySelector('.task-count').textContent = map[id];
  });
}

// Load quest state from Firestore
async function loadState() {
  const uid = localStorage.getItem('loggedInUserId');
  if (!uid) return;

  try {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const qs = data.questState || {};
      state.hp = qs.hp ?? 3.0;
      state.rank = qs.rank ?? 0.0;
      state.streak = qs.streak ?? 0;
      state.tasksDone = new Set(qs.tasksDone || []);
      state.questDay = qs.questDay ?? 1;
    }
  } catch (err) {
    console.error("Error loading quest state:", err);
  }

  renderTasks();
  updateUI();
}

// Save quest state to Firestore
async function saveState() {
  const uid = localStorage.getItem('loggedInUserId');
  if (!uid) return;

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      questState: {
        hp: state.hp,
        rank: state.rank,
        streak: state.streak,
        tasksDone: [...state.tasksDone],
        questDay: state.questDay
      }
    });
  } catch (err) {
    console.error("Error saving quest state:", err);
  }
}

// Create new user data if not exists
async function createUserIfNotExists(uid, email, firstName, lastName) {
  const userDocRef = doc(db, "users", uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, {
      email,
      firstName,
      lastName,
      questState: {
        hp: 3.0,
        rank: 0.0,
        streak: 0,
        tasksDone: [],
        questDay: 1
      }
    });
  }
}

// Update UI elements
function updateUI() {
  el.hpBar.style.width = `${(state.hp / 3) * 100}%`;
  el.rankBar.style.width = `${Math.min(state.rank * 100, 100)}%`;
  el.hpText.textContent = `${state.hp.toFixed(1)}/3`;
  el.rankText.textContent = `${(state.rank * 100).toFixed(0)}%`;
  el.currentRank.textContent = getRankLetter(Math.floor(state.rank * 26));
  el.streakValue.textContent = state.streak;
  el.taskCards.forEach(card => {
    card.classList.toggle('completed', state.tasksDone.has(card.dataset.taskId));
  });
}

// Handle auth + load profile + check/create user document
onAuthStateChanged(auth, async user => {
  const uid = localStorage.getItem('loggedInUserId');
  if (!uid) return console.log("User Id not Found");
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      const d = docSnap.data();
      document.getElementById('loggedUserFName').innerText = d.firstName;
      document.getElementById('loggedUserLName').innerText = d.lastName;
      document.getElementById('loggedUserEmail').innerText = d.email;
      await createUserIfNotExists(uid, d.email, d.firstName, d.lastName);
      await loadState();
    }
  } catch (err) {
    console.error(err);
  }
});

// Logout
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('loggedInUserId');
  signOut(auth).then(() => window.location.href = 'index.html')
               .catch(err => console.error(err));
});

// Task click toggles
el.taskCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!state.timer) return;
    const id = card.dataset.taskId;
    state.tasksDone.has(id) ? state.tasksDone.delete(id) : state.tasksDone.add(id);
    updateUI();
    saveState();
  });
});

// Timer logic
function startTimer() {
  el.startBtn.textContent = 'Complete Quest';
  state.timer = setInterval(() => {
    state.timeLeft--;
    const m = String(Math.floor(state.timeLeft / 60)).padStart(2,'0');
    const s = String(state.timeLeft % 60).padStart(2,'0');
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

// Complete quest
function completeQuest() {
  clearInterval(state.timer);
  if (state.tasksDone.size === el.taskCards.length) {
    if (state.rank < 1) state.rank = Math.min(1, state.rank + 1/26);
    if (state.hp < 3) state.hp = Math.min(3, state.hp + (1/20 * 3));
    state.streak++;
    state.questDay++;
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

// Rank-up handler
function rankUp() {
  state.rank = 1.01;
  state.questDay++;
  el.currentRank.classList.add('rank-up-animation');
  setTimeout(() => el.currentRank.classList.remove('rank-up-animation'), 800);
  alert('🎉 Congratulations, you ranked up!');
  postQuestReset();
}

// Timer fail
function failQuest() {
  state.streak = 0;
  if (state.rank < 1) {
    state.hp = Math.max(state.hp - 1, 0);
    if (state.hp <= 0) showModal();
  }
  postQuestReset();
}

// Modal
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

// Reset
function postQuestReset() {
  resetTimer();
  state.tasksDone.clear();
  saveState();
  renderTasks();
  updateUI();
}

// Start or complete
el.startBtn.addEventListener('click', () => {
  state.timer ? completeQuest() : startTimer();
});


const toggleBtn = document.getElementById("chatbot-toggler");
const popup = document.querySelector(".chatbot-popup");
const closeBtn = document.getElementById("close-chatbot");
const chatBody = document.querySelector(".chat-body");
const form = document.querySelector(".chat-form");
const input = document.querySelector(".message-input");

// Toggle chatbot
toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});
closeBtn?.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

// On message submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (message) {
    appendMessage("user", message);
    input.value = "";
    setTimeout(() => {
      respond(message);
    }, 500);
  }
});

// Add message to chat
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `${sender}-message message`;
  msg.innerHTML = `<div class="message-text">${text}</div>`;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Helpers for fuzzy match
function similarity(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = Array(s2.length + 1).fill(0);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1]) newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Recognized small talk
const smallTalk = {
  "how are you": "I'm doing great! I'm here to help with your health questions.",
  "what's up": "Just here to assist you with any health concerns you have!",
  "hello": "Hi there! What symptom are you experiencing today?",
  "hi": "Hello! Tell me how you're feeling.",
  "hey": "Hey there! I'm ready to help with your symptoms."
};

// Symptom advice (expand as needed)
const healthTips = {
  "fever": "Rest, stay hydrated, and take paracetamol. See a doctor if it's above 39.4°C or lasts more than 3 days.",
  "cough": "Use cough syrups, drink warm fluids, and avoid smoking. If it lasts more than 3 weeks, consult a doctor.",
  "headache": "Rest in a dark room, stay hydrated, and take a painkiller. Seek help if it's sudden or with vision issues.",
  "sore throat": "Gargle with warm salt water, drink warm fluids, and use lozenges. See a doctor if it persists or is severe.",
  "nausea": "Sip water, avoid solid food for a while, and rest. Visit a doctor if persistent or with dehydration.",
  "vomiting": "Rehydrate with fluids, avoid solids, and use anti-nausea meds if prescribed.",
  "shortness of breath": "Sit upright, use an inhaler if asthmatic. Call emergency if it's sudden or severe.",
  "dizziness": "Sit down, hydrate, and eat something. Visit a doctor if it's frequent or with chest pain.",
  "diarrhea": "Use oral rehydration salts, avoid spicy/dairy foods. See a doctor if it lasts over 2 days.",
  "fatigue": "Improve sleep, manage stress, and eat well. Get a checkup if it’s chronic.",
  "chest pain": "Call emergency if it spreads or with breath trouble. Rest and monitor symptoms.",
  "rash": "Apply calamine or antihistamines. Don’t scratch. Seek care if spreading or painful.",
  "blurred vision": "Rest your eyes. If sudden or with other symptoms, get urgent care.",
  "abdominal pain": "Use a heat pad or antacid. Seek care if severe, sudden or with fever.",
  "ear pain": "Use warm compress or OTC drops. See a doctor if pain persists."
};

// Extract symptoms from a message
function extractSymptoms(text) {
  const phrasesToRemove = [
    "i have", "i am", "i'm", "i feel", "i'm feeling", "i got", "i'm experiencing",
    "suffering from", "having", "dealing with"
  ];

  let cleaned = text.toLowerCase();
  for (let phrase of phrasesToRemove) {
    cleaned = cleaned.replaceAll(phrase, "");
  }

  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

  // Split into words by conjunctions
  return cleaned.split(/and|,|\/|&/).map(sym => sym.trim());
}

// Find best match for a single symptom
function findClosestMatch(input, data) {
  let bestMatch = null;
  let highestScore = 0.5; // match threshold
  for (let key in data) {
    const score = similarity(input, key);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = key;
    }
  }
  return bestMatch;
}

// Main chatbot responder
function respond(message) {
  const userInput = message.toLowerCase();

  // 1. Small talk?
  const talkMatch = findClosestMatch(userInput, smallTalk);
  if (talkMatch) {
    appendMessage("bot", smallTalk[talkMatch]);
    return;
  }

  // 2. Try extracting multiple symptoms
  const extracted = extractSymptoms(userInput);
  let responses = [];

  for (let raw of extracted) {
    const match = findClosestMatch(raw, healthTips);
    if (match) responses.push(`👉 *${match}*: ${healthTips[match]}`);
  }

  // 3. If we found any matches, show them
  if (responses.length > 0) {
    appendMessage("bot", responses.join("<br><br>"));
    return;
  }

  // 4. Fallback
  appendMessage("bot", "I'm not sure how to help with that. Please book a doctor’s appointment or try describing your symptoms again.");
}

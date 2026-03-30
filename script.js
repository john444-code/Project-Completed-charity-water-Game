const difficultySettings = {
  easy:   { spawnInterval: 900, dropDuration: 5.0, timeLimit: 45, goal: 12 },
  normal: { spawnInterval: 700, dropDuration: 4.0, timeLimit: 30, goal: 15 },
  hard:   { spawnInterval: 450, dropDuration: 3.0, timeLimit: 20, goal: 18 }
};

const gameArea = document.getElementById('gameArea');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const difficultyEl = document.getElementById('difficulty');
const scoreEl = document.getElementById('score');
const goalEl = document.getElementById('goal');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const playAgainBtn = document.getElementById('playAgain');

let spawnTimer = null;
let clockTimer = null;
let score = 0;
let timeLeft = 0;
let currentSettings = null;

function startGame(){
  resetGame(true);
  const diff = difficultyEl.value;
  currentSettings = difficultySettings[diff];
  goalEl.textContent = currentSettings.goal;
  timeLeft = currentSettings.timeLimit;
  timerEl.textContent = timeLeft;

  spawnTimer = setInterval(spawnDrop, currentSettings.spawnInterval);
  clockTimer = setInterval(()=>{
    timeLeft -= 1;
    timerEl.textContent = timeLeft;
    if(timeLeft <= 0){
      endGame(score >= currentSettings.goal);
    }
  }, 1000);
}

function spawnDrop(){
  const drop = document.createElement('div');
  drop.className = 'drop';
  const size = 28 + Math.round(Math.random()*22);
  drop.style.width = size + 'px';
  drop.style.height = Math.round(size*1.25) + 'px';
  const left = Math.random()*85 + 5; // percent
  drop.style.left = left + '%';
  const dur = currentSettings.dropDuration * (0.8 + Math.random()*0.7);
  drop.style.setProperty('--duration', dur + 's');
  drop.style.animation = `fall ${dur}s linear forwards`;

  // Click to collect
  drop.addEventListener('click', (e)=>{
    e.stopPropagation();
    collectDrop(drop);
  });

  // Remove when it finishes falling
  drop.addEventListener('animationend', ()=>{
    if(gameArea.contains(drop)) drop.remove();
  });

  gameArea.appendChild(drop);
}

function collectDrop(drop){
  score += 1;
  scoreEl.textContent = score;
  drop.classList.add('pop');
  // remove after pop animation
  setTimeout(()=>{ if(drop.parentNode) drop.remove(); }, 350);
  // optional: small visual feedback on goal
  if(score >= currentSettings.goal){
    endGame(true);
  }
}

function endGame(win){
  clearInterval(spawnTimer); spawnTimer = null;
  clearInterval(clockTimer); clockTimer = null;
  // remove remaining drops
  document.querySelectorAll('.drop').forEach(d=>d.remove());
  // show overlay
  overlay.classList.remove('hidden');
  if(win){
    resultTitle.textContent = 'You did it!';
    resultText.textContent = `You collected ${score} drops — thanks for helping spread the word about clean water.`;
  } else {
    resultTitle.textContent = 'Time’s up';
    resultText.textContent = `You collected ${score} drops. Try again to hit the goal of ${currentSettings.goal}.`;
  }
}

function resetGame(skipUiReset=false){
  clearInterval(spawnTimer); spawnTimer = null;
  clearInterval(clockTimer); clockTimer = null;
  document.querySelectorAll('.drop').forEach(d=>d.remove());
  score = 0;
  scoreEl.textContent = score;
  if(!skipUiReset){
    overlay.classList.add('hidden');
    timeLeft = 0; timerEl.textContent = '0';
    goalEl.textContent = '0';
  }
}

startBtn.addEventListener('click', ()=>{
  if(!spawnTimer) startGame();
});
resetBtn.addEventListener('click', ()=>{ resetGame(false); });
playAgainBtn.addEventListener('click', ()=>{ overlay.classList.add('hidden'); startGame(); });

// Accessibility: allow clicking empty space to remove stray drops (no effect)
gameArea.addEventListener('click', ()=>{});

// initialize UI values
goalEl.textContent = difficultySettings[difficultyEl.value].goal;
timerEl.textContent = difficultySettings[difficultyEl.value].timeLimit;
difficultyEl.addEventListener('change', ()=>{
  goalEl.textContent = difficultySettings[difficultyEl.value].goal;
  timerEl.textContent = difficultySettings[difficultyEl.value].timeLimit;
});

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
let audioCtx = null;
let milestones = [];
let milestoneTriggered = new Set();
let audioFiles = {};
let useFiles = false;
let masterVolume = 0.8;
let muted = false;

function startGame(){
  resetGame(true);
  const diff = difficultyEl.value;
  currentSettings = difficultySettings[diff];
  goalEl.textContent = currentSettings.goal;
  timeLeft = currentSettings.timeLimit;
  timerEl.textContent = timeLeft;

  // prepare milestones (halfway, three-quarters, near-goal)
  milestoneTriggered.clear();
  milestones = [];
  const half = Math.ceil(currentSettings.goal/2);
  const threeQ = Math.ceil(currentSettings.goal*0.75);
  const almost = Math.max(currentSettings.goal-3, 1);
  milestones.push({score: half, message: 'Halfway there!'});
  if(threeQ !== half) milestones.push({score: threeQ, message: 'Great progress!'});
  if(almost !== threeQ && almost !== half) milestones.push({score: almost, message: 'Almost there!'});

  // try to load audio file elements once per new game start
  maybeLoadAudioFiles();

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
    // if not collected, it's a miss
    if(drop.dataset.collected !== 'true'){
      playSound('miss');
      // small visual feedback: briefly flash red border
      gameArea.animate([{boxShadow:'0 8px 24px rgba(255,100,100,0.0)'},{boxShadow:'0 8px 24px rgba(255,100,100,0.14)'}],{duration:180,iterations:1});
    }
    if(gameArea.contains(drop)) drop.remove();
  });

  gameArea.appendChild(drop);
}

function collectDrop(drop){
  score += 1;
  scoreEl.textContent = score;
  drop.dataset.collected = 'true';
  playSound('collect');
  drop.classList.add('pop');
  // remove after pop animation
  setTimeout(()=>{ if(drop.parentNode) drop.remove(); }, 350);
  // optional: small visual feedback on goal
  if(score >= currentSettings.goal){
    playSound('win');
    endGame(true);
  }
  // check milestones
  checkMilestones(score);
}

function checkMilestones(currentScore){
  for(const m of milestones){
    if(currentScore >= m.score && !milestoneTriggered.has(m.score)){
      milestoneTriggered.add(m.score);
      showMilestone(m.message);
      playSound('milestone');
    }
  }
}

function showMilestone(text){
  const el = document.createElement('div');
  el.className = 'milestone';
  el.textContent = text;
  gameArea.appendChild(el);
  // force reflow then show
  requestAnimationFrame(()=> el.classList.add('show'));
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.remove(),300); }, 1800);
}

// --- Sound utilities (WebAudio synthesized tones) ---
function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if the context is suspended (browsers block audio until user gesture)
  if(audioCtx.state === 'suspended'){
    audioCtx.resume().catch(()=>{});
  }
}

function playTone(freq, duration=0.12, type='sine', gain=0.12){
  try{
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain * (muted?0:masterVolume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t + duration + 0.02);
  }catch(e){ /* silent degrade */ }
}

function playSound(kind){
  // if user provided audio files (assets/sounds/*), prefer those
  if(useFiles && audioFiles[kind]){
    try{
      const a = audioFiles[kind].cloneNode();
      a.volume = muted ? 0 : masterVolume;
      a.play().catch(()=>{});
      return;
    }catch(e){ /* fall back to tones */ }
  }
  switch(kind){
    case 'collect': playTone(880,0.12,'sine',0.14); break;
    case 'miss': playTone(220,0.18,'sawtooth',0.08); break;
    case 'click': playTone(1320,0.06,'sine',0.06); break;
    case 'win': playTone(1320,0.2,'triangle',0.16); setTimeout(()=>playTone(1040,0.16,'sine',0.14), 140); break;
    case 'milestone': playTone(990,0.14,'sine',0.12); break;
    default: playTone(660,0.08,'sine',0.06);
  }
}

function maybeLoadAudioFiles(){
  if(useFiles) return;
  const names = ['collect','miss','click','win','milestone'];
  let foundAny = false;
  for(const n of names){
    // try common extensions
    const paths = [`assets/sounds/${n}.mp3`, `assets/sounds/${n}.wav`, `assets/sounds/${n}.ogg`];
    for(const p of paths){
      const a = new Audio(p);
      a.preload = 'auto';
      // attach error handler to detect missing files
      a.addEventListener('error', ()=>{});
      // quick test: do not rely on load events here; assume presence and let play() fail if missing
      audioFiles[n] = a;
      foundAny = true;
      break;
    }
  }
  if(foundAny) useFiles = true;
}

function setMasterVolume(v){
  masterVolume = Math.min(1, Math.max(0, Number(v)));
  localStorage.setItem('cwb_volume', masterVolume.toString());
}

function setMuted(val){
  muted = !!val;
  localStorage.setItem('cwb_muted', muted ? '1' : '0');
  // update audio elements volume if present
  Object.values(audioFiles).forEach(a=>{ try{ a.volume = muted?0:masterVolume; }catch(e){} });
  const muteBtn = document.getElementById('muteBtn');
  if(muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
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
  playSound('click');
});
resetBtn.addEventListener('click', ()=>{ resetGame(false); });
playAgainBtn.addEventListener('click', ()=>{ overlay.classList.add('hidden'); startGame(); });

// play click sound for header buttons
document.querySelectorAll('.controls button, .controls select, .overlay button').forEach(el=>{
  el.addEventListener('click', ()=> playSound('click'));
});

// Initialize audio controls from localStorage and hook events
const volumeSlider = document.getElementById('volumeSlider');
const muteBtn = document.getElementById('muteBtn');
if(volumeSlider){
  const saved = localStorage.getItem('cwb_volume');
  if(saved !== null) { masterVolume = Number(saved); volumeSlider.value = masterVolume; }
  volumeSlider.addEventListener('input', (e)=>{ setMasterVolume(e.target.value); });
}
if(muteBtn){
  const savedM = localStorage.getItem('cwb_muted');
  muted = savedM === '1';
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', ()=>{ setMuted(!muted); });
}

// ensure audio elements match initial volume
maybeLoadAudioFiles();
setMuted(muted);

// Accessibility: allow clicking empty space to remove stray drops (no effect)
gameArea.addEventListener('click', ()=>{});

// initialize UI values
goalEl.textContent = difficultySettings[difficultyEl.value].goal;
timerEl.textContent = difficultySettings[difficultyEl.value].timeLimit;
difficultyEl.addEventListener('change', ()=>{
  goalEl.textContent = difficultySettings[difficultyEl.value].goal;
  timerEl.textContent = difficultySettings[difficultyEl.value].timeLimit;
});

// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Play, Home, CheckCircle, Star, Volume2, ArrowRight, PaintBucket } from 'lucide-react';

// --- Khởi tạo Tailwind trực tiếp qua CDN ---
const injectTailwind = () => {
  if (!document.getElementById('tailwind-cdn')) {
    const script = document.createElement('script');
    script.id = 'tailwind-cdn';
    script.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(script);
  }
};

// --- UTILS: SOUND & TTS ---
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  
  // Try to find a female voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'))
  );
  if (preferredVoice) utterance.voice = preferredVoice;
  
  window.speechSynthesis.speak(utterance);
};

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'error') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }
};

// --- COMPONENT: CONFETTI ---
const Confetti = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * -20}%`,
    color: ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e'][Math.floor(Math.random() * 4)],
    animationDuration: `${Math.random() * 1.5 + 1}s`,
    animationDelay: `${Math.random() * 0.2}s`
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-full animate-fall"
          style={{
            left: p.left,
            top: p.top,
            backgroundColor: p.color,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// --- GAME 1: SILENT LETTERS (TAP TO MATCH) ---
const SilentLettersGame = ({ onBack, onFinish, bestScore }) => {
  const puzzles = [
    { word1: 'knight', word2: 'knee', silent: 'k', options: ['w', 'k', 'b', 'l'] },
    { word1: 'wrist', word2: 'wriggle', silent: 'w', options: ['h', 'k', 'w', 'b'] },
    { word1: 'numb', word2: 'thumb', silent: 'b', options: ['k', 'l', 'h', 'b'] },
    { word1: 'rhino', word2: 'rhyme', silent: 'h', options: ['w', 'h', 'l', 'k'] },
    { word1: 'palm', word2: 'half', silent: 'l', options: ['l', 'w', 'b', 'h'] }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [solved, setSolved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [score, setScore] = useState(0);
  const [hasMistake, setHasMistake] = useState(false);

  const currentPuzzle = puzzles[currentIndex];

  const handleLetterTap = (letter) => {
    playSound('pop');
    setSelectedLetter(letter);
  };

  const handleTargetTap = () => {
    if (!selectedLetter) return;
    
    if (selectedLetter === currentPuzzle.silent) {
      playSound('success');
      setSolved(true);
      setShowConfetti(true);
      
      const earnedPoints = hasMistake ? 5 : 10;
      setScore(prev => prev + earnedPoints);
      
      speak(`${currentPuzzle.word1}. ${currentPuzzle.word2}. The silent letter is ${currentPuzzle.silent}`);
      
      setTimeout(() => {
        if (currentIndex < puzzles.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSelectedLetter(null);
          setSolved(false);
          setShowConfetti(false);
          setHasMistake(false); 
        }
      }, 3500);
    } else {
      playSound('error');
      setSelectedLetter(null);
      setHasMistake(true); 
      const target = document.getElementById('drop-target');
      if (target) {
        target.classList.add('animate-shake');
        setTimeout(() => target.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 animate-fade-in">
      <Confetti active={showConfetti} />
      
      <div className="flex justify-between items-center w-full mb-8">
        <button onClick={onBack} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
          <Home className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex gap-1">
          {puzzles.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i <= currentIndex ? 'bg-amber-400' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full font-bold text-amber-600 border-2 border-amber-300 shadow-sm">
          <Star className="w-5 h-5 fill-amber-500" /> {score}
        </div>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-2 text-center">Tìm chữ cái "Yên lặng"</h2>
      <p className="text-slate-600 mb-8 text-center">Chạm vào chữ cái, sau đó chạm vào ô trống ở giữa nhé!</p>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full flex flex-col items-center mb-8 border-4 border-indigo-100">
        <div className="flex items-center justify-center gap-4 text-3xl md:text-5xl font-bold text-slate-700 mb-4">
          <span>{currentPuzzle.word1.replace(currentPuzzle.silent, '_')}</span>
          <div 
            id="drop-target"
            onClick={handleTargetTap}
            className={`w-16 h-16 md:w-20 md:h-20 border-4 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all
              ${solved ? 'bg-green-100 border-green-500 text-green-600 scale-110' : 
                selectedLetter ? 'bg-indigo-50 border-indigo-400 scale-105' : 'border-slate-300 bg-slate-50'}`}
          >
            {solved ? currentPuzzle.silent : (selectedLetter ? <span className="opacity-50">{selectedLetter}</span> : '?')}
          </div>
          <span>{currentPuzzle.word2.replace(currentPuzzle.silent, '_')}</span>
        </div>
      </div>

      {!solved && (
        <div className="flex gap-4 flex-wrap justify-center">
          {currentPuzzle.options.map((letter, idx) => (
            <button
              key={idx}
              onClick={() => handleLetterTap(letter)}
              className={`w-16 h-16 md:w-20 md:h-20 text-3xl font-bold rounded-2xl shadow-lg transform transition-all border-b-4
                ${selectedLetter === letter 
                  ? 'bg-amber-400 border-amber-600 text-white scale-110 -translate-y-2' 
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {solved && currentIndex === puzzles.length - 1 && (
        <div className="mt-8 text-center animate-bounce">
          <h3 className="text-3xl font-bold text-green-500 mb-2">Tuyệt vời! Em đã hoàn thành!</h3>
          <p className="text-xl font-bold text-amber-500 mb-6">Đạt được: {score} Điểm</p>
          <button onClick={() => onFinish(score)} className="px-8 py-3 bg-indigo-500 text-white rounded-full font-bold text-xl shadow-lg">
            Nhận điểm & Quay lại
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// --- GAME 2: THE MAZE (CHOOSE THE RIGHT WORD) ---
const MazeGame = ({ onBack, onFinish, bestScore }) => {
  const steps = [
    { textBefore: "The silver knight", wrong: "signs", correct: "sighs", textAfter: "." },
    { textBefore: "The gold", wrong: "knife", correct: "knight", textAfter: "soars." },
    { textBefore: '"My wrists are', wrong: "sure", correct: "sore", textAfter: '."' },
    { textBefore: '"The', wrong: "shiver", correct: "silver", textAfter: 'knight deserves the cup."' }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [knightPos, setKnightPos] = useState(0);

  const [score, setScore] = useState(0);
  const [hasMistake, setHasMistake] = useState(false);

  const handleAnswer = (word) => {
    const isCorrect = word === steps[currentStep].correct;
    
    if (isCorrect) {
      playSound('success');
      
      const earnedPoints = hasMistake ? 5 : 10;
      setScore(prev => prev + earnedPoints);
      
      speak(`${steps[currentStep].textBefore} ${word} ${steps[currentStep].textAfter}`);
      setKnightPos(currentStep + 1);
      
      if (currentStep === steps.length - 1) {
        setShowConfetti(true);
      } else {
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setHasMistake(false);
        }, 2000);
      }
    } else {
      playSound('error');
      setHasMistake(true);
      const container = document.getElementById('quiz-container');
      if (container) {
        container.classList.add('animate-shake');
        setTimeout(() => container.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-4 animate-fade-in">
      <Confetti active={showConfetti} />
      
      <div className="flex justify-between items-center w-full mb-8">
        <button onClick={onBack} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
          <Home className="w-6 h-6 text-slate-700" />
        </button>
        <h2 className="text-2xl font-bold text-indigo-800">Mê cung Kỳ bí</h2>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full font-bold text-amber-600 border-2 border-amber-300 shadow-sm">
          <Star className="w-5 h-5 fill-amber-500" /> {score}
        </div>
      </div>

      <div className="w-full bg-green-100 rounded-full h-24 mb-12 relative flex items-center px-4 shadow-inner border-4 border-green-200">
        <div className="absolute w-full h-2 bg-green-300 top-1/2 transform -translate-y-1/2 left-0 z-0"></div>
        
        {[0, 1, 2, 3, 4].map(pos => (
          <div key={pos} className="absolute w-4 h-4 bg-green-500 rounded-full z-10" style={{ left: `${(pos / 4) * 85 + 5}%` }}></div>
        ))}

        <div className="absolute text-5xl z-20" style={{ left: '90%' }}>🏆</div>
        
        <div 
          className="absolute text-5xl z-30 transition-all duration-1000 ease-in-out"
          style={{ left: `${(knightPos / 4) * 85}%`, transform: knightPos === 4 ? 'scale(1.2) rotate(10deg)' : 'none' }}
        >
          🛡️
        </div>
      </div>

      {currentStep < steps.length && knightPos === currentStep && (
        <div id="quiz-container" className="bg-white p-6 md:p-10 rounded-3xl shadow-xl w-full text-center border-4 border-indigo-100">
          <button onClick={() => speak(steps[currentStep].textBefore)} className="mb-4 p-3 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition">
            <Volume2 className="w-8 h-8" />
          </button>
          
          <p className="text-2xl md:text-3xl text-slate-700 font-medium mb-8 leading-relaxed">
            {steps[currentStep].textBefore} <span className="inline-block w-24 h-10 border-b-4 border-slate-300 border-dashed mx-2"></span> {steps[currentStep].textAfter}
          </p>
          
          <div className="flex gap-4 justify-center">
            {[steps[currentStep].correct, steps[currentStep].wrong].sort(() => Math.random() - 0.5).map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(word)}
                className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-[0_6px_0_0_#3730a3] active:shadow-[0_0px_0_0_#3730a3] active:translate-y-2 transition-all"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="mt-8 text-center animate-bounce">
          <h3 className="text-3xl font-bold text-amber-500 mb-2">Chàng Hiệp sĩ đã lấy được cúp!</h3>
          <p className="text-xl font-bold text-green-600 mb-6">Đạt được: {score} Điểm</p>
          <button onClick={() => onFinish(score)} className="px-8 py-3 bg-indigo-500 text-white rounded-full font-bold text-xl shadow-lg">
            Nhận điểm & Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

// --- GAME 3: COLOR BY NUMBER ---
const ColorGame = ({ onBack, onFinish, bestScore }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [parts, setParts] = useState({
    armor: '#e2e8f0', 
    plume: '#e2e8f0',
    belt: '#e2e8f0',
    dots: '#e2e8f0'
  });

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState({});

  const palette = [
    { id: 'gold', hex: '#fbbf24', number: 1, name: 'Gold', target: 'armor' },
    { id: 'red', hex: '#ef4444', number: 2, name: 'Red', target: 'plume' },
    { id: 'brown', hex: '#8b5cf6', number: 3, name: 'Purple', target: 'belt' }, 
    { id: 'white', hex: '#ffffff', number: 4, name: 'White', target: 'dots' }
  ];

  const handleColorSelect = (color) => {
    playSound('pop');
    setSelectedColor(color);
    speak(`Number ${color.number} is ${color.name}`);
  };

  const handlePartClick = (partName, reqNumber) => {
    if (!selectedColor) {
      speak("Please select a color first");
      return;
    }
    
    if (parts[partName] !== '#e2e8f0') return;
    
    if (selectedColor.number === reqNumber) {
      playSound('success');
      
      const earnedPoints = mistakes[partName] ? 5 : 10;
      setScore(prev => prev + earnedPoints);
      
      setParts(prev => {
        const newParts = { ...prev, [partName]: selectedColor.hex };
        checkWin(newParts);
        return newParts;
      });
    } else {
      playSound('error');
      setMistakes(prev => ({...prev, [partName]: true}));
      speak(`Oops! This needs number ${reqNumber}`);
    }
  };

  const checkWin = (currentParts) => {
    if (
      currentParts.armor === '#fbbf24' &&
      currentParts.plume === '#ef4444' &&
      currentParts.belt === '#8b5cf6' &&
      currentParts.dots === '#ffffff'
    ) {
      setTimeout(() => {
        setShowConfetti(true);
        speak("Amazing! You colored the Gold Knight!");
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <Confetti active={showConfetti} />
      
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={onBack} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
          <Home className="w-6 h-6 text-slate-700" />
        </button>
        <h2 className="text-2xl font-bold text-indigo-800">Họa sĩ Tài ba</h2>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full font-bold text-amber-600 border-2 border-amber-300 shadow-sm">
          <Star className="w-5 h-5 fill-amber-500" /> {score}
        </div>
      </div>

      <p className="text-slate-600 mb-6 text-center">Nghe đọc tiếng Anh và tô màu cho chàng Hiệp sĩ Vàng nhé!</p>

      <div className="flex flex-col md:flex-row gap-8 w-full items-center justify-center">
        
        <div className="flex md:flex-col gap-4 bg-white p-4 rounded-3xl shadow-lg border-2 border-slate-100">
          {palette.map(color => (
            <button
              key={color.id}
              onClick={() => handleColorSelect(color)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-md transition-all
                ${selectedColor?.id === color.id ? 'scale-110 ring-4 ring-indigo-400' : 'hover:scale-105'}
                ${color.id === 'white' ? 'border-2 border-slate-200 text-slate-800' : 'text-white'}`}
              style={{ backgroundColor: color.hex }}
            >
              {color.number}
            </button>
          ))}
        </div>

        <div className="bg-sky-100 p-8 rounded-3xl shadow-inner border-4 border-sky-200 relative">
          <svg width="300" height="400" viewBox="0 0 300 400" className="drop-shadow-xl">
            <path 
              d="M 150 20 Q 200 10 220 50 Q 240 90 180 100 Q 150 110 140 80 Z" 
              fill={parts.plume} 
              stroke="#334155" strokeWidth="4"
              onClick={() => handlePartClick('plume', 2)}
              className="cursor-pointer transition-colors duration-500 hover:opacity-80"
            />
            <text x="180" y="60" fontSize="24" fontWeight="bold" fill={parts.plume === '#e2e8f0' ? '#64748b' : 'rgba(0,0,0,0.2)'} pointerEvents="none">2</text>

            <rect x="100" y="160" width="100" height="120" rx="40" 
              fill={parts.armor} stroke="#334155" strokeWidth="4" 
              onClick={() => handlePartClick('armor', 1)}
              className="cursor-pointer transition-colors duration-500 hover:opacity-80"
            />
            <text x="142" y="230" fontSize="30" fontWeight="bold" fill={parts.armor === '#e2e8f0' ? '#64748b' : 'rgba(0,0,0,0.2)'} pointerEvents="none">1</text>

            <rect x="110" y="90" width="80" height="80" rx="20" 
              fill={parts.armor} stroke="#334155" strokeWidth="4" 
              onClick={() => handlePartClick('armor', 1)}
              className="cursor-pointer transition-colors duration-500 hover:opacity-80"
            />
            <rect x="120" y="110" width="60" height="20" rx="10" fill="#334155" pointerEvents="none" />

            <rect x="95" y="240" width="110" height="30" rx="10" 
              fill={parts.belt} stroke="#334155" strokeWidth="4"
              onClick={() => handlePartClick('belt', 3)}
              className="cursor-pointer transition-colors duration-500 hover:opacity-80"
            />
            <circle cx="150" cy="255" r="10" fill="#fbbf24" stroke="#334155" strokeWidth="2" pointerEvents="none"/>
            <text x="110" y="262" fontSize="20" fontWeight="bold" fill={parts.belt === '#e2e8f0' ? '#64748b' : 'rgba(0,0,0,0.2)'} pointerEvents="none">3</text>

            <path d="M 120 280 L 120 320 Q 150 330 180 320 L 180 280 Z" fill="#ef4444" stroke="#334155" strokeWidth="4" pointerEvents="none"/>
            <circle cx="140" cy="300" r="15" fill={parts.dots} stroke="#334155" strokeWidth="2" onClick={() => handlePartClick('dots', 4)} className="cursor-pointer transition-colors duration-500"/>
            <text x="134" y="306" fontSize="16" fontWeight="bold" fill={parts.dots === '#e2e8f0' ? '#64748b' : 'rgba(0,0,0,0.1)'} pointerEvents="none">4</text>
            <circle cx="165" cy="290" r="10" fill={parts.dots} stroke="#334155" strokeWidth="2" onClick={() => handlePartClick('dots', 4)} className="cursor-pointer transition-colors duration-500"/>
            
            <rect x="125" y="320" width="15" height="50" fill="#fb923c" stroke="#334155" strokeWidth="4" pointerEvents="none"/>
            <rect x="160" y="320" width="15" height="50" fill="#fb923c" stroke="#334155" strokeWidth="4" pointerEvents="none"/>
          </svg>
        </div>
      </div>

      {showConfetti && (
        <div className="mt-8 text-center animate-bounce">
          <h3 className="text-3xl font-bold text-pink-500 mb-2">Bức tranh thật tuyệt đẹp!</h3>
          <p className="text-xl font-bold text-amber-600 mb-6">Đạt được: {score} Điểm</p>
          <button onClick={() => onFinish(score)} className="px-8 py-3 bg-indigo-500 text-white rounded-full font-bold text-xl shadow-lg">
            Nhận điểm & Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP (MENU HUB) ---
export default function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [isTailwindLoaded, setIsTailwindLoaded] = useState(false);
  
  const [scores, setScores] = useState({
    game1: null,
    game2: null,
    game3: null
  });

  // Inject Tailwind & Request voice load on mount
  useEffect(() => {
    injectTailwind();
    const timer = setTimeout(() => setIsTailwindLoaded(true), 200);
    
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    
    return () => clearTimeout(timer);
  }, []);

  const handleFinishGame = (gameKey, score) => {
    setScores(prev => ({
      ...prev,
      [gameKey]: Math.max(prev[gameKey] || 0, score) 
    }));
    setCurrentView('menu');
  };

  const totalScore = (scores.game1 || 0) + (scores.game2 || 0) + (scores.game3 || 0);
  
  if (!isTailwindLoaded) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Đang tải giao diện...</div>;

  if (currentView === 'game1') return <SilentLettersGame onBack={() => setCurrentView('menu')} onFinish={(score) => handleFinishGame('game1', score)} bestScore={scores.game1} />;
  if (currentView === 'game2') return <MazeGame onBack={() => setCurrentView('menu')} onFinish={(score) => handleFinishGame('game2', score)} bestScore={scores.game2} />;
  if (currentView === 'game3') return <ColorGame onBack={() => setCurrentView('menu')} onFinish={(score) => handleFinishGame('game3', score)} bestScore={scores.game3} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-white relative">
        
        {totalScore > 0 && (
          <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-4 shadow-xl border-4 border-white rotate-12 transform hover:rotate-0 transition-transform">
            <div className="text-white text-center">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider mb-1 drop-shadow-md">Tổng điểm</p>
              <p className="text-3xl md:text-4xl font-black drop-shadow-lg">{totalScore}<span className="text-lg md:text-xl text-amber-100">/130</span></p>
            </div>
          </div>
        )}

        <div className="text-center mb-10 mt-4 md:mt-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-pink-500 mb-4">
            Knight Fight
          </h1>
          <p className="text-xl text-indigo-800 font-medium">Phiếu Bài Tập Số Hóa</p>
        </div>

        <div className="flex flex-col gap-6">
          <button 
            onClick={() => { playSound('pop'); setCurrentView('game1'); }}
            className="flex items-center p-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-3xl shadow-[0_8px_0_0_#1e3a8a] hover:translate-y-1 hover:shadow-[0_4px_0_0_#1e3a8a] active:translate-y-2 active:shadow-none transition-all group relative overflow-hidden"
          >
            <div className="bg-white/30 p-4 rounded-2xl mr-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">1. Trò chơi Kéo Thả</h2>
              <p className="text-blue-100">Tìm chữ cái yên lặng (Silent letters)</p>
            </div>
            {scores.game1 !== null ? (
               <div className="flex flex-col items-center mr-2 bg-blue-600/30 px-3 py-2 rounded-xl">
                 <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 mb-1" />
                 <span className="text-white font-bold text-lg">{scores.game1}/50</span>
               </div>
            ) : (
               <ArrowRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <button 
            onClick={() => { playSound('pop'); setCurrentView('game2'); }}
            className="flex items-center p-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-3xl shadow-[0_8px_0_0_#064e3b] hover:translate-y-1 hover:shadow-[0_4px_0_0_#064e3b] active:translate-y-2 active:shadow-none transition-all group relative overflow-hidden"
          >
            <div className="bg-white/30 p-4 rounded-2xl mr-6">
              <Star className="w-10 h-10 text-white" />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">2. Mê cung Kỳ bí</h2>
              <p className="text-emerald-100">Chọn từ đúng giúp Hiệp sĩ tìm Cúp</p>
            </div>
            {scores.game2 !== null ? (
               <div className="flex flex-col items-center mr-2 bg-emerald-600/30 px-3 py-2 rounded-xl">
                 <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 mb-1" />
                 <span className="text-white font-bold text-lg">{scores.game2}/40</span>
               </div>
            ) : (
               <ArrowRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <button 
            onClick={() => { playSound('pop'); setCurrentView('game3'); }}
            className="flex items-center p-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-3xl shadow-[0_8px_0_0_#881337] hover:translate-y-1 hover:shadow-[0_4px_0_0_#881337] active:translate-y-2 active:shadow-none transition-all group relative overflow-hidden"
          >
            <div className="bg-white/30 p-4 rounded-2xl mr-6">
              <PaintBucket className="w-10 h-10 text-white" />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">3. Họa sĩ Tài ba</h2>
              <p className="text-pink-100">Lắng nghe và tô màu theo số</p>
            </div>
            {scores.game3 !== null ? (
               <div className="flex flex-col items-center mr-2 bg-rose-600/30 px-3 py-2 rounded-xl">
                 <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 mb-1" />
                 <span className="text-white font-bold text-lg">{scores.game3}/40</span>
               </div>
            ) : (
               <ArrowRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
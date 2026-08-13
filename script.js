const { useEffect, useRef, useState } = React;

// ---------- data ----------
const palette = [
  { color: '#f04444', shape: '▲' },
  { color: '#3478f6', shape: '◆' },
  { color: '#f5bd28', shape: '●' },
  { color: '#32b76c', shape: '■' },
];
const make = (subject, prompt, answers, correct, seconds = 20) => ({
  subject,
  prompt,
  options: answers.map((text, i) => ({ text, ...palette[i] })),
  correct,
  seconds,
});

const questions = [
  make('Maths', 'What number comes after 7?', ['6', '8', '9', '10'], 1, 15),
  make('Our Island Jamaica', 'Which fruit is shown on Jamaica’s coat of arms?', ['Ackee', 'Apple', 'Grape', 'Pear'], 0),
  make('Phonics', 'Which word begins with the /sh/ sound?', ['ship', 'cat', 'moon', 'van'], 0, 15),
  make('Reading', 'Mia has a red hat. What colour is Mia’s hat?', ['Blue', 'Green', 'Red', 'Yellow'], 2),
  make('Maths', 'How many sides does a triangle have?', ['2', '3', '4', '5'], 1, 15),
  make('Our Island Jamaica', 'What are the colours of the Jamaican flag?', ['Red, white, blue', 'Black, green, gold', 'Pink, blue, white', 'Orange, purple, red'], 1, 25),
  make('Phonics', 'Which word rhymes with "sun"?', ['run', 'sit', 'top', 'red'], 0, 15),
  make('Reading', 'The dog ran to the big tree. Who ran?', ['The cat', 'The dog', 'The bird', 'The fish'], 1),
  make('Maths', 'Which group has the most: 2, 5, or 3 stars?', ['2 stars', '5 stars', '3 stars', 'They are equal'], 1),
  make('Our Island Jamaica', 'What is the capital city of Jamaica?', ['Kingston', 'Montego Bay', 'Ocho Rios', 'Negril'], 0, 25),
  make('Phonics', 'What is the first sound in "fish"?', ['/m/', '/f/', '/s/', '/t/'], 1, 15),
  make('Reading', 'Sam is happy because he can play. How does Sam feel?', ['Sad', 'Sleepy', 'Happy', 'Angry'], 2),
];

const demoPlayers = [
  { name: 'Amari', score: 4380, delta: 870 },
  { name: 'Zoe', score: 4120, delta: 910 },
  { name: 'Kairo', score: 3890, delta: 760 },
  { name: 'Nia', score: 3510, delta: 690 },
  { name: 'Noah', score: 3220, delta: 640 },
];
const avatars = ['🐯', '🦊', '🐼', '🦁', '🐸'];

function Logo() {
  return (
    <button className="logo-word" onClick={() => location.reload()}>
      <span>bright</span>buzz<i>!</i>
    </button>
  );
}

function App() {
  const [view, setView] = useState('home');
  const [pin, setPin] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [players, setPlayers] = useState(demoPlayers.slice(0, 4));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('question');
  const [time, setTime] = useState(questions[0].seconds);
  const [answered, setAnswered] = useState(null);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState('');
  const channel = useRef(null);
  const total = questions.length;

  // cross-tab sync: open this pen in two tabs to simulate host + player
  useEffect(() => {
    channel.current = new BroadcastChannel('brightbuzz-room');
    channel.current.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'join') {
        setPlayers((p) => (p.some((x) => x.name === m.name) ? p : [...p, { name: m.name, score: 0, delta: 0 }]));
      }
      if (m.type === 'state' && view === 'player') {
        setIndex(m.index);
        setPhase(m.phase);
        setTime(m.time);
        setAnswered(null);
      }
    };
    return () => channel.current && channel.current.close();
  }, [view]);

  useEffect(() => {
    if (view !== 'host' || phase !== 'question') return;
    if (time <= 0) {
      setPhase('reveal');
      return;
    }
    const t = setTimeout(() => setTime((v) => v - 1), 1000);
    channel.current && channel.current.postMessage({ type: 'state', index, phase, time });
    return () => clearTimeout(t);
  }, [time, view, phase, index]);

  const createGame = () => {
    const p = String(Math.floor(100000 + Math.random() * 900000));
    setPin(p);
    localStorage.setItem('brightbuzz-pin', p);
    setPlayers(demoPlayers.slice(0, 4));
    setView('lobby');
  };
  const startGame = () => {
    setIndex(0);
    setPhase('question');
    setTime(questions[0].seconds);
    setView('host');
  };
  const next = () => {
    if (phase === 'reveal') return setPhase('board');
    if (phase === 'board') {
      if (index < total - 1) {
        const n = index + 1;
        setIndex(n);
        setTime(questions[n].seconds);
        setPhase('question');
      } else {
        setPhase('final');
      }
    }
  };
  const doJoin = () => {
    if (joinPin.length !== 6 || !nickname.trim()) {
      setToast('Enter a 6-digit PIN and nickname');
      return;
    }
    channel.current && channel.current.postMessage({ type: 'join', name: nickname.trim() });
    setView('player');
  };

  return (
    <div className="app-shell">
      <header>
        <Logo />
        <nav>
          <button onClick={() => setView('library')}>📚 Quiz library</button>
          <button onClick={() => setView('builder')}>➕ Create</button>
        </nav>
        <button className="sound" onClick={() => setMuted(!muted)}>
          🔊 {muted ? 'Sound off' : 'Sound on'}
        </button>
      </header>
      <main key={view + phase} className="view-fade">
        {view === 'home' && <Home onHost={createGame} onJoin={() => setView('join')} onLibrary={() => setView('library')} />}
        {view === 'join' && <Join pin={joinPin} setPin={setJoinPin} name={nickname} setName={setNickname} submit={doJoin} back={() => setView('home')} toast={toast} />}
        {view === 'lobby' && <Lobby pin={pin} players={players} start={startGame} back={() => setView('home')} />}
        {view === 'host' && <HostGame q={questions[index]} index={index} total={total} time={time} phase={phase} players={players} next={next} reveal={() => setPhase('reveal')} />}
        {view === 'player' && <Player q={questions[index]} phase={phase} answered={answered} pick={setAnswered} name={nickname} />}
        {view === 'library' && <QuizLibrary play={createGame} create={() => setView('builder')} back={() => setView('home')} />}
        {view === 'builder' && <Builder back={() => setView('library')} saved={() => { setToast('Quiz saved!'); setView('library'); }} />}
      </main>
    </div>
  );
}

function Home({ onHost, onJoin, onLibrary }) {
  return (
    <section className="home">
      <div className="doodle d1">123</div>
      <div className="doodle d2">ABC</div>
      <div className="hero-copy">
        <span className="eyebrow">✨ Made for little learners</span>
        <h1>Big learning.<br /><em>Happy buzzing.</em></h1>
        <p>Playful quizzes for bright young minds—full of colour, cheering, and just the right amount of challenge.</p>
        <div className="hero-actions">
          <button className="primary" onClick={onHost}>▶ Host a game</button>
          <button className="secondary" onClick={onJoin}>👥 Join with PIN</button>
        </div>
        <button className="browse" onClick={onLibrary}>Browse 4 ready-to-play K3 quizzes →</button>
      </div>
      <div className="hero-art">
        <div className="sun">☀</div>
        <div className="card-stack card-one"><span>7 + 1 = ?</span><b>8!</b></div>
        <div className="card-stack card-two"><span>Which begins with /sh/?</span><b>SHIP 🚢</b></div>
        <div className="bee">🐝</div>
      </div>
      <div className="trust">
        <div><b>12</b><span>original K3 questions</span></div>
        <div><b>4</b><span>learning areas</span></div>
        <div><b>5–6</b><span>years old</span></div>
      </div>
    </section>
  );
}

function Join({ pin, setPin, name, setName, submit, back, toast }) {
  return (
    <section className="center-page">
      <button className="back" onClick={back}>‹ Back</button>
      <div className="join-card">
        <div className="mini-bee">🐝</div>
        <p className="kicker">Ready to buzz?</p>
        <h2>Join the game</h2>
        <label>Game PIN
          <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="000 000" />
        </label>
        <label>Your nickname
          <input maxLength={16} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Little Lion" />
        </label>
        {toast && <p className="error">{toast}</p>}
        <button className="primary wide" onClick={submit}>Let's go! ▶</button>
      </div>
    </section>
  );
}

function Lobby({ pin, players, start, back }) {
  return (
    <section className="lobby">
      <button className="back" onClick={back}>✕ End game</button>
      <div className="pin-panel">
        <span>Game PIN</span>
        <strong>{pin}</strong>
        <small>Waiting for our busy bees…</small>
      </div>
      <div className="player-wrap">
        <div className="section-title">
          <h2>👥 {players.length} players joined</h2>
          <span className="live-dot">LIVE</span>
        </div>
        <div className="player-cloud">
          {players.map((p, i) => (
            <div className="player-chip" key={p.name} style={{ animationDelay: `${i * 60}ms` }}>
              {avatars[i % avatars.length]} {p.name} ✓
            </div>
          ))}
        </div>
      </div>
      <button className="primary start" onClick={start}>Start game ▶</button>
      <p className="helper">Open this Pen in another tab to join with this PIN</p>
    </section>
  );
}

function HostGame({ q, index, total, time, phase, players, next, reveal }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => setSelected(null), [index]);
  const choose = (i) => {
    if (phase !== 'question' || selected !== null) return;
    setSelected(i);
    window.setTimeout(reveal, 350);
  };
  if (phase === 'final') return <Final />;
  if (phase === 'board') return <Leaderboard players={players} next={next} final={index === total - 1} />;
  const counts = [1, 3, 0, 1];
  return (
    <section className="game">
      <div className="game-top">
        <span>Question {index + 1} of {total}</span>
        <b>{q.subject}</b>
        <span>👥 5</span>
      </div>
      <div className="progress"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      <h2 className="question">{q.prompt}</h2>
      <div className="game-meta">
        <div className={`timer ${time < 6 ? 'urgent' : ''}`}>🕒 {time}</div>
        {phase === 'question' && <div className="play-hint">Tap an answer to play here, or answer on a joined device</div>}
        {phase === 'reveal' && <div className="reveal-title"><b>{q.options[q.correct].text}</b> is correct! 🎉</div>}
      </div>
      <div className="answers">
        {q.options.map((o, i) => (
          <button
            type="button"
            aria-label={`Choose ${o.text}`}
            onClick={() => choose(i)}
            disabled={phase !== 'question' || selected !== null}
            className={`answer ${selected === i ? 'chosen' : ''} ${phase === 'reveal' && i !== q.correct ? 'dim' : ''} ${phase === 'reveal' && i === q.correct ? 'correct' : ''}`}
            style={{ background: o.color }}
            key={o.text}
          >
            <strong>{o.shape}</strong>
            <span>{o.text}</span>
            {phase === 'reveal' && <b className="count">{counts[i]}</b>}
          </button>
        ))}
      </div>
      {phase === 'reveal' && <button className="primary next" onClick={next}>See leaderboard →</button>}
    </section>
  );
}

function Leaderboard({ players, next, final }) {
  return (
    <section className="board">
      <p className="kicker">Fast minds, big points!</p>
      <h2>Leaderboard</h2>
      <div className="rank-list">
        {players.slice(0, 5).map((p, i) => (
          <div className="rank" style={{ animationDelay: `${i * 80}ms` }} key={p.name}>
            <b>{i + 1}</b>
            <span className="avatar">{avatars[i]}</span>
            <strong>{p.name}</strong>
            <em>+{p.delta}</em>
            <span>{p.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <button className="primary next" onClick={next}>{final ? 'See the podium' : 'Next question'} →</button>
    </section>
  );
}

function Final() {
  return (
    <section className="final">
      <p className="kicker">Wonderful work, everyone!</p>
      <h2>Today's bright stars</h2>
      <div className="podium">
        <div className="pod second"><span>🦊</span><b>Zoe</b><i>2</i></div>
        <div className="pod first">👑<span>🐯</span><b>Amari</b><i>1</i></div>
        <div className="pod third"><span>🐼</span><b>Kairo</b><i>3</i></div>
      </div>
      <div className="confetti">✦ ● ▲ ✦ ■ ● ✦</div>
      <button className="primary" onClick={() => location.reload()}>Play another game</button>
    </section>
  );
}

function Player({ q, phase, answered, pick, name }) {
  if (phase === 'final') {
    return (
      <section className="player-screen">
        <div className="player-message">🏆<h2>Great game, {name}!</h2></div>
      </section>
    );
  }
  if (phase !== 'question') {
    return (
      <section className="player-screen">
        <div className="player-message">✨<h2>{phase === 'reveal' ? 'Answer sent!' : 'Look at the big screen'}</h2></div>
      </section>
    );
  }
  return (
    <section className="player-screen">
      <div className="player-head"><b>{name}</b><span>Choose your answer</span></div>
      <div className="player-grid">
        {q.options.map((o, i) => (
          <button
            disabled={answered !== null}
            onClick={() => pick(i)}
            className={answered !== null && answered !== i ? 'faded' : ''}
            style={{ background: o.color }}
            key={i}
          >
            <span>{answered === i ? '✓' : o.shape}</span>
          </button>
        ))}
      </div>
      {answered !== null && <div className="locked">Locked in! Look up 👀</div>}
    </section>
  );
}

function QuizLibrary({ play, create, back }) {
  const sets = [
    ['Maths Magic', 'Numbers, shapes & patterns', '🧮', '#ffdc68'],
    ['My Jamaica', 'People, places & symbols', '🇯🇲', '#8bd5a4'],
    ['Phonics Fun', 'Sounds, blends & rhymes', '🔤', '#a8ccff'],
    ['Story Detectives', 'Early reading comprehension', '📚', '#ffaaa5'],
  ];
  const labels = ['MATHEMATICS', 'OUR ISLAND JAMAICA', 'PHONICS', 'READING'];
  return (
    <section className="library">
      <button className="back" onClick={back}>‹ Home</button>
      <div className="library-head">
        <div>
          <p className="kicker">Teacher's shelf</p>
          <h1>Ready-to-play quizzes</h1>
          <p>Original activities aligned with popular Jamaican K3 learning themes.</p>
        </div>
        <button className="secondary" onClick={create}>➕ Create your own</button>
      </div>
      <div className="quiz-grid">
        {sets.map((s, i) => (
          <article className="quiz-card" key={s[0]}>
            <div className="cover" style={{ background: s[3] }}><span>{s[2]}</span><i>K3</i></div>
            <div>
              <small>{labels[i]}</small>
              <h3>{s[0]}</h3>
              <p>{s[1]}</p>
              <footer>
                <span>🕒 8 min</span>
                <button onClick={play}>▶ Play</button>
              </footer>
            </div>
          </article>
        ))}
      </div>
      <p className="source-note">📖 Content is original and topic-aligned; it does not reproduce textbook pages.</p>
    </section>
  );
}

function Builder({ back, saved }) {
  const [prompt, setPrompt] = useState('Which word begins with the /b/ sound?');
  const [opts, setOpts] = useState(['ball', 'sun', 'fish', 'cat']);
  const [correct, setCorrect] = useState(0);
  const [title, setTitle] = useState('My K3 Quiz');
  return (
    <section className="builder">
      <button className="back" onClick={back}>‹ Quiz library</button>
      <div className="builder-top">
        <div>
          <p className="kicker">Quiz builder</p>
          <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <button className="primary" onClick={saved}>✓ Save quiz</button>
      </div>
      <div className="builder-layout">
        <aside>
          <b>Questions</b>
          <button className="question-item"><span>1</span><div>{prompt}<small>Single choice · 20 sec</small></div></button>
          <button className="add-question">➕ Add question</button>
        </aside>
        <div className="editor">
          <label>Question
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
          <div className="editor-options">
            {opts.map((o, i) => (
              <label style={{ borderColor: palette[i].color }} key={i}>
                <button onClick={() => setCorrect(i)} className={correct === i ? 'selected' : ''}>{correct === i ? '✓' : i + 1}</button>
                <span style={{ color: palette[i].color }}>{palette[i].shape}</span>
                <input value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
              </label>
            ))}
          </div>
          <div className="settings">
            <label>Time limit
              <select defaultValue="20"><option>10</option><option>20</option><option>30</option></select> seconds
            </label>
            <label>Learning area
              <select><option>Phonics</option><option>Mathematics</option><option>Reading</option><option>Our Island Jamaica</option></select>
            </label>
          </div>
          <p className="correct-note">✓ Green check marks the correct answer.</p>
        </div>
      </div>
    </section>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
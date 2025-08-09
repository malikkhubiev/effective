import React, { useEffect, useState, useRef } from "react";
import "./App.css"; // Подключаем CSS

const SYMBOLS = ["🍒", "🍋", "🔔", "💎"];
const STORAGE_KEY = "slot_machine_state_v1";

export default function App() {
  const [balance, setBalance] = useState(200);
  const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const spinTimeoutRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.balance === "number") setBalance(parsed.balance);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, history }));
  }, [balance, history]);

  useEffect(() => () => clearTimeout(spinTimeoutRef.current), []);

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);

    const flickerSequence = [];
    for (let i = 0; i < 6; i++) {
      flickerSequence.push([randomSymbol(), randomSymbol(), randomSymbol()]);
    }

    let idx = 0;
    const flickerInterval = setInterval(() => {
      setReels(flickerSequence[idx]);
      idx++;
      if (idx >= flickerSequence.length) {
        clearInterval(flickerInterval);

        const final = [randomSymbol(), randomSymbol(), randomSymbol()];
        setReels(final);

        const allEqual = final[0] === final[1] && final[1] === final[2];
        const delta = allEqual ? 100 : -10;
        setBalance((b) => b + delta);

        const item = {
          symbols: final,
          result: allEqual ? "win" : "lose",
          delta,
          time: new Date().toISOString(),
        };
        setHistory((h) => [item, ...h].slice(0, 5));

        spinTimeoutRef.current = setTimeout(() => setSpinning(false), 350);
      }
    }, 90);
  }

  function handleReset() {
    if (window.confirm("Сбросить баланс и историю?")) {
      setBalance(200);
      setHistory([]);
      setReels([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div>
            <div className="title">Slot Machine</div>
            <div className="subtitle">Крути и выигрывай виртуальные фишки</div>
          </div>
          <div className="balance">{balance} ♠</div>
        </div>

        <div className="machine">
          <div className="reels">
            {reels.map((s, i) => (
              <div key={i} className={`reel ${spinning ? "spin" : ""}`}>
                {s}
              </div>
            ))}
          </div>

          <div className="controls">
            <button className="btn" onClick={handleSpin} disabled={spinning}>
              {spinning ? "Spinning..." : "SPIN"}
            </button>
            <button className="btn secondary" onClick={handleReset}>
              Reset
            </button>
          </div>

          <div className="history">
            <div className="history-header">
              <div className="history-title">История (последние 5)</div>
              <div className="history-hint">Выйгрыш +100 · Проигрыш -10</div>
            </div>

            <div className="hist-list">
              {history.length === 0 && (
                <div className="empty-history">Пока пусто — попробуй крутить!</div>
              )}
              {history.map((h, idx) => (
                <div className="hist-item" key={idx}>
                  <div className="symbols">{h.symbols.join(" ")}</div>
                  <div className={h.result === "win" ? "win" : "lose"}>
                    {h.delta > 0 ? `+${h.delta}` : h.delta}
                  </div>
                </div>
              ))}
            </div>

            <div className="footer-note">
              Баланс и история сохраняются в localStorage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/ui/VoiceCommand.jsx — Web Speech API voice assistant
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const COMMANDS = [
  { pattern: /open (war room|warroom)/i,  action: 'navigate', target: 'warroom' },
  { pattern: /open kanban/i,              action: 'navigate', target: 'kanban' },
  { pattern: /open chat/i,                action: 'navigate', target: 'chat' },
  { pattern: /open analytics/i,           action: 'navigate', target: 'analytics' },
  { pattern: /open insights/i,            action: 'navigate', target: 'insights' },
  { pattern: /go (to )?dashboard/i,       action: 'navigate', target: 'dashboard' },
  { pattern: /hackathon mode/i,           action: 'hackathon' },
  { pattern: /send sos/i,                 action: 'sos' },
];

export default function VoiceCommand() {
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [show, setShow]             = useState(false);
  const { currentTeam, toggleHackathonMode, setSosActive, voiceActive, setVoiceActive } = useStore();
  const navigate = useNavigate();

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const processCommand = useCallback((text) => {
    for (const cmd of COMMANDS) {
      if (cmd.pattern.test(text)) {
        if (cmd.action === 'navigate' && currentTeam) {
          if (cmd.target === 'dashboard') navigate('/app');
          else navigate(`/app/teams/${currentTeam.id}/${cmd.target}`);
          toast.success(`🎙️ Navigating to ${cmd.target}`);
        } else if (cmd.action === 'hackathon') {
          toggleHackathonMode();
          toast.success('🚀 Hackathon Mode toggled!');
        } else if (cmd.action === 'sos') {
          setSosActive(true);
          toast.error('🆘 SOS activated by voice!');
        }
        return;
      }
    }
    toast(`Command not recognized: "${text}"`, { icon: '❓' });
  }, [currentTeam, navigate, toggleHackathonMode, setSosActive]);

  const startListening = useCallback(() => {
    if (!supported) return toast.error('Voice not supported in this browser');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    setListening(true); setVoiceActive(true); setShow(true); setTranscript('');
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[0].isFinal) { processCommand(t); setListening(false); setVoiceActive(false); setTimeout(() => setShow(false), 1500); }
    };
    recognition.onerror = () => { setListening(false); setVoiceActive(false); };
    recognition.onend   = () => { setListening(false); setVoiceActive(false); };
    recognition.start();
  }, [supported, processCommand, setVoiceActive]);

  // Keyboard shortcut: Ctrl+Space
  useEffect(() => {
    const handler = (e) => { if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); startListening(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [startListening]);

  if (!supported) return null;

  return (
    <>
      {/* Floating mic button */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={startListening}
        title="Voice Command (Ctrl+Space)"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 500,
          width: 52, height: 52, borderRadius: '50%',
          background: listening
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening ? '0 0 0 0 rgba(239,68,68,0.7)' : '0 4px 20px rgba(79,142,247,0.4)',
          animation: listening ? 'sos-pulse 1s infinite' : 'none',
        }}
      >
        {listening ? <Mic size={20} color="white" /> : <Mic size={20} color="white" />}
      </motion.button>

      {/* Voice overlay */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 90, right: 24, zIndex: 500,
              background: 'rgba(13,21,38,0.95)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(79,142,247,0.4)', borderRadius: 16,
              padding: '16px 20px', minWidth: 260, maxWidth: 340,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), var(--glow-blue)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {listening ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="voice-ring" style={{
                      position: 'absolute', width: 32, height: 32, borderRadius: '50%',
                      border: '2px solid var(--accent-blue)', opacity: 0,
                    }} animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }} />
                  ))}
                  <Mic size={18} color="var(--accent-blue)" style={{ position: 'relative' }} />
                </div>
              ) : <MicOff size={18} color="var(--accent-green)" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: listening ? 'var(--accent-blue)' : 'var(--accent-green)' }}>
                {listening ? 'Listening...' : 'Command received'}
              </span>
              <button onClick={() => setShow(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', minHeight: 20, fontStyle: transcript ? 'normal' : 'italic', color: transcript ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {transcript || 'Say a command...'}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
              Try: "Open War Room" · "Hackathon Mode" · "Send SOS"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

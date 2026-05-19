// src/components/ui/SOSAlert.jsx — Emergency alert overlay
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { AlertTriangle, X, Shield } from 'lucide-react';

export default function SOSAlert() {
  const { sosActive, activeSOS, setSosActive, setActiveSOS } = useStore();

  const dismiss = () => { setSosActive(false); setActiveSOS(null); };

  return (
    <AnimatePresence>
      {sosActive && (
        <>
          {/* Red pulse overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 8000, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)',
              animation: 'sos-overlay-pulse 1s infinite', }}
          />
          {/* Alert Banner */}
          <motion.div
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))',
              backdropFilter: 'blur(20px)',
              borderBottom: '2px solid rgba(239,68,68,0.8)',
              padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 4px 40px rgba(239,68,68,0.5)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <AlertTriangle size={28} color="white" />
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'white', fontFamily: "'Space Grotesk',sans-serif" }}>
                🆘 EMERGENCY ALERT — SOS TRIGGERED
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {activeSOS?.message || 'A team member needs immediate help!'}
                {activeSOS?.triggered_by_name && ` — from ${activeSOS.triggered_by_name}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={dismiss}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8, padding: '6px 14px', color: 'white', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Shield size={14} /> Respond
              </motion.button>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

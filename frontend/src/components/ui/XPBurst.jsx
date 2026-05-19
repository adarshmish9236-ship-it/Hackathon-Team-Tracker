// src/components/ui/XPBurst.jsx — Animated XP reward popup
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Zap } from 'lucide-react';

export default function XPBurst() {
  const { xpBurst } = useStore();
  return (
    <AnimatePresence>
      {xpBurst && (
        <motion.div
          key={xpBurst.id}
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: 1, scale: 1.2, y: -60 }}
          exit={{ opacity: 0, scale: 0.8, y: -120 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'fixed', bottom: 80, right: 32, zIndex: 9999,
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            borderRadius: 16, padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 30px rgba(245,158,11,0.6), 0 8px 24px rgba(0,0,0,0.4)',
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
            fontSize: 20, color: '#000',
          }}
        >
          <Zap size={22} fill="#000" />
          +{xpBurst.amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

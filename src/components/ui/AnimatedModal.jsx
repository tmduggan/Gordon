import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function AnimatedModal({ open, onOpenChange, children, ...props }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <AnimatePresence>
        {open && (
          <DialogContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
} 
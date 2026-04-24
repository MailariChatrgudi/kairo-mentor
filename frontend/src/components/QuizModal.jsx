import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import QuizSlider from './QuizSlider';
import './QuizModal.css';

const QuizModal = ({ isOpen, onClose, questions }) => {
  if (!isOpen || !questions) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="quiz-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="quiz-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="quiz-modal-header">
            <h3>Knowledge Check</h3>
            <button onClick={onClose} className="quiz-modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="quiz-modal-body">
            <QuizSlider questions={questions} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizModal;

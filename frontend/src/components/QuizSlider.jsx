import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import './QuizSlider.css';

const QuizSlider = ({ questions }) => {
  if (!questions || questions.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);

  const isFinished = currentIndex >= questions.length;
  const currentQ = !isFinished ? questions[currentIndex] : null;
  
  // Filter out any empty options if tasks.json parses poorly
  const options = currentQ?.options?.filter(o => o.trim() !== "") || [];

  const handleSelect = (option) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(option);
    
    if (option === currentQ.answer) {
      setIsCorrect(true);
      setScore(s => s + 1);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setCurrentIndex(i => i + 1);
  };

  return (
    <div className="quiz-slider">
      <div className="quiz-slider-header">
        <HelpCircle size={18} color="#C8A951" />
        <h4>Daily Quiz Challenge</h4>
      </div>
      
      <div className="quiz-slider-content">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="quiz-meta">
                <span>Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <h3 className="quiz-question">{currentQ.q}</h3>
              
              <div className="quiz-options">
                {options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isWinningOpt = opt === currentQ.answer;
                    
                    let bgClass = "quiz-option-btn";
                    if (selectedOption !== null) {
                        if (isWinningOpt) bgClass += " quiz-option-btn--correct";
                        else if (isSelected) bgClass += " quiz-option-btn--wrong";
                        else bgClass += " quiz-option-btn--disabled";
                    }

                    return (
                        <button 
                            key={i} 
                            className={bgClass}
                            onClick={() => handleSelect(opt)}
                            disabled={selectedOption !== null}
                        >
                            <span className="quiz-option-text">{opt}</span>
                            {selectedOption !== null && isWinningOpt && <CheckCircle2 size={16} color="#4ade80" />}
                            {isSelected && !isWinningOpt && <XCircle size={16} color="#f87171" />}
                        </button>
                    )
                })}
              </div>

              {selectedOption !== null && (
                  <motion.button 
                    className="quiz-next-btn"
                    onClick={handleNext}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                      {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                      <ChevronRight size={16} />
                  </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              className="quiz-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle2 size={48} color="#C8A951" className="mb-4" />
              <h3>Quiz Completed!</h3>
              <p>You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizSlider;

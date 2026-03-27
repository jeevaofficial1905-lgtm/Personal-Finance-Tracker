import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Divide, Minus, Plus, X as Multiply, Equal } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === '0' ? digit : prev + digit;
    });
  }, [waitingForOperand]);

  const inputDot = useCallback(() => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      if (!prev.includes('.')) {
        return prev + '.';
      }
      return prev;
    });
  }, [waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const calculate = (prev: number, current: number, op: string) => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return prev / current;
      default: return current;
    }
  };

  const performOperation = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, prevValue, operator]);

  const handleEqual = useCallback(() => {
    const inputValue = parseFloat(display);
    if (operator && prevValue !== null) {
      const newValue = calculate(prevValue, inputValue, operator);
      setDisplay(String(newValue));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }, [display, operator, prevValue]);

  const toggleSign = useCallback(() => {
    setDisplay(prev => String(parseFloat(prev) * -1));
  }, []);

  const inputPercent = useCallback(() => {
    setDisplay(prev => String(parseFloat(prev) / 100));
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return '0';
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for some keys to avoid page scrolling/etc
      if (['/', '*', '-', '+', 'Enter', '=', 'Backspace', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDot();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('-');
      } else if (e.key === '*') {
        performOperation('*');
      } else if (e.key === '/') {
        performOperation('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        handleEqual();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        clearAll();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === '%') {
        inputPercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDot, performOperation, handleEqual, clearAll, handleBackspace, inputPercent]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-20 right-6 z-50 w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden"
    >
      <div className="p-4 bg-[var(--color-muted)]/5 border-b border-[var(--color-border)] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Calculator</span>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-[var(--color-muted)]/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-[var(--color-muted)]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[var(--color-background)] p-4 rounded-2xl border border-[var(--color-border)] text-right">
          <div className="text-[var(--color-muted)] text-[10px] h-4 mb-1 font-mono">
            {prevValue !== null ? `${prevValue} ${operator || ''}` : ''}
          </div>
          <div className="text-2xl font-bold font-mono truncate text-[var(--color-foreground)]">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <CalcButton label="AC" onClick={clearAll} variant="secondary" />
          <CalcButton label="+/-" onClick={toggleSign} variant="secondary" />
          <CalcButton label="%" onClick={inputPercent} variant="secondary" />
          <CalcButton icon={<Divide className="w-4 h-4" />} onClick={() => performOperation('/')} variant="accent" active={operator === '/'} />

          {/* Row 2 */}
          <CalcButton label="7" onClick={() => inputDigit('7')} />
          <CalcButton label="8" onClick={() => inputDigit('8')} />
          <CalcButton label="9" onClick={() => inputDigit('9')} />
          <CalcButton icon={<Multiply className="w-4 h-4" />} onClick={() => performOperation('*')} variant="accent" active={operator === '*'} />

          {/* Row 3 */}
          <CalcButton label="4" onClick={() => inputDigit('4')} />
          <CalcButton label="5" onClick={() => inputDigit('5')} />
          <CalcButton label="6" onClick={() => inputDigit('6')} />
          <CalcButton icon={<Minus className="w-4 h-4" />} onClick={() => performOperation('-')} variant="accent" active={operator === '-'} />

          {/* Row 4 */}
          <CalcButton label="1" onClick={() => inputDigit('1')} />
          <CalcButton label="2" onClick={() => inputDigit('2')} />
          <CalcButton label="3" onClick={() => inputDigit('3')} />
          <CalcButton icon={<Plus className="w-4 h-4" />} onClick={() => performOperation('+')} variant="accent" active={operator === '+'} />

          {/* Row 5 */}
          <CalcButton label="0" onClick={() => inputDigit('0')} className="col-span-2" />
          <CalcButton label="." onClick={inputDot} />
          <CalcButton icon={<Equal className="w-4 h-4" />} onClick={handleEqual} variant="accent" />
        </div>
      </div>
    </motion.div>
  );
}

interface CalcButtonProps {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  active?: boolean;
}

function CalcButton({ label, icon, onClick, variant = 'primary', className = '', active = false }: CalcButtonProps) {
  const variants = {
    primary: 'bg-[var(--color-card)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/5 border border-[var(--color-border)]',
    secondary: 'bg-[var(--color-muted)]/10 text-[var(--color-muted)] hover:bg-[var(--color-muted)]/20',
    accent: active 
      ? 'bg-[var(--color-accent)] text-white' 
      : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20',
  };

  return (
    <button
      onClick={onClick}
      className={`h-12 rounded-xl font-semibold transition-all flex items-center justify-center active:scale-95 ${variants[variant]} ${className}`}
    >
      {label || icon}
    </button>
  );
}

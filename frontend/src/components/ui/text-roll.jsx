import React from 'react';
import { motion } from 'framer-motion';

export function TextRoll({
    children,
    duration = 0.5,
    getEnterDelay = (i) => i * 0.1,
    getExitDelay = (i) => i * 0.1 + 0.2,
    className,
    letterClassName,
    transition = { ease: 'easeIn' },
    variants,
    onAnimationComplete,
}) {
    const defaultVariants = {
        enter: {
            initial: { rotateX: 0 },
            animate: { rotateX: 90 },
        },
        exit: {
            initial: { rotateX: 90 },
            animate: { rotateX: 0 },
        },
    };

    const letters = children.split('');

    return (
        <span className={className}>
            {letters.map((letter, i) => {
                return (
                    <span
                        key={i}
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                            perspective: '10000px',
                            transformStyle: 'preserve-3d',
                            width: 'auto'
                        }}
                        aria-hidden="true"
                    >
                        <motion.span
                            className={letterClassName}
                            style={{
                                position: 'absolute',
                                display: 'inline-block',
                                backfaceVisibility: 'hidden',
                                transformOrigin: '50% 25%',
                            }}
                            initial={variants?.enter?.initial ?? defaultVariants.enter.initial}
                            animate={variants?.enter?.animate ?? defaultVariants.enter.animate}
                            transition={{
                                ...transition,
                                duration,
                                delay: getEnterDelay(i),
                            }}
                        >
                            {letter === ' ' ? '\u00A0' : letter}
                        </motion.span>
                        <motion.span
                            className={letterClassName}
                            style={{
                                position: 'absolute',
                                display: 'inline-block',
                                backfaceVisibility: 'hidden',
                                transformOrigin: '50% 100%',
                            }}
                            initial={variants?.exit?.initial ?? defaultVariants.exit.initial}
                            animate={variants?.exit?.animate ?? defaultVariants.exit.animate}
                            transition={{
                                ...transition,
                                duration,
                                delay: getExitDelay(i),
                            }}
                            onAnimationComplete={
                                letters.length === i + 1 ? onAnimationComplete : undefined
                            }
                        >
                            {letter === ' ' ? '\u00A0' : letter}
                        </motion.span>
                        <span style={{ visibility: 'hidden' }}>
                            {letter === ' ' ? '\u00A0' : letter}
                        </span>
                    </span>
                );
            })}
            <span style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0
            }}>
                {children}
            </span>
        </span>
    );
}

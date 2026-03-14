import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export function AnimatedSocialIcons({
    icons,
    className = "",
    iconSize = 25
}) {
    const [active, setActive] = useState(false);

    return (
        <div className={`flex items-center gap-4 ${className}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>

            {/* The Main Action Button */}
            <motion.button
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ef4444',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(239,68,68,0.5)',
                    zIndex: 20,
                    flexShrink: 0
                }}
                onClick={() => setActive(!active)}
                animate={{ rotate: active ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                <Plus size={30} strokeWidth={3} />
            </motion.button>

            {/* The Hidden Icons that slide out to the right */}
            <AnimatePresence>
                {active && icons.map(({ Icon, href, onClick, color, disabled, title }, index) => {
                    const content = (
                        <motion.div
                            title={title}
                            style={{
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: `1px solid ${color || 'rgba(255,255,255,0.2)'}`,
                                boxShadow: `0 4px 15px ${color ? color.replace(')', ', 0.3)').replace('rgb', 'rgba') : 'rgba(0,0,0,0.5)'}`,
                                color: color || '#cbd5e1',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                overflow: 'hidden'
                            }}
                            initial={{ opacity: 0, scale: 0.5, x: -60, width: 0, marginRight: -16 }}
                            animate={{ opacity: disabled ? 0.5 : 1, scale: 1, x: 0, width: '60px', marginRight: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: -60, width: 0, marginRight: -16 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: active ? index * 0.05 : (icons.length - index) * 0.05
                            }}
                            whileHover={!disabled ? { scale: 1.1, y: -5 } : {}}
                        >
                            <div style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={iconSize} />
                            </div>
                        </motion.div>
                    );

                    if (href && !disabled) {
                        return (
                            <a
                                href={href}
                                key={index}
                                style={{ textDecoration: 'none' }}
                            >
                                {content}
                            </a>
                        );
                    }
                    return (
                        <div
                            onClick={!disabled ? onClick : undefined}
                            key={index}
                            style={{ pointerEvents: disabled ? 'none' : 'auto', cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                            {content}
                        </div>
                    );
                })}
            </AnimatePresence>

        </div>
    );
}

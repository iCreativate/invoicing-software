'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

type CharacterId = 'creative' | 'owner' | 'professional';

const SRC: Record<CharacterId, string> = {
  creative: '/images/timely/characters/timely-character-creative.webp',
  owner: '/images/timely/characters/timely-character-owner.webp',
  professional: '/images/timely/characters/timely-character-professional.webp',
};

const ALT: Record<CharacterId, string> = {
  creative: 'Timely character — creative entrepreneur',
  owner: 'Timely character — small business owner',
  professional: 'Timely character — independent professional',
};

/** Subtle breathing / float for brand characters — container-only motion. */
export function TimelyCharacter({
  id,
  className,
  size = 180,
  caption,
  delay = 0,
}: {
  id: CharacterId;
  className?: string;
  size?: number;
  caption?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <figure className={cn('relative flex flex-col items-center', className)}>
      <motion.div
        className={cn('relative', !reduce && 'tl-character-breathe')}
        style={{ width: size, height: size }}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={SRC[id]}
          alt={ALT[id]}
          width={size}
          height={size}
          className="h-full w-full object-contain object-bottom drop-shadow-[0_12px_28px_rgba(11,15,20,0.12)]"
          sizes={`${size}px`}
        />
      </motion.div>
      {caption ? (
        <figcaption className="mt-2 max-w-[11rem] text-center text-[12px] font-medium text-[var(--tl-ink-2)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

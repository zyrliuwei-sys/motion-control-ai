import {
  createContext,
  useContext,
  useRef,
  useState,
} from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

type DraggableCardContextValue = {
  nextLayer: () => number;
};

const DraggableCardContext = createContext<DraggableCardContextValue | null>(
  null
);

/**
 * A shared surface for tactile, freely arranged media cards. The visual
 * boundary is owned by the caller, while cards raise above neighbours on drag.
 */
export function DraggableCardContainer({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const layerRef = useRef(10);

  return (
    <DraggableCardContext.Provider
      value={{
        nextLayer: () => {
          layerRef.current += 1;
          return layerRef.current;
        },
      }}
    >
      <div
        className={cn('isolate', className)}
        {...props}
      >
        {children}
      </div>
    </DraggableCardContext.Provider>
  );
}

/** A freely draggable card that shares layering with its nearest card container. */
export function DraggableCardBody({
  children,
  className,
  onPointerDown,
  onDragStart,
  style,
  ...props
}: HTMLMotionProps<'div'>) {
  const context = useContext(DraggableCardContext);
  const [zIndex, setZIndex] = useState(1);

  return (
    <motion.div
      drag
      dragElastic={0.12}
      dragMomentum
      whileDrag={{
        cursor: 'grabbing',
        rotate: 0,
        scale: 1.025,
      }}
      transition={{ type: 'spring', stiffness: 330, damping: 28 }}
      onPointerDown={(event) => {
        setZIndex(context?.nextLayer() ?? zIndex + 1);
        onPointerDown?.(event);
      }}
      onDragStart={(event, info) => {
        setZIndex(context?.nextLayer() ?? zIndex + 1);
        onDragStart?.(event, info);
      }}
      style={{ ...style, zIndex }}
      className={cn('cursor-grab touch-pan-y select-none', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

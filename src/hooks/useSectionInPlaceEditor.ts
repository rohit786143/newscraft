import { useState, useRef, useCallback, useEffect } from 'react';
import { NewsSection } from '@/types/project';

export type ActiveSubElement = 'image' | 'topline' | 'heading' | 'subheading' | 'body' | null;

export interface ToolbarPosition {
  top: number;
  left: number;
}

export function useSectionInPlaceEditor(
  initialSection: NewsSection,
  onUpdateSection: (updated: NewsSection) => void
) {
  const [section, setSection] = useState<NewsSection>(initialSection);
  const [activeElement, setActiveElement] = useState<ActiveSubElement>(null);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition | null>(null);
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const updateField = useCallback(
    <K extends keyof NewsSection>(key: K, value: NewsSection[K]) => {
      setSection((prev) => {
        const next = { ...prev, [key]: value };
        onUpdateSection(next);
        return next;
      });
    },
    [onUpdateSection]
  );

  const selectSubElement = useCallback(
    (target: ActiveSubElement, e?: React.MouseEvent<HTMLElement>) => {
      setActiveElement(target);

      if (target === 'image') {
        setIsImagePopoverOpen(true);
        setToolbarPos(null);
        return;
      }

      setIsImagePopoverOpen(false);

      if (e && containerRef.current) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setToolbarPos({
          top: Math.max(10, rect.top - containerRect.top - 52),
          left: Math.max(10, rect.left - containerRect.left + (rect.width / 2) - 180),
        });
      } else {
        setToolbarPos(null);
      }
    },
    []
  );

  const clearSelection = useCallback(() => {
    setActiveElement(null);
    setToolbarPos(null);
    setIsImagePopoverOpen(false);
  }, []);

  return {
    section,
    activeElement,
    toolbarPos,
    isImagePopoverOpen,
    containerRef,
    updateField,
    selectSubElement,
    clearSelection,
    setIsImagePopoverOpen,
  };
}

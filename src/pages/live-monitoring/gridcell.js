import { useRef, useEffect, useState } from "react";

const GridCell = ({ children }) => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full rounded-lg">
      {size.width > 0 &&
        children(size)}
    </div>
  );
};

export default GridCell;

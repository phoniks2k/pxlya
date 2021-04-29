/*
 * @flex
 *
 * mouse draging
 */

import { useEffect, useCallback } from 'react';

/*
 * @param elRef element reference from useRef
 * @param startHandler function called on start of drag
 * @param diffHandler functio that is called with dragged distance
 */
function useDrag(elRef, startHandler, diffHandler) {
  const startDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    startHandler();
    console.log('startDrag');

    let {
      clientX: startX,
      clientY: startY,
    } = event.touches ? event.touches[0] : event;
    const drag = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const {
        clientX: curX,
        clientY: curY,
      } = evt.touches ? evt.touches[0] : evt;
      console.log(`drag by ${curX - startX} - ${curY - startY}`);
      diffHandler(curX - startX, curY - startY);
      startX = curX;
      startY = curY;
    };
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    const stopDrag = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      console.log('stopDrag');
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchcancel', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchcancel', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }, [startHandler]);

  useEffect(() => {
    if (elRef && elRef.current) {
      elRef.current.addEventListener('mousedown', startDrag, { passive: false });
      elRef.current.addEventListener('touchstart', startDrag, { passive: false });
    }
    return () => {
      elRef.current.removeEventListener('mousedown', startDrag);
      elRef.current.removeEventListener('touchstart', startDrag);
    };
  }, [elRef, diffHandler]);
}

export default useDrag;

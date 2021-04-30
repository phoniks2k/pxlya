/*
 * @flex
 *
 * detect click outside
 */

import { useEffect, useLayoutEffect, useCallback } from 'react';

/*
 * Keeps listening to outside clicks or window resize
 * as long as active is true
 * @param insideRefs references to elements that are considered inside
 * @param calback function that gets fired on click outside
 * @param active boolean if we should listen or not
 */
export function useConditionalClickOutside(insideRefs, active, callback) {
  const handleClickOutside = useCallback((event) => {
    if (insideRefs.every((ref) => !ref.current
      || !ref.current.contains(event.target))) {
      event.stopPropagation();
      callback();
    }
  }, [callback]);

  const handleWindowResize = useCallback(() => {
    callback();
  }, [callback]);

  useLayoutEffect(() => {
    if (active) {
      document.addEventListener('click', handleClickOutside, {
        capture: true,
      });
      window.addEventListener('resize', handleWindowResize);
    } else {
      document.removeEventListener('click', handleClickOutside, {
        capture: true,
      });
      window.removeEventListener('resize', handleWindowResize);
    }
  }, [active, callback]);
}

/*
 * listen to click outside or window resize
 * @param insideRefs references to elements that are considered inside
 * @param callback function that gets fired on click outside
 */
export function useClickOutside(insideRefs, callback) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (insideRefs.every((ref) => !ref.current
        || !ref.current.contains(event.target))) {
        event.stopPropagation();
        callback();
      }
    };

    const handleWindowResize = () => {
      callback();
    };

    document.addEventListener('click', handleClickOutside, {
      capture: true,
    });
    window.addEventListener('resize', handleWindowResize);
    return () => {
      document.removeEventListener('click', handleClickOutside, {
        capture: true,
      });
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [callback]);
}

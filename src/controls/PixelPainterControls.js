/*
 * Creates Viewport for 2D Canvas
 *
 * @flow
 */

import keycode from 'keycode';

import {
  tryPlacePixel,
  setHover,
  unsetHover,
  setViewCoordinates,
  setScale,
  zoomIn,
  zoomOut,
  selectColor,
  moveNorth,
  moveWest,
  moveSouth,
  moveEast,
  onViewFinishChange,
} from '../actions';
import {
  screenToWorld,
  getChunkOfPixel,
  getOffsetOfPixel,
} from '../core/utils';

class PixelPlainterControls {
  constructor(renderer, viewport: HTMLCanvasElement, curStore) {
    this.store = curStore;
    this.renderer = renderer;
    this.viewport = viewport;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onAuxClick = this.onAuxClick.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.clickTabStartView = [0, 0];
    this.clickTabStartTime = 0;
    this.clickTabStartCoords = [0, 0];
    this.startTabDist = 50;
    this.startTabScale = this.store.getState().scale;
    this.isMultiTab = false;
    this.isMouseDown = false;
    this.tabTimeout = null;

    document.addEventListener('keydown', this.onKeyPress, false);
    viewport.addEventListener('auxclick', this.onAuxClick, false);
    viewport.addEventListener('mousedown', this.onMouseDown, false);
    viewport.addEventListener('mousemove', this.onMouseMove, false);
    viewport.addEventListener('mouseup', this.onMouseUp, false);
    viewport.addEventListener('wheel', this.onWheel, false);
    viewport.addEventListener('touchstart', this.onTouchStart, false);
    viewport.addEventListener('touchend', this.onTouchEnd, false);
    viewport.addEventListener('touchmove', this.onTouchMove, false);
    viewport.addEventListener('mouseout', this.onMouseOut, false);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyPress, false);
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    window.focus();

    if (event.button === 0) {
      this.isMouseDown = true;
      const { clientX, clientY } = event;
      this.clickTabStartTime = Date.now();
      this.clickTabStartCoords = [clientX, clientY];
      this.clickTabStartView = this.store.getState().canvas.view;
      const { viewport } = this;
      setTimeout(() => {
        if (this.isMouseDown) {
          viewport.style.cursor = 'move';
        }
      }, 300);
    }
  }

  onMouseUp(event: MouseEvent) {
    event.preventDefault();

    if (event.button === 0) {
      this.isMouseDown = false;
      const { clientX, clientY } = event;
      const { clickTabStartCoords, clickTabStartTime } = this;
      const coordsDiff = [
        clickTabStartCoords[0] - clientX,
        clickTabStartCoords[1] - clientY,
      ];
      // thresholds for single click / holding
      if (clickTabStartTime > Date.now() - 250
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        PixelPlainterControls.placePixel(
          this.store,
          this.viewport,
          this.renderer,
          [clientX, clientY],
        );
      }
      this.viewport.style.cursor = 'auto';
    }
  }

  static getTouchCenter(event: TouchEvent) {
    switch (event.touches.length) {
      case 1: {
        const { pageX, pageY } = event.touches[0];
        return [pageX, pageY];
      }
      case 2: {
        const pageX = Math.floor(0.5
            * (event.touches[0].pageX + event.touches[1].pageX));
        const pageY = Math.floor(0.5
            * (event.touches[0].pageY + event.touches[1].pageY));
        return [pageX, pageY];
      }
      default:
        break;
    }
    return null;
  }

  static placePixel(store, viewport, renderer, center) {
    const state = store.getState();
    const { autoZoomIn } = state.gui;
    const { placeAllowed } = state.user;
    const {
      scale,
      isHistoricalView,
      selectedColor,
    } = state.canvas;

    if (isHistoricalView) return;

    const cell = screenToWorld(state, viewport, center);

    if (autoZoomIn && scale < 8) {
      store.dispatch(setViewCoordinates(cell));
      store.dispatch(setScale(12));
      return;
    }

    // allow placing of pixel just on low zoomlevels
    if (scale < 3) return;

    if (!placeAllowed) return;

    if (selectedColor !== renderer.getColorIndexOfPixel(...cell)) {
      const { canvasSize } = state.canvas;
      const [i, j] = getChunkOfPixel(canvasSize, ...cell);
      const offset = getOffsetOfPixel(canvasSize, ...cell);
      store.dispatch(tryPlacePixel(
        i, j, offset,
        selectedColor,
      ));
    }
  }

  static getMultiTouchDistance(event: TouchEvent) {
    if (event.touches.length < 2) {
      return 1;
    }
    const a = event.touches[0];
    const b = event.touches[1];
    return Math.sqrt(
      (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
    );
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();

    this.clickTabStartTime = Date.now();
    this.clickTabStartCoords = PixelPlainterControls.getTouchCenter(event);
    const state = this.store.getState();
    this.clickTabStartView = state.canvas.view;

    if (event.touches.length > 1) {
      this.startTabScale = state.canvas.scale;
      this.startTabDist = PixelPlainterControls.getMultiTouchDistance(event);
      this.isMultiTab = true;
    } else {
      this.isMouseDown = true;
      this.isMultiTab = false;
      this.tabTimeout = setTimeout(() => {
        // check for longer tap to select taped color
        PixelPlainterControls.selectColor(
          this.store,
          this.viewport,
          this.renderer,
          [
            this.clickTabStartCoords[0],
            this.clickTabStartCoords[1],
          ],
        );
      }, 500);
    }
  }

  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.clearTabTimeout();

    if (event.changedTouches.length < 2) {
      const { pageX, pageY } = event.changedTouches[0];
      const { clickTabStartCoords, clickTabStartTime } = this;
      const coordsDiff = [
        clickTabStartCoords[0] - pageX,
        clickTabStartCoords[1] - pageY,
      ];
      // thresholds for single click / holding
      if (clickTabStartTime > Date.now() - 250
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        const { store, viewport } = this;
        PixelPlainterControls.placePixel(
          store,
          viewport,
          this.renderer,
          [pageX, pageY],
        );
        setTimeout(() => {
          store.dispatch(unsetHover());
        }, 500);
      }
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    const multiTouch = (event.touches.length > 1);

    const [clientX, clientY] = PixelPlainterControls.getTouchCenter(event);
    const { store } = this;
    const state = store.getState();
    if (this.isMultiTab !== multiTouch) {
      // if one finger got lifted or added, reset clickTabStart
      this.isMultiTab = multiTouch;
      this.clickTabStartCoords = [clientX, clientY];
      this.clickTabStartView = state.canvas.view;
      this.startTabDist = PixelPlainterControls.getMultiTouchDistance(event);
      this.startTabScale = state.canvas.scale;
    } else {
      // pan
      const { clickTabStartView, clickTabStartCoords } = this;
      const [lastPosX, lastPosY] = clickTabStartView;

      const deltaX = clientX - clickTabStartCoords[0];
      const deltaY = clientY - clickTabStartCoords[1];
      if (deltaX > 2 || deltaY > 2) {
        this.clearTabTimeout();
      }
      const { scale } = state.canvas;
      store.dispatch(setViewCoordinates([
        lastPosX - (deltaX / scale),
        lastPosY - (deltaY / scale),
      ]));

      // pinch
      if (multiTouch) {
        this.clearTabTimeout();

        const a = event.touches[0];
        const b = event.touches[1];
        const { startTabDist, startTabScale } = this;
        const dist = Math.sqrt(
          (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
        );
        const pinchScale = dist / startTabDist;
        store.dispatch(setScale(startTabScale * pinchScale));
      }
    }
  }

  clearTabTimeout() {
    if (this.tabTimeout) {
      clearTimeout(this.tabTimeout);
      this.tabTimeout = null;
    }
  }

  onWheel(event: MouseEvent) {
    const { deltaY } = event;
    const { store } = this;
    const state = store.getState();
    const { hover } = state.gui;
    let zoompoint = null;
    if (hover) {
      zoompoint = hover;
    }
    if (deltaY < 0) {
      store.dispatch(zoomIn(zoompoint));
    }
    if (deltaY > 0) {
      store.dispatch(zoomOut(zoompoint));
    }
    store.dispatch(onViewFinishChange());
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();

    const { clientX, clientY } = event;
    const { store, isMouseDown } = this;
    const state = store.getState();
    if (isMouseDown) {
      const { clickTabStartView, clickTabStartCoords } = this;
      const [lastPosX, lastPosY] = clickTabStartView;
      const deltaX = clientX - clickTabStartCoords[0];
      const deltaY = clientY - clickTabStartCoords[1];

      const { scale } = state.canvas;
      store.dispatch(setViewCoordinates([
        lastPosX - (deltaX / scale),
        lastPosY - (deltaY / scale),
      ]));
    } else {
      const screenCoor = screenToWorld(
        state,
        this.viewport,
        [clientX, clientY],
      );
      store.dispatch(setHover(screenCoor));
    }
  }

  onMouseOut() {
    const { store, viewport } = this;
    viewport.style.cursor = 'auto';
    store.dispatch(unsetHover());
  }

  static selectColor(store, viewport, renderer, center) {
    const state = store.getState();
    if (state.canvas.scale < 3) {
      return;
    }
    const coords = screenToWorld(state, viewport, center);
    const clrIndex = renderer.getColorIndexOfPixel(...coords);
    if (clrIndex === null) {
      return;
    }
    store.dispatch(selectColor(clrIndex));
  }

  onAuxClick(event: MouseEvent) {
    const { which, clientX, clientY } = event;
    // middle mouse button
    if (which !== 2) {
      return;
    }
    event.preventDefault();

    PixelPlainterControls.selectColor(
      this.store,
      this.viewport, 
      this.renderer,
      [clientX, clientY],
    );
  }

  onKeyPress(event: KeyboardEvent) {
    // ignore key presses if modal is open or chat is used
    if (event.target.nodeName === 'INPUT'
      || event.target.nodeName === 'TEXTAREA'
    ) {
      return;
    }
    const { store } = this;

    switch (keycode(event)) {
      case 'up':
      case 'w':
        store.dispatch(moveNorth());
        break;
      case 'left':
      case 'a':
        store.dispatch(moveWest());
        break;
      case 'down':
      case 's':
        store.dispatch(moveSouth());
        break;
      case 'right':
      case 'd':
        store.dispatch(moveEast());
        break;
      /*
      case 'space':
        if ($viewport) $viewport.click();
        return;
      */
      case '+':
      case 'e':
        store.dispatch(zoomIn());
        break;
      case '-':
      case 'q':
        store.dispatch(zoomOut());
        break;
      default:
    }
  }
}

export default PixelPlainterControls;

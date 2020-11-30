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
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onAuxClick = this.onAuxClick.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.clickTapStartView = [0, 0];
    this.clickTapStartTime = 0;
    this.clickTapStartCoords = [0, 0];
    this.tapStartDist = 50;
    this.tapStartScale = this.store.getState().scale;
    // on mouse: true as long as left mouse button is pressed
    // on touch: set to true when one finger touches the screen
    //           set to false when second finger touches or touch ends
    this.isClicking = false;
    // on touch: true if more than one finger on screen
    this.isMultiTab = false;
    // on touch: timeout to detect long-press
    this.tapTimeout = null;
    // if we are shift-hold-painting
    this.holdPainting = false;
    // if we are waiting before placeing pixel via holdPainting again
    this.coolDownDelta = false;

    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);
    viewport.addEventListener('auxclick', this.onAuxClick, false);
    viewport.addEventListener('mousedown', this.onMouseDown, false);
    viewport.addEventListener('mousemove', this.onMouseMove, false);
    viewport.addEventListener('mouseup', this.onMouseUp, false);
    viewport.addEventListener('wheel', this.onWheel, false);
    viewport.addEventListener('touchstart', this.onTouchStart, false);
    viewport.addEventListener('touchend', this.onTouchEnd, false);
    viewport.addEventListener('touchmove', this.onTouchMove, false);
    viewport.addEventListener('mouseout', this.onMouseOut, false);
    viewport.addEventListener('touchcancel', this.onMouseOut, false);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    document.removeEventListener('keyup', this.onKeyUp, false);
  }

  gotCoolDownDelta(delta) {
    this.coolDownDelta = true;
    setTimeout(() => {
      this.coolDownDelta = false;
    }, delta * 1000);
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    document.activeElement.blur();

    if (event.button === 0) {
      this.isClicking = true;
      const { clientX, clientY } = event;
      this.clickTapStartTime = Date.now();
      this.clickTapStartCoords = [clientX, clientY];
      this.clickTapStartView = this.store.getState().canvas.view;
      const { viewport } = this;
      setTimeout(() => {
        if (this.isClicking) {
          viewport.style.cursor = 'move';
        }
      }, 300);
    }
  }

  onMouseUp(event: MouseEvent) {
    event.preventDefault();

    const { store } = this;
    if (event.button === 0) {
      this.isClicking = false;
      const { clientX, clientY } = event;
      const { clickTapStartCoords, clickTapStartTime } = this;
      const coordsDiff = [
        clickTapStartCoords[0] - clientX,
        clickTapStartCoords[1] - clientY,
      ];
      // thresholds for single click / holding
      if (clickTapStartTime > Date.now() - 250
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        const state = store.getState();
        const cell = screenToWorld(
          state,
          this.viewport,
          [clientX, clientY],
        );
        PixelPlainterControls.placePixel(
          store,
          this.renderer,
          cell,
        );
      }
      this.viewport.style.cursor = 'auto';
    }
    store.dispatch(onViewFinishChange());
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

  static placePixel(store, renderer, cell) {
    const state = store.getState();
    const { autoZoomIn } = state.gui;
    const { placeAllowed } = state.user;
    const {
      scale,
      isHistoricalView,
      selectedColor,
    } = state.canvas;

    if (isHistoricalView) return;

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
    event.stopPropagation();
    document.activeElement.blur();

    this.clickTapStartTime = Date.now();
    this.clickTapStartCoords = PixelPlainterControls.getTouchCenter(event);
    const state = this.store.getState();
    this.clickTapStartView = state.canvas.view;

    if (event.touches.length > 1) {
      this.tapStartScale = state.canvas.scale;
      this.tapStartDist = PixelPlainterControls.getMultiTouchDistance(event);
      this.isMultiTab = true;
      this.clearTabTimeout();
    } else {
      this.isClicking = true;
      this.isMultiTab = false;
      this.tapTimeout = setTimeout(() => {
        // check for longer tap to select taped color
        PixelPlainterControls.selectColor(
          this.store,
          this.viewport,
          this.renderer,
          this.clickTapStartCoords,
        );
      }, 800);
    }
  }

  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    const { store } = this;
    if (event.touches.length === 0 && this.isClicking) {
      const { pageX, pageY } = event.changedTouches[0];
      const { clickTapStartCoords, clickTapStartTime } = this;
      const coordsDiff = [
        clickTapStartCoords[0] - pageX,
        clickTapStartCoords[1] - pageY,
      ];
      // thresholds for single click / holding
      if (clickTapStartTime > Date.now() - 250
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        const { viewport } = this;
        const state = store.getState();
        const cell = screenToWorld(
          state,
          viewport,
          [pageX, pageY],
        );
        PixelPlainterControls.placePixel(
          store,
          this.renderer,
          cell,
        );
        setTimeout(() => {
          store.dispatch(unsetHover());
        }, 500);
      }
    }
    store.dispatch(onViewFinishChange());
    this.clearTabTimeout();
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    const multiTouch = (event.touches.length > 1);

    const [clientX, clientY] = PixelPlainterControls.getTouchCenter(event);
    const { store } = this;
    const state = store.getState();
    if (this.isMultiTab !== multiTouch) {
      // if one finger got lifted or added, reset clickTabStart
      this.isMultiTab = multiTouch;
      this.clickTapStartCoords = [clientX, clientY];
      this.clickTapStartView = state.canvas.view;
      this.tapStartDist = PixelPlainterControls.getMultiTouchDistance(event);
      this.tapStartScale = state.canvas.scale;
    } else {
      // pan
      const { clickTapStartView, clickTapStartCoords } = this;
      const [lastPosX, lastPosY] = clickTapStartView;

      const deltaX = clientX - clickTapStartCoords[0];
      const deltaY = clientY - clickTapStartCoords[1];
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
        const { tapStartDist, tapStartScale } = this;
        const dist = Math.sqrt(
          (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
        );
        const pinchScale = dist / tapStartDist;
        store.dispatch(setScale(tapStartScale * pinchScale));
      }
    }
  }

  clearTabTimeout() {
    this.isClicking = false;
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
  }

  onWheel(event: MouseEvent) {
    event.preventDefault();
    document.activeElement.blur();

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
    const { store, isClicking } = this;
    const state = store.getState();
    if (isClicking) {
      if (Date.now() < this.clickTapStartTime + 100) {
        // 100ms treshold till starting to pan
        return;
      }
      const { clickTapStartView, clickTapStartCoords } = this;
      const [lastPosX, lastPosY] = clickTapStartView;
      const deltaX = clientX - clickTapStartCoords[0];
      const deltaY = clientY - clickTapStartCoords[1];

      const { scale } = state.canvas;
      store.dispatch(setViewCoordinates([
        lastPosX - (deltaX / scale),
        lastPosY - (deltaY / scale),
      ]));
    } else {
      const { hover } = state.gui;
      const screenCoor = screenToWorld(
        state,
        this.viewport,
        [clientX, clientY],
      );
      if (!hover || hover[0] !== screenCoor[0] || hover[1] !== screenCoor[1]) {
        store.dispatch(setHover(screenCoor));
      }
      if (this.holdPainting && !this.coolDownDelta) {
        PixelPlainterControls.placePixel(store, this.renderer, screenCoor);
      }
    }
  }

  onMouseOut() {
    const { store, viewport } = this;
    viewport.style.cursor = 'auto';
    store.dispatch(unsetHover());
    store.dispatch(onViewFinishChange());
    this.holdPainting = false;
    this.clearTabTimeout();
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

  onKeyUp(event: KeyboardEvent) {
    if (keycode(event) === 'shift') {
      this.holdPainting = false;
    }
  }

  onKeyDown(event: KeyboardEvent) {
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
      case '+':
      case 'e':
        store.dispatch(zoomIn());
        break;
      case '-':
      case 'q':
        store.dispatch(zoomOut());
        break;
      case 'shift': {
        const state = store.getState();
        const { hover } = state.gui;
        if (hover) {
          this.holdPainting = true;
          PixelPlainterControls.placePixel(store, this.renderer, hover);
        }
        break;
      }
      default:
    }
  }
}

export default PixelPlainterControls;

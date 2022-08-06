/*
  * play sounds using the HTML5 AudoContext
  */


// iPhone needs this
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = AudioContext && new AudioContext();

export default (store) => (next) => (action) => {
  const state = store.getState();
  const { mute, chatNotify } = state.audio;

  if (!mute && context) {
    switch (action.type) {
      case 'SELECT_COLOR': {
        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.detune.value = -600;

        oscillatorNode.frequency.setValueAtTime(600, context.currentTime);
        oscillatorNode.frequency.setValueAtTime(700, context.currentTime + 0.1);


        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.2,
          context.currentTime + 0.1,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.2);
        break;
      }

      case 'SET_NOTIFICATION': {
        const { notification } = action;
        if (typeof notification !== 'string') {
          break;
        }
        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.detune.value = -1200;

        oscillatorNode.frequency.setValueAtTime(500, context.currentTime);
        oscillatorNode.frequency.setValueAtTime(600, context.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.2,
          context.currentTime + 0.1,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.2);
        break;
      }

      case 'PIXEL_WAIT': {
        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        // oscillatorNode.detune.value = -600

        oscillatorNode.frequency.setValueAtTime(1479.98, context.currentTime);
        oscillatorNode.frequency.exponentialRampToValueAtTime(
          493.88,
          context.currentTime + 0.01,
        );


        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.2,
          context.currentTime + 0.1,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.1);
        break;
      }

      case 'ALERT': {
        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.detune.value = -900;
        oscillatorNode.frequency.setValueAtTime(600, context.currentTime);
        oscillatorNode.frequency.setValueAtTime(
          1400,
          context.currentTime + 0.025,
        );
        oscillatorNode.frequency.setValueAtTime(
          1200,
          context.currentTime + 0.05,
        );
        oscillatorNode.frequency.setValueAtTime(
          900,
          context.currentTime + 0.075,
        );

        const lfo = context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2.0;
        lfo.connect(gainNode.gain);
        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        lfo.start();
        oscillatorNode.stop(context.currentTime + 0.3);
        break;
      }

      case 'PLACED_PIXELS': {
        const { palette, selectedColor: color } = state.canvas;
        const colorsAmount = palette.colors.length;

        const clrFreq = 100 + Math.log(color / colorsAmount + 1) * 300;
        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.frequency.setValueAtTime(clrFreq, context.currentTime);
        oscillatorNode.frequency.exponentialRampToValueAtTime(
          1400,
          context.currentTime + 0.2,
        );

        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.2,
          context.currentTime + 0.1,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.1);
        break;
      }

      case 'COOLDOWN_END': {
        // do not play sound if last cooldown end was <5s ago
        const { lastCoolDownEnd } = state.user;
        if (lastCoolDownEnd && lastCoolDownEnd.getTime() + 5000 > Date.now()) {
          break;
        }

        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.frequency.setValueAtTime(349.23, context.currentTime);
        oscillatorNode.frequency.setValueAtTime(
          523.25,
          context.currentTime + 0.1,
        );
        oscillatorNode.frequency.setValueAtTime(
          698.46,
          context.currentTime + 0.2,
        );

        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.2,
          context.currentTime + 0.15,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.3);
        break;
      }

      case 'RECEIVE_CHAT_MESSAGE': {
        if (chatNotify) break;

        const { isPing, channel } = action;
        const { mute: muteCh, chatChannel } = state.chatRead;
        if (muteCh.includes(channel)) break;
        if (muteCh.includes(`${channel}`)) break;
        const { channels } = state.chat;

        const oscillatorNode = context.createOscillator();
        const gainNode = context.createGain();

        oscillatorNode.type = 'sine';
        oscillatorNode.frequency.setValueAtTime(310, context.currentTime);
        /*
         * ping if user mention or
         * message in DM channel that is not currently open
         */
        const freq = (isPing
          || (
            channels[channel]
            && channels[channel][1] === 1
            // eslint-disable-next-line eqeqeq
            && channel != chatChannel
          )
        ) ? 540 : 355;
        oscillatorNode.frequency.exponentialRampToValueAtTime(
          freq,
          context.currentTime + 0.025,
        );

        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.1,
          context.currentTime + 0.1,
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(context.destination);

        oscillatorNode.start();
        oscillatorNode.stop(context.currentTime + 0.075);
        break;
      }

      default:
        // nothing
    }
  }

  return next(action);
};

import AudioManager;

exports.sound = null;

/* Initialize the audio files if they haven't been already.
 */
exports.getSound = function () {
	if (!exports.sound) {
		exports.sound = new AudioManager({
			path: 'resources/sounds',
			files: {
				levelmusic: {
					path: 'music',
					volume: 0.2,
					background: true,
					loop: true
				},
				whack: {
					path: 'effect',
					volume: 1.0,
					background: false
				},
				pop: {
					path: 'effect',
					volume: 1.0,
					background: false
				},
				shot: {
					path: 'effect',
					volume: 1.0,
					background: false
				}
			}
		});
	}
	return exports.sound;
};

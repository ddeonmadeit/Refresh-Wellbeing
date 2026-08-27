/*
 * Refresh Wellbeing - homepage hero background video.
 *
 * The hero ships as a chrome-free YouTube background: no controls, no play
 * head, and pointer-events disabled so it cannot be clicked or paused.
 *
 * To serve the video yourself instead - the only way to guarantee zero player
 * chrome on every browser and device - drop the file in at
 * site/assets/hero/hero.mp4 and point the hero at it:
 *
 *     <div class="rw-hero-video" data-local-video="assets/hero/hero.mp4" ...>
 *
 * This then swaps the iframe for a native muted, looping <video> with no
 * controls attribute. If the file is missing or undecodable, the YouTube
 * background stays exactly as it is.
 */
(function () {
	'use strict';

	function ready(fn) {
		if (document.readyState !== 'loading') {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

	ready(function () {
		var hero = document.querySelector('.rw-hero-video');
		if (!hero) {
			return;
		}

		var src = (hero.getAttribute('data-local-video') || '').trim();
		if (!src) {
			return; // No self-hosted file configured - keep the YouTube background.
		}

		// Confirm the file is really there and decodable before swapping, so a
		// bad path can never leave the hero blank.
		var probe = document.createElement('video');
		probe.muted = true;
		probe.preload = 'metadata';

		probe.addEventListener('loadeddata', function () {
			var iframe = hero.querySelector('iframe.rw-hero-video__media');
			if (!iframe) {
				return;
			}

			var video = document.createElement('video');
			video.className = 'rw-hero-video__media';
			video.src = src;
			video.autoplay = true;
			video.loop = true;
			video.muted = true;
			video.defaultMuted = true;
			video.playsInline = true;
			video.controls = false;
			video.tabIndex = -1;
			video.setAttribute('muted', '');
			video.setAttribute('playsinline', '');
			video.setAttribute('webkit-playsinline', '');
			video.setAttribute('disablepictureinpicture', '');
			video.setAttribute('aria-hidden', 'true');

			var poster = hero.getAttribute('data-poster');
			if (poster) {
				video.poster = poster;
			}

			iframe.parentNode.replaceChild(video, iframe);

			var attempt = video.play();
			if (attempt && typeof attempt.catch === 'function') {
				attempt.catch(function () {
					/* Muted autoplay is allowed everywhere we target. If a
					   browser still refuses, the poster stays on screen -
					   never a play button. */
				});
			}
		});

		probe.addEventListener('error', function () {
			/* Unreadable file - keep the YouTube background. */
		});

		probe.src = src;
	});
})();

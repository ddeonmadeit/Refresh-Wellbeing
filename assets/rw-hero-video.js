/*
 * Refresh Wellbeing - homepage hero background video.
 *
 * The hero is a self-hosted, muted, looping <video> with no controls, so no
 * player chrome is ever drawn. WebM is offered first and MP4 is the fallback,
 * which between them cover every current browser.
 *
 * The markup carries the full-size files, so the hero works with JavaScript
 * disabled. This script's only job is to swap in the lighter encodes on small
 * screens, where a 1080p download is wasted on the visitor's data.
 */
(function () {
	'use strict';

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	ready(function () {
		var video = document.querySelector('video.rw-hero-video__media');
		if (!video) { return; }

		if (window.matchMedia('(max-width: 900px)').matches) {
			var swapped = false;
			[].forEach.call(video.querySelectorAll('source'), function (s) {
				var small = (s.getAttribute('data-src-mobile') || '').trim();
				if (small && s.getAttribute('src') !== small) {
					s.setAttribute('src', small);
					swapped = true;
				}
			});
			// Re-run source selection against the newly written URLs.
			if (swapped) { video.load(); }
		}

		// iOS Safari honours autoplay only when muted is set as a property,
		// not merely as an attribute.
		video.muted = true;
		video.defaultMuted = true;

		var attempt = video.play();
		if (attempt && typeof attempt.catch === 'function') {
			attempt.catch(function () {
				/* If a browser still refuses muted autoplay the poster frame
				   stays on screen - never a play button. */
			});
		}
	});
})();

/*
 * Refresh Wellbeing - homepage hero background video.
 *
 * Three jobs:
 *
 *   1. Serve the right encode. WebM where the browser takes it, MP4 elsewhere;
 *      the 1152x812 cut on phones and the 1920x880 cut on wide screens, so a
 *      full-width download is never spent on a 390px band.
 *
 *   2. Blend the loop. The footage is a montage of four scenes with the
 *      dissolves between them baked into the file, but a single looping
 *      <video> would still hard-cut from the last frame back to the first.
 *      Instead two identical layers are stacked and played in turn: as the
 *      live one nears its end the idle one starts from zero underneath and
 *      fades up over it, so the wrap is a dissolve like the other three.
 *
 *   3. Never show a play button. The layers start fully transparent over a
 *      still frame and are only faded in once the browser reports the footage
 *      actually playing. If autoplay is refused - Low Power Mode, a data
 *      saver, a locked-down browser - the layers stay hidden and the visitor
 *      sees the still frame, never Safari's play-head overlay. Playback is
 *      retried quietly on the first interaction and whenever the tab is
 *      brought back to the front.
 */
(function () {
	'use strict';

	var FADE_MS = 600;          // must match the CSS opacity transition,
	                            // and the dissolves baked into the montage
	var LEAD_S = FADE_MS / 1000; // start the next layer this far from the end

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	ready(function () {
		var hero = document.querySelector('.rw-hero-video');
		if (!hero) { return; }

		var layers = [].slice.call(hero.querySelectorAll('video.rw-hero-video__media'));
		if (!layers.length) { return; }

		/* ---- pick the encode -------------------------------------------- */

		var probe = document.createElement('video');
		var webm = !!probe.canPlayType &&
			probe.canPlayType('video/webm; codecs="vp9"').replace(/no/, '') !== '';
		/* 778px is where the stylesheet locks the band to 1.418:1. Below it the
		   art-directed crop is the right footage; above it the band is wide
		   again and wants the full 16:9 frame. */
		var small = window.matchMedia('(max-width: 778px)').matches;

		var src = 'assets/hero/hero' + (small ? '-mobile' : '') + (webm ? '.webm' : '.mp4');

		layers.forEach(function (v) {
			v.muted = true;          // iOS honours muted autoplay only as a property
			v.defaultMuted = true;
			v.playsInline = true;
			v.controls = false;
			if (v.getAttribute('src') !== src) {
				v.setAttribute('src', src);
				v.load();
			}
		});

		/* The blend is driven from here, so the browser's own hard-cut loop is
		   handed back. Kept in the markup purely for the no-JavaScript case. */
		var blending = layers.length > 1;
		if (blending) { layers.forEach(function (v) { v.loop = false; }); }

		/* ---- keep the layers hidden until footage is genuinely running --- */

		var live = 0;
		var started = false;

		function reveal(v) {
			v.classList.add('is-live');
			if (!started) {
				started = true;
				hero.classList.add('is-playing');
			}
		}

		layers.forEach(function (v) {
			// A layer that is not the current one must never show itself.
			v.addEventListener('playing', function () {
				if (layers[live] === v) { reveal(v); }
			});
		});

		/* ---- autoplay, with quiet retries -------------------------------- */

		function attempt(v) {
			var p;
			try { p = v.play(); } catch (e) { return; }
			if (p && typeof p.catch === 'function') { p.catch(function () { /* still frame stays */ }); }
		}

		function kick() {
			if (!started) { attempt(layers[live]); }
		}

		layers[0].classList.remove('is-live');
		attempt(layers[0]);

		['touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (evt) {
			window.addEventListener(evt, kick, { passive: true });
		});
		document.addEventListener('visibilitychange', function () {
			if (document.visibilityState !== 'visible') { return; }
			if (!started) { kick(); return; }
			// Coming back from the background can leave the live layer paused.
			if (layers[live].paused) { attempt(layers[live]); }
		});

		if (!blending) { return; }

		/* ---- the dissolve ------------------------------------------------ */

		var handing = false;

		/* If a browser will not run two videos at once, give up on the blend and
		   hand the loop back to the layer that was already playing. A hard cut
		   is a poorer seam than a dissolve, but it is still a loop. */
		function fallBackToPlainLoop(keep, drop) {
			live = layers.indexOf(keep);
			blending = false;
			drop.classList.remove('is-live');
			drop.pause();
			keep.loop = true;
			keep.style.zIndex = '2';
			keep.classList.add('is-live');
			attempt(keep);
			handing = false;
		}

		function handOver() {
			if (!blending || handing) { return; }
			handing = true;

			var out = layers[live];
			var next = layers[1 - live];

			live = 1 - live;

			try { next.currentTime = 0; } catch (e) { /* not seekable yet */ }
			// The incoming layer rides on top for the length of the dissolve.
			// It is faded up by the 'playing' handler, never on a timer, so a
			// layer that failed to start is never dissolved to.
			next.style.zIndex = '2';
			out.style.zIndex = '1';
			attempt(next);

			window.setTimeout(function () {
				if (next.paused || next.currentTime < 0.05) {
					fallBackToPlainLoop(out, next);
					return;
				}
				out.classList.remove('is-live');
				out.pause();
				try { out.currentTime = 0; } catch (e) { /* ignore */ }
				handing = false;
			}, FADE_MS + 60);
		}

		layers.forEach(function (v) {
			v.addEventListener('timeupdate', function () {
				if (!blending || layers[live] !== v || handing) { return; }
				var d = v.duration;
				if (!isFinite(d) || d <= LEAD_S) { return; }
				if (v.currentTime >= d - LEAD_S) { handOver(); }
			});
			// Safety net: timeupdate fires roughly 4x a second and can skip the
			// window on a slow device.
			v.addEventListener('ended', function () {
				if (blending && layers[live] === v) { handOver(); }
			});
		});
	});
})();

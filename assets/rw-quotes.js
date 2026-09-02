/*
 * Refresh Wellbeing - testimonials marquee.
 *
 * The row scrolls on its own and never stops: no pause on hover or tap. A
 * horizontal swipe, or a scroll over the section, gives it a shove that decays
 * back to the base speed, so it can be hurried along without ever being frozen.
 *
 * The CSS keyframe animation stays in the stylesheet as the no-JavaScript
 * fallback. When this file runs it adds `is-js`, which switches the animation
 * off and hands the transform to the frame loop below - a keyframe animation
 * cannot have its speed changed mid-flight without jumping.
 */
(function () {
	'use strict';

	var SECONDS_PER_RUN = 64;   // base pace, matching the CSS fallback
	var WHEEL_GAIN = 9;         // how hard a horizontal wheel/trackpad shove pushes
	var SCROLL_GAIN = 3.2;      // a vertical page scroll nudges it along more gently
	var SWIPE_GAIN = 22;        // a finger drag
	var DECAY = 0.06;           // fraction of the boost surviving each second
	var MAX_BOOST = 2600;       // px/sec, so a flick cannot send it into a blur

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	ready(function () {
		var viewport = document.querySelector('.rw-quotes__viewport');
		var track = viewport && viewport.querySelector('.rw-quotes__track');
		if (!track) { return; }

		// Respect a reduced-motion preference: the stylesheet turns the row into
		// a plain manual scroller there, so leave it alone.
		var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
		if (reduce && reduce.matches) { return; }

		track.classList.add('is-js');

		/* One "set" is the original run of cards. The track is padded out with
		   clones until it is at least a viewport wider than a set, because the
		   loop travels exactly one set before repeating: with only two sets and
		   a 27" monitor, the track was narrower than the screen and the row ran
		   out mid-band with brown behind it. */
		var set = [].slice.call(track.children).filter(function (el) {
			return el.getAttribute('aria-hidden') !== 'true';
		});
		if (!set.length) { set = [].slice.call(track.children); }

		function setWidth() {
			return set.reduce(function (sum, el) {
				var cs = getComputedStyle(el);
				return sum + el.getBoundingClientRect().width + parseFloat(cs.marginRight || 0);
			}, 0);
		}

		function fill() {
			var one = setWidth();
			if (one <= 0) { return 0; }
			var needed = window.innerWidth + one;
			var guard = 0;
			while (track.scrollWidth < needed && guard++ < 20) {
				set.forEach(function (el) {
					var clone = el.cloneNode(true);
					clone.setAttribute('aria-hidden', 'true');
					track.appendChild(clone);
				});
			}
			return one;
		}

		var runWidth = 0;
		function measure() { runWidth = fill(); }
		measure();
		window.addEventListener('resize', measure);
		if (window.ResizeObserver) { new ResizeObserver(measure).observe(track); }

		var offset = 0;
		var boost = 0;
		var last = 0;
		var running = true;

		function frame(now) {
			if (!last) { last = now; }
			var dt = Math.min((now - last) / 1000, 0.05); // clamp after a tab switch
			last = now;

			if (runWidth > 0) {
				var base = runWidth / SECONDS_PER_RUN;
				offset += (base + boost) * dt;
				boost *= Math.pow(DECAY, dt);
				if (Math.abs(boost) < 0.5) { boost = 0; }
				// Wrap within one run; the second run makes the seam invisible.
				offset = ((offset % runWidth) + runWidth) % runWidth;
				track.style.transform = 'translateX(' + (-offset).toFixed(2) + 'px)';
			}
			if (running) { requestAnimationFrame(frame); }
		}
		requestAnimationFrame(frame);

		// Pause the loop off-screen and in background tabs - it is decoration,
		// not something worth spending frames on when nobody is looking.
		document.addEventListener('visibilitychange', function () {
			if (document.hidden) { running = false; }
			else if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
		});

		function push(amount) {
			boost += amount;
			if (boost > MAX_BOOST) { boost = MAX_BOOST; }
			if (boost < -MAX_BOOST) { boost = -MAX_BOOST; }
		}

		viewport.addEventListener('wheel', function (e) {
			if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
				// A deliberate horizontal gesture belongs to the row, not the page.
				e.preventDefault();
				push(e.deltaX * WHEEL_GAIN);
			} else {
				// Vertical is the page's scroll; borrow a little of it, block nothing.
				push(e.deltaY * SCROLL_GAIN);
			}
		}, { passive: false });

		var startX = 0, startY = 0, lastX = 0, horizontal = null;

		/* Touch events can arrive with an empty list - touchend always does, and
		   a cancelled sequence can too - so never index into it blind. */
		viewport.addEventListener('touchstart', function (e) {
			if (!e.touches || !e.touches.length) { return; }
			var t = e.touches[0];
			startX = lastX = t.clientX;
			startY = t.clientY;
			horizontal = null;
		}, { passive: true });

		viewport.addEventListener('touchmove', function (e) {
			if (!e.touches || !e.touches.length) { return; }
			var t = e.touches[0];
			if (horizontal === null) {
				// Decide once, from the first few pixels, whether this drag is the
				// row's or the page's - so a vertical scroll is never captured.
				var dx = Math.abs(t.clientX - startX), dy = Math.abs(t.clientY - startY);
				if (dx + dy < 6) { return; }
				horizontal = dx > dy;
			}
			if (!horizontal) { return; }
			e.preventDefault();
			push((lastX - t.clientX) * SWIPE_GAIN);
			lastX = t.clientX;
		}, { passive: false });
	});
})();

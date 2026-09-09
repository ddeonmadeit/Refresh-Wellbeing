/*
 * Refresh Wellbeing - mobile navigation drawer.
 *
 * The theme ships a push-down dropdown for mobile: it shoves the page content
 * down, has no backdrop, and offers no way to close itself. This replaces it
 * with a slide-in drawer.
 *
 * The drawer is built by cloning the theme's own menu markup, so it stays in
 * step with whatever the menu contains - no second copy of the links to keep
 * in sync.
 */
(function () {
	'use strict';

	var BREAKPOINT = 1024;
	var SVG_NS = 'http://www.w3.org/2000/svg';

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	function icon(paths, size) {
		var svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'currentColor');
		svg.setAttribute('stroke-width', '2');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		svg.setAttribute('aria-hidden', 'true');
		paths.forEach(function (d) {
			var p = document.createElementNS(SVG_NS, 'path');
			p.setAttribute('d', d);
			svg.appendChild(p);
		});
		return svg;
	}

	/* Brand marks are solid shapes, not strokes, so they need their own
	   builder rather than the stroked one above. */
	function brandIcon(d, viewBox) {
		var svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('viewBox', viewBox);
		svg.setAttribute('fill', 'currentColor');
		svg.setAttribute('aria-hidden', 'true');
		var p = document.createElementNS(SVG_NS, 'path');
		p.setAttribute('d', d);
		svg.appendChild(p);
		return svg;
	}

	var SOCIAL = [
		{ name: 'Instagram',
		  href: 'https://www.instagram.com/refresh.wellbeing/',
		  viewBox: '0 0 448 512',
		  d: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z' },
		{ name: 'Facebook',
		  href: 'https://www.facebook.com/pages/category/Beauty-Salon/Refresh-Spa-Clinic-231025000996130',
		  viewBox: '0 0 320 512',
		  d: 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z' }
	];

	/* The theme renders the menu more than once (split either side of the
	   logo on desktop, plus a complete copy for mobile). The complete one is
	   whichever has the most top-level items. */
	function sourceMenu() {
		var best = null, bestCount = -1;
		[].forEach.call(document.querySelectorAll('ul.wl_hf-nav-menu'), function (ul) {
			var n = ul.querySelectorAll(':scope > li').length;
			if (n > bestCount) { bestCount = n; best = ul; }
		});
		return bestCount > 0 ? best : null;
	}

	function build(source) {
		var backdrop = document.createElement('div');
		backdrop.className = 'rw-nav-backdrop';
		backdrop.hidden = true;

		var panel = document.createElement('div');
		panel.className = 'rw-nav-panel';
		panel.id = 'rw-nav-panel';
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-modal', 'true');
		panel.setAttribute('aria-label', 'Menu');
		panel.hidden = true;

		// --- header -----------------------------------------------------
		var top = document.createElement('div');
		top.className = 'rw-nav-panel__top';
		var brand = document.createElement('span');
		brand.className = 'rw-nav-panel__brand';
		brand.textContent = 'Menu';
		var close = document.createElement('button');
		close.type = 'button';
		close.className = 'rw-nav-close';
		close.setAttribute('aria-label', 'Close menu');
		close.appendChild(icon(['M18 6 6 18', 'M6 6l12 12']));
		top.appendChild(brand);
		top.appendChild(close);

		// --- items ------------------------------------------------------
		var list = document.createElement('ul');
		list.className = 'rw-nav-list';

		var here = location.pathname.replace(/index\.html$/, '');

		[].forEach.call(source.querySelectorAll(':scope > li'), function (li) {
			var link = li.querySelector(':scope > a, :scope > div > a');
			if (!link) { return; }

			var item = document.createElement('li');
			var sub = li.querySelector(':scope > ul');
			var label = (link.textContent || '').trim();

			if (sub && sub.querySelector('a')) {
				// Parent with children -> accordion. The theme's parent link is
				// a placeholder ("#"), so it becomes the toggle rather than a link.
				var toggle = document.createElement('button');
				toggle.type = 'button';
				toggle.className = 'rw-nav-sub-toggle';
				toggle.setAttribute('aria-expanded', 'false');
				toggle.appendChild(document.createTextNode(label));
				toggle.appendChild(icon(['m6 9 6 6 6-6']));

				var subList = document.createElement('ul');
				subList.className = 'rw-nav-sub';

				[].forEach.call(sub.querySelectorAll(':scope > li > a'), function (a) {
					var subItem = document.createElement('li');
					var link2 = document.createElement('a');
					link2.href = a.getAttribute('href');
					link2.textContent = (a.textContent || '').trim();
					if (a.getAttribute('target')) { link2.target = a.getAttribute('target'); }
					try {
						if (new URL(link2.href, location.href).pathname.replace(/index\.html$/, '') === here) {
							link2.className = 'is-current';
						}
					} catch (e) { /* ignore odd hrefs */ }
					subItem.appendChild(link2);
					subList.appendChild(subItem);
				});

				toggle.addEventListener('click', function () {
					var open = toggle.getAttribute('aria-expanded') === 'true';
					toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
					subList.style.maxHeight = open ? '' : subList.scrollHeight + 'px';
				});

				item.appendChild(toggle);
				item.appendChild(subList);
			} else {
				var a2 = document.createElement('a');
				a2.href = link.getAttribute('href');
				a2.textContent = label;
				if (link.getAttribute('target')) { a2.target = link.getAttribute('target'); }
				try {
					if (new URL(a2.href, location.href).pathname.replace(/index\.html$/, '') === here) {
						a2.className = 'is-current';
					}
				} catch (e) { /* ignore */ }
				item.appendChild(a2);
			}
			list.appendChild(item);
		});

		// --- footer CTA --------------------------------------------------
		var foot = document.createElement('div');
		foot.className = 'rw-nav-panel__foot';
		var social = document.createElement('div');
		social.className = 'rw-nav-social';
		SOCIAL.forEach(function (s) {
			var a = document.createElement('a');
			a.className = 'rw-nav-social__link';
			a.href = s.href;
			a.target = '_blank';
			a.rel = 'noopener';
			// The glyph is decorative, so the accessible name goes on the link.
			a.setAttribute('aria-label', s.name);
			a.appendChild(brandIcon(s.d, s.viewBox));
			social.appendChild(a);
		});
		foot.appendChild(social);

		panel.appendChild(top);
		panel.appendChild(list);
		panel.appendChild(foot);
		document.body.appendChild(backdrop);
		document.body.appendChild(panel);

		return { backdrop: backdrop, panel: panel, close: close };
	}

	ready(function () {
		var source = sourceMenu();
		if (!source) { return; }

		var els = build(source);
		var panel = els.panel;
		var backdrop = els.backdrop;
		var lastFocus = null;

		function focusable() {
			return [].filter.call(
				panel.querySelectorAll('a[href], button:not([disabled])'),
				function (el) { return el.offsetParent !== null; });
		}

		function open() {
			lastFocus = document.activeElement;
			panel.hidden = false;
			backdrop.hidden = false;
			// force a frame so the transition runs from the closed position
			void panel.offsetWidth;
			panel.classList.add('is-open');
			backdrop.classList.add('is-open');
			document.body.classList.add('rw-nav-open');
			[].forEach.call(document.querySelectorAll('.wl_hf-nav-menu__toggle'), function (t) {
				t.setAttribute('aria-expanded', 'true');
			});
			var f = focusable();
			if (f.length) { f[0].focus(); }
		}

		function shut() {
			panel.classList.remove('is-open');
			backdrop.classList.remove('is-open');
			document.body.classList.remove('rw-nav-open');
			[].forEach.call(document.querySelectorAll('.wl_hf-nav-menu__toggle'), function (t) {
				t.setAttribute('aria-expanded', 'false');
			});
			window.setTimeout(function () {
				if (!panel.classList.contains('is-open')) {
					panel.hidden = true;
					backdrop.hidden = true;
				}
			}, 340);
			if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
		}

		function isOpen() { return panel.classList.contains('is-open'); }

		// Take over the theme's hamburger, in the capture phase so its own
		// handler never runs and the old dropdown never appears.
		[].forEach.call(document.querySelectorAll('.wl_hf-nav-menu__toggle'), function (t) {
			t.setAttribute('aria-controls', 'rw-nav-panel');
			t.setAttribute('aria-expanded', 'false');
			t.addEventListener('click', function (e) {
				if (window.innerWidth > BREAKPOINT) { return; }
				e.preventDefault();
				e.stopPropagation();
				if (isOpen()) { shut(); } else { open(); }
			}, true);
		});

		els.close.addEventListener('click', shut);
		backdrop.addEventListener('click', shut);

		// Navigating away from a same-page link should close the drawer.
		panel.addEventListener('click', function (e) {
			if (e.target.closest('a')) { shut(); }
		});

		document.addEventListener('keydown', function (e) {
			if (!isOpen()) { return; }
			if (e.key === 'Escape') { shut(); return; }
			if (e.key !== 'Tab') { return; }
			var f = focusable();
			if (!f.length) { return; }
			var first = f[0], last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});

		// Returning to desktop width should not leave a drawer stranded open.
		window.addEventListener('resize', function () {
			if (window.innerWidth > BREAKPOINT && isOpen()) { shut(); }
		});
	});
})();

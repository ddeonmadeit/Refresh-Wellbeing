/*
 * Refresh Wellbeing - local activity store.
 *
 * IMPORTANT, and the reason this file looks the way it does: the site is a
 * static build served by GitHub Pages. There is no server and no database, so
 * nothing here can be written anywhere central. Everything below is held in
 * the visitor's own browser via localStorage.
 *
 * What that means in practice:
 *
 *   - The dashboard at /dash shows the activity of the browser it is opened
 *     in. It is not, and cannot be, a view of every visitor.
 *   - Nothing recorded here leaves the device, which is also why a public
 *     /dash page leaks nothing: there is no shared store behind it to read.
 *   - To collect real enquiries centrally the form needs a submission
 *     endpoint. Set RW_FORM_ENDPOINT below and the retreats form will POST to
 *     it as well as recording locally.
 */
(function (w) {
	'use strict';

	/* Set this to a form endpoint (Formspree, Basin, a Worker - anything that
	   accepts a JSON POST) and enquiries will be delivered there. Left empty,
	   the form falls back to handing the visitor a pre-filled email so the
	   enquiry still reaches the studio. */
	var RW_FORM_ENDPOINT = '';

	var K = {
		leads:  'rw.leads.v1',
		clicks: 'rw.clicks.v1',
		views:  'rw.views.v1'
	};

	/* Every accessor is wrapped: private windows, cleared site data and
	   browsers set to block storage all throw rather than return empty. */
	function read(key, fallback) {
		try {
			var raw = w.localStorage.getItem(key);
			return raw ? JSON.parse(raw) : fallback;
		} catch (e) { return fallback; }
	}

	function write(key, value) {
		try { w.localStorage.setItem(key, JSON.stringify(value)); return true; }
		catch (e) { return false; }
	}

	function now() { return new Date().toISOString(); }

	var RW = {
		endpoint: RW_FORM_ENDPOINT,

		getLeads:  function () { return read(K.leads, []); },
		getClicks: function () { return read(K.clicks, {}); },
		getViews:  function () { return read(K.views, {}); },

		addLead: function (lead) {
			var all = RW.getLeads();
			all.push({
				id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
				ts: now(),
				name: lead.name,
				method: lead.method,
				value: lead.value,
				note: lead.note || '',
				page: location.pathname
			});
			write(K.leads, all);
			return all[all.length - 1];
		},

		/* Delivery is best-effort and never blocks the confirmation: the lead
		   is already recorded locally by the time this runs. */
		deliver: function (lead) {
			if (!RW_FORM_ENDPOINT) { return Promise.resolve(false); }
			return fetch(RW_FORM_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify(lead)
			}).then(function (r) { return r.ok; }).catch(function () { return false; });
		},

		recordView: function () {
			var v = RW.getViews();
			var p = location.pathname.replace(/index\.html$/, '') || '/';
			v[p] = v[p] || { count: 0, last: null };
			v[p].count += 1;
			v[p].last = now();
			write(K.views, v);
		},

		recordClick: function (href, label) {
			var c = RW.getClicks();
			c[href] = c[href] || { label: label, count: 0, last: null };
			if (label) { c[href].label = label; }
			c[href].count += 1;
			c[href].last = now();
			write(K.clicks, c);
		},

		clear: function () {
			[K.leads, K.clicks, K.views].forEach(function (k) {
				try { w.localStorage.removeItem(k); } catch (e) { /* ignore */ }
			});
		}
	};

	w.RWLeads = RW;

	/* ---- passive tracking ------------------------------------------------ */

	RW.recordView();

	/* An explicit data-track-label wins; otherwise text is gathered node by node
	   and joined with spaces, because textContent runs elements together - a
	   link reading "Retreats" over "Coming soon" came back as
	   "RetreatsComing soon". */
	function labelFor(a) {
		var explicit = a.getAttribute('data-track-label');
		if (explicit) { return explicit.trim().slice(0, 60); }
		var parts = [];
		var walk = document.createTreeWalker(a, NodeFilter.SHOW_TEXT, null);
		var node;
		while ((node = walk.nextNode())) {
			var t = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
			if (t) { parts.push(t); }
		}
		return (parts.join(' ') || a.getAttribute('aria-label') || '').slice(0, 60);
	}

	document.addEventListener('click', function (e) {
		var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
		if (!a) { return; }
		var href = a.getAttribute('href') || '';
		// Ignore in-page jumps and non-navigations; they are not link choices.
		if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href)) { return; }
		RW.recordClick(href, labelFor(a) || href);
	}, true);
})(window);

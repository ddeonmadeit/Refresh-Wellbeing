/*
 * Refresh Wellbeing - dashboard rendering.
 *
 * Reads the local store written by rw-leads.js. Everything here is a view over
 * one browser's own activity, which is what the notice at the top of the page
 * says plainly - see the header comment in rw-leads.js for why.
 *
 * Forms: counts are hero numbers in stat tiles; the two rankings are single-hue
 * horizontal bars with the value direct-labelled on every row, so no legend and
 * no axis are needed. Enquiries are a table - names and contact details are
 * identity, not magnitude, and there is nothing to plot.
 */
(function () {
	'use strict';

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	function el(tag, cls, text) {
		var n = document.createElement(tag);
		if (cls) { n.className = cls; }
		if (text != null) { n.textContent = text; }
		return n;
	}

	function fmtDate(iso) {
		try {
			var d = new Date(iso);
			return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) +
				' ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
		} catch (e) { return iso || ''; }
	}

	function empty(msg) {
		return el('p', 'rw-dash__empty', msg);
	}

	/* Ranked bars. One hue carries magnitude, the value is written on the row,
	   and the scale is the largest bar - so no axis is drawn. */
	function bars(rows) {
		var max = rows.reduce(function (m, r) { return Math.max(m, r.count); }, 0) || 1;
		var list = el('ul', 'rw-bars');
		rows.forEach(function (r) {
			var li = el('li', 'rw-bar');
			var head = el('div', 'rw-bar__head');
			var label = el('span', 'rw-bar__label', r.label);
			label.title = r.sub || r.label;
			head.appendChild(label);
			head.appendChild(el('span', 'rw-bar__value', String(r.count)));
			li.appendChild(head);
			var track = el('div', 'rw-bar__track');
			var fill = el('div', 'rw-bar__fill');
			fill.style.width = Math.max(3, Math.round((r.count / max) * 100)) + '%';
			track.appendChild(fill);
			li.appendChild(track);
			if (r.sub) { li.appendChild(el('p', 'rw-bar__sub', r.sub)); }
			list.appendChild(li);
		});
		return list;
	}

	function table(leads) {
		var t = el('table', 'rw-table');
		var thead = el('thead');
		var hr = el('tr');
		['When', 'Name', 'Reach them on', 'Interest'].forEach(function (h) {
			hr.appendChild(el('th', null, h));
		});
		thead.appendChild(hr);
		t.appendChild(thead);
		var tb = el('tbody');
		leads.slice().reverse().forEach(function (l) {
			var tr = el('tr');
			tr.appendChild(el('td', 'rw-table__when', fmtDate(l.ts)));
			tr.appendChild(el('td', null, l.name));
			var td = el('td');
			var a = el('a', null, l.value);
			a.href = (l.method === 'email' ? 'mailto:' : 'tel:') + l.value;
			td.appendChild(a);
			td.appendChild(el('span', 'rw-table__tag', l.method === 'email' ? 'email' : 'phone'));
			tr.appendChild(td);
			tr.appendChild(el('td', null, l.note || '—'));
			tb.appendChild(tr);
		});
		t.appendChild(tb);
		var wrap = el('div', 'rw-table__scroll');
		wrap.appendChild(t);
		return wrap;
	}

	function csv(leads) {
		var head = ['Date', 'Name', 'Method', 'Contact', 'Interest'];
		var rows = leads.map(function (l) {
			return [l.ts, l.name, l.method, l.value, l.note || ''];
		});
		return [head].concat(rows).map(function (r) {
			return r.map(function (c) {
				c = String(c == null ? '' : c);
				return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
			}).join(',');
		}).join('\n');
	}

	ready(function () {
		var store = window.RWLeads;
		var statsEl = document.getElementById('rw-stats');
		if (!store || !statsEl) { return; }

		var leads = store.getLeads();
		var clicks = store.getClicks();
		var views = store.getViews();

		var clickRows = Object.keys(clicks).map(function (href) {
			return { label: clicks[href].label || href, sub: href, count: clicks[href].count };
		}).sort(function (a, b) { return b.count - a.count; });

		var viewRows = Object.keys(views).map(function (p) {
			return { label: p, count: views[p].count };
		}).sort(function (a, b) { return b.count - a.count; });

		var totalClicks = clickRows.reduce(function (s, r) { return s + r.count; }, 0);
		var totalViews = viewRows.reduce(function (s, r) { return s + r.count; }, 0);

		[['Enquiries', leads.length],
		 ['Page views', totalViews],
		 ['Link clicks', totalClicks]].forEach(function (pair) {
			var li = el('li', 'rw-stat');
			li.appendChild(el('span', 'rw-stat__value', String(pair[1])));
			li.appendChild(el('span', 'rw-stat__label', pair[0]));
			statsEl.appendChild(li);
		});

		var leadsOut = document.getElementById('rw-leads-out');
		if (leads.length) {
			leadsOut.appendChild(table(leads));
			var btn = document.getElementById('rw-export');
			btn.hidden = false;
			btn.addEventListener('click', function () {
				var blob = new Blob([csv(leads)], { type: 'text/csv;charset=utf-8;' });
				var url = URL.createObjectURL(blob);
				var a = document.createElement('a');
				a.href = url;
				a.download = 'refresh-wellbeing-enquiries.csv';
				document.body.appendChild(a);
				a.click();
				a.remove();
				setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
			});
		} else {
			leadsOut.appendChild(empty('No enquiries from this browser yet. One submitted through the retreats form will appear here.'));
		}

		var clicksOut = document.getElementById('rw-clicks-out');
		clicksOut.appendChild(clickRows.length
			? bars(clickRows.slice(0, 10))
			: empty('No links clicked in this browser yet.'));

		var viewsOut = document.getElementById('rw-views-out');
		viewsOut.appendChild(viewRows.length
			? bars(viewRows.slice(0, 10))
			: empty('No pages recorded in this browser yet.'));

		document.getElementById('rw-clear').addEventListener('click', function () {
			if (!window.confirm('Clear all enquiries and activity stored in this browser? This cannot be undone.')) { return; }
			store.clear();
			location.reload();
		});
	});
})();

/*
 * Refresh Wellbeing - footer enquiry form.
 *
 * Sits in the footer on every page. Like the contact and retreat forms it has
 * no server to post to, so the enquiry is recorded locally for /dash and, with
 * no endpoint configured in rw-leads.js, handed to the visitor as a pre-filled
 * email so it still reaches the studio.
 */
(function () {
	'use strict';

	var STUDIO_EMAIL = 'evonnekelly@hotmail.com';
	var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	ready(function () {
		var form = document.querySelector('.rw-footform');
		if (!form) { return; }

		var wrap  = form.closest('.rw-footform-wrap') || form.parentNode;
		var err   = wrap.querySelector('.rw-footform__error');
		var done  = wrap.querySelector('.rw-footform__done');
		var blurb = wrap.querySelector('.rw-footform__blurb');

		function field(name) { return form.querySelector('[name="' + name + '"]'); }
		function val(name) { var f = field(name); return f ? f.value.trim() : ''; }

		function fail(message, focus) {
			err.textContent = message;
			err.hidden = false;
			if (focus) { focus.setAttribute('aria-invalid', 'true'); focus.focus(); }
		}

		form.addEventListener('input', function () {
			err.hidden = true;
			[].forEach.call(form.querySelectorAll('[aria-invalid]'), function (f) {
				f.removeAttribute('aria-invalid');
			});
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();

			var name = val('name');
			var email = val('email');

			if (!name) { fail('Please tell us your name.', field('name')); return; }
			if (!EMAIL_RE.test(email)) { fail('Please enter a valid email address.', field('email')); return; }

			var lead = {
				name: name,
				method: 'email',
				value: email,
				message: val('message'),
				note: 'Footer form'
			};

			var store = window.RWLeads;
			if (store) { store.addLead(lead); }

			form.hidden = true;
			if (blurb) { blurb.hidden = true; }
			done.hidden = false;
			done.textContent = 'Thanks ' + name.split(' ')[0] + ' — we’ll be in touch.';

			var delivered = store && store.endpoint ? store.deliver(lead) : Promise.resolve(false);
			delivered.then(function (sent) {
				if (sent) { return; }
				var lines = ['Name: ' + lead.name, 'Email: ' + lead.value];
				if (lead.message) { lines.push('', lead.message); }
				var a = document.createElement('a');
				a.className = 'rw-footform__mailto';
				a.href = 'mailto:' + STUDIO_EMAIL +
					'?subject=' + encodeURIComponent('Website enquiry — ' + lead.name) +
					'&body=' + encodeURIComponent(lines.join('\n'));
				a.textContent = 'Finish — send your message';
				done.appendChild(document.createElement('br'));
				done.appendChild(a);
			});

			done.setAttribute('tabindex', '-1');
			done.focus();
		});
	});
})();

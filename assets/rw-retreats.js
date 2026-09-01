/*
 * Refresh Wellbeing - retreat interest form.
 *
 * The email/phone choice is a pair of radios styled as a segmented control, so
 * the form still submits and still reads correctly to a screen reader without
 * this file. All this adds is: retyping the contact field to match the choice,
 * inline validation, and the confirmation panel.
 *
 * Every enquiry is recorded locally by rw-leads.js so it appears on /dash. If
 * an endpoint is configured there it is also POSTed; if not, the confirmation
 * hands the visitor a pre-filled email so the enquiry still reaches the studio.
 */
(function () {
	'use strict';

	var STUDIO_EMAIL = 'evonnekelly@hotmail.com';

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	ready(function () {
		var form = document.getElementById('rw-retreat-form');
		if (!form) { return; }

		var name      = document.getElementById('rw-name');
		var nameErr   = document.getElementById('rw-name-error');
		var contact   = document.getElementById('rw-contact');
		var contactEr = document.getElementById('rw-contact-error');
		var label     = document.getElementById('rw-contact-label');
		var done      = document.getElementById('rw-retreat-done');
		var doneBody  = document.getElementById('rw-retreat-done-body');
		var mailto    = document.getElementById('rw-retreat-mailto');
		var mailNote  = document.getElementById('rw-retreat-mailto-note');
		var radios    = [].slice.call(form.querySelectorAll('input[name="method"]'));

		var MODES = {
			email: { label: 'Email address', type: 'email', mode: 'email', auto: 'email',
			         ph: 'you@example.com', err: 'Please enter a valid email address.' },
			phone: { label: 'Phone number', type: 'tel', mode: 'tel', auto: 'tel',
			         ph: '04XX XXX XXX',   err: 'Please enter a valid phone number.' }
		};

		function method() {
			var r = radios.filter(function (x) { return x.checked; })[0];
			return r ? r.value : 'email';
		}

		function applyMode() {
			var m = MODES[method()];
			label.textContent = m.label;
			contact.type = m.type;
			contact.setAttribute('inputmode', m.mode);
			contact.setAttribute('autocomplete', m.auto);
			contact.placeholder = m.ph;
			contactEr.textContent = m.err;
			hide(contactEr, contact);
		}

		function show(errEl, field) { errEl.hidden = false; field.setAttribute('aria-invalid', 'true'); }
		function hide(errEl, field) { errEl.hidden = true;  field.removeAttribute('aria-invalid'); }

		function validContact(v) {
			v = v.trim();
			if (method() === 'email') { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
			// Australian numbers, typed any which way: count the digits.
			return (v.replace(/\D/g, '').length >= 8);
		}

		radios.forEach(function (r) { r.addEventListener('change', applyMode); });
		name.addEventListener('input', function () { if (name.value.trim()) { hide(nameErr, name); } });
		contact.addEventListener('input', function () { if (validContact(contact.value)) { hide(contactEr, contact); } });
		applyMode();

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var ok = true;

			if (!name.value.trim()) { show(nameErr, name); ok = false; } else { hide(nameErr, name); }
			if (!validContact(contact.value)) { show(contactEr, contact); ok = false; } else { hide(contactEr, contact); }
			if (!ok) { (name.getAttribute('aria-invalid') ? name : contact).focus(); return; }

			var lead = {
				name: name.value.trim(),
				method: method(),
				value: contact.value.trim(),
				note: 'Retreat interest'
			};

			var store = window.RWLeads;
			if (store) { store.addLead(lead); }

			form.hidden = true;
			done.hidden = false;
			doneBody.textContent = 'Thanks ' + lead.name.split(' ')[0] +
				' — we’ll be in touch about retreat dates.';

			var delivered = store && store.endpoint
				? store.deliver(lead)
				: Promise.resolve(false);

			delivered.then(function (sent) {
				if (sent) {
					// The endpoint took it; no need to ask for anything more.
					mailto.hidden = true;
					mailNote.hidden = true;
					return;
				}
				var subject = 'Retreat interest — ' + lead.name;
				var body = 'Name: ' + lead.name + '\n'
					+ (lead.method === 'email' ? 'Email: ' : 'Phone: ') + lead.value + '\n\n'
					+ 'I’d like to hear about upcoming retreats.';
				mailto.href = 'mailto:' + STUDIO_EMAIL
					+ '?subject=' + encodeURIComponent(subject)
					+ '&body=' + encodeURIComponent(body);
			});

			done.setAttribute('tabindex', '-1');
			done.focus();
		});
	});
})();

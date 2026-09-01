/*
 * Refresh Wellbeing - contact form.
 *
 * The markup is WPForms', left over from the WordPress build: an AJAX form
 * posting to a WordPress endpoint that does not exist on a static host. As
 * shipped it could not deliver a single enquiry - it would reload the page and
 * lose whatever had been typed.
 *
 * This takes the submit over. The enquiry is recorded locally (so it shows on
 * /dash) and, if an endpoint is configured in rw-leads.js, POSTed there. With
 * no endpoint it hands the visitor a pre-filled email so the message still
 * reaches the studio rather than vanishing.
 */
(function () {
	'use strict';

	var STUDIO_EMAIL = 'evonnekelly@hotmail.com';

	function ready(fn) {
		if (document.readyState !== 'loading') { fn(); }
		else { document.addEventListener('DOMContentLoaded', fn); }
	}

	function val(form, name) {
		var f = form.querySelector('[name="' + name + '"]');
		return f ? f.value.trim() : '';
	}

	ready(function () {
		var form = document.querySelector('form.wpforms-form');
		if (!form) { return; }

		var panel = document.createElement('div');
		panel.className = 'rw-form__done rw-contact__done';
		panel.hidden = true;
		panel.innerHTML =
			'<h3 class="rw-form__done-title">Thank you</h3>' +
			'<p class="rw-form__done-body"></p>' +
			'<p><a class="rw-form__mailto" href="#">Finish &mdash; send your message</a></p>' +
			'<p class="rw-form__privacy">This opens your email app with everything filled in. ' +
			'One tap to send.</p>';
		form.parentNode.insertBefore(panel, form.nextSibling);

		var body = panel.querySelector('.rw-form__done-body');
		var mailto = panel.querySelector('.rw-form__mailto');
		var note = panel.querySelector('.rw-form__privacy');

		function fail(field, message) {
			var wrap = field.closest('.wpforms-field') || field.parentNode;
			var err = wrap.querySelector('.rw-formerr');
			if (!err) {
				err = document.createElement('p');
				err.className = 'rw-formerr';
				wrap.appendChild(err);
			}
			err.textContent = message;
			field.setAttribute('aria-invalid', 'true');
		}

		function clear(field) {
			var wrap = field.closest('.wpforms-field') || field.parentNode;
			var err = wrap.querySelector('.rw-formerr');
			if (err) { err.remove(); }
			field.removeAttribute('aria-invalid');
		}

		/* Bound to the button's click as well as the form's submit, both in the
		   capture phase. WPForms ships jQuery Validate, which handles the click
		   and can stop a `submit` event ever being dispatched - so a submit-only
		   listener never ran. Capturing the click gets in front of it, and
		   stopImmediatePropagation keeps WPForms' AJAX handler from reaching the
		   dead endpoint. */
		function handle(e) {
			e.preventDefault();
			e.stopImmediatePropagation();

			var first = form.querySelector('[name="wpforms[fields][1][first]"]');
			var email = form.querySelector('[name="wpforms[fields][2]"]');
			var ok = true;

			[first, email].forEach(function (f) { if (f) { clear(f); } });

			if (first && !first.value.trim()) { fail(first, 'Please tell us your name.'); ok = false; }
			if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
				fail(email, 'Please enter a valid email address.'); ok = false;
			}
			if (!ok) {
				var bad = form.querySelector('[aria-invalid="true"]');
				if (bad) { bad.focus(); }
				return;
			}

			var name = (val(form, 'wpforms[fields][1][first]') + ' ' +
			            val(form, 'wpforms[fields][1][last]')).trim();
			var lead = {
				name: name,
				method: 'email',
				value: val(form, 'wpforms[fields][2]'),
				phone: val(form, 'wpforms[fields][4]'),
				message: val(form, 'wpforms[fields][3]'),
				note: 'Contact form'
			};

			var store = window.RWLeads;
			if (store) { store.addLead(lead); }

			form.hidden = true;
			panel.hidden = false;
			body.textContent = 'Thanks ' + (name.split(' ')[0] || 'for getting in touch') +
				' — we’ll get back to you shortly.';

			var delivered = store && store.endpoint ? store.deliver(lead) : Promise.resolve(false);
			delivered.then(function (sent) {
				if (sent) { mailto.hidden = true; note.hidden = true; return; }
				var lines = ['Name: ' + lead.name, 'Email: ' + lead.value];
				if (lead.phone) { lines.push('Phone: ' + lead.phone); }
				if (lead.message) { lines.push('', lead.message); }
				mailto.href = 'mailto:' + STUDIO_EMAIL +
					'?subject=' + encodeURIComponent('Website enquiry — ' + lead.name) +
					'&body=' + encodeURIComponent(lines.join('\n'));
			});

			panel.setAttribute('tabindex', '-1');
			panel.focus();
		}

		form.addEventListener('submit', handle, true);

		var btn = form.querySelector('.wpforms-submit, button[type="submit"], input[type="submit"]');
		if (btn) { btn.addEventListener('click', handle, true); }
	});
})();

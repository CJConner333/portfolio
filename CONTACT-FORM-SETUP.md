# Portfolio Contact Form Setup

The modal contact form posts to `contact.php` in a hidden iframe. The PHP handler verifies Cloudflare Turnstile server-side and emails submissions to `chris@cjconner.us`; the existing portfolio modal displays the result.

## Turnstile configuration

The existing widget's public site key is embedded in `index.html` with the `contact` action. Ensure the widget is configured for `cjconner.us`; add `www.cjconner.us` only if that hostname is used.

Deploy the site files to `/home/users/web/b2321/ipw.revcjcon/public_html/cjconner/`. The handler resolves the secret file at `/home/users/web/b2321/ipw.revcjcon/private/turnstile-cjconner-config.php`, outside the public web root:

```php
<?php
return [
    'secret' => 'your Turnstile secret key',
    'hostnames' => ['cjconner.us'],
];
```

Add `www.cjconner.us` to `hostnames` only if it is enabled in the widget and used by the portfolio. Keep this secret out of the repository. From `/home/users/web/b2321/ipw.revcjcon/public_html/cjconner/contact.php`, `dirname(__DIR__, 2)` resolves to `/home/users/web/b2321/ipw.revcjcon`, then appends `/private/turnstile-cjconner-config.php`. Site asset links are relative so they resolve from the `cjconner` deployment directory, as in `claws`.

## Server requirements

The server must run PHP with cURL enabled and allow outbound HTTPS to `challenges.cloudflare.com`. PHP `mail()` must be enabled and configured to send mail with `chris@cjconner.us` as the authorized sender. A successful `mail()` response means the server accepted the message, not necessarily that it reached the inbox.

Deploy `contact.php` beside `index.html` and `script.js` in `/home/users/web/b2321/ipw.revcjcon/public_html/cjconner/`. To test, submit the form on the production hostname, complete the Turnstile check, and verify that the success message appears and the email arrives. On failure, check the PHP error log.

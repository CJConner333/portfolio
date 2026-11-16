<?php
declare(strict_types=1);

function respond(int $status, array $payload): void
{
    http_response_code($status);

    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    if (strpos($accept, 'text/html') !== false && strpos($accept, 'application/json') === false) {
        header('Content-Type: text/html; charset=utf-8');
        $isSuccess = $status >= 200 && $status < 300;
        $title = $isSuccess ? 'Message sent' : 'Unable to send message';
        $message = $payload['message'] ?? $payload['error'] ?? 'Please try again later.';
        $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeMessage = htmlspecialchars((string) $message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $responseStatus = $isSuccess ? 'success' : 'error';
        echo '<!doctype html><html lang="en" data-contact-status="' . $responseStatus . '">';
        echo '<head><meta charset="utf-8"><title>' . $safeTitle . '</title></head><body>';
        echo '<p data-contact-message>' . $safeMessage . '</p></body></html>';
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Method not allowed.']);
}

foreach (['name', 'email', 'message', 'company', 'cf-turnstile-response'] as $field) {
    if (isset($_POST[$field]) && !is_string($_POST[$field])) {
        respond(400, ['error' => 'Please check the form fields and try again.']);
    }
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$company = trim($_POST['company'] ?? '');
$turnstileToken = trim($_POST['cf-turnstile-response'] ?? '');

if ($company !== '') {
    respond(400, ['error' => 'Unable to submit the form.']);
}

if ($turnstileToken === '' || strlen($turnstileToken) > 2048) {
    respond(400, ['error' => 'Please complete the verification and try again.']);
}

if (
    $name === '' || strlen($name) > 150 || preg_match('/[\r\n]/', $name) ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 ||
    preg_match('/[\r\n]/', $email) ||
    $message === '' || strlen($message) > 5000
) {
    respond(400, ['error' => 'Please check the form fields and try again.']);
}

$turnstileConfigPath = dirname(__DIR__, 2) . '/private/turnstile-cjconner-config.php';
if (!is_file($turnstileConfigPath)) {
    error_log('Portfolio contact form private Turnstile configuration is missing.');
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

try {
    $turnstileConfig = require $turnstileConfigPath;
} catch (Throwable $error) {
    error_log('Portfolio contact form Turnstile configuration could not be loaded: ' . $error->getMessage());
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

if (!is_array($turnstileConfig)) {
    error_log('Portfolio contact form Turnstile configuration is invalid.');
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

$turnstileSecret = $turnstileConfig['secret'] ?? null;
$configuredHostnames = $turnstileConfig['hostnames'] ?? null;
if (
    !is_string($turnstileSecret) || $turnstileSecret === '' ||
    !is_array($configuredHostnames) || $configuredHostnames === []
) {
    error_log('Portfolio contact form Turnstile configuration is missing or invalid.');
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

$turnstileHostnames = [];
foreach ($configuredHostnames as $hostname) {
    if (!is_string($hostname) || trim($hostname) === '') {
        error_log('Portfolio contact form Turnstile hostname configuration is invalid.');
        respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
    }
    $turnstileHostnames[] = strtolower(trim($hostname));
}

if (!function_exists('curl_init')) {
    error_log('Portfolio contact form Turnstile verification requires the PHP cURL extension.');
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

$verificationFields = [
    'secret' => $turnstileSecret,
    'response' => $turnstileToken,
];
if (isset($_SERVER['REMOTE_ADDR']) && is_string($_SERVER['REMOTE_ADDR'])) {
    $remoteIp = filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP);
    if ($remoteIp !== false) {
        $verificationFields['remoteip'] = $remoteIp;
    }
}

$curl = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
if ($curl === false) {
    error_log('Portfolio contact form could not initialize Turnstile verification.');
    respond(503, ['error' => 'We could not verify your submission right now. Please try again later.']);
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($verificationFields),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
]);
$verificationResponse = curl_exec($curl);
$verificationStatus = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$verificationError = curl_error($curl);
curl_close($curl);

if ($verificationResponse === false || $verificationStatus < 200 || $verificationStatus >= 300) {
    error_log('Portfolio contact form Turnstile verification request failed: ' . $verificationError);
    respond(503, ['error' => 'We could not verify your submission right now. Please try again later.']);
}

$verificationResult = json_decode($verificationResponse, true);
if (
    !is_array($verificationResult) ||
    ($verificationResult['success'] ?? false) !== true ||
    ($verificationResult['action'] ?? null) !== 'contact' ||
    !is_string($verificationResult['hostname'] ?? null) ||
    !in_array(strtolower($verificationResult['hostname']), $turnstileHostnames, true)
) {
    respond(400, ['error' => 'Please complete the verification and try again.']);
}

$mailBody = implode("\n", [
    'Name: ' . $name,
    'Email: ' . $email,
    '',
    'Message:',
    $message,
]);
$mailHeaders = implode("\r\n", [
    'From: chris@cjconner.us',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

if (!function_exists('mail')) {
    error_log('Portfolio contact form requires the PHP mail() function.');
    respond(500, ['error' => 'The contact form is not configured correctly. Please try again later.']);
}

$mailError = null;
$mailSent = false;
set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
try {
    $mailSent = mail('chris@cjconner.us', 'Portfolio contact form message', $mailBody, $mailHeaders);
} catch (Throwable $error) {
    $mailError = $error;
} finally {
    restore_error_handler();
}

if ($mailError !== null) {
    error_log('Portfolio contact form mail() error: ' . $mailError->getMessage());
    respond(500, ['error' => 'We could not send your message right now. Please try again later.']);
}
if (!$mailSent) {
    error_log('Portfolio contact form mail() returned false.');
    respond(500, ['error' => 'We could not send your message right now. Please try again later.']);
}

respond(200, ['message' => 'Message sent.']);

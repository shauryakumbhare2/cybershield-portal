Local PII Sanitizer

A 100% client-side, privacy-first browser utility that detects, classifies, highlights, and redacts Personally Identifiable Information (PII) from pasted text, .txt logs, and .csv files—without ever sending user data over the network.

Privacy Design
Zero network requests: No backend, external APIs, analytics, CDN scripts, or remote fonts.
Strict Content Security Policy: Production builds inject:
text
default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self' blob:; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none';
connect-src 'none' enforces at the browser level that fetch, XMLHttpRequest, WebSocket, and EventSource cannot make outbound connections.
Zero persistent client storage: User text, filenames, and detections live strictly in React memory and are never written to localStorage, sessionStorage, cookies, or IndexedDB.
XSS-safe rendering: User content is rendered exclusively via React text nodes—innerHTML and dangerouslySetInnerHTML are never used.
Non-blocking Web Worker: Detection runs in a dedicated Web Worker (src/worker/detection.worker.ts) so large logs and CSV files do not freeze the UI thread.
Setup & Development
Prerequisites
Node.js 20+ and npm 10+
Commands
bash
# Install dependencies
npm install
# Start local dev server
npm run dev
# Run unit tests (Vitest)
npm test
# Type-check and build production bundle
npm run build
# Preview production build locally
npm run preview
Deployment (Static Site)

The production bundle (dist/) is a pure static site with relative asset paths (base: './' in vite.config.ts). You can host dist/ on any static host (GitHub Pages, Cloudflare Pages, Netlify, Amazon S3, Nginx, or even an air-gapped intranet server).

Ensure your web server serves .js and .mjs files with application/javascript or text/javascript MIME types so the module Web Worker loads cleanly.

Detection Rules & Accuracy

All detectors live as pure TypeScript functions in src/engine/ and return { type, value, start, end }.

Email: Standard addresses including subdomains and + addressing (e.g., alice+billing@sub.example.com). Rejects consecutive dots, missing TLDs, and invalid label hyphens.
Credit Card: 13–19 digits (plain or space/hyphen-separated) that must pass the Luhn algorithm.
Any card-shaped 13–19 digit number that fails Luhn is excluded from card detection and blocked from matching any other PII type (e.g., Aadhaar or phone substrings).
Aadhaar: 12 digits starting with 2–9, plain or 4-4-4 with spaces or hyphens.
Includes an optional Strict Aadhaar (Verhoeff checksum) toggle (off by default).
PAN: 5 letters, 4 digits, 1 letter, case-insensitive, where the 4th letter is one of A B C F G H J L P T.
IP Address:
IPv4: Four octets 0–255 without leading zeros.
IPv6: Full 8-group, compressed (::), loopback (::1), and IPv4-mapped (::ffff:192.0.2.128) forms.
Phone:
Indian mobiles: Optional +91 or 0 prefix, 10-digit subscriber number starting with 6–9 (plain, spaced, or hyphenated).
International numbers: + country code followed by 7–15 total E.164 digits with spaces, hyphens, or parenthesized area codes.
Overlap & Boundary Resolution
Boundaries: Lookarounds prevent partial matches inside longer numbers, order IDs (ORD-2026-8849201), version strings (v2.14.0.1), or malformed tokens.
Overlap priority: email > credit card > Aadhaar > PAN > IP > phone. A span is never redacted twice.
Redaction Modes
Full Mask: Replaces every detected span with [REDACTED].
Partial Mask:
Email: j***@example.com
Phone: XXXXXX1234
IPv4: 192.168.XXX.XXX · IPv6: keeps first two groups (2001:db8:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX)
PAN: XXXXXX234F
Aadhaar: XXXX-XXXX-1234
Card: XXXX-XXXX-XXXX-1234
Consistent Pseudonymization: Assigns USER_01, PHONE_01, IP_01, PAN_01, AADHAAR_01, CARD_01 in order of first appearance (reset per document). Values are normalized before matching (lowercase emails/PAN, canonical expanded IPv6, stripped separators, and Indian +91 / 0 / bare 10-digit numbers mapped to the same key).
Known Limitations
Pattern matching only: Regular expressions and checksums cannot reliably detect unstructured PII such as person names, street addresses, medical diagnoses, free-form account notes, or arbitrary organization names.
No guarantee of complete redaction: Pattern matching cannot guarantee 100% redaction across arbitrary text. Always review the side-by-side Audit View before sharing sensitive documents externally.
Ambiguous numeric formats: Arbitrary 10-digit numbers starting with 6–9 or 12-digit numbers starting with 2–9 in unlabelled text may be flagged as phone or Aadhaar numbers unless Strict Aadhaar (Verhoeff) or type toggles are used.
Client-side memory: Files up to 5 MB are supported and processed in browser memory; very large inputs depend on available device RAM.

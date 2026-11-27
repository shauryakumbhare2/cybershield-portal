export const NOISY_SAMPLE_TEXT = `=== SERVER LOGS ===
[2026-11-27T10:25:47Z] INFO gateway v2.14.0.1 auth ok user=Alice.Sharma+billing@example.com ip=192.0.2.15
[2026-11-27 10:26:03] WARN proxy=2001:db8:85a3::8a2e:370:7334 upstream=198.51.100.42 invalid_ip=999.10.1.1
[2026-11-27T10:26:19Z] DEBUG retry ipv6=2001:0db8:85a3:0000:0000:8a2e:0370:7334 order=ORD-2026-8849201 build=1.2.3
[2026-11-27T10:27:01Z] ERROR rejected malformed=bad..user@example.com missing=user@localhost dash=user@-bad.example.com

=== SUPPORT TICKET ===
Ticket #SUP-40921 | From: alice.sharma+billing@example.com | Callback: +91 98765-43210
Hi team, I tried paying with card 4111 1111 1111 1111 (retried as 4111111111111111) for invoice INV-998877665544.
Earlier I mistyped 4111 1111 1111 1112 and it failed. Please reach me on 09876543210 or +1-202-555-0148.
Assigned agent: support.desk@mail.example.org | Client IP: 203.0.113.7

=== RESUME SNIPPET ===
Candidate: Aarav Mehta | Email: aarav.mehta@example.net | Mobile: 98765 43210
KYC Ref - PAN: ABCPK1234F (lowercase copy: abcpk1234f) | Aadhaar: 2345 6789 0124
Tooling: node-24.19.0, client-sdk v2.14.0.1

=== CLINICAL NOTE ===
Clinic Intake 2026-11-27 14:32:09 | Attending: dr.meera@clinic.example.com
Patient ID: PT-77410 | Primary Aadhaar: 234567890124 | Guardian Aadhaar: 9123-4567-8905
Billing Entity PAN: AAACF9876L | Invalid PAN ref: ABCDX1234F | Incomplete email: @example.com`;

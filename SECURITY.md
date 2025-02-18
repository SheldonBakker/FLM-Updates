# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.6.x   | :white_check_mark: |
| < 0.6.0 | :x:                |

## Security Features

The application implements several security measures:

- Content Security Policy (CSP) for renderer process
- Context Isolation enabled
- Node Integration disabled
- Strict TypeScript checking
- Hardened runtime for windows
- Admin-only access control
- Secure Database authentication

## Reporting a Vulnerability

We take security vulnerabilities seriously. To report a security issue, please follow these steps:

1. **Do Not** open a public GitHub issue
2. Email your findings to [sheldon@gunlicence.co.za](mailto:sheldon@gunlicence.co.za)
3. Include detailed steps to reproduce the vulnerability
4. Allow up to 48 hours for an initial response

## Security Update Process

- Security patches will be released as soon as possible
- Users will be notified through the application's update system
- Critical updates will be marked for immediate installation

## Development Security Guidelines

- All dependencies are regularly audited
- Code changes require review before merging
- Production builds are signed and verified
- Environment variables are properly secured

## License and Usage Restrictions

This application is protected under a custom license that restricts modification and distribution rights. For more details, see the LICENSE file.

## Contact

For security-related inquiries, contact:

- Sheldon Bakker
- [sheldon@gunlicence.co.za](mailto:sheldon@gunlicence.co.za)

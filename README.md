# Firearm Licence Management System (FLMS)

A modern desktop application built with Electron, React, and TypeScript for managing firearm licenses. Designed with security and efficiency in mind, fLMS provides a robust solution for license tracking and client management.

## Features

- **Secure Client Management**: Store and manage client information with strict access control
- **License Tracking**: Track firearm licenses with expiration notifications
- **Auto-Updates**: Built-in update system with manual control
- **Cross-Platform**: Available for Windows, macOS, and Linux
- **Database Integration**: Secure connection to Postgres SQL

## Technology Stack

- **Frontend**: React with TailwindCSS
- **Backend**: Electron with TypeScript, Python, Node.js
- **Database**: Postgres SQL
- **Build Tools**: Electron Vite
- **Update System**: Electron Updater

## Installation

### Prerequisites

- Node.js v18+
- npm v9+

### Development Setup

Build for Windows
npm run build:win

Build for macOS
npm run build:mac

Build for Linux
npm run build:linux

## Security Features

- Content Security Policy (CSP) enforced
- Context Isolation enabled
- Node Integration disabled
- Hardened runtime for Windows
- Strict TypeScript checking
- Admin-only access control

## Update System

The application includes a controlled update system that:

- Allows manual update checks
- Provides update notifications
- Gives users control over download and installation
- Prevents automatic updates during critical operations

## License

This project is protected under a custom license that restricts modification and distribution rights. See [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a new branch
3. Submit a pull request

## Support

For support or security-related inquiries, contact:

- Sheldon Bakker
- [acum3n@protonmail.com](mailto:acum3n@protonmail.com)

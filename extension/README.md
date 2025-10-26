# NullPass Browser Extension

A stateless password manager browser extension that uses the existing NullPass bash script via WebAssembly.

## Features

- **Auto-detection**: Automatically detects username/password fields on web pages
- **One-click generation**: Generate strong passwords with customizable options
- **Profile management**: Save login profiles for quick access
- **WASM integration**: Uses the existing NullPass bash script compiled to WebAssembly
- **No cloud storage**: All password generation happens locally
- **Cross-platform**: Works on Chrome, Firefox, and Edge

## Installation

### Development Installation

1. Clone this repository:
```bash
git clone https://github.com/metacritical/nullpass.git
cd nullpass/extension
```

2. Load the extension in your browser:

**Chrome/Edge:**
- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension` folder

**Firefox:**
- Open `about:debugging`
- Click "This Firefox"
- Click "Load Temporary Add-on"
- Select `manifest.json`

### Production Build

For production, you'll need to compile the bash script to WebAssembly:

```bash
# Install required tools
npm install -g wasmer-cli

# Compile bash to WASM
wasmer compile bash.wasm -o bash.wasm

# Or use a pre-compiled bash WASM binary
```

## Usage

### Auto-fill on Websites

1. Navigate to any login page
2. NullPass will automatically detect password fields
3. Click the "⚡ Generate" button to create a new password
4. Click the "🔑 Autofill" button to fill both username and password

### Using the Popup

1. Click the NullPass icon in your toolbar (or press Ctrl+Shift+N)
2. Enter your master password
3. Customize options (length, character types, exclusions)
4. Click "Generate Password"
5. Copy the password or save the profile for future use

### Profile Management

- **Save Profile**: After generating a password, click "Save Profile" to store the settings
- **Load Profile**: In the Profiles tab, click "Load" to restore saved settings
- **Delete Profile**: Remove unwanted profiles from the Profiles tab

## Development

### Project Structure

```
extension/
├── manifest.json          # Extension manifest
├── content.js            # Content script for field detection
├── content.css           # Styles for injected UI
├── background.js         # Service worker for storage and WASM
├── popup.html            # Popup interface
├── popup.js              # Popup logic
├── popup.css             # Popup styles
├── nullpass              # Original bash script
├── bash.wasm             # Bash compiled to WebAssembly (to be added)
└── icons/                # Extension icons
```

### Key Components

1. **Content Script**: Detects password fields and injects UI
2. **Background Script**: Handles storage, WASM execution, and password generation
3. **Popup**: Main interface for manual password generation and profile management
4. **WASM Module**: Executes the original nullpass bash script

### Building WASM

To compile the bash script to WebAssembly:

```bash
# Using Wasmer
wasmer compile /bin/bash -o bash.wasm

# Or using wasm32-wasi target
clang --target=wasm32-wasi -nostartfiles -o bash.wasm bash.c
```

## Security

- **Master password**: Never stored or transmitted
- **Local generation**: All password generation happens in the browser
- **Sandboxed execution**: WASM runs in a secure sandbox
- **No network calls**: Extension works entirely offline

## Compatibility

- **Chrome**: 88+ (Manifest V3)
- **Firefox**: 109+ (Manifest V3)
- **Edge**: 88+ (Manifest V3)
- **Safari**: Not yet supported (needs Manifest V3 support)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

GNU GPLv3 - same as the original NullPass project.

## Acknowledgments

Based on the original [NullPass](https://github.com/metacritical/nullpass) project and inspired by [LessPass](https://github.com/lesspass/lesspass).
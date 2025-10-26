#!/bin/bash

# Simple build script for NullPass extension

echo "🔐 Building NullPass Extension..."

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Please run this script from the extension directory."
    exit 1
fi

echo "✅ Extension files ready for testing"
echo ""
echo "📋 To test the extension:"
echo "   Chrome: chrome://extensions/ -> Enable Developer mode -> Load unpacked -> select this directory"
echo "   Firefox: about:debugging -> This Firefox -> Load Temporary Add-on -> select manifest.json"
echo ""
echo "🚀 The extension uses JavaScript implementation of NullPass core logic"
echo "   No WASM compilation needed - it's self-contained!"
echo ""
echo "🔧 Features included:"
echo "   ✅ Auto-detect password fields on web pages"
echo "   ✅ Generate passwords using NullPass algorithm (PBKDF2-HMAC-SHA256)"
echo "   ✅ Save/load profiles for different sites"
echo "   ✅ Modern UI with dark theme support"
echo "   ✅ Cross-platform compatibility"

echo ""
echo "🎉 Extension is ready to load!"
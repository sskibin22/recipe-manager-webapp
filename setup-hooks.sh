#!/bin/bash
# Setup script to configure git hooks
# Run this after cloning the repository: ./setup-hooks.sh

HOOKS_DIR=".githooks"
GIT_HOOKS_DIR=".git/hooks"

echo "Setting up git hooks..."

# Check if .githooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ Error: $HOOKS_DIR directory not found"
    exit 1
fi

# Configure git to use .githooks directory
git config core.hooksPath "$HOOKS_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Git hooks configured successfully!"
    echo ""
    echo "The following hooks are now active:"
    ls -1 "$HOOKS_DIR"
    echo ""
    echo "These hooks will help prevent committing sensitive files like .env.local"
else
    echo "❌ Failed to configure git hooks"
    exit 1
fi

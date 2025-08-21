#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="yuis-ice/videos-to-tomontage-thumbnails"
INSTALL_DIR="$HOME/.local/bin"
TOOL_NAME="samples-thumbnail-generator"

echo -e "${BLUE}📦 Installing Video Thumbnail Generator...${NC}"

# Check dependencies
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ Error: $1 is required but not installed${NC}"
        echo -e "${YELLOW}Please install $1 and try again${NC}"
        exit 1
    fi
}

echo -e "${BLUE}🔍 Checking dependencies...${NC}"
check_dependency "node"
check_dependency "npm"
check_dependency "ffmpeg"
check_dependency "git"

# Create install directory
mkdir -p "$INSTALL_DIR"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

cd "$TEMP_DIR"

echo -e "${BLUE}📥 Downloading from GitHub...${NC}"
git clone --depth 1 "https://github.com/$REPO.git" .

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}📋 Creating executable script...${NC}"
cat > "$INSTALL_DIR/$TOOL_NAME" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
npx tsx "$SCRIPT_DIR/samples-thumbnail-generator-files/src/samples-thumbnail-generator.ts" "$@"
EOF

chmod +x "$INSTALL_DIR/$TOOL_NAME"

# Copy files to install directory
TOOL_DIR="$INSTALL_DIR/samples-thumbnail-generator-files"
mkdir -p "$TOOL_DIR"
cp -r src "$TOOL_DIR/"
cp -r node_modules "$TOOL_DIR/"
cp package.json "$TOOL_DIR/" 2>/dev/null || echo '{"dependencies":{"tsx":"*","chalk":"*","commander":"*"}}' > "$TOOL_DIR/package.json"

echo -e "${GREEN}✅ Installation completed!${NC}"
echo
echo -e "${YELLOW}📍 Tool installed to: ${NC}$INSTALL_DIR/$TOOL_NAME"
echo

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: $INSTALL_DIR is not in your PATH${NC}"
    echo -e "${BLUE}Add this line to your ~/.bashrc or ~/.zshrc:${NC}"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo
    echo -e "${BLUE}Then reload your shell or run:${NC}"
    echo "source ~/.bashrc"
    echo
fi

echo -e "${GREEN}🚀 Usage:${NC}"
echo "  $TOOL_NAME --help"
echo "  $TOOL_NAME -d /path/to/videos --verbose"
echo "  $TOOL_NAME --montage-interval-seconds 15 --tile 4x4"
echo
echo -e "${BLUE}📖 For more info: https://github.com/$REPO${NC}"
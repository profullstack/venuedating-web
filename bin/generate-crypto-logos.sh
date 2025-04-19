#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if librsvg-bin is installed
if ! command -v rsvg-convert &> /dev/null; then
    echo -e "${RED}Error: librsvg-bin is not installed. Please install it first:${NC}"
    echo -e "  sudo apt-get install librsvg2-bin"
    exit 1
fi

# Create directory for crypto logos
ICONS_DIR="public/images/crypto"
mkdir -p "$ICONS_DIR"

# Generate Bitcoin logo
echo -e "${YELLOW}Generating Bitcoin logo...${NC}"
cat > "$ICONS_DIR/bitcoin.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F7931A">
  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.5 17.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c1.5 0 2.7.7 3.5 1.8l1.3-1.3c-1.2-1.4-2.9-2.3-4.8-2.3-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5c2.1 0 4-1 5.2-2.6l-1.3-1.3c-.8 1.2-2.1 1.9-3.7 1.9z"/>
  <path d="M14.5 10.5h-2v-2h-1v2h-1v1h1v2h-1v1h1v2h1v-2h2c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5zm0 3h-2v-2h2c.3 0 .5.2.5.5s-.2.5-.5.5zm0-3h-2v-2h2c.3 0 .5.2.5.5s-.2.5-.5.5z"/>
</svg>
EOF

# Generate Ethereum logo
echo -e "${YELLOW}Generating Ethereum logo...${NC}"
cat > "$ICONS_DIR/ethereum.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#627EEA">
  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4l5 8-5 3-5-3 5-8zm0 16l-5-7 5 3 5-3-5 7z"/>
</svg>
EOF

# Generate Solana logo
echo -e "${YELLOW}Generating Solana logo...${NC}"
cat > "$ICONS_DIR/solana.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="#000000"/>
  <path d="M6 14.5l2-2h10l-2 2H6zm0-5l2-2h10l-2 2H6zm12 2.5l-2 2H6l2-2h10z" fill="#14F195"/>
</svg>
EOF

# Generate USDC logo
echo -e "${YELLOW}Generating USDC logo...${NC}"
cat > "$ICONS_DIR/usdc.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="#2775CA"/>
  <path d="M12 4.5v1.2c-2.4.3-4.3 2.3-4.3 4.8 0 2.5 1.9 4.5 4.3 4.8v1.2h1v-1.2c2.4-.3 4.3-2.3 4.3-4.8 0-2.5-1.9-4.5-4.3-4.8V4.5h-1zm0 2.2v7.6c-1.8-.3-3.3-1.8-3.3-3.8s1.5-3.5 3.3-3.8zm1 0c1.8.3 3.3 1.8 3.3 3.8s-1.5 3.5-3.3 3.8V6.7z" fill="white"/>
</svg>
EOF

# Convert SVGs to PNGs
echo -e "${YELLOW}Converting SVGs to PNGs...${NC}"
for svg in "$ICONS_DIR"/*.svg; do
    base=$(basename "$svg" .svg)
    rsvg-convert -w 192 -h 192 "$svg" -o "$ICONS_DIR/$base.png"
    echo -e "${GREEN}Generated $ICONS_DIR/$base.png${NC}"
done

echo -e "${GREEN}Crypto logos generated successfully!${NC}"
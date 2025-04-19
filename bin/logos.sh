#!/bin/zsh

# Paths and settings
INPUT="./public/icons/logo.svg"
OUTPUT_DIR="./public/icons"
BASENAME="favicon"
SIZE=512

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# 1. Pad logo to square and save as favicon.svg
convert -background none "$INPUT" -gravity center -extent ${SIZE}x${SIZE} "$OUTPUT_DIR/${BASENAME}.svg"

# 2. Create light and dark variants by inverting fill/stroke
sed 's/fill="#000000"/fill="#ffffff"/Ig; s/stroke="#000000"/stroke="#ffffff"/Ig' "$OUTPUT_DIR/${BASENAME}.svg" > "$OUTPUT_DIR/${BASENAME}.light.svg"
sed 's/fill="#ffffff"/fill="#000000"/Ig; s/stroke="#ffffff"/stroke="#000000"/Ig' "$OUTPUT_DIR/${BASENAME}.svg" > "$OUTPUT_DIR/${BASENAME}.dark.svg"

# 3. Generate PNGs using rsvg-convert
for variant in "" ".light" ".dark"; do
  SVG="$OUTPUT_DIR/${BASENAME}${variant}.svg"
  PNG="$OUTPUT_DIR/${BASENAME}${variant}.png"
  if [[ -f "$SVG" ]]; then
    rsvg-convert -w $SIZE -h $SIZE "$SVG" -o "$PNG"
  else
    echo "❌ Missing $SVG, skipping..."
  fi
done

# 4. Generate .ico from light PNG if it exists
LIGHT_PNG="$OUTPUT_DIR/${BASENAME}.light.png"
ICO="$OUTPUT_DIR/${BASENAME}.ico"

if [[ -f "$LIGHT_PNG" ]]; then
  convert "$LIGHT_PNG" -define icon:auto-resize=64,48,32,16 "$ICO"
else
  echo "❌ Cannot generate favicon.ico — missing $LIGHT_PNG"
fi

echo "✅ Favicons generated in $OUTPUT_DIR"

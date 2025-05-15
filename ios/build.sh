#!/bin/bash

# Build script for PDF Converter iOS app

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building PDF Converter iOS App...${NC}"

# Check if we're in the right directory
if [ ! -d "PDFConverter" ]; then
  echo -e "${RED}Error: PDFConverter directory not found!${NC}"
  echo -e "${YELLOW}Make sure you're running this script from the ios directory.${NC}"
  exit 1
fi

# Check if xcodebuild is available
if ! command -v xcodebuild &> /dev/null; then
  echo -e "${RED}Error: xcodebuild command not found!${NC}"
  echo -e "${YELLOW}Make sure Xcode is installed and command line tools are set up.${NC}"
  echo -e "${YELLOW}Run: xcode-select --install${NC}"
  exit 1
fi

# Navigate to the project directory
cd PDFConverter

# Get available simulators
echo -e "${YELLOW}Available iOS Simulators:${NC}"
xcrun simctl list devices available | grep -E 'iPhone|iPad' | grep -v unavailable | head -5

# Clean the project
echo -e "\n${YELLOW}Cleaning project...${NC}"
xcodebuild clean -scheme PDFConverter -sdk iphonesimulator

# Build for simulator
echo -e "${YELLOW}Building for iOS Simulator...${NC}"
xcodebuild -scheme PDFConverter -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 14,OS=latest' build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Build successful!${NC}"
  
  echo -e "\n${YELLOW}To run on a simulator:${NC}"
  echo -e "1. Open Xcode"
  echo -e "2. Open PDFConverter.xcodeproj"
  echo -e "3. Select a simulator from the scheme dropdown"
  echo -e "4. Click the Run button or press Cmd+R"
  
  echo -e "\n${YELLOW}To build for a physical device:${NC}"
  echo -e "xcodebuild -scheme PDFConverter -sdk iphoneos -configuration Release build"
else
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi

# Provide instructions for creating an IPA
echo -e "\n${YELLOW}To create an IPA for distribution:${NC}"
echo -e "1. Create an exportOptions.plist file with your team ID and provisioning profile"
echo -e "2. Run the following commands:"
echo -e "   xcodebuild -scheme PDFConverter -sdk iphoneos -configuration Release archive -archivePath ./build/PDFConverter.xcarchive"
echo -e "   xcodebuild -exportArchive -archivePath ./build/PDFConverter.xcarchive -exportOptionsPlist exportOptions.plist -exportPath ./build"
#!/bin/bash

#####################################################
# 4Word Import Path Updater
# Automatically fixes all import paths after reorganization
#####################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
MODIFIED_FILES=0
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   4Word Import Path Updater v1.0      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create backup
create_backup() {
    print_info "Creating backup in $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup all JS files
    find src/js -name "*.js" -type f | while read -r file; do
        backup_path="$BACKUP_DIR/${file#src/js/}"
        mkdir -p "$(dirname "$backup_path")"
        cp "$file" "$backup_path"
    done
    
    print_success "Backup created"
}

# Restore from backup
restore_backup() {
    if [ -d "$BACKUP_DIR" ]; then
        print_warning "Restoring from backup..."
        cp -r "$BACKUP_DIR"/* src/js/
        print_success "Restored from backup"
    fi
}

# Update imports in a file
update_file() {
    local file="$1"
    local modified=false
    
    # Create temp file
    local temp_file="${file}.tmp"
    cp "$file" "$temp_file"
    
    # Get file's directory for calculating relative paths
    local file_dir=$(dirname "$file")
    local relative_to_js=""
    
    # Calculate how many levels deep we are from src/js/
    case "$file_dir" in
        */components)
            relative_to_js=".."
            ;;
        */services)
            relative_to_js=".."
            ;;
        */utils)
            relative_to_js=".."
            ;;
        */state)
            relative_to_js=".."
            ;;
        */js)
            relative_to_js="."
            ;;
        *)
            relative_to_js=".."
            ;;
    esac
    
    # Pattern replacements
    local changes_made=0
    
    # 1. Remove CryptoJS imports
    if grep -q "import.*crypto-js\|require.*crypto-js\|from 'crypto-js'\|from \"crypto-js\"" "$temp_file"; then
        print_warning "  Removing CryptoJS imports from $(basename $file)"
        sed -i.bak "/import.*crypto-js/d" "$temp_file"
        sed -i.bak "/require.*crypto-js/d" "$temp_file"
        sed -i.bak "/from ['\"]crypto-js['\"]/d" "$temp_file"
        rm -f "${temp_file}.bak"
        ((changes_made++))
    fi
    
    # 2. Fix crypto/webCrypto imports based on location
    if grep -q "webCrypto" "$temp_file"; then
        case "$file_dir" in
            */components)
                sed -i.bak "s|from ['\"].*crypto/webCrypto\\.js['\"]|from '../crypto/webCrypto.js'|g" "$temp_file"
                sed -i.bak "s|import(['\"].*crypto/webCrypto\\.js['\"])|import('../crypto/webCrypto.js')|g" "$temp_file"
                ;;
            */services)
                sed -i.bak "s|from ['\"].*crypto/webCrypto\\.js['\"]|from '../crypto/webCrypto.js'|g" "$temp_file"
                sed -i.bak "s|import(['\"].*crypto/webCrypto\\.js['\"])|import('../crypto/webCrypto.js')|g" "$temp_file"
                ;;
            */utils)
                sed -i.bak "s|from ['\"].*crypto/webCrypto\\.js['\"]|from '../crypto/webCrypto.js'|g" "$temp_file"
                sed -i.bak "s|import(['\"].*crypto/webCrypto\\.js['\"])|import('../crypto/webCrypto.js')|g" "$temp_file"
                ;;
            */crypto)
                # Already in crypto folder, use relative
                sed -i.bak "s|from ['\"].*crypto/webCrypto\\.js['\"]|from './webCrypto.js'|g" "$temp_file"
                ;;
        esac
        rm -f "${temp_file}.bak"
        ((changes_made++))
    fi
    
    # 3. Fix steganography imports
    if grep -q "steganography\|stego" "$temp_file" && ! grep -q "import.*steganography" "$temp_file"; then
        case "$file_dir" in
            */components|*/services)
                # Add import if it uses stego but doesn't import it
                if grep -q "stego\\.embed\|stego\\.extract" "$temp_file"; then
                    sed -i.bak "1s|^|import stego from '../crypto/steganography.js';\n|" "$temp_file"
                    ((changes_made++))
                fi
                ;;
        esac
        rm -f "${temp_file}.bak"
    fi
    
    # 4. Fix storage/indexedDB imports
    if grep -q "indexedDB\|storage\\.save\|storage\\.get" "$temp_file" && ! grep -q "import.*storage.*indexedDB" "$temp_file"; then
        case "$file_dir" in
            */components|*/services)
                sed -i.bak "1s|^|import storage from '../storage/indexedDB.js';\n|" "$temp_file"
                ((changes_made++))
                ;;
        esac
        rm -f "${temp_file}.bak"
    fi
    
    # 5. Fix validation imports
    if grep -q "Validator\\..*\|sanitize\|validateAddress" "$temp_file" && ! grep -q "import.*validation" "$temp_file"; then
        case "$file_dir" in
            */components|*/services)
                sed -i.bak "1s|^|import { Validator } from '../utils/validation.js';\n|" "$temp_file"
                ((changes_made++))
                ;;
        esac
        rm -f "${temp_file}.bak"
    fi
    
    # 6. Fix encryption service imports (if using old patterns)
    sed -i.bak "s|from ['\"]\.\.\/services\/encryption\\.js['\"]|from '../services/encryption.js'|g" "$temp_file"
    sed -i.bak "s|from ['\"]\.\/encryption\\.js['\"]|from './encryption.js'|g" "$temp_file"
    rm -f "${temp_file}.bak"
    
    # 7. Normalize all import extensions (ensure .js)
    sed -i.bak "s|from '\(.*\)'\([^.js]\)|from '\1.js'\2|g" "$temp_file"
    sed -i.bak "s|from \"\(.*\)\"\([^.js]\)|from \"\1.js\"\2|g" "$temp_file"
    rm -f "${temp_file}.bak"
    
    # Check if file actually changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        modified=true
        ((MODIFIED_FILES++))
        print_success "  Updated: ${file#src/js/} (${changes_made} changes)"
    else
        rm "$temp_file"
    fi
    
    ((TOTAL_FILES++))
}

# Main execution
main() {
    print_info "Starting import path updates..."
    echo ""
    
    # Check if src/js exists
    if [ ! -d "src/js" ]; then
        print_error "src/js directory not found!"
        print_info "Please run this script from the project root (~/www3/4word)"
        exit 1
    fi
    
    # Create backup
    create_backup
    echo ""
    
    # Find and update all JS files
    print_info "Scanning JavaScript files..."
    echo ""
    
    # Update files in specific order
    local dirs=(
        "src/js/crypto"
        "src/js/storage"
        "src/js/utils"
        "src/js/services"
        "src/js/components"
        "src/js/state"
        "src/js"
    )
    
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_info "Processing: $dir"
            find "$dir" -maxdepth 1 -name "*.js" -type f | while read -r file; do
                update_file "$file"
            done
            echo ""
        fi
    done
    
    # Summary
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    print_success "Import path update complete!"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo "  Total files scanned: $TOTAL_FILES"
    echo "  Files modified: $MODIFIED_FILES"
    echo "  Backup location: $BACKUP_DIR"
    echo ""
    
    if [ $MODIFIED_FILES -gt 0 ]; then
        print_warning "Please review the changes and test your application."
        print_info "To restore backup: cp -r $BACKUP_DIR/* src/js/"
    else
        print_info "No files needed updating."
    fi
}

# Trap errors
trap 'print_error "An error occurred. Restoring backup..."; restore_backup; exit 1' ERR

# Run main function
main

exit 0

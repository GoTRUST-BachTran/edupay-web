#!/bin/bash
# Sync engine files from tools/template-converter/src/ to web/src/engine/
# Run this after making changes to the CLI engine code.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_SRC="$SCRIPT_DIR/../tools/template-converter/src"
ENGINE_DST="$SCRIPT_DIR/src/engine"

for dir in config mapper parser utils writer; do
  mkdir -p "$ENGINE_DST/$dir"
done

# Copy all engine files (excluding index.js and report-printer.js which are CLI-only)
cp "$ENGINE_SRC/config/services.js" "$ENGINE_DST/config/"
cp "$ENGINE_SRC/mapper/template-loader.js" "$ENGINE_DST/mapper/"
cp "$ENGINE_SRC/mapper/record-mapper.js" "$ENGINE_DST/mapper/"
cp "$ENGINE_SRC/mapper/validator.js" "$ENGINE_DST/mapper/"
cp "$ENGINE_SRC/parser/school-parser.js" "$ENGINE_DST/parser/"
cp "$ENGINE_SRC/parser/header-detector.js" "$ENGINE_DST/parser/"
cp "$ENGINE_SRC/parser/column-mapper.js" "$ENGINE_DST/parser/"
cp "$ENGINE_SRC/parser/data-extractor.js" "$ENGINE_DST/parser/"
cp "$ENGINE_SRC/utils/excel-helpers.js" "$ENGINE_DST/utils/"
cp "$ENGINE_SRC/utils/fuzzy-match.js" "$ENGINE_DST/utils/"
cp "$ENGINE_SRC/utils/money-parser.js" "$ENGINE_DST/utils/"
cp "$ENGINE_SRC/writer/output-writer.js" "$ENGINE_DST/writer/"

# Fix imports for bundler (default → namespace import)
if [[ "$OSTYPE" == "darwin"* ]]; then
  find "$ENGINE_DST" -name "*.js" -exec sed -i '' "s/import XLSX from 'xlsx'/import * as XLSX from 'xlsx'/g" {} +
else
  find "$ENGINE_DST" -name "*.js" -exec sed -i "s/import XLSX from 'xlsx'/import * as XLSX from 'xlsx'/g" {} +
fi

echo "Engine synced successfully."

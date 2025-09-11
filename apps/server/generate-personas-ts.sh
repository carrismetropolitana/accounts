#!/bin/bash

# Path to the personas folder
PERSONAS_DIR="/Users/brunocastelo/Developer/carrismetropolitana/accounts/apps/server/public/personas"
OUTPUT_FILE="$PERSONAS_DIR/personas.ts"

# Start the TS file
echo "export const personas = [" > "$OUTPUT_FILE"

# Loop through all PNG files
for file in "$PERSONAS_DIR"/*.png; do
  filename=$(basename "$file")         # full filename with extension
  id="${filename%.png}"                # remove .png
  echo "	{" >> "$OUTPUT_FILE"
  echo "		id: '$id'," >> "$OUTPUT_FILE"
  echo "		url: '$filename'," >> "$OUTPUT_FILE"
  echo "	}," >> "$OUTPUT_FILE"
done

# Close array
echo "]" >> "$OUTPUT_FILE"
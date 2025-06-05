#!/bin/bash

# === CONFIGURATION ===
LOG_DIR="logs"
SANITIZED_FILE=".env.sanitized"
METADATA_FILE="$LOG_DIR/metadata.log"
VALID_VAR_REGEX='^[A-Z_][A-Z0-9_]*=[^[:space:]]+$'
INVALID_KEYS_REGEX='^(PASSWORD|SECRET|TOKEN|.*PATH|.*EMAIL|.*LEVEL)='

# === SETUP LOG DIRECTORY AND MAINTAINER USER ===
setup_logging_dir() {
    mkdir -p "$LOG_DIR"
    if ! id maintainer &>/dev/null; then
        sudo useradd -M -r maintainer
    fi
    sudo chown maintainer:maintainer "$LOG_DIR"
    sudo chmod 700 "$LOG_DIR"
}

# === FIND .env FILES ===
find_env_files() {
    local search_dir="$1"
    find "$search_dir" -type f -iname "*.env" -o -iname "*.env.example"
}

# === VALIDATE AND SANITIZE FILE ===
sanitize_file() {
    local file="$1"
    local valid_lines=()
    local invalid_lines=()
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        stripped_line="$(echo "$line" | sed 's/#.*//g' | xargs)"
        if [[ -z "$stripped_line" ]]; then continue; fi

        if [[ "$stripped_line" =~ $VALID_VAR_REGEX ]] &&
           ! [[ "$stripped_line" =~ $INVALID_KEYS_REGEX ]] &&
           ! [[ "$stripped_line" == export* ]]; then
            valid_lines+=("$stripped_line")
        else
            invalid_lines+=("$line")
        fi
    done < "$file"

    printf "%s\n" "${valid_lines[@]}" >> "$SANITIZED_FILE"
    log_metadata "$file" "${#valid_lines[@]}" "${#invalid_lines[@]}" "${invalid_lines[@]}"
}

# === LOG METADATA ===
log_metadata() {
    local file="$1"
    local valid_count="$2"
    local invalid_count="$3"
    shift 3
    local rejected=("$@")

    local file_stat
    file_stat=$(stat "$file")
    local acl
    acl=$(getfacl --absolute-names "$file" 2>/dev/null | grep -v '^#')

    {
        echo "File: $file"
        echo "User: $(stat -c "UID=%u (%U), GID=%g (%G)" "$file")"
        echo "Permissions: $(stat -c "%a" "$file")"
        echo "Valid Lines: $valid_count"
        echo "Invalid Lines: $invalid_count"
        echo "ACLs:"
        echo "$acl"
        echo "Rejected Lines:"
        for line in "${rejected[@]}"; do
            echo "■ - $line"
        done
        echo ""
    } >> "$METADATA_FILE"
}

# === MAIN FUNCTION ===
main() {
    if [[ $# -ne 1 ]]; then
        echo "Usage: $0 <directory>"
        exit 1
    fi

    local base_dir="$1"
    > "$SANITIZED_FILE"
    > "$METADATA_FILE"

    setup_logging_dir
    mapfile -t env_files < <(find_env_files "$base_dir")

    for file in "${env_files[@]}"; do
        sanitize_file "$file"
    done

    sudo chown maintainer:maintainer "$SANITIZED_FILE" "$METADATA_FILE"
    sudo chmod 600 "$SANITIZED_FILE" "$METADATA_FILE"
}

main "$@"




compare and tell which one is better and why 
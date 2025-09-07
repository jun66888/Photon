#!/usr/bin/env python3
"""
update_plist.py

Search and replace occurrences of a string inside a .plist file (both keys and values),
while preserving the original plist format (binary vs XML).

Usage:
  python3 update_plist.py [PLIST_PATH] [--from NEEDLE] [--to REPLACEMENT] [--no-backup] [--dry-run]

Defaults:
  PLIST_PATH: apm.Heimdallr.userdefaults.plist
  --from: com.ss.iphone.ugc.Aweme
  --to:   com.ss.iphone.ugc.Aweme.111111
"""

from __future__ import annotations

import argparse
import os
import plistlib
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List


def detect_plist_is_binary(plist_path: Path) -> bool:
    """Return True if the plist appears to be in binary format."""
    with plist_path.open("rb") as file_obj:
        header = file_obj.read(8)
    return header.startswith(b"bplist00")


def replace_in_object(node: Any, needle: str, replacement: str) -> Any:
    """
    Recursively replace occurrences of `needle` with `replacement` in both keys and values.
    Keys are only transformed if they are strings; values are transformed if strings.
    Dicts and lists are traversed recursively.
    """
    if isinstance(node, dict):
        new_dict: Dict[Any, Any] = {}
        for original_key, original_value in node.items():
            new_key = (
                original_key.replace(needle, replacement)
                if isinstance(original_key, str)
                else original_key
            )
            new_value = replace_in_object(original_value, needle, replacement)
            # If key collision occurs after replacement, last one wins.
            new_dict[new_key] = new_value
        return new_dict

    if isinstance(node, list):
        new_list: List[Any] = []
        for item in node:
            new_list.append(replace_in_object(item, needle, replacement))
        return new_list

    if isinstance(node, str):
        return node.replace(needle, replacement)

    # Numbers, booleans, bytes, dates, None, etc. are returned unchanged
    return node


def process_plist(
    plist_path: Path,
    needle: str,
    replacement: str,
    make_backup: bool,
    dry_run: bool,
) -> None:
    if not plist_path.exists():
        raise FileNotFoundError(f"Plist not found: {plist_path}")

    is_binary = detect_plist_is_binary(plist_path)

    with plist_path.open("rb") as file_obj:
        data = plistlib.load(file_obj)

    updated = replace_in_object(data, needle, replacement)

    if dry_run:
        print(
            f"[DRY-RUN] Would update '{plist_path}' (binary={is_binary}) replacing '"
            f"{needle}' -> '{replacement}'."
        )
        return

    if make_backup:
        backup_path = plist_path.with_suffix(plist_path.suffix + ".bak")
        shutil.copy2(plist_path, backup_path)
        print(f"Backup created: {backup_path}")

    with plist_path.open("wb") as file_obj:
        fmt = plistlib.FMT_BINARY if is_binary else plistlib.FMT_XML
        plistlib.dump(updated, file_obj, fmt=fmt, sort_keys=False)

    print(
        f"Updated '{plist_path}' (binary={is_binary}): '{needle}' -> '{replacement}'."
    )


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search/replace inside a .plist (keys and values)")
    parser.add_argument(
        "plist_path",
        nargs="?",
        default="apm.Heimdallr.userdefaults.plist",
        help="Path to the plist file (default: apm.Heimdallr.userdefaults.plist)",
    )
    parser.add_argument(
        "--from",
        dest="needle",
        default="com.ss.iphone.ugc.Aweme",
        help="String to find (default: com.ss.iphone.ugc.Aweme)",
    )
    parser.add_argument(
        "--to",
        dest="replacement",
        default="com.ss.iphone.ugc.Aweme.111111",
        help="Replacement string (default: com.ss.iphone.ugc.Aweme.111111)",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create a .bak backup next to the plist",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without writing",
    )
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    plist_path = Path(args.plist_path).expanduser().resolve()
    try:
        process_plist(
            plist_path=plist_path,
            needle=args.needle,
            replacement=args.replacement,
            make_backup=not args.no_backup,
            dry_run=args.dry_run,
        )
        return 0
    except Exception as exc:  # noqa: BLE001 - CLI tool should report any error
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))


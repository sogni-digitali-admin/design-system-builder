"""Writing text files that other tools and git will read.

A file converted by a script keeps its line endings: a project checked out with CRLF (Windows) stays CRLF, one
with LF stays LF, and a new file gets LF. Python's text mode would otherwise write the platform's ending and turn
a one-line change into a whole-file diff.
"""
from __future__ import annotations

from pathlib import Path


def line_ending(path: Path) -> str:
    """The ending the file uses today ("\\r\\n" or "\\n"); LF for a new or empty file."""
    if not path.exists():
        return "\n"
    head = path.read_bytes()[:65536]
    return "\r\n" if b"\r\n" in head else "\n"


def write_text(path: Path, text: str) -> None:
    """Write `text` (written with "\\n") with the file's own line ending, UTF-8, no platform translation."""
    path.write_text(text, encoding="utf-8", newline=line_ending(path))

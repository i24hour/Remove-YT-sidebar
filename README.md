# YouTube Clean Sidebar Extension

A simple Chrome extension that hides the right-side video recommendations (sidebar) and related chips on YouTube watch pages, allowing for a distraction-free viewing experience.

## Features

- **Hides Sidebar**: Removes the `#secondary` column containing video suggestions.
- **Hides Related Chips**: Removes the `#related-chips` filter bar.
- **Expands Player**: Automatically expands the video player to fill the available width.
- **Lightweight**: Uses a simple content script and CSS injection.

## Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the directory where you saved this extension.

## Usage

Just visit any YouTube video page. The sidebar recommendations should be gone!

## Files

- `manifest.json`: Extension configuration.
- `content.js`: Script to detect and hide elements.
- `style.css`: Styles to hide elements and adjust layout.

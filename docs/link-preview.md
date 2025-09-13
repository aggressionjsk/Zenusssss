# LinkPreview Component

The LinkPreview component renders rich preview cards for URLs in posts. It extracts metadata like title, description, and image from the linked website.

## Usage

```tsx
<LinkPreview url="https://example.com" />
```

Simply pass a URL to display a rich preview card with metadata from the linked website.

## Features

- Displays title, description, and image from linked websites
- Handles loading and error states gracefully
- Prevents React hydration errors with client-side rendering
- Responsive design for different screen sizes
# nFileManager

A lightweight, web-based file management tool with directory navigation, multi-language support, and a full-featured file operations toolbar.

## Features

- 📂 **Directory Navigation** – Browse folders with breadcrumb, clickable ".." parent row
- 📤 **File Upload** – Upload files with real-time progress bar (percentage + MB)
- 📥 **File Download** – One-click file download
- ✏️ **Create / Rename / Delete** – Create files and folders, rename, delete (single & bulk)
- 📋 **Copy / Move** – Copy or move files between directories
- 👁️ **View Files** – View images, videos, PDFs, audio directly in browser
- 📝 **Text Editor** – Built-in editor for code and text files
- 🔍 **Search** – Real-time client-side file filtering
- 🔀 **Sort** – Sort by name, size, type, date (ascending / descending)
- ☑️ **Multi-Select Toolbar** – Select files, action buttons enable/disable dynamically
- 🌐 **i18n** – Turkish / English language support
- 📌 **Sticky Toolbar** – Actions stay visible while scrolling
- 📱 **Responsive Design** – Works on desktop, tablet, and mobile
- 🖼️ **Dynamic Favicon** – Emoji-based favicon via canvas

## Installation

```bash
# Install globally via npm
npm install -g nfilemanager

# OR run from source
git clone git@github.com:necdetuygur/nfilemanager.git
cd nfilemanager
npm install
npm link
```

## Usage

```bash
# Start with default settings (port 3000, current directory)
nfilemanager

# Custom port
nfilemanager --port 8080

# Custom host and root directory
nfilemanager --host 0.0.0.0 --port 4321 --path /home/user/files

# Show help
nfilemanager --help
```

Then open http://localhost:3000 in your browser.

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--port <number>` | `3000` | HTTP server port |
| `--host <string>` | `0.0.0.0` | Bind address |
| `--root <path>` | `.` (current dir) | Root directory for file browser |
| `--path <path>` | — | Same as `--root` |
| `--help` | — | Show help message |

## Project Structure

```
nfilemanager/
├── bin/
│   └── cli.js            # CLI entry point
├── public/
│   ├── index.html        # Main web interface
│   ├── style.css         # Stylesheet
│   ├── script.js         # Client-side logic
│   ├── editor.html       # Text editor page
│   ├── editor.js         # Editor script
│   ├── editor.css        # Editor styles
│   └── languages.json    # i18n translations (TR / EN)
├── index.js              # Express server (all API routes)
├── package.json
└── README.md
```

## API Endpoints

All endpoints accept an optional `?path=` query parameter for subdirectory access.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files` | List directory contents |
| POST | `/upload` | Upload a file |
| GET | `/download/:filename` | Download a file |
| GET | `/view/:filename` | View file in browser |
| DELETE | `/delete/:filename` | Delete a file or folder |
| PUT | `/rename/:filename` | Rename a file or folder |
| POST | `/mkdir` | Create a folder |
| POST | `/touch` | Create an empty file |
| POST | `/copy` | Copy files to a destination directory |
| POST | `/move` | Move files to a destination directory |
| POST | `/bulk-delete` | Delete multiple files or folders |
| GET | `/read/:filename` | Read a text file's content |
| POST | `/save/:filename` | Save content to a text file |

## UI Overview

```
┌─────────────────────────────────────────────┐
│  nFileManager                    [🇹🇷/🇬🇧]  │  ← Top bar
├─────────────────────────────────────────────┤
│  [🔍 Search...]                             │  ← Search
│  [📄 New File] [📁 New Folder] [✏️ Rename]  │  ← Toolbar (sticky)
│  📁 / Root › folder                         │  ← Breadcrumb
├─────────────────────────────────────────────┤
│  [☐] Ad ▲   Boyut   Tür   Tarih     [🔄]  │  ← Sort header
├─────────────────────────────────────────────┤
│  📁 ..                                      │  ← Parent dir
│  📁 documents                               │
│  📄 notes.txt                               │  ← File list
│  📄 script.js                               │
└─────────────────────────────────────────────┘
│  [📄 Select File] [Upload]                  │  ← Upload section
└─────────────────────────────────────────────┘
```

## Requirements

- Node.js >= 14.0.0

## Technologies

- **Node.js** – Runtime environment
- **Express.js** – Web framework
- **Multer** – File upload middleware
- **Vanilla JavaScript** – Client-side logic
- **Custom CSS** – Styling (no frameworks)

## License

MIT

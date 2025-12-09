# nFileManager

A lightweight, web-based file management tool built with Node.js. Upload, download, rename, and delete files through an elegant web interface with real-time progress tracking.

## Features

- 📤 **File Upload** - Upload files with real-time progress bar showing percentage and MB
- 📥 **File Download** - One-click file downloads
- 📋 **File Listing** - View all files with size and modification date
- ✏️ **Rename Files** - Easily rename your files
- 🗑️ **Delete Files** - Remove files with confirmation
- 🎨 **Clean UI** - Modern interface built with vanilla CSS (no Bootstrap)
- 🚀 **Easy Setup** - Install globally via npm

## Installation

```bash
# Basic usage
npm i -g nfilemanager
nfilemanager

# OR

# Clone or download the project
git clone git@github.com:necdetuygur/nfilemanager.git
cd nfilemanager

# Install dependencies
npm install

# Install globally
npm link
```

## Usage

```bash
# Start with default port (3000)
nfilemanager

# Start with custom port
nfilemanager 8080
```

Then open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
nfilemanager/
├── bin/
│   └── cli.js           # CLI entry point
├── public/
│   ├── index.html       # Web interface
│   ├── style.css        # Styles
│   └── script.js        # Client-side JavaScript
├── index.js             # Express server
├── package.json         # Package configuration
└── uploads/             # Files directory (auto-created)
```

## How It Works

1. **Select a file** using the file picker
2. **Upload** and watch the real-time progress bar
3. **Manage files** - download, rename, or delete from the list
4. All files are stored in the `uploads/` directory

## Uninstall

```bash
# Remove global link
npm unlink -g nfilemanager

# Or completely uninstall
npm uninstall -g nfilemanager
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload middleware
- **Vanilla JavaScript** - Client-side logic
- **Custom CSS** - Styling (no frameworks)

## Requirements

- Node.js >= 14.0.0
- npm >= 6.0.0

## License

MIT

## Features in Detail

### Upload Progress
The upload progress bar displays:
- Percentage (0-100%)
- Uploaded size / Total size in MB
- Real-time updates during upload

### File Management
- **List**: Automatically loads all uploaded files
- **Download**: Direct download via browser
- **Rename**: Prompt-based file renaming
- **Delete**: Confirmation dialog before deletion

### Responsive Design
The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
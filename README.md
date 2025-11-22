# sac - Signature Animation Creator

A modern web application for creating stunning animated signatures. Draw your signature, preview the animated reveal, and export in multiple formats including SVG, MP4, and Lottie JSON for use across web, video, and cross-platform applications.

**Live Demo:** [https://sac.jayanithu.dev](https://sac.jayanithu.dev)

## ✨ Features

*   🎨 **Interactive Canvas:** Draw signatures with touch or mouse support, featuring pressure sensitivity and smooth stroke rendering
*   🎬 **Real-time Preview:** Watch your signature animate in real-time with playback controls (play, pause, restart)
*   📤 **Multiple Export Formats:**
    *   **SVG** - Perfect for web use with animated stroke-dasharray effects
    *   **MP4** - Video format for presentations and social media
    *   **Lottie JSON** - Cross-platform animation format for mobile and web apps
*   🎯 **Advanced Drawing Tools:**
    *   Customizable stroke width and colors
    *   Eraser mode for corrections
    *   Undo/Redo functionality
    *   Zoom and pan controls
    *   Grid background for precision
*   🌓 **Theme Support:** Light and dark mode with persistent preferences
*   📱 **Fully Responsive:** Optimized for desktop, tablet, and mobile devices
*   ⚡ **Performance Optimized:** Built with Next.js for fast loading and smooth animations

## 🚀 Tech Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) with App Router
*   **UI Library:** [React 19](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) / [Motion](https://motion.dev/)
*   **Canvas API:** Native HTML5 Canvas for drawing
*   **MediaRecorder API:** For video export

## 📦 Installation

### Prerequisites

*   Node.js (version 18 or higher)
*   npm or yarn package manager

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Jayanithu/sac.git
    cd sac
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## 🎮 Usage

1.  **Landing Page:** The app starts with a beautiful landing page. Click anywhere to enter the application.

2.  **Drawing:**
    *   Use your mouse or touch to draw on the canvas
    *   Adjust stroke width and color using the controls
    *   Use the eraser tool to remove parts of your drawing
    *   Undo/Redo to correct mistakes
    *   Zoom and pan for detailed work

3.  **Preview:**
    *   Watch your signature animate in real-time
    *   Use playback controls to play, pause, or restart the animation
    *   The preview shows the exact animation that will be exported

4.  **Export:**
    *   Click any export button (SVG, MP4, or Lottie) to download your animated signature
    *   Each format is optimized for its specific use case

## 📁 Project Structure

```
sac/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout with metadata and SEO
│   │   ├── page.tsx             # Main application page
│   │   ├── globals.css          # Global styles
│   │   └── sitemap.ts           # Dynamic sitemap generation
│   ├── components/              # React components
│   │   ├── canvas/              # Canvas-related components
│   │   │   └── CanvasSign.tsx   # Drawing canvas component
│   │   ├── preview/             # Preview-related components
│   │   │   └── Preview.tsx      # Animation preview component
│   │   ├── export/              # Export-related components
│   │   │   └── ExportButtons.tsx # Export functionality
│   │   ├── landing/             # Landing page components
│   │   │   └── Landing.tsx      # Landing page component
│   │   ├── seo/                 # SEO-related components
│   │   │   └── StructuredData.tsx # JSON-LD structured data
│   │   └── ui/                  # Reusable UI components
│   │       └── blurred-stagger-text.tsx # Text animation component
│   ├── hooks/                   # Custom React hooks
│   │   └── useTheme.ts          # Theme management hook
│   ├── lib/                     # Utility functions
│   │   ├── pathUtils.ts         # Stroke manipulation utilities
│   │   └── exportUtils.ts       # Export format generators
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Shared types
│   └── constants/               # Application constants
│       └── index.ts             # Shared constants and config
├── public/                      # Static assets
│   ├── manifest.json            # PWA manifest
│   ├── robots.txt               # SEO robots file
│   ├── og-image.png             # Open Graph image
│   └── header.jpg               # Favicon and app icon
├── next.config.ts               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

### Directory Organization

- **`src/app/`**: Next.js App Router pages and layouts
- **`src/components/`**: Feature-based component organization
  - Components are grouped by feature (canvas, preview, export, etc.)
  - UI components are in a separate `ui/` folder
- **`src/hooks/`**: Custom React hooks for reusable logic
- **`src/lib/`**: Utility functions and helpers
- **`src/types/`**: Shared TypeScript type definitions
- **`src/constants/`**: Application-wide constants and configuration

### Next.js Configuration

The project uses Next.js 16 with:
*   App Router for routing
*   Server Components by default
*   Optimized builds with Turbopack

### Tailwind CSS

Custom configuration includes:
*   Dark mode support
*   Custom color palette
*   Responsive breakpoints
*   Custom scrollbar styling

## 🎨 Export Formats

### SVG
*   Animated using `stroke-dasharray` and `stroke-dashoffset`
*   Preserves original drawing timing
*   Perfect for web embedding
*   Scalable vector format

### MP4
*   Recorded using MediaRecorder API
*   High-quality video output
*   Compatible with all video players
*   Great for presentations and social media

### Lottie JSON
*   Cross-platform animation format
*   Supports individual stroke colors and widths
*   Can be used in React Native, iOS, Android, and web
*   Lightweight and performant

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## 🧪 Development

### Available Scripts

*   `npm run dev` - Start development server
*   `npm run build` - Build for production
*   `npm run start` - Start production server
*   `npm run lint` - Run ESLint

### Code Style

*   TypeScript for type safety
*   ESLint for code quality
*   Tailwind CSS for styling
*   Component-based architecture

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jayanithu**

*   GitHub: [@Jayanithu](https://github.com/Jayanithu)
*   LinkedIn: [jayanithu-perera](https://www.linkedin.com/in/jayanithu-perera-ba7a46264/)
*   Twitter/X: [@Jayaniithu](https://x.com/Jayaniithu)

## 🙏 Acknowledgements

*   Built with [Next.js](https://nextjs.org/)
*   Styled with [Tailwind CSS](https://tailwindcss.com/)
*   Animations powered by [Framer Motion](https://www.framer.com/motion/)
*   Icons and UI inspiration from the modern web design community

---

_Made with ❤️ by [@jayanithu](https://github.com/Jayanithu)_

# GitNest 🚀

**GitNest** is an advanced AI-powered tutoring assistant designed to help developers understand any GitHub repository. By analyzing the codebase, GitNest generates a structured, step-by-step tutorial plan and provides detailed, deep-dive chapters on-demand, explaining the architecture, key concepts, and implementation details.

## ✨ Features

- **🔍 Repository Analysis**: Fetches and analyzes file structures and code from any public GitHub repository.
- **📚 AI Chapter Planning**: Generates a comprehensive 10-12 chapter learning path tailored to the specific project.
- **🤖 On-Demand Tutorials**: Uses Groq (Llama 3) to generate detailed markdown tutorials for each chapter, complete with code examples and architectural insights.
- **💎 Glassmorphism UI**: A stunning, modern interface featuring glassmorphism effects, smooth animations, and a premium developer experience.
- **📝 Rich Content Display**: Tutorials are rendered with syntax highlighting, copy-to-clipboard functionality, and clear typographic hierarchy.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: Groq SDK
- **Icons**: Lucide React
- **Markdown**: React Markdown & React Syntax Highlighter

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Groq API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/piyyu/gitnest.git
    cd gitnest
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your Groq API key:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Dependencies

- `groq-sdk`: For interacting with Groq's fast AI inference.
- `next`: The React framework for the web.
- `react` / `react-dom`: UI library.
- `react-markdown`: For rendering the generated tutorial content.
- `react-syntax-highlighter`: For beautiful code blocks.
- `lucide-react`: For modern, clean icons.
- `tailwindcss`: For utility-first styling.

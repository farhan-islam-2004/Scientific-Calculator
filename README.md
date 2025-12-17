# Scientific Calculator Web App

A powerful, mobile-first scientific calculator built with vanilla HTML, CSS, and JavaScript. It features advanced mathematical functions, an equation solver, a graphing engine, and a built-in unit converter.

![Calculator Preview](preview.png)
*(Note: Add a screenshot of your calculator here)*

## Features

### 🧮 Scientific Calculation
- **Basic Operations**: Arithmetic, percentages, factorial (`!`), powers (`^`).
- **Advanced Math**: Trigonometry (`sin`, `cos`, `tan`, `sec`, `cosec`, `cot`) and their inverses.
- **Logarithms**: Natural (`ln`) and base-10 (`log`).
- **Statistics**: Mean, Standard Deviation (`stdev`, `stdevp`).
- **Combinatorics**: Permutations (`nPr`) and Combinations (`nCr`).
- **Calculus & rounding**: `floor`, `ceil`, `round`, `abs`, `nthRoot`.

### 📉 Graphing Engine
- **Plot Functions**: Visualize equations (e.g., `sin(x)`, `x^2`) directly on a canvas.
- **Interactive Controls**: Zoom in/out, pan across the graph.
- **Hold Mode**: Plot multiple functions on the same graph with different colors.
- **Export**: Save your graphs as PNG images.

### 🧩 Equation Solver
- **Solve for x**: Automatically detects equations with variables (e.g., `x^2 - 4`) and solves for `x` using the Newton-Raphson method.

### 🔄 Unit Converter
- **Multi-category Support**: Convert values for Length, Mass, Temperature, and Currency.
- **Real-time**: Conversions happen instantly as you type.

### 📜 History & Memory
- **Calculation History**: Automatically saves your past calculations using LocalStorage.
- **Recall**: Click any history item to load it back into the display.
- **Ans Button**: Use the result of your last calculation in the next expression.

### 🎨 UI/UX
- **Mobile-First Design**: Fully responsive layout that adapts to phones, tablets, and desktops.
- **Themes**: Toggle between Light and Dark modes.
- **Keyboard Support**: Type math expressions naturally using your keyboard.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/scientific-calculator.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd scientific-calculator
    ```
3.  Open `index.html` in your web browser.

## Usage

-   **Scientific Mode**: Just start typing! Use `Shift` + keys for secondary functions if on desktop (or use the on-screen buttons).
-   **Graphing**: Click the "Graph" button to open the panel. Type a function like `sin(x)` and see it plotted.
-   **Solving**: Enter an equation like `2*x + 5 = 15` and press `=` to solve for `x`.

## Technologies Used

-   **HTML5**: Structure and semantic layout.
-   **CSS3**: Custom variables for theming, CSS Grid for layout, and Flexbox for components.
-   **JavaScript (ES6+)**: Custom tokenizer, Shunting-yard algorithm for parsing, and Canvas API for graphing.

## License

This project is open source and available under the [MIT License](LICENSE).

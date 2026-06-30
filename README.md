# PCI BioMedTech: Precision Cellular Immunology

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
![Framework](https://img.shields.io/badge/framework-React19%20%7C%20Vite6-61dafb.svg)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS%20v4-38bdf8.svg)
![Target Industry](https://img.shields.io/badge/industry-Digital%20Pathology%20%26%20MedTech-blue.svg)

Precision Cellular Immunology (PCI) is a clinical-stage medical technology startup (originating out of the Texas Medical Center) redefining diagnostic quality calibration and IHC assay standards. We merge engineered cellular tissue controls with automated computer vision pipelines to eliminate subjective scoring variances, accelerate clinical throughput, and decrease patient misdiagnoses in oncology.

This repository contains the interactive client-facing portal, education module, digital whole-slide image (WSI) viewport simulator, and diagnostic deep-learning pipeline visualizations.

---

## 🔬 Core Product Ecosystem

Our workflow bridges the gap between **physical immunohistochemistry (IHC) assay verification** and **automated digital pathologist instrumentation**.

### 1. Characterized Cell Line IHC Controls (FFPE)
Physical formalin-fixed paraffin-embedded (FFPE) cell line control plugs, engineered to express precise, pre-quantified antigen cell density levels.
*   **Standardization**: Standardizes breast, lung, and gastric cancer panels.
*   **Failed Run Prevention**: Protects laboratories from "staining failure pitfalls" where false-negatives go undetected due to suboptimal antibody titers.
*   **Quantified Expressors**: Available in high, intermediate, and negative expression panels (e.g., HER2, PD-L1, ER/PR).

### 2. Digital Slide Viewer & Machine-Learning Diagnostic Engine
Interpreting tissue slides manually is highly prone to cognitive ocular fatigue. PCI's automated AI Assessment suite aids clinical decisions:
*   **Hematoxylin & DAB Visual Separation**: Segments blue/violet nucleus staining from brown diaminobenzidine (DAB) chromogen structures.
*   **Dynamic Whole-Slide Viewer**: Sub-millisecond rastering simulation supporting 10x, 20x, and 40x magnification with coordinate matrix overlays.
*   **Automated Tumor Proportion Scores (TPS)**: Live calculation of cell expression ratios directly via modern client-side modeling.

---

## 🛠️ Technology Stack & Architecture

This application is engineered for high performance, frame-rate responsive interactions, and absolute structural precision:

*   **Build Tooling & Bundling**: [Vite 6](https://vite.dev/) & [TypeScript](https://www.typescriptlang.org/) for modern, safe, rapid bundling cycle times.
*   **Core UI Elements**: High-contrast, accessibility-vetted web architecture constructed with **HTML5** and **Tailwind CSS v4** utilizing an elegant custom clinical theme (**Space Grotesk** headings paired with **JetBrains Mono** data readout tables).
*   **Interactive Components**: [React 19](https://react.dev/) manages dynamic view states, diagnostics, and patient slide assets inside the digital viewport.
*   **Fluid Animations**: [Framer Motion](https://www.framer.com/motion/) powering the micro-interactions, tissue slide loading crosshairs, and educational visualizers.

---

## 📁 Repository Directory Structure

```text
├── index.html                  # Homepage with primary value propositions & statistics
├── products.html               # Product list (lung diagnostic blocks, breast cancer controls, gastric panels)
├── controls.html               # FFPE manufacturing detail and control slide chemistry explanations
├── ai.html                     # AI Biomarker Assessment, clinical problems and computational solutions
├── education.html              # Interactive teaching modules regarding IHC staining procedures
├── viewer.html                 # Complete virtual pathology slide viewer running interactive cell segmentation
├── about.html                  # Mission statement and clinical advisory board profiles
├── contact.html                # Enterprise procurement and regulatory compliance inquiry forms
├── package.json                # Project dependencies, script configurations, and build tasks
├── tsconfig.json               # Modular TypeScript configurations
├── vite.config.ts              # Custom multipage entry-point configurations for Vite
├── src/
│   ├── App.tsx                 # Base entry component for custom React instances
│   ├── main.tsx                # React DOM tree mounter
│   ├── index.css               # Tailwind CSS v4 directives and system typography declarations
│   └── assets/
│       └── images/             # Visual case records and clinical adviser portraits
└── css/
    └── style.css               # Custom global CSS definitions (microscopy simulated filters, keyframes)
```

---

## 🚀 Getting Started

### Prerequisites

You must have the following system programs installed:
*   [Node.js](https://nodejs.org/) (version `18.x` or higher recommended)
*   `npm` (included alongside Node)

### Installation

1.  Clone the repository to your regional workspace:
    ```bash
    git clone https://github.com/pci-bio-medtech/pci-bio-app.git
    cd pci-bio-app
    ```

2.  Install the required production and development dependencies:
    ```bash
    npm install
    ```

### Development Server

Boot the local Vite development web server locally:
```bash
npm run dev
```
The application will launch on your local engine. Navigate your web client to `http://localhost:3000` to review and test the interactive slide viewer and controls interface.

### Production Build

Prepare the distribution package for secure, high-concurrency production deployments (e.g., standard static servers or container instances):
```bash
npm run build
```
Vite compiles and optimizes all biological datasets, typescript modules, and tailwind classes into a lightweight, deployable bundle inside the `./dist` folder.

---

## 🛡️ Clinical & Regulatory Compliance Note

*This portal contains computational simulations and educational models. Real-world physical control units and cloud-based AI scoring diagnostic software undergo strict Quality Management Systems (QMS) compliant under ISO 13485, FDA 21 CFR Part 820, and IVDR (EU) 2017/746 guidelines.*

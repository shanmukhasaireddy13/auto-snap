
<div align="center">

# a u t o s n a p
### Intelligent Local File History & Protection in Time

[![NPM Version](https://img.shields.io/npm/v/autosnap?style=flat-square&color=blue)](https://www.npmjs.com/package/autosnap)
[![License](https://img.shields.io/badge/license-ISC-green?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-win%20|%20mac%20|%20linux-lightgrey?style=flat-square)]()

</div>

---

**Autosnap** is a lightweight, background service that automatically watches your code for changes and creates **intelligent snapshots**, allowing you to travel back in time to any version of any file.

Think of it as a local, granular Time Machine for your code—working silently to protect your work from accidental deletion or bad edits.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🌲 Tree-Based History** | Every edit branches off. Restoring an old version creates a new branch, so **nothing is ever overwritten or lost**. |
| **📉 Compact Storage** | Uses **Forward Delta** + **Brotli Compression** to store dozens of versions in just a few KB (typ. ~80% space reduction). |
| **⚡ Zero Friction** | Runs silently in the background. No manual `git commit` needed for every small change. |
| **🔄 Non-Destructive Restore** | "Pivots" your workspace to any past version instantly without creating duplicate snapshots. |

---

## 📦 Installation

Install globally via NPM to use the `autosnap` CLI anywhere:

```bash
npm install -g autosnap
```

---

## 🛠️ Usage Guide

### 1. Start Watching
Go to your project directory and start the background watcher.
```bash
autosnap start
```
> **Note:** Autosnap automatically ignores `node_modules`, `.git`, `dist`, and other noisy folders.

### 2. View History
See a summary of all tracked files or deep-dive into a specific file's timeline.

**Summary View:**
```bash
autosnap history
```

**Detailed Tree View:**
```bash
auto-snap history src/server.js
```
**Example Output:**
```
Snapshot History for "sai.txt":

File: sai.txt
----------------------------------------------------------------------------------------------------------------------------------
| Snapshot ID     | Parent          | Timestamp                      | Size (Raw)   | Stats      | Type
----------------------------------------------------------------------------------------------------------------------------------
| mjjygyjp        | mjjye8t9        | 24/12/2025, 5:23:50 pm         | 150.84 MB    | +680400 | VERSION (HEAD)
| mjjye8t9        | mjjyd5nv        | 24/12/2025, 5:21:43 pm         | 13.71 MB     | +63180 | VERSION 
| mjjyd5nv        | mjjycj68        | 24/12/2025, 5:20:52 pm         | 1003.01 KB   | +4590 | VERSION 
| mjjycj68        | mjjybv0k        | 24/12/2025, 5:20:23 pm         | 55.72 KB     | +180 | VERSION 
| mjjybv0k        | mjjyb66p        | 24/12/2025, 5:19:52 pm         | 18.57 KB     | +61 -1 | VERSION 
| mjjyb66p        | mjjya8bv        | 24/12/2025, 5:19:20 pm         | 6.19 KB      | +15 | VERSION 
| mjjya8bv        | mjibpjwi        | 24/12/2025, 5:18:36 pm         | 3.09 KB      | +12 | VERSION 
| mjibpjwi        | mjib5c22        | 23/12/2025, 1:58:53 pm         | 74 B         | +2 | VERSION 
| mjibg8id        | mjibfwk9        | 23/12/2025, 1:51:38 pm         | 44 B         | +1 -1 | VERSION 
| mjibfwk9        | mjibellx        | 23/12/2025, 1:51:23 pm         | 10 B         | +1 -8 | VERSION 
| mjibellx        | mjib5c22        | 23/12/2025, 1:50:22 pm         | 247 B        | +7 | VERSION 
| mjib5c22        | -               | 23/12/2025, 1:43:10 pm         | 29 B         |            | ROOT 
----------------------------------------------------------------------------------------------------------------------------------

Tip: Use the 'Snapshot ID' (first column) to restore. Example: npm run restore mjjygyjp

----------------------------------------------------------------------------------------------------------------------------------
Storage Efficiency Overview:
Current File Size:        150.84 MB
Hypothetical Total Size:  165.62 MB  (Sum of all 12 versions)
Actual Storage (.snap):   2.64 KB
Total Saved:              165.61 MB (100.0%)
----------------------------------------------------------------------------------------------------------------------------------
```
*   **Snapshot ID**: (First Column) Key used for restoration.
*   **Size (Raw)**: The full size of that version if stored normally.
*   **Efficiency**: Shows how much space Auto-Snap is saving you.

### 3. Restore in Time
Travel back safely. This updates the file in your workspace and "pivots" the history tree to that version.

```bash
autosnap restore <SNAPSHOT_ID>
```
*Example:* `autosnap restore mjibpjwi`

### 4. Other Commands
*   `autosnap stop`: Stop the background process.
*   `autosnap clear`: **RESET** all history (Irreversible!).
*   `autosnap settings`: Open the config file.

---

## ⚙️ Configuration
A `.autosnap/config.json` is created in your project root.

```json
{
  "debounce": 2000,       // Wait 2s after typing stops before snapshotting
  "maxSize": 102400,      // Max file size to track (in bytes)
  "include": ["**/*"],    // Files to watch
  "exclude": ["*.log"]    // Files to ignore
}
```

## 🧩 Architecture

Autosnap uses a modern **Forward-Delta Architecture**:
1.  **Root Node**: Stores the full initial file content.
2.  **Child Nodes**: Store only the *patches* (diffs) required to recreate the file from the parent.
3.  **Storage**: All data is compressed (Brotli) and stored in succinct `.snap` files in `.autosnap/store/`.

---

<div align="center">

Made with ❤️ by [Shanmukha Sai Reddy](https://github.com/shanmukhasaireddy13)

</div>
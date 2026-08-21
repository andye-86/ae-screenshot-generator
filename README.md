# Screenshot Generator

After Effects (ExtendScript) script that saves a PNG screenshot of each selected comp every N frames (10-200, default 50, plus the last frame).

## Usage

Select one or more comps in the Project panel, then run `screenshotGenerator.jsx` (File > Scripts > Run Script File...). If no comps are selected, the active comp is used instead. A dialog lets you set the frame interval and pick a destination folder; each comp gets its own subfolder there.

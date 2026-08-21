// ============================================================================
// screenshotGenerator.jsx
// ----------------------------------------------------------------------------
// For each comp selected in the Project panel (or the active comp if none
// are selected), saves a PNG screenshot every
// N frames starting at frame 0, plus one final screenshot of the comp's
// last frame if it doesn't already land on an N-frame boundary.
//
// On run, shows a dialog to pick the frame interval (10-200, default 50)
// and a destination folder. Each comp gets its own subfolder (named after
// the comp) inside that destination.
// ============================================================================

(function screenshotGenerator() {
    "use strict";

    var SCRIPT_NAME = "Screenshot Generator";
    var DEFAULT_INTERVAL = 50;
    var MIN_INTERVAL = 10;
    var MAX_INTERVAL = 200;
    var FRAME_DIGITS = 5;

    function sanitizeFileName(name) {
        return name.replace(/[\/\\:*?"<>|]/g, "_");
    }

    function padFrame(frameNumber) {
        var str = String(frameNumber);
        while (str.length < FRAME_DIGITS) {
            str = "0" + str;
        }
        return str;
    }

    function framesToCapture(comp, interval) {
        var totalFrames = Math.round(comp.duration * comp.frameRate);
        var lastFrame = totalFrames - 1;
        var frames = [];

        for (var frame = 0; frame < lastFrame; frame += interval) {
            frames.push(frame);
        }
        frames.push(lastFrame);

        return frames;
    }

    function showSettingsDialog() {
        var dialog = new Window("dialog", SCRIPT_NAME);
        dialog.orientation = "column";
        dialog.alignChildren = "fill";
        dialog.spacing = 10;
        dialog.margins = 16;

        var intervalPanel = dialog.add("panel", undefined, "Frame Interval");
        intervalPanel.orientation = "row";
        intervalPanel.alignChildren = "center";
        intervalPanel.alignment = "fill";
        intervalPanel.margins = 12;

        var intervalSlider = intervalPanel.add("slider", undefined, DEFAULT_INTERVAL, MIN_INTERVAL, MAX_INTERVAL);
        intervalSlider.alignment = ["fill", "center"];

        var intervalValue = intervalPanel.add("edittext", undefined, String(DEFAULT_INTERVAL));
        intervalValue.alignment = ["right", "center"];
        intervalValue.characters = 4;

        intervalSlider.onChanging = function () {
            intervalValue.text = String(Math.round(intervalSlider.value));
        };

        intervalValue.onChange = function () {
            var parsed = parseInt(intervalValue.text, 10);
            if (isNaN(parsed)) {
                parsed = DEFAULT_INTERVAL;
            }
            parsed = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, parsed));
            intervalValue.text = String(parsed);
            intervalSlider.value = parsed;
        };

        var folderPanel = dialog.add("panel", undefined, "Destination Folder");
        folderPanel.orientation = "row";
        folderPanel.alignChildren = "center";
        folderPanel.margins = 12;

        var folderPath = folderPanel.add("edittext", undefined, "");
        folderPath.preferredSize.width = 260;
        folderPath.enabled = false;

        var browseButton = folderPanel.add("button", undefined, "Browse...");
        var selectedFolder = null;

        browseButton.onClick = function () {
            var folder = Folder.selectDialog(SCRIPT_NAME + ": choose a destination folder");
            if (folder) {
                selectedFolder = folder;
                folderPath.text = folder.fsName;
            }
        };

        var buttonGroup = dialog.add("group");
        buttonGroup.alignment = "right";
        var cancelButton = buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });
        var runButton = buttonGroup.add("button", undefined, "Run", { name: "ok" });

        var result = null;

        runButton.onClick = function () {
            if (!selectedFolder) {
                alert(SCRIPT_NAME + ": choose a destination folder first.");
                return;
            }
            result = {
                interval: Math.round(intervalSlider.value),
                folder: selectedFolder
            };
            dialog.close();
        };

        cancelButton.onClick = function () {
            dialog.close();
        };

        dialog.show();

        return result;
    }

    var comps = [];
    for (var i = 0; i < app.project.selection.length; i++) {
        if (app.project.selection[i] instanceof CompItem) {
            comps.push(app.project.selection[i]);
        }
    }

    if (!comps.length && app.project.activeItem instanceof CompItem) {
        comps.push(app.project.activeItem);
    }

    if (!comps.length) {
        alert(SCRIPT_NAME + ": select one or more comps in the Project panel, or open a comp.");
        return;
    }

    var settings = showSettingsDialog();
    if (!settings) {
        return;
    }

    app.beginUndoGroup(SCRIPT_NAME);

    for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        var compName = sanitizeFileName(comp.name);

        var compFolder = new Folder(settings.folder.fsName + "/" + compName);
        if (!compFolder.exists) {
            compFolder.create();
        }

        var frames = framesToCapture(comp, settings.interval);

        for (var f = 0; f < frames.length; f++) {
            var frameNumber = frames[f];
            var time = frameNumber / comp.frameRate;
            var fileName = compName + "_" + padFrame(frameNumber) + ".png";
            var file = new File(compFolder.fsName + "/" + fileName);

            comp.saveFrameToPng(time, file);
        }
    }

    app.endUndoGroup();

    alert(SCRIPT_NAME + ": done.");
})();

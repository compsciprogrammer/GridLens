# GridLens pretrained detection display fix

The city dashboard was using legacy OpenCV fields (`vegetation_fraction` and `line_like_features`) for ALL reports. Pretrained YOLO-World instead returns `candidate_line_boxes` and `candidate_tree_boxes`, so the old dashboard displayed `NaN%` and `undefined`.

This update renders fields according to `screening.method`, preserving old report compatibility. It does not alter the model, training, saved reports, or severity logic.

## Run
1. Stop the old Python server (Control+C).
2. Start the backend from this extracted project's `server` folder using the same virtual environment/dependencies as before.
3. Open http://localhost:8000 and hard-refresh the browser (Mac: Cmd+Shift+R).
4. No mobile reinstall is needed if your phone is already connected to this server.

If reports still show Unassessed, that is an actual model result, not the NaN display bug. Inspect `screening.model_status` and the candidate counts from `/api/reports`.

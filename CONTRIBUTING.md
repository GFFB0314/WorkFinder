# Contributing to WorkFinder

## Git Workflow (Simplified)

We use a simple **Shared Dev Branch** workflow.

### Branches

- **`main`**: The stable production version. **Do not touch.**
- **`dev`**: The working branch for EVERYONE.

### Deployment / Work Rules

1.  **All developers** work directly on the `dev` branch.
2.  **Before you start**:
    ```bash
    git checkout dev
    git pull origin dev
    ```
3.  **After you finish**:
    ```bash
    git add .
    git commit -m "Your message"
    git push origin dev
    ```

## Project Structure

- **`backend`**: FastAPI application.
- **`frontend`**: React + Vite application.

## Team Rules
- Backend Team works primarily in `backend/`.
- Frontend Team works primarily in `frontend/`.
- Integration and testing happen on the `dev` branch.

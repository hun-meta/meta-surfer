Organize and commit current session changes following the commit convention.

## Procedure

### Step 1: Review Commit Convention
Read `docs/commit-convention.md` and understand the commit convention.

### Step 2: Identify Changes
```bash
git status
git diff --cached
git diff
```
Use the commands above to identify all current changes (staged, unstaged, untracked).

### Step 3: Determine Scope
- If session tasks exist: select only the changes within the task scope for commit
- If no session tasks: include all changes as commit targets

### Step 4: Classify into Logical Units
Classify changes into logical units based on the convention's types and scopes.
- Each commit should contain only one logical change
- Group related files into a single commit
- Determine commit order considering dependencies (types → config → utils → core logic → docs)

### Step 5: Execute Commits
Commit each classified unit in order:
1. `git add <files>` — stage only the files for that unit
2. Write a commit message following the convention (title + body in English)
3. Run `git commit`

### Commit Message Format
```
<type>(<scope>): <title>

<body>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Required Rules
- **Commit title and body must be written in English**
- Title must be under 50 characters
- List changes in the body using `-` bullet points
- Do not commit sensitive files such as `.env` or credentials
- Verify staged content with `git diff --cached` before committing
- Always include the Co-Authored-By line

## Arguments
If $ARGUMENTS is provided, reflect the content in the commit message.

# Git & GitHub Workflow Guide

A comprehensive guide for managing your code across different computers and tools using Git and GitHub.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Pushing Changes to GitHub](#pushing-changes-to-github)
3. [Pulling Changes from GitHub](#pulling-changes-from-github)
4. [Common Workflows](#common-workflows)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### First-Time Git Configuration (Do this on each new computer)

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### Clone an Existing Repository

```bash
# Clone via HTTPS
git clone https://github.com/username/repository-name.git

# Clone via SSH (recommended after SSH setup)
git clone git@github.com:username/repository-name.git

# Navigate into the cloned directory
cd repository-name
```

### Initialize a New Repository (if starting fresh)

```bash
# Initialize git in your project directory
cd /path/to/your/project
git init

# Add remote repository
git remote add origin https://github.com/username/repository-name.git

# Verify remote
git remote -v
```

---

## Pushing Changes to GitHub

### Basic Push Workflow

```bash
# 1. Check current status
git status

# 2. Stage files for commit
# Stage specific files
git add path/to/file1.txt path/to/file2.txt

# Stage all changes
git add .

# Stage all files of a specific type
git add *.js

# 3. Commit changes with a message
git commit -m "Brief description of changes"

# 4. Push to GitHub
git push origin main
# or if your default branch is 'master'
git push origin master
```

### First Push to a New Repository

```bash
# After initializing and adding remote
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

The `-u` flag sets the upstream branch, so future pushes can be done with just `git push`.

### Push a New Branch

```bash
# Create and switch to a new branch
git checkout -b feature-branch-name

# Make changes, stage, and commit
git add .
git commit -m "Add new feature"

# Push the new branch to GitHub
git push -u origin feature-branch-name
```

---

## Pulling Changes from GitHub

### Basic Pull Workflow

```bash
# 1. Check current status
git status

# 2. Pull latest changes from GitHub
git pull origin main

# This is equivalent to:
# git fetch origin
# git merge origin/main
```

### Pull Changes When Switching Computers

```bash
# 1. Navigate to your project directory
cd /path/to/your/project

# 2. Check which branch you're on
git branch

# 3. Pull latest changes
git pull origin main

# 4. Verify you have the latest code
git log --oneline -5
```

### Fetch vs Pull

```bash
# Fetch downloads changes but doesn't merge them
git fetch origin

# View what was fetched
git log origin/main

# Merge fetched changes
git merge origin/main

# Pull does both fetch and merge in one command
git pull origin main
```

---

## Common Workflows

### Daily Workflow (Single Developer)

```bash
# Morning: Start work on Computer A
git pull origin main
# Make changes...
git add .
git commit -m "Implement feature X"
git push origin main

# Evening: Continue work on Computer B
git pull origin main
# Make more changes...
git add .
git commit -m "Complete feature X"
git push origin main
```

### Working with Branches

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Work on the feature
git add .
git commit -m "Add new feature"

# Push feature branch
git push -u origin feature/new-feature

# Switch back to main
git checkout main

# Pull latest main
git pull origin main

# Merge feature into main
git merge feature/new-feature

# Push updated main
git push origin main

# Delete feature branch (optional)
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### Handling Uncommitted Changes When Pulling

```bash
# Option 1: Stash changes temporarily
git stash
git pull origin main
git stash pop

# Option 2: Commit changes first
git add .
git commit -m "WIP: Work in progress"
git pull origin main
```

---

## Troubleshooting

### Merge Conflicts

When pulling changes that conflict with your local changes:

```bash
# Pull and encounter conflict
git pull origin main

# Git will mark conflicted files
# Open conflicted files and look for:
# <<<<<<< HEAD
# Your changes
# =======
# Incoming changes
# >>>>>>> origin/main

# Edit files to resolve conflicts
# Then stage and commit
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Undo Last Commit (Not Pushed)

```bash
# Keep changes but undo commit
git reset --soft HEAD~1

# Discard changes and undo commit
git reset --hard HEAD~1
```

### Undo Pushed Commit

```bash
# Create a new commit that reverses changes
git revert HEAD
git push origin main
```

### Force Push (Use with Caution!)

```bash
# Only use if you're sure and working alone
git push --force origin main
```

### Check Remote URL

```bash
# View remote URLs
git remote -v

# Change remote URL
git remote set-url origin https://github.com/username/new-repo.git
```

### View Commit History

```bash
# View detailed history
git log

# View compact history
git log --oneline

# View last 5 commits
git log --oneline -5

# View changes in a commit
git show commit-hash
```

---

## Quick Reference Commands

### Status & Information
```bash
git status                    # Check current status
git branch                    # List branches
git log --oneline -5         # View recent commits
git remote -v                # View remote URLs
```

### Basic Operations
```bash
git add .                    # Stage all changes
git commit -m "message"      # Commit with message
git push origin main         # Push to GitHub
git pull origin main         # Pull from GitHub
```

### Branch Operations
```bash
git checkout -b branch-name  # Create and switch to branch
git checkout main            # Switch to main branch
git merge branch-name        # Merge branch into current
git branch -d branch-name    # Delete local branch
```

### Undo Operations
```bash
git stash                    # Temporarily save changes
git stash pop                # Restore stashed changes
git reset --soft HEAD~1      # Undo last commit, keep changes
git revert HEAD              # Create commit that undoes last commit
```

---

## Best Practices

1. **Commit Often**: Make small, focused commits with clear messages
2. **Pull Before Push**: Always pull latest changes before pushing
3. **Use Branches**: Create feature branches for new work
4. **Write Clear Commit Messages**: Use descriptive messages
5. **Don't Commit Sensitive Data**: Use `.gitignore` for secrets
6. **Review Before Committing**: Use `git status` and `git diff`

---

## Transition Checklist

When moving to a new computer:

- [ ] Install Git
- [ ] Configure user name and email
- [ ] Set up SSH keys (optional but recommended)
- [ ] Clone repository
- [ ] Pull latest changes
- [ ] Verify you can push changes
- [ ] Set up any environment-specific files (`.env`, etc.)

---

## Additional Resources

- [Official Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Note**: Replace `main` with `master` if your repository uses `master` as the default branch.
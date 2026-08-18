@echo off
title AeroQuiz - Push to GitHub
cd /d "C:\Users\charles\PycharmProjects\Website"

echo.
echo ==========================================
echo   AeroQuiz - Auto Push to GitHub
echo   Repo: escar116/Websites
echo ==========================================
echo.

:: Pull latest first to avoid conflicts
echo [1/4] Pulling latest from origin/main...
git pull origin main
if %errorlevel% neq 0 (
    echo ERROR: Git pull failed. Please resolve any conflicts manually.
    pause
    exit /b 1
)

:: Stage the exam folder and reviewer files
echo.
echo [2/4] Staging exam/ folder changes...
git add exam/

:: Commit with timestamp
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set TIMESTAMP=%%i
git commit -m "AeroQuiz update: %TIMESTAMP%"
if %errorlevel% neq 0 (
    echo NOTE: Nothing new to commit, or commit failed.
)

:: Push to GitHub
echo.
echo [3/4] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Push failed. You may need to authenticate.
    echo Try running: git config --global credential.helper manager
    pause
    exit /b 1
)

echo.
echo [4/4] Done! Changes pushed to GitHub successfully.
echo View your repo at: https://github.com/escar116/Websites
echo.
pause

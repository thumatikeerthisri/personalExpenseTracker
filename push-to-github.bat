@echo off
set "PATH=C:\Users\KEERTHI\AppData\Local\Programs\MinGit\cmd;%PATH%"

echo ========================================================
echo   Pushing Personal Expense Tracker to GitHub
echo ========================================================
echo Remote: https://github.com/thumatikeerthisri/personalExpenseTracker.git
echo Branch: main
echo.

git push -u origin main

echo.
echo ========================================================
pause

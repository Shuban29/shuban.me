@echo off
title Pushing Portfolio to GitHub (main)
echo ========================================================
echo Pushing portfolio to https://github.com/Shuban29/shuban.me.git
echo ========================================================
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Successfully pushed all changes to origin/main!
) else (
    echo [ERROR] Push failed. If prompted, please sign in via browser or check credentials.
)
echo.
pause

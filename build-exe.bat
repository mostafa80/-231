@echo off
chcp 65001 >nul
title تجهيز وتحويل برنامج الاستلامات إلى صيغة EXE
cls
echo ==============================================================================
echo        🦅 صقر الشرق - برنامج الاستلامات للفروع والمخازن
echo         أداة بناء وتحويل البرنامج إلى ملف تشغيلي EXE لويندوز
echo ==============================================================================
echo.

echo [1/3] فحص بيئة العمل والحزم الأساسية...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] لم يتم العثور على Node.js أو npm على جهازك!
    echo يرجى تحميل وتثبيت Node.js من الموقع الرسمي: https://nodejs.org
    pause
    exit /b
)

echo [2/3] بناء وتجهيز واجهة البرنامج (Vite Production Build)...
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشلت عملية بناء الواجهة. يرجى التأكد من تشغيل npm install أولاً.
    pause
    exit /b
)

echo.
echo [3/3] جاري تجميع وحزم ملف EXE المستقل لنظام ويندوز 64-بت...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo [تحذير] لم يكتمل بناء electron-builder. جاري المحاولة بنمط المحمول Portable...
    call npx electron-builder --win portable --x64
)

echo.
echo ==============================================================================
echo [تم بنجاح!] تم إنشاء ملف EXE بنجاح.
echo ستجد ملف التثبيت والبرنامج المحمول داخل المجلد:
echo      📁 dist-electron\
echo ==============================================================================
echo.
pause

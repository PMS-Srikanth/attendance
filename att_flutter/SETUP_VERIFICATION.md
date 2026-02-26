# Flutter App Development Setup - Verification Checklist

This document helps you verify everything is installed correctly for developing the AttendEase mobile app.

---

## ✅ What You've Already Installed

Based on our setup session:
- ✅ Flutter SDK 3.41.1 (extracted to Downloads)
- ✅ Android Studio (with SDK)
- ✅ Android SDK Command-line Tools
- ✅ Android Emulator (Medium Phone API 36.1)
- ✅ Basic Flutter app created at `att_flutter/`

---

## 🔍 Step-by-Step Verification (Run These Commands)

### 1) Open a **NEW** PowerShell Terminal
Close any existing terminals that show "Please choose one (or q to quit)".

Press `Ctrl + Shift + `` ` (backtick) in VS Code to open a new terminal.

### 2) Set Flutter Path (Temporary - for this terminal only)
```powershell
$env:Path = "$env:USERPROFILE\Downloads\flutter_windows_3.41.1-stable\flutter\bin;" + $env:Path
```

### 3) Check Flutter Version
```powershell
flutter --version
```

**Expected output:**
```
Flutter 3.41.1 • channel stable
```

### 4) Check Installation Status
```powershell
flutter doctor
```

**What you should see:**
- `[✓] Flutter` - Green checkmark
- `[✓] Windows Version` - Green checkmark
- `[✓] Android toolchain` - Green checkmark (or at least no "X")
- `[✓] Connected device` - Should show at least "Windows (desktop)" and "Edge (web)"

**Common warnings you can ignore (for now):**
- `[X] Chrome` - Not needed (you have Edge)
- `[X] Visual Studio` - Only needed for Windows desktop builds

### 5) Check Available Devices
```powershell
flutter devices
```

**Expected output (at minimum):**
```
Found 2 connected devices:
  Windows (desktop) • windows • windows-x64
  Edge (web)        • edge    • web-javascript
```

### 6) Check if App Compiles
```powershell
cd att_flutter
flutter pub get
flutter analyze
```

**Expected output:**
- `flutter pub get` → "Got dependencies!"
- `flutter analyze` → "No issues found!"

---

## 📱 Android Emulator Check

### Option A: Start Emulator from Android Studio
1. Open **Android Studio**
2. Click **More Actions** → **Device Manager**
3. Find **Medium Phone API 36.1** → click ▶ (Play button)
4. Wait 30-60 seconds for emulator to boot

### Option B: Start Emulator from Command Line
```powershell
flutter emulators
flutter emulators --launch Medium_Phone_API_36.1
```

After 30-60 seconds, run:
```powershell
flutter devices
```

**You should now see:**
```
Found 3 connected devices:
  sdk gphone x86 64 arm64 (mobile) • emulator-5554 • android-x64
  Windows (desktop) • windows • windows-x64
  Edge (web) • edge • web-javascript
```

---

## ✅ If All Checks Pass

**Your setup is COMPLETE.** You can now:
- Develop the app in VS Code
- Run it on Android emulator
- Build features for your phone app

---

## 🚀 Quick Start (After Verification)

### Run the app on Android emulator:
```powershell
# 1. Make sure emulator is running (see above)
# 2. Navigate to app folder
cd att_flutter

# 3. Run the app (Flutter will auto-select the emulator)
flutter run
```

**Tip:** To avoid device selection prompts, always specify the device:
```powershell
flutter run -d emulator-5554
```

---

## 📝 Current App Status

**What's built:**
- ✅ Basic app structure with navigation
- ✅ Login screen (calls `/health` endpoint to verify backend)
- ✅ Home screen (placeholder)
- ✅ API client (ready to call your FastAPI backend)
- ✅ Config file for backend URL

**Files to know:**
- `lib/main.dart` - App entry point & routes
- `lib/config.dart` - Backend URL (change for emulator vs real phone)
- `lib/screens/login_screen.dart` - Login UI
- `lib/screens/home_screen.dart` - Home UI
- `lib/services/api_client.dart` - Network calls
- `lib/services/auth_service.dart` - Login logic

**Next step:**
Add screens that match your website pages (Upload, Planner, Summary).

---

## ❌ If Something Fails

### Flutter not found
- Make sure you ran: `$env:Path = "...flutter\bin;" + $env:Path`
- Or add Flutter to Windows PATH permanently (see FLUTTER_SETUP_WINDOWS.md)

### Android toolchain issues
- Open Android Studio → SDK Manager
- Install: **Android SDK Command-line Tools (latest)**
- Run: `flutter doctor --android-licenses`

### Emulator not showing in `flutter devices`
- Wait 60 seconds after starting emulator
- Check if emulator window is open and booted (not just "loading")
- Run `adb devices` to verify

---

## 📞 Ready to Build

Once all checks pass, tell me and I'll add the first real feature:
- **Upload Attendance Screen** (file picker + preview)
- **Summary Screen** (call `/api/attendance/summary`)
- **Planner Screen** (what-if simulator)

Your goal: **make the phone app a convenient version of your deployed website**.

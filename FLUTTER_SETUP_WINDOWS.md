# Flutter setup on Windows (quick)

This repo includes a Flutter starter app at `att_flutter/`.

## 1) Make `flutter` available in PowerShell

Your extracted SDK is currently here:

- `C:\Users\srika\Downloads\flutter_windows_3.41.1-stable\flutter`

Add this to PATH:

- `C:\Users\srika\Downloads\flutter_windows_3.41.1-stable\flutter\bin`

**Temporary (current terminal only):**

```powershell
$env:Path = "C:\Users\srika\Downloads\flutter_windows_3.41.1-stable\flutter\bin;" + $env:Path
flutter --version
flutter doctor -v
```

**Permanent (recommended):**

Windows Search → **Edit the system environment variables** → **Environment Variables…** → select **Path** → **Edit** → **New** → paste the `...\flutter\bin` path → OK.

Then open a NEW PowerShell and re-run:

```powershell
flutter doctor -v
```

## 2) VS Code extensions you want

Install these extensions:

- **Dart** (`Dart-Code.dart-code`)
- **Flutter** (`Dart-Code.flutter`)

(These are the standard job-interview/tooling expectations.)

## 3) Android setup (needed for Android apps)

Right now `flutter doctor` reports **Android SDK missing**. For Android development you need:

1. Install **Android Studio**
2. Open Android Studio once → it installs the Android SDK
3. In **SDK Manager**, ensure you have:
   - Android SDK Platform (latest)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools (latest)
   - (Optional) Android Emulator + a system image
4. Accept licenses:

```powershell
flutter doctor --android-licenses
flutter doctor -v
```

If you installed the SDK to a custom location, point Flutter to it:

```powershell
flutter config --android-sdk "C:\path\to\Android\Sdk"
```

## 4) Windows desktop setup (optional)

`flutter doctor` also flags **Visual Studio** missing. You only need this if you want to build **Windows desktop** apps.

Install **Visual Studio 2022** and select workload:

- **Desktop development with C++**

Then re-run:

```powershell
flutter doctor -v
```

## 5) Web setup (optional)

Chrome is missing on this machine; you can still develop for web using **Edge**, or install Chrome.

## 6) Run the Flutter app in this repo

From repo root:

```powershell
cd att_flutter
flutter pub get
flutter run -d windows
```

(Once Android is set up you can also do `flutter run` for an emulator/device.)

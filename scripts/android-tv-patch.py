"""Делает один APK пригодным и для телефона, и для Android TV (иконка-баннер в меню ТВ, управление пультом)."""
import re, shutil, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
man = root / 'android/app/src/main/AndroidManifest.xml'
s = man.read_text()
if 'android.software.leanback' not in s:
    s = s.replace('<application', '<uses-feature android:name="android.software.leanback" android:required="false" />\n'
                  '    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n\n    <application', 1)
if 'android:banner' not in s:
    s = s.replace('<application', '<application\n        android:banner="@drawable/tv_banner"', 1)
if 'LEANBACK_LAUNCHER' not in s:
    s = re.sub(r'(<category android:name="android.intent.category.LAUNCHER"\s*/>)',
               r'\1\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />', s, count=1)
man.write_text(s)
dst = root / 'android/app/src/main/res/drawable'
dst.mkdir(parents=True, exist_ok=True)
shutil.copy(root / 'assets/tv-banner.png', dst / 'tv_banner.png')
# Номер версии приложения = номер сборки (приложение сравнивает его с последним APK)
n = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 1
g = root / 'android/app/build.gradle'
gs = g.read_text()
gs = re.sub(r'versionCode \d+', f'versionCode {n}', gs)
gs = re.sub(r'versionName "[^"]*"', f'versionName "1.0.{n}"', gs)
g.write_text(gs)
print('Android TV: манифест обновлён, версия 1.0.%d' % n)

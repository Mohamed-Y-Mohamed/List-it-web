# R8 rules for the List It Android shell.
#
# Capacitor resolves plugins by name at runtime — it reads the class list out of
# the generated plugin registration, instantiates each by reflection, and matches
# @PluginMethod members against the method name the JavaScript side asks for.
# R8 sees none of those call sites, so without the keeps below it renames or
# removes the plugins and every native call fails at runtime with a
# "plugin not implemented" error that never appears in a debug build.

# Keep the Capacitor bridge and every plugin that extends it.
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# Methods the WebView calls by name, and the annotations used to find them.
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*, JavascriptInterface

# Cordova plugins bridged through Capacitor are resolved the same reflective way.
-keep class org.apache.cordova.** { *; }

# Keep enough of the stack trace to read a crash report. Play symbolicates
# obfuscated traces from the mapping file that ships in the bundle, but line
# numbers have to survive for that to be worth anything.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

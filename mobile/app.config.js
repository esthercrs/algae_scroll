export default ({ config }) => ({
  ...config,
  name: "Algae Scroll",
  slug: "algae-scroll",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || "com.escros.algaescroll"
  },
  android: {
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "com.escros.algaescroll"
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000",
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || ""
    }
  }
});

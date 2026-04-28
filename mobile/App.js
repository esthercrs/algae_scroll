import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { FeedScreen } from "./src/screens/FeedScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: "#111", borderTopColor: "#222" },
          tabBarActiveTintColor: "#64D2FF",
          tabBarInactiveTintColor: "#777"
        }}
      >
        <Tab.Screen
          name="Nouveautes"
          options={{ title: "Nouveautes" }}
          children={() => <FeedScreen tab="new" />}
        />
        <Tab.Screen
          name="Archives"
          options={{ title: "Archives" }}
          children={() => <FeedScreen tab="archives" />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

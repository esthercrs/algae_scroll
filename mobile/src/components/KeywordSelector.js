import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { KEYWORDS } from "../constants";

export function KeywordSelector({ selected, onToggle }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {KEYWORDS.map((keyword) => {
          const active = selected.includes(keyword);
          return (
            <Pressable
              key={keyword}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(keyword)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{keyword}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8
  },
  chipActive: {
    borderColor: "#64D2FF",
    backgroundColor: "rgba(100, 210, 255, 0.15)"
  },
  chipText: {
    color: "#AAA",
    fontSize: 13
  },
  chipTextActive: {
    color: "#C7F0FF"
  }
});

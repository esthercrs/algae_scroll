import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export function ArticleCard({ article }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>{new Date(article.publication_date).toLocaleDateString()}</Text>

      <Text style={styles.sectionTitle}>Resume simplifie</Text>
      <Text style={styles.body}>{article.simplified_french || "Resume indisponible."}</Text>

      <Text style={styles.sectionTitle}>Concepts clefs</Text>
      <View style={styles.list}>
        {(article.key_points || []).slice(0, 4).map((point, index) => (
          <Text style={styles.point} key={`${article.id}-point-${index}`}>
            - {point}
          </Text>
        ))}
      </View>

      <Text style={styles.tags}>{(article.keywords || []).map((tag) => `#${tag}`).join(" ")}</Text>

      <Pressable onPress={() => Linking.openURL(article.doi_url)} style={styles.linkButton}>
        <Text style={styles.linkText}>Ouvrir l'article</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 18,
    margin: 14,
    padding: 18,
    justifyContent: "center"
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8
  },
  meta: {
    color: "#8E8E93",
    marginBottom: 14
  },
  sectionTitle: {
    color: "#64D2FF",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6
  },
  body: {
    color: "#E9E9EA",
    lineHeight: 20
  },
  list: {
    marginTop: 4
  },
  point: {
    color: "#E9E9EA",
    marginBottom: 4
  },
  tags: {
    color: "#9AE6B4",
    marginTop: 12
  },
  linkButton: {
    marginTop: 16,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  linkText: {
    color: "#C7F0FF",
    fontWeight: "700"
  }
});

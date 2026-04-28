import { useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export function ArticleCard({ article, onToggleLike }) {
  const { width } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);
  const styles = useMemo(() => buildStyles(width), [width]);
  const slideWidth = width - 28;
  const publicationDate = article.publication_date
    ? new Date(article.publication_date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "Date inconnue";
  const summary = useMemo(() => truncateWords(article.simplified_french || "Resume indisponible.", 160), [article]);
  const keyPoints = useMemo(() => normalizeFrenchBullets(article.key_points || []), [article]);
  const images = Array.isArray(article.images) ? article.images.slice(0, 2) : [];
  const slides = useMemo(() => {
    const base = ["summary", "keypoints"];
    if (images.length > 0) base.push("graphs");
    return base;
  }, [images.length]);

  function onHorizontalScroll(event) {
    const x = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width || 1;
    const index = Math.round(x / width);
    setActiveSlide(index);
  }

  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onHorizontalScroll}
        style={styles.pager}
      >
        <View style={[styles.slide, { width: slideWidth }]}>
          <ScrollView style={styles.slideScroll} contentContainerStyle={styles.slideContent}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.meta}>Publication: {publicationDate}</Text>
            <Text style={styles.sectionTitle}>Synthese</Text>
            <Text style={styles.body}>{summary}</Text>
            {(article.keywords || []).length > 0 ? (
              <Text style={styles.tags}>
                {(article.keywords || []).slice(0, 4).map((tag) => `#${tag}`).join(" ")}
              </Text>
            ) : null}
          </ScrollView>
        </View>

        <View style={[styles.slide, { width: slideWidth }]}>
          <ScrollView style={styles.slideScroll} contentContainerStyle={styles.slideContent}>
            <Text style={styles.title}>Points cles</Text>
            <Text style={styles.meta}>Essentiel a retenir</Text>
            <View style={styles.list}>
              {keyPoints.map((point, index) => (
                <View style={styles.pointRow} key={`${article.id}-point-${index}`}>
                  <Text style={styles.pointNumber}>{index + 1}.</Text>
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {images.length > 0 ? (
          <View style={[styles.slide, { width: slideWidth }]}>
            <ScrollView style={styles.slideScroll} contentContainerStyle={styles.slideContent}>
              <Text style={styles.title}>Graphiques</Text>
              <Text style={styles.meta}>Figures associees a l'article</Text>
              {images.map((image, index) => (
                <View key={`${article.id}-img-${index}`} style={styles.imageBlock}>
                  <Image source={{ uri: image.url }} style={styles.image} resizeMode="cover" />
                  <Text style={styles.caption}>{image.caption || "Figure de l'article"}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.dotsRow}>
        {slides.map((slide, index) => (
          <View key={`${article.id}-dot-${slide}`} style={[styles.dot, index === activeSlide && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.fixedActions}>
        <Pressable
          onPress={() => onToggleLike?.(article)}
          style={[styles.likeButton, article.is_liked && styles.likeButtonActive]}
          hitSlop={8}
        >
          <Text style={styles.likeText}>{article.is_liked ? "Aime" : "J'aime"}</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(article.article_url)} style={styles.linkButton} hitSlop={8}>
          <Text style={styles.linkText}>Voir l'article</Text>
        </Pressable>
      </View>
    </View>
  );
}

function truncateWords(text, maxWords = 120) {
  const words = String(text || "")
    .replace(/^en bref[:\s-]*/i, "")
    .replace(/\bdoi\s*:\s*\S+/gi, "")
    .replace(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function normalizeFrenchBullets(points) {
  const input = Array.isArray(points) ? points : [];
  const cleaned = input
    .map((point) =>
      String(point || "")
        .replace(/\bdoi\s*:\s*\S+/gi, "")
        .replace(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi, "")
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 6);

  if (cleaned.length >= 4) return cleaned;
  return [
    "Objectif: caracteriser precisement le phenomene observe.",
    "Methode: analyse croisee de donnees biologiques et environnementales.",
    "Resultat: identification de signaux associes au risque.",
    "Impact: soutien a la surveillance et a la decision."
  ];
}

function buildStyles(screenWidth) {
  const compact = screenWidth < 390;
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: "#111",
      borderRadius: 18,
      margin: 14,
      paddingTop: compact ? 14 : 18,
      overflow: "hidden"
    },
    pager: {
      flex: 1
    },
    slide: {
      paddingHorizontal: compact ? 14 : 18
    },
    slideScroll: {
      flex: 1
    },
    slideContent: {
      paddingBottom: 140
    },
    title: {
      fontSize: compact ? 30 : 34,
      fontWeight: "700",
      color: "#FFF",
      marginBottom: 8
    },
    meta: {
      color: "#C7F0FF",
      fontWeight: "600",
      marginBottom: 14,
      fontSize: compact ? 15 : 17
    },
    sectionTitle: {
      color: "#64D2FF",
      fontWeight: "700",
      marginTop: 8,
      marginBottom: 8,
      fontSize: compact ? 17 : 19
    },
    body: {
      color: "#E9E9EA",
      lineHeight: compact ? 26 : 29,
      fontSize: compact ? 16 : 18
    },
    list: {
      marginTop: 4
    },
    pointRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10
    },
    pointNumber: {
      color: "#9CA3AF",
      width: 22,
      fontSize: compact ? 14 : 16,
      fontWeight: "600",
      lineHeight: compact ? 24 : 27
    },
    pointText: {
      flex: 1,
      color: "#E9E9EA",
      fontSize: compact ? 15 : 17,
      lineHeight: compact ? 24 : 27
    },
    tags: {
      color: "#9AE6B4",
      marginTop: 14,
      fontSize: compact ? 14 : 15
    },
    imageBlock: {
      marginTop: 12
    },
    image: {
      width: "100%",
      height: compact ? 160 : 190,
      borderRadius: 12,
      backgroundColor: "#1F2937"
    },
    caption: {
      color: "#D1D5DB",
      marginTop: 6,
      fontSize: compact ? 13 : 14
    },
    dotsRow: {
      position: "absolute",
      bottom: 88,
      alignSelf: "center",
      flexDirection: "row",
      gap: 6,
      zIndex: 20
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#374151"
    },
    dotActive: {
      backgroundColor: "#64D2FF"
    },
    fixedActions: {
      position: "absolute",
      bottom: 14,
      left: 14,
      right: 14,
      flexDirection: "row",
      gap: 8,
      zIndex: 30,
      elevation: 6
    },
    likeButton: {
      flex: 1,
      backgroundColor: "#222",
      borderRadius: 10,
      paddingVertical: compact ? 11 : 12,
      alignItems: "center"
    },
    likeButtonActive: {
      backgroundColor: "#7C3AED"
    },
    likeText: {
      color: "#F3E8FF",
      fontWeight: "700",
      fontSize: compact ? 15 : 16
    },
    linkButton: {
      flex: 1,
      backgroundColor: "#1F2937",
      borderRadius: 10,
      paddingVertical: compact ? 11 : 12,
      alignItems: "center"
    },
    linkText: {
      color: "#C7F0FF",
      fontWeight: "700",
      fontSize: compact ? 15 : 16
    }
  });
}

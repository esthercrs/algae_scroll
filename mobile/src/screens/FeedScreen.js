import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchArticles, markArticleRead, setArticleLiked } from "../api";
import { ArticleCard } from "../components/ArticleCard";
import { KeywordSelector } from "../components/KeywordSelector";
import { useDeviceId } from "../hooks/useDeviceId";

const { height } = Dimensions.get("window");
const CACHE_VERSION = "v2";

export function FeedScreen({ tab }) {
  const deviceId = useDeviceId();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 80 }), []);
  const markedRef = useRef(new Set());
  const loadingRef = useRef(false);
  const latestPageLoadedRef = useRef(0);
  const ITEMS_PER_PAGE = 10;

  const storageKey = `cache:${CACHE_VERSION}:${tab}:${selectedKeywords.join("-") || "all"}`;

  const loadPage = useCallback(
    async (targetPage, reset = false) => {
      if (!deviceId || loadingRef.current) return;
      if (!reset && targetPage <= latestPageLoadedRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      try {
        setErrorMessage("");
        const data = await fetchArticles({
          tab,
          keywords: selectedKeywords,
          page: targetPage,
          deviceId
        });

        latestPageLoadedRef.current = targetPage;
        setHasMore(data.length === ITEMS_PER_PAGE);

        setItems((prev) => {
          const nextItems = reset ? data : [...prev, ...data];
          AsyncStorage.setItem(storageKey, JSON.stringify(nextItems));
          return nextItems;
        });
      } catch (error) {
        setErrorMessage(
          "Impossible de charger les articles. Verifie EXPO_PUBLIC_API_BASE_URL et que le backend tourne."
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [deviceId, tab, selectedKeywords, storageKey]
  );

  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        try {
          setItems(JSON.parse(cached));
        } catch {
          setItems([]);
        }
      }
      setPage(1);
      setHasMore(true);
      latestPageLoadedRef.current = 0;
      await loadPage(1, true);
    })();
  }, [tab, selectedKeywords, storageKey, deviceId, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    latestPageLoadedRef.current = 0;
    await loadPage(1, true);
    setRefreshing(false);
  }, [loadPage]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    const next = page + 1;
    setPage(next);
    await loadPage(next);
  }, [hasMore, page, loadPage]);

  const onViewableItemsChanged = useRef(async ({ viewableItems }) => {
    if (tab !== "new" || !deviceId) return;
    for (const viewable of viewableItems) {
      const id = viewable.item?.id;
      if (!id || markedRef.current.has(id)) continue;
      markedRef.current.add(id);
      try {
        await markArticleRead(id, deviceId);
        // Keep "Nouveautes" truly unread by removing items
        // immediately once they are viewed.
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch {
        // Fail silently for MVP; next refresh can retry.
      }
    }
  }).current;

  const toggleKeyword = useCallback((keyword) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }, []);

  const onToggleLike = useCallback(
    async (article) => {
      if (!deviceId) return;
      const nextLiked = !article.is_liked;
      setItems((prev) =>
        prev.map((item) => (item.id === article.id ? { ...item, is_liked: nextLiked } : item))
      );
      try {
        await setArticleLiked(article.id, deviceId, nextLiked);
        if (tab === "liked" && !nextLiked) {
          setItems((prev) => prev.filter((item) => item.id !== article.id));
        }
      } catch {
        // Revert optimistic update on error.
        setItems((prev) =>
          prev.map((item) => (item.id === article.id ? { ...item, is_liked: article.is_liked } : item))
        );
      }
    },
    [deviceId, tab]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeywordSelector selected={selectedKeywords} onToggle={toggleKeyword} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <ArticleCard article={item} onToggleLike={onToggleLike} />
          </View>
        )}
        pagingEnabled
        snapToInterval={height - 90}
        decelerationRate="fast"
        onEndReachedThreshold={0.15}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={loading ? <ActivityIndicator color="#64D2FF" /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {errorMessage || "Aucun article pour ce filtre. Essaie de retirer des mots-cles."}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1
  },
  page: {
    height: height - 90
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center"
  }
});

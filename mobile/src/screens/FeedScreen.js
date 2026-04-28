import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchArticles, markArticleRead } from "../api";
import { ArticleCard } from "../components/ArticleCard";
import { KeywordSelector } from "../components/KeywordSelector";
import { useDeviceId } from "../hooks/useDeviceId";

const { height } = Dimensions.get("window");

export function FeedScreen({ tab }) {
  const deviceId = useDeviceId();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 80 }), []);
  const markedRef = useRef(new Set());
  const loadingRef = useRef(false);
  const latestPageLoadedRef = useRef(0);
  const ITEMS_PER_PAGE = 10;

  const storageKey = `cache:${tab}:${selectedKeywords.join("-") || "all"}`;

  const loadPage = useCallback(
    async (targetPage, reset = false) => {
      if (!deviceId || loadingRef.current) return;
      if (!reset && targetPage <= latestPageLoadedRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      try {
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeywordSelector selected={selectedKeywords} onToggle={toggleKeyword} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <ArticleCard article={item} />
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
    paddingBottom: 20
  },
  page: {
    height: height - 90
  }
});

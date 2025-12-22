import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

const initialTodos = [
  { id: "welcome-1", title: "Tap a task to toggle complete", done: false, progress: 20 },
  { id: "welcome-2", title: "Swipe left to delete", done: false, progress: 60 }
];

export default function App() {
  const [todos, setTodos] = useState(initialTodos);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState("tasks");

  const remainingCount = useMemo(
    () => todos.filter((item) => !item.done).length,
    [todos]
  );

  const addTodo = () => {
    const title = draft.trim();
    if (!title) {
      Alert.alert("Add a task", "Type something first.");
      return;
    }
    const newTodo = {
      id: `${Date.now()}`,
      title,
      done: false,
      progress: 0
    };
    setTodos((prev) => [newTodo, ...prev]);
    setDraft("");
    Keyboard.dismiss();
  };

  const toggleTodo = (id) => {
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const toggled = { ...target, done: !target.done };
      const others = prev.filter((t) => t.id !== id);
      const active = others.filter((t) => !t.done);
      const completed = others.filter((t) => t.done);
      if (toggled.done) {
        return [...active, toggled, ...completed];
      }
      return [toggled, ...active, ...completed];
    });
  };

  const removeTodo = (id) => {
    setTodos((prev) => {
      const item = prev.find((todo) => todo.id === id);
      if (!item) {
        return prev;
      }
      setHistory((prevHistory) => [
        { ...item, deletedAt: new Date().toISOString() },
        ...prevHistory
      ]);
      return prev.filter((todo) => todo.id !== id);
    });
  };

  const restoreFromHistory = (deletedItem) => {
    setHistory((prev) =>
      prev.filter((item) => item.id !== deletedItem.id || item.deletedAt !== deletedItem.deletedAt)
    );
    setTodos((prev) => [
      { id: deletedItem.id, title: deletedItem.title, done: false, progress: deletedItem.progress },
      ...prev
    ]);
  };

  const purgeHistoryItem = (deletedItem) => {
    setHistory((prev) =>
      prev.filter((item) => item.id !== deletedItem.id || item.deletedAt !== deletedItem.deletedAt)
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.row, item.done && styles.rowDone]}
      onPress={() => toggleTodo(item.id)}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
          {item.done ? <Ionicons name="checkmark" size={16} color="#0b132b" /> : null}
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.title, item.done && styles.titleDone]}>{item.title}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.meta}>{`${item.progress}%`}</Text>
            <Slider
              style={styles.slider}
              value={item.progress}
              minimumValue={0}
              maximumValue={100}
              step={5}
              minimumTrackTintColor="#5ce1e6"
              maximumTrackTintColor="#243653"
              thumbTintColor="#fcbf49"
              thumbImage={null}
              thumbStyle={styles.sliderThumb}
              onSlidingComplete={(value) => {
                const rounded = Math.max(0, Math.min(100, Math.round(value)));
                setTodos((prev) =>
                  prev.map((todo) =>
                    todo.id === item.id ? { ...todo, progress: rounded } : todo
                  )
                );
              }}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => removeTodo(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color="#f05d5e" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={[styles.row, styles.historyRow]}>
      <View style={styles.rowLeft}>
        <View style={[styles.checkbox, styles.historyBadge]}>
          <Ionicons name="time-outline" size={16} color="#0b132b" />
        </View>
        <View style={{ flex: 1.2 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{new Date(item.deletedAt).toLocaleString()}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
          </View>
        <Text style={styles.meta}>{`${item.progress || 0}%`}</Text>
      </View>
    </View>
    <View style={styles.historyActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.restoreButton]}
          onPress={() => restoreFromHistory(item)}
        >
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => purgeHistoryItem(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.heading}>Today</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "tasks" && styles.tabButtonActive]}
            onPress={() => setTab("tasks")}
          >
            <Text style={[styles.tabLabel, tab === "tasks" && styles.tabLabelActive]}>
              Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "history" && styles.tabButtonActive]}
            onPress={() => setTab("history")}
          >
            <Text style={[styles.tabLabel, tab === "history" && styles.tabLabelActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "tasks" ? (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {remainingCount === 0
                  ? "All caught up. Nice work!"
                  : `${remainingCount} task${remainingCount === 1 ? "" : "s"} left`}
              </Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Add a task..."
                placeholderTextColor="#8ea1c0"
                onSubmitEditing={addTodo}
                returnKeyType="done"
                style={styles.input}
              />
              <TouchableOpacity style={styles.addButton} onPress={addTodo}>
                <Ionicons name="add" size={24} color="#0b132b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={todos}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={styles.empty}>No tasks yet. Add your first one above.</Text>
              }
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id + item.deletedAt}
            renderItem={renderHistoryItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No deleted tasks yet.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070d1f"
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    width: "100%",
    maxWidth: 820,
    alignSelf: "center"
  },
  heading: {
    color: "#f5f7fb",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 10
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#101a30",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  tabButtonActive: {
    backgroundColor: "#20304f"
  },
  tabLabel: {
    color: "#9fb7da",
    fontWeight: "600"
  },
  tabLabelActive: {
    color: "#f5f7fb"
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  summaryText: {
    color: "#d6e3ff",
    fontSize: 16,
    flexShrink: 1
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#10203d",
    color: "#f5f7fb",
    fontSize: 17
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: "#5ce1e6",
    borderRadius: 14,
    padding: 14
  },
  listContent: {
    flexGrow: 1
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#15284b",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16
  },
  rowDone: {
    opacity: 0.75
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#4bbf73",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  checkboxDone: {
    backgroundColor: "#4bbf73"
  },
  historyBadge: {
    backgroundColor: "#5ce1e6",
    borderColor: "#5ce1e6"
  },
  rowBody: {
    flex: 1,
    gap: 6
  },
  title: {
    color: "#f5f7fb",
    fontSize: 18,
    flexShrink: 1,
    fontWeight: "700"
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "#9fb1cd"
  },
  meta: {
    color: "#b6c8e5",
    fontSize: 13,
    marginTop: 2
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  slider: {
    flex: 1,
    height: 36
  },
  sliderThumb: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#243653",
    overflow: "hidden",
    marginTop: 6
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5ce1e6"
  },
  metaMuted: {
    color: "#94a7c9",
    fontSize: 12
  },
  historyRow: {
    alignItems: "flex-start"
  },
  historyActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  actionButtonText: {
    color: "#0b132b",
    fontWeight: "700",
    fontSize: 13
  },
  restoreButton: {
    backgroundColor: "#4bbf73"
  },
  deleteButton: {
    backgroundColor: "#fcbf49"
  },
  separator: {
    height: 12
  },
  empty: {
    color: "#8ea1c0",
    textAlign: "center",
    marginTop: 30
  }
});

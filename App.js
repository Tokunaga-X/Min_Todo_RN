import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

const initialTodos = [
  { id: "welcome-1", title: "Tap a task to toggle complete", done: false, progress: 20 },
  { id: "welcome-2", title: "Swipe left to delete", done: false, progress: 60 }
];

const initialGoals = [
  {
    id: "g-1",
    title: "Finish a Java course",
    createdAt: "2024-02-01T09:00:00.000Z",
    durationDays: 7,
    term: "short",
    progress: 4,
    color: "#2fb97f"
  },
  {
    id: "g-2",
    title: "Run a marathon",
    createdAt: "2024-02-15T09:00:00.000Z",
    durationDays: 30,
    term: "short",
    progress: 2,
    color: "#6d5bd0"
  },
  {
    id: "g-3",
    title: "Learn Spanish",
    createdAt: "2024-03-01T09:00:00.000Z",
    durationDays: 30,
    term: "short",
    progress: 1,
    color: "#f6ad55"
  },
  {
    id: "g-4",
    title: "Start an online business",
    createdAt: "2024-03-10T09:00:00.000Z",
    durationDays: 30,
    term: "short",
    progress: 0,
    color: "#f472b6"
  },
  {
    id: "g-5",
    title: "Travel to India",
    createdAt: "2024-03-20T09:00:00.000Z",
    durationDays: 7,
    term: "short",
    progress: 0,
    color: "#d1d5db"
  },
  {
    id: "g-6",
    title: "Write a book",
    createdAt: "2024-01-01T09:00:00.000Z",
    durationDays: 365,
    term: "long",
    progress: 0,
    color: "#d1d5db"
  },
  {
    id: "g-7",
    title: "Learn piano",
    createdAt: "2024-01-15T09:00:00.000Z",
    durationDays: 365,
    term: "long",
    progress: 0,
    color: "#d1d5db"
  }
];

const durationOptions = {
  "1d": { label: "1 day", days: 1, term: "short" },
  "1w": { label: "1 week", days: 7, term: "short" },
  "1m": { label: "1 month", days: 30, term: "long" },
  "1y": { label: "1 year", days: 365, term: "long" }
};

const durationKeys = Object.keys(durationOptions);

const colorOptions = [
  { label: "Emerald", value: "#2fb97f" },
  { label: "Indigo", value: "#6d5bd0" },
  { label: "Amber", value: "#f6ad55" },
  { label: "Rose", value: "#f472b6" },
  { label: "Stone", value: "#d1d5db" }
];

const emptyGoalForm = {
  title: "",
  durationKey: "1w",
  progress: 0,
  color: colorOptions[0].value
};

const createId = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const STORAGE_KEY = "min_todo_rn_state_v1";
const initialDailyTasks = [
  {
    id: "daily-exercise",
    title: "exercise",
    createdAt: new Date().toISOString(),
    records: {},
    notes: {}
  }
];

const celebrationParticles = [
  { angle: -90, distance: 170, color: "#5ce1e6" },
  { angle: -55, distance: 165, color: "#fcbf49" },
  { angle: -20, distance: 160, color: "#4bbf73" },
  { angle: 20, distance: 160, color: "#f472b6" },
  { angle: 55, distance: 165, color: "#6d5bd0" },
  { angle: 90, distance: 170, color: "#f6ad55" },
  { angle: 125, distance: 155, color: "#5ce1e6" },
  { angle: 160, distance: 150, color: "#fcbf49" },
  { angle: -125, distance: 155, color: "#f472b6" },
  { angle: -160, distance: 150, color: "#4bbf73" }
];

const getDurationKey = (durationDays) => {
  if (durationDays === 1) return "1d";
  if (durationDays === 7) return "1w";
  if (durationDays === 30) return "1m";
  if (durationDays === 365) return "1y";
  return "1w";
};

const getElapsedInfo = (createdAt, durationDays) => {
  if (!createdAt || !durationDays) {
    return { elapsedDays: 0, remainingDays: durationDays || 0 };
  }
  const start = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, durationDays - elapsedDays);
  return { elapsedDays, remainingDays };
};

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDayStart = (dateValue) => {
  const date = new Date(dateValue);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const toMonthStart = (dateValue) => {
  const date = new Date(dateValue);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const addMonths = (dateValue, diff) => {
  const date = toMonthStart(dateValue);
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
};

const formatDateKey = (dateValue) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildMonthCells = (monthDate) => {
  const firstDay = toMonthStart(monthDate);
  const offset = firstDay.getDay();
  const daysInMonth = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0
  ).getDate();
  const cells = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

const normalizeDailyTask = (task) => {
  const safeRecords = task?.records && typeof task.records === "object" ? task.records : {};
  const safeNotes = task?.notes && typeof task.notes === "object" ? task.notes : {};
  const checkedKeys = Object.keys(safeRecords).filter((key) => safeRecords[key]);
  const firstCheckedKey = checkedKeys.sort()[0];
  return {
    id: task?.id || createId(),
    title: task?.title || "daily task",
    createdAt:
      task?.createdAt ||
      (firstCheckedKey ? `${firstCheckedKey}T00:00:00` : new Date().toISOString()),
    records: safeRecords,
    notes: safeNotes
  };
};

export default function App() {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const [todos, setTodos] = useState(initialTodos);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [todoTab, setTodoTab] = useState("tasks");
  const [rootTab, setRootTab] = useState("daily-check");
  const [goals, setGoals] = useState(initialGoals);
  const [goalModal, setGoalModal] = useState({ visible: false, editing: null });
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [dailyTasks, setDailyTasks] = useState(initialDailyTasks);
  const [dailyDraft, setDailyDraft] = useState("");
  const [isDailySessionOpen, setIsDailySessionOpen] = useState(false);
  const [dailyCalendarTaskId, setDailyCalendarTaskId] = useState(null);
  const [dailyCalendarMonth, setDailyCalendarMonth] = useState(toMonthStart(new Date()));
  const [dailyCalendarSelectedDateKey, setDailyCalendarSelectedDateKey] = useState(null);
  const [dailyEditModal, setDailyEditModal] = useState({ visible: false, taskId: null });
  const [dailyEditDraft, setDailyEditDraft] = useState("");
  const [dailySessionIndex, setDailySessionIndex] = useState(0);
  const [holdTaskId, setHoldTaskId] = useState(null);
  const [holdCompletedTaskId, setHoldCompletedTaskId] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [dailyNoteModal, setDailyNoteModal] = useState({ visible: false, taskId: null });
  const [dailyNoteDraft, setDailyNoteDraft] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdShake = useRef(new Animated.Value(0)).current;
  const celebrationProgress = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef(null);
  const holdShakeLoopRef = useRef(null);

  const remainingCount = useMemo(
    () => todos.filter((item) => !item.done).length,
    [todos]
  );
  const dailyCalendarTask = useMemo(
    () => dailyTasks.find((task) => task.id === dailyCalendarTaskId) || null,
    [dailyTasks, dailyCalendarTaskId]
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.todos)) {
          setTodos(parsed.todos);
        }
        if (Array.isArray(parsed?.history)) {
          setHistory(parsed.history);
        }
        if (Array.isArray(parsed?.goals)) {
          setGoals(parsed.goals);
        }
        if (Array.isArray(parsed?.dailyTasks)) {
          setDailyTasks(parsed.dailyTasks.map(normalizeDailyTask));
        }
      } catch (error) {
        console.warn("Failed to load local state", error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const payload = JSON.stringify({ todos, history, goals, dailyTasks });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch((error) => {
      console.warn("Failed to persist local state", error);
    });
  }, [isHydrated, todos, history, goals, dailyTasks]);

  useEffect(() => () => clearHoldAnimation(), []);

  useEffect(() => {
    if (dailySessionIndex >= dailyTasks.length && dailyTasks.length > 0) {
      setDailySessionIndex(dailyTasks.length - 1);
    }
    if (dailyTasks.length === 0) {
      setDailySessionIndex(0);
      endHoldComplete();
    }
  }, [dailyTasks.length, dailySessionIndex]);

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
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={() => removeTodo(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#0b132b" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      )}
      overshootRight={false}
      rightThreshold={40}
    >
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
      </TouchableOpacity>
    </Swipeable>
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

  const openGoalModal = (editing = null) => {
    setGoalModal({ visible: true, editing });
    setGoalForm({
      ...emptyGoalForm,
      ...(editing
        ? {
            title: editing.title,
            durationKey: getDurationKey(editing.durationDays),
            progress: editing.progress,
            color: editing.color
          }
        : {})
    });
  };

  const closeGoalModal = () => {
    setGoalModal({ visible: false, editing: null });
    setGoalForm(emptyGoalForm);
  };

  const updateGoalForm = (key, value) => {
    setGoalForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveGoal = () => {
    const selected = durationOptions[goalForm.durationKey] || durationOptions["1w"];
    const payload = {
      id: goalModal.editing?.id || createId(),
      title: goalForm.title.trim() || "Untitled goal",
      createdAt: goalModal.editing?.createdAt || new Date().toISOString(),
      durationDays: selected.days,
      term: selected.term,
      progress: Number(goalForm.progress) || 0,
      color: goalForm.color
    };

    setGoals((prev) =>
      goalModal.editing
        ? prev.map((goal) => (goal.id === goalModal.editing.id ? payload : goal))
        : [payload, ...prev]
    );
    closeGoalModal();
  };

  const handleGoalProgress = (goalId, value) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, progress: value } : goal))
    );
  };

  const handleGoalDelete = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const handleGoalReset = (goalId) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, progress: 0 } : goal))
    );
  };

  const addDailyTask = () => {
    const title = dailyDraft.trim();
    if (!title) {
      Alert.alert("Add daily task", "Type something first.");
      return;
    }
    const newTask = {
      id: createId(),
      title,
      createdAt: new Date().toISOString(),
      records: {},
      notes: {}
    };
    setDailyTasks((prev) => [newTask, ...prev]);
    setDailyDraft("");
    Keyboard.dismiss();
  };

  const openDailyTaskEdit = (task) => {
    setDailyEditModal({ visible: true, taskId: task.id });
    setDailyEditDraft(task.title);
  };

  const closeDailyTaskEdit = () => {
    setDailyEditModal({ visible: false, taskId: null });
    setDailyEditDraft("");
  };

  const saveDailyTaskEdit = () => {
    const title = dailyEditDraft.trim();
    if (!title) {
      Alert.alert("Edit daily task", "Title can't be empty.");
      return;
    }
    setDailyTasks((prev) =>
      prev.map((task) =>
        task.id === dailyEditModal.taskId
          ? {
              ...task,
              title
            }
          : task
      )
    );
    closeDailyTaskEdit();
  };

  const openDailyNoteModal = (task) => {
    const todayKey = getTodayKey();
    setDailyNoteModal({ visible: true, taskId: task.id });
    setDailyNoteDraft(task.notes?.[todayKey] || "");
  };

  const closeDailyNoteModal = () => {
    setDailyNoteModal({ visible: false, taskId: null });
    setDailyNoteDraft("");
  };

  const saveDailyNote = () => {
    const note = dailyNoteDraft.trim();
    const todayKey = getTodayKey();
    setDailyTasks((prev) =>
      prev.map((task) => {
        if (task.id !== dailyNoteModal.taskId) return task;
        const nextNotes = { ...(task.notes || {}) };
        if (note) {
          nextNotes[todayKey] = note;
        } else {
          delete nextNotes[todayKey];
        }
        return {
          ...task,
          notes: nextNotes
        };
      })
    );
    closeDailyNoteModal();
  };

  const moveDailyTask = (taskId, direction) => {
    setDailyTasks((prev) => {
      const currentIndex = prev.findIndex((task) => task.id === taskId);
      if (currentIndex < 0) return prev;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[currentIndex];
      next[currentIndex] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const deleteDailyTask = (id) => {
    if (dailyCalendarTaskId === id) {
      setDailyCalendarTaskId(null);
    }
    if (dailyEditModal.taskId === id) {
      closeDailyTaskEdit();
    }
    if (dailyNoteModal.taskId === id) {
      closeDailyNoteModal();
    }
    setDailyTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const markDailyTaskDone = (id) => {
    const todayKey = getTodayKey();
    setDailyTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              records: {
                ...(task.records || {}),
                [todayKey]: true
              }
            }
          : task
      )
    );
  };

  const clearHoldAnimation = () => {
    if (holdTimerRef.current) {
      holdTimerRef.current.stop();
      holdTimerRef.current = null;
    }
    if (holdShakeLoopRef.current) {
      holdShakeLoopRef.current.stop();
      holdShakeLoopRef.current = null;
    }
    holdProgress.stopAnimation();
    holdShake.stopAnimation();
    holdProgress.setValue(0);
    holdShake.setValue(0);
  };

  const runCelebration = () => {
    celebrationProgress.stopAnimation();
    celebrationProgress.setValue(0);
    setIsCelebrating(true);
    Animated.sequence([
      Animated.timing(celebrationProgress, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true
      }),
      Animated.delay(240)
    ]).start(() => {
      setIsCelebrating(false);
      celebrationProgress.setValue(0);
    });
  };

  const startHoldComplete = (taskId, checkedToday) => {
    if (checkedToday) return;
    clearHoldAnimation();
    setHoldTaskId(taskId);
    setHoldCompletedTaskId(null);

    holdShakeLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(holdShake, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true
        }),
        Animated.timing(holdShake, {
          toValue: -1,
          duration: 70,
          useNativeDriver: true
        }),
        Animated.timing(holdShake, {
          toValue: 0,
          duration: 70,
          useNativeDriver: true
        })
      ])
    );
    holdShakeLoopRef.current.start();

    holdTimerRef.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false
    });
    holdTimerRef.current.start(({ finished }) => {
      if (finished) {
        markDailyTaskDone(taskId);
        runCelebration();
        setHoldCompletedTaskId(taskId);
        setHoldTaskId(null);
      }
      clearHoldAnimation();
    });
  };

  const endHoldComplete = () => {
    setHoldTaskId(null);
    setHoldCompletedTaskId(null);
    clearHoldAnimation();
  };

  const openDailyCalendar = (task) => {
    setDailyCalendarTaskId(task.id);
    setDailyCalendarMonth(toMonthStart(new Date()));
    setDailyCalendarSelectedDateKey(getTodayKey());
  };

  const shortGoals = goals.filter((goal) => goal.term === "short");
  const longGoals = goals.filter((goal) => goal.term === "long");

  const renderTodoScreen = () => (
    <View style={styles.container}>
      <Text style={styles.heading}>Today</Text>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, todoTab === "tasks" && styles.tabButtonActive]}
          onPress={() => setTodoTab("tasks")}
        >
          <Text style={[styles.tabLabel, todoTab === "tasks" && styles.tabLabelActive]}>
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, todoTab === "history" && styles.tabButtonActive]}
          onPress={() => setTodoTab("history")}
        >
          <Text style={[styles.tabLabel, todoTab === "history" && styles.tabLabelActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {todoTab === "tasks" ? (
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
          ListEmptyComponent={<Text style={styles.empty}>No deleted tasks yet.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );

  const renderGoalCard = (goal) => {
    const percent = Math.round((goal.progress / 10) * 1000) / 10;
    const { elapsedDays, remainingDays } = getElapsedInfo(goal.createdAt, goal.durationDays);
    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalCardHeader}>
          <View style={styles.goalCardTitle}>
            <View style={[styles.goalAccent, { backgroundColor: goal.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalMeta}>
                {elapsedDays} days elapsed · {remainingDays} days left
              </Text>
            </View>
          </View>
          <View style={styles.goalActions}>
            <Pressable style={styles.goalActionButton} onPress={() => openGoalModal(goal)}>
              <Text style={styles.goalActionText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.goalActionButton}
              onPress={() => handleGoalReset(goal.id)}
            >
              <Text style={styles.goalActionMuted}>Reset</Text>
            </Pressable>
            <Pressable
              style={styles.goalActionButton}
              onPress={() => handleGoalDelete(goal.id)}
            >
              <Text style={styles.goalActionDanger}>Delete</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.dotRow}>
          {Array.from({ length: 10 }).map((_, index) => {
            const filled = index < goal.progress;
            return (
              <Pressable
                key={`${goal.id}-dot-${index}`}
                onPress={() => handleGoalProgress(goal.id, index + 1)}
                style={[
                  styles.progressDot,
                  filled && { backgroundColor: goal.color, borderColor: goal.color }
                ]}
              />
            );
          })}
        </View>
        <View style={styles.goalPercentRow}>
          <Text style={styles.goalPercent}>{percent}%</Text>
          <View style={styles.goalPercentBadge} />
        </View>
      </View>
    );
  };

  const renderGoalScreen = () => (
    <View style={styles.container}>
      <Text style={styles.heading}>Goals</Text>
      <TouchableOpacity style={styles.goalAddButton} onPress={() => openGoalModal(null)}>
        <Ionicons name="add" size={20} color="#0b132b" />
        <Text style={styles.goalAddText}>New Goal</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.goalScroll}>
        <Text style={styles.sectionHeading}>Short term</Text>
        {shortGoals.length === 0 ? (
          <Text style={styles.empty}>No short-term goals yet.</Text>
        ) : (
          shortGoals.map(renderGoalCard)
        )}
        <Text style={styles.sectionHeading}>Long term</Text>
        {longGoals.length === 0 ? (
          <Text style={styles.empty}>No long-term goals yet.</Text>
        ) : (
          longGoals.map(renderGoalCard)
        )}
      </ScrollView>
    </View>
  );

  const renderDailyTaskItem = (task, index) => {
    const todayKey = getTodayKey();
    const checkedToday = Boolean(task.records?.[todayKey]);
    const checkedDays = Object.values(task.records || {}).filter(Boolean).length;
    return (
      <View key={task.id} style={styles.dailyTaskCard}>
        <View style={styles.dailyTaskHead}>
          <View style={styles.dailyTaskTitleWrap}>
            <View style={styles.dailyTaskTitleRow}>
              <Text style={styles.dailyTaskTitle}>{task.title}</Text>
              <TouchableOpacity
                style={styles.dailyTitleEditButton}
                onPress={() => openDailyTaskEdit(task)}
              >
                <Ionicons name="create-outline" size={14} color="#d6e3ff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dailyTaskMeta}>{`Checked ${checkedDays} day${
              checkedDays === 1 ? "" : "s"
            }`}</Text>
          </View>
          {checkedToday ? (
            <View style={styles.dailyDoneBadge}>
              <Ionicons name="checkmark" size={14} color="#0b132b" />
              <Text style={styles.dailyDoneBadgeText}>Today done</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dailyTaskActions}>
          <View style={styles.dailyTaskActionGroup}>
            <TouchableOpacity
              style={[styles.dailyTaskAction, index === 0 && styles.dailyTaskActionDisabled]}
              onPress={() => moveDailyTask(task.id, -1)}
              disabled={index === 0}
            >
              <Ionicons name="arrow-up-outline" size={14} color="#d6e3ff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dailyTaskAction,
                index === dailyTasks.length - 1 && styles.dailyTaskActionDisabled
              ]}
              onPress={() => moveDailyTask(task.id, 1)}
              disabled={index === dailyTasks.length - 1}
            >
              <Ionicons name="arrow-down-outline" size={14} color="#d6e3ff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.dailyTaskAction}
            onPress={() => openDailyCalendar(task)}
          >
            <Ionicons name="calendar-outline" size={14} color="#d6e3ff" />
            <Text style={styles.dailyTaskActionText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dailyTaskDanger}
            onPress={() => deleteDailyTask(task.id)}
          >
            <Ionicons name="trash-outline" size={14} color="#f05d5e" />
            <Text style={styles.dailyTaskDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDailyCheckScreen = () => (
    <View style={styles.container}>
      <Text style={styles.heading}>Daily Check</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={dailyDraft}
          onChangeText={setDailyDraft}
          placeholder="Add daily task (e.g. exercise)"
          placeholderTextColor="#8ea1c0"
          onSubmitEditing={addDailyTask}
          returnKeyType="done"
          style={styles.input}
        />
        <TouchableOpacity style={styles.addButton} onPress={addDailyTask}>
          <Ionicons name="add" size={24} color="#0b132b" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.dailyPrimaryButton}
        onPress={() => {
          setDailySessionIndex(0);
          setIsDailySessionOpen(true);
        }}
      >
        <Text style={styles.dailyPrimaryButtonText}>开始 daily check</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.dailyList}>
        {dailyTasks.length === 0 ? (
          <Text style={styles.empty}>No daily task yet.</Text>
        ) : (
          dailyTasks.map((task, index) => renderDailyTaskItem(task, index))
        )}
      </ScrollView>
    </View>
  );

  const renderComingSoonScreen = () => (
    <View style={styles.container}>
      <Text style={styles.heading}>working on it...</Text>
    </View>
  );

  const calendarWeekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStart = toDayStart(new Date());
  const taskCreatedStart = dailyCalendarTask
    ? toDayStart(dailyCalendarTask.createdAt || new Date())
    : toDayStart(new Date());
  const minCalendarMonth = toMonthStart(taskCreatedStart);
  const maxCalendarMonth = toMonthStart(todayStart);
  const canGoPrevMonth = dailyCalendarMonth.getTime() > minCalendarMonth.getTime();
  const canGoNextMonth = dailyCalendarMonth.getTime() < maxCalendarMonth.getTime();
  const calendarMonthTitle = `${dailyCalendarMonth.getFullYear()}-${`${dailyCalendarMonth.getMonth() + 1}`.padStart(2, "0")}`;
  const calendarCells = buildMonthCells(dailyCalendarMonth);
  const selectedDateNote =
    dailyCalendarTask && dailyCalendarSelectedDateKey
      ? dailyCalendarTask.notes?.[dailyCalendarSelectedDateKey] || ""
      : "";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.appShell}>
          {rootTab === "daily-check" ? renderDailyCheckScreen() : renderComingSoonScreen()}
        </View>
        <View style={styles.bottomTabs}>
          <Pressable
            style={[styles.bottomTab, rootTab === "daily-check" && styles.bottomTabActive]}
            onPress={() => setRootTab("daily-check")}
          >
            <Ionicons
              name={rootTab === "daily-check" ? "today" : "today-outline"}
              size={22}
              color={rootTab === "daily-check" ? "#0b132b" : "#9fb7da"}
            />
            <Text
              style={[
                styles.bottomTabLabel,
                rootTab === "daily-check" && styles.bottomTabLabelActive
              ]}
            >
              Daily
            </Text>
          </Pressable>
          <Pressable
            style={[styles.bottomTab, rootTab === "todo" && styles.bottomTabActive]}
            onPress={() => setRootTab("todo")}
          >
            <Ionicons
              name={rootTab === "todo" ? "checkmark-circle" : "checkmark-circle-outline"}
              size={22}
              color={rootTab === "todo" ? "#0b132b" : "#9fb7da"}
            />
            <Text style={[styles.bottomTabLabel, rootTab === "todo" && styles.bottomTabLabelActive]}>
              Todo
            </Text>
          </Pressable>
          <Pressable
            style={[styles.bottomTab, rootTab === "goal" && styles.bottomTabActive]}
            onPress={() => setRootTab("goal")}
          >
            <Ionicons
              name={rootTab === "goal" ? "flag" : "flag-outline"}
              size={22}
              color={rootTab === "goal" ? "#0b132b" : "#9fb7da"}
            />
            <Text
              style={[
                styles.bottomTabLabel,
                rootTab === "goal" && styles.bottomTabLabelActive
              ]}
            >
              Goal
            </Text>
          </Pressable>
        </View>

        <Modal visible={goalModal.visible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {goalModal.editing ? "Edit goal" : "New goal"}
                </Text>
                <Pressable onPress={closeGoalModal}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <View>
                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    value={goalForm.title}
                    onChangeText={(value) => updateGoalForm("title", value)}
                    placeholder="Goal title"
                    placeholderTextColor="#8ea1c0"
                    style={styles.modalInput}
                  />
                </View>
                <View style={styles.modalRow}>
                  <View style={styles.modalColumn}>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <View style={styles.optionRow}>
                      {durationKeys.map((key) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.optionChip,
                            goalForm.durationKey === key && styles.optionChipActive
                          ]}
                          onPress={() => updateGoalForm("durationKey", key)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              goalForm.durationKey === key && styles.optionChipTextActive
                            ]}
                          >
                            {durationOptions[key].label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <View style={styles.modalColumn}>
                    <Text style={styles.modalLabel}>Progress</Text>
                    <Slider
                      value={goalForm.progress}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      minimumTrackTintColor="#5ce1e6"
                      maximumTrackTintColor="#243653"
                      thumbTintColor="#fcbf49"
                      onValueChange={(value) => updateGoalForm("progress", value)}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.modalLabel}>Color</Text>
                  <View style={styles.colorRow}>
                    {colorOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.colorChip,
                          goalForm.color === option.value && styles.colorChipActive
                        ]}
                        onPress={() => updateGoalForm("color", option.value)}
                      >
                        <View style={[styles.colorSwatch, { backgroundColor: option.value }]} />
                        <Text style={styles.colorLabel}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.modalFooter}>
                <Pressable style={styles.modalCancel} onPress={closeGoalModal}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={handleSaveGoal}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isDailySessionOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setIsDailySessionOpen(false);
            endHoldComplete();
          }}
        >
          <SafeAreaView style={styles.dailyFullscreen}>
            <View style={styles.dailyFullscreenHeader}>
              <Text style={styles.dailyFullscreenTitle}>Daily Check</Text>
              <Pressable
                style={styles.dailyExitButton}
                onPress={() => {
                  setIsDailySessionOpen(false);
                  endHoldComplete();
                }}
              >
                <Text style={styles.dailyExitButtonText}>Exit</Text>
              </Pressable>
            </View>
            {dailyTasks.length === 0 ? (
              <View style={styles.dailySessionEmptyWrap}>
                <Text style={styles.empty}>No daily task yet.</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={dailyTasks}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const nextIndex = Math.round(offsetX / Math.max(viewportWidth, 1));
                    setDailySessionIndex(nextIndex);
                    endHoldComplete();
                  }}
                  getItemLayout={(_, index) => ({
                    length: viewportWidth,
                    offset: viewportWidth * index,
                    index
                  })}
                  initialScrollIndex={Math.min(dailySessionIndex, Math.max(dailyTasks.length - 1, 0))}
                  renderItem={({ item }) => {
                    const checkedToday = Boolean(item.records?.[getTodayKey()]);
                    const todayNote = item.notes?.[getTodayKey()] || "";
                    const isHolding = holdTaskId === item.id;
                    const completedByHold = holdCompletedTaskId === item.id;
                    const circleFillHeight =
                      isHolding || completedByHold
                        ? holdProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 76]
                          })
                        : 0;
                    const questionSize = Math.max(
                      42,
                      Math.min(86, Math.floor(Math.min(viewportWidth, viewportHeight) * 0.1))
                    );

                    return (
                      <View style={[styles.dailySessionPage, { width: viewportWidth }]}>
                        <Text style={[styles.dailySessionQuestion, { fontSize: questionSize }]}>
                          {`你今天${item.title}了吗？`}
                        </Text>
                        <Text style={styles.dailySessionHint}>左右滑动切换任务</Text>

                        <Animated.View
                          style={{
                            transform: [
                              {
                                translateX: holdShake.interpolate({
                                  inputRange: [-1, 1],
                                  outputRange: [-4, 4]
                                })
                              }
                            ]
                          }}
                        >
                          <Pressable
                            style={[
                              styles.dailyHoldButton,
                              checkedToday && styles.dailyHoldButtonDone
                            ]}
                            onPressIn={() => startHoldComplete(item.id, checkedToday)}
                            onPressOut={endHoldComplete}
                          >
                            <Animated.View
                              pointerEvents="none"
                              style={[styles.dailyHoldFill, { height: circleFillHeight }]}
                            />
                            <View style={styles.dailyHoldInner}>
                              <Ionicons
                                name={checkedToday ? "checkmark" : "finger-print-outline"}
                                size={30}
                                color="#0b132b"
                              />
                            </View>
                          </Pressable>
                        </Animated.View>
                        <Text style={styles.dailyHoldHint}>
                          {checkedToday ? "已完成" : "按住 3 秒完成"}
                        </Text>
                        {checkedToday ? (
                          <>
                            <TouchableOpacity
                              style={styles.dailyNoteButton}
                              onPress={() => openDailyNoteModal(item)}
                            >
                              <Ionicons name="document-text-outline" size={16} color="#0b132b" />
                              <Text style={styles.dailyNoteButtonText}>
                                {todayNote ? "编辑今日备注" : "添加今日备注"}
                              </Text>
                            </TouchableOpacity>
                            {todayNote ? (
                              <View style={styles.dailyNotePreview}>
                                <Text style={styles.dailyNotePreviewText}>{todayNote}</Text>
                              </View>
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    );
                  }}
                />
                <Text style={styles.dailySessionPager}>
                  {`${Math.min(dailySessionIndex + 1, dailyTasks.length)} / ${dailyTasks.length}`}
                </Text>
              </>
            )}

            {dailyNoteModal.visible ? (
              <View style={styles.inlineModalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Today note</Text>
                    <Pressable onPress={closeDailyNoteModal}>
                      <Text style={styles.modalClose}>Close</Text>
                    </Pressable>
                  </View>
                  <View style={styles.modalBody}>
                    <View>
                      <Text style={styles.modalLabel}>What did you do today?</Text>
                      <TextInput
                        value={dailyNoteDraft}
                        onChangeText={setDailyNoteDraft}
                        placeholder="例如：俯卧撑 20 个..."
                        placeholderTextColor="#8ea1c0"
                        style={[styles.modalInput, styles.dailyNoteInput]}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                  <View style={styles.modalFooter}>
                    <Pressable style={styles.modalCancel} onPress={closeDailyNoteModal}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.modalSave} onPress={saveDailyNote}>
                      <Text style={styles.modalSaveText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {isCelebrating ? (
              <View pointerEvents="none" style={styles.celebrationLayer}>
                <Animated.View
                  style={[
                    styles.celebrationCore,
                    {
                      opacity: celebrationProgress.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0, 1, 0]
                      }),
                      transform: [
                        {
                          scale: celebrationProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 2.3]
                          })
                        }
                      ]
                    }
                  ]}
                />
                {celebrationParticles.map((particle, index) => {
                  const rad = (particle.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * particle.distance;
                  const y = Math.sin(rad) * particle.distance;
                  return (
                    <Animated.View
                      key={`${particle.color}-${index}`}
                      style={[
                        styles.celebrationParticle,
                        {
                          backgroundColor: particle.color,
                          opacity: celebrationProgress.interpolate({
                            inputRange: [0, 0.1, 1],
                            outputRange: [0, 1, 0]
                          }),
                          transform: [
                            {
                              translateX: celebrationProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, x]
                              })
                            },
                            {
                              translateY: celebrationProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, y]
                              })
                            },
                            {
                              scale: celebrationProgress.interpolate({
                                inputRange: [0, 0.3, 1],
                                outputRange: [0.2, 1.2, 0.8]
                              })
                            }
                          ]
                        }
                      ]}
                    />
                  );
                })}
                <Animated.Text
                  style={[
                    styles.celebrationText,
                    {
                      opacity: celebrationProgress.interpolate({
                        inputRange: [0.05, 0.25, 1],
                        outputRange: [0, 1, 0]
                      }),
                      transform: [
                        {
                          scale: celebrationProgress.interpolate({
                            inputRange: [0, 0.3, 1],
                            outputRange: [0.2, 1.1, 1]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  完成! Super!
                </Animated.Text>
              </View>
            ) : null}
          </SafeAreaView>
        </Modal>

        <Modal
          visible={Boolean(dailyCalendarTask)}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setDailyCalendarTaskId(null);
            setDailyCalendarSelectedDateKey(null);
          }}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setDailyCalendarTaskId(null);
              setDailyCalendarSelectedDateKey(null);
            }}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{dailyCalendarTask?.title} calendar</Text>
                <Pressable
                  onPress={() => {
                    setDailyCalendarTaskId(null);
                    setDailyCalendarSelectedDateKey(null);
                  }}
                >
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.dailyCalendarMonthHeader}>
                <Pressable
                  onPress={() =>
                    canGoPrevMonth && setDailyCalendarMonth((prev) => addMonths(prev, -1))
                  }
                  style={[
                    styles.dailyCalendarNavButton,
                    !canGoPrevMonth && styles.dailyTaskActionDisabled
                  ]}
                  disabled={!canGoPrevMonth}
                >
                  <Ionicons name="chevron-back" size={16} color="#d6e3ff" />
                </Pressable>
                <Text style={styles.dailyCalendarMonthTitle}>{calendarMonthTitle}</Text>
                <Pressable
                  onPress={() =>
                    canGoNextMonth && setDailyCalendarMonth((prev) => addMonths(prev, 1))
                  }
                  style={[
                    styles.dailyCalendarNavButton,
                    !canGoNextMonth && styles.dailyTaskActionDisabled
                  ]}
                  disabled={!canGoNextMonth}
                >
                  <Ionicons name="chevron-forward" size={16} color="#d6e3ff" />
                </Pressable>
              </View>
              <View style={styles.dailyCalendarWeekHeader}>
                {calendarWeekLabels.map((label) => (
                  <Text key={label} style={styles.dailyCalendarWeekLabel}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.dailyCalendarGrid}>
                {calendarCells.map((dayDate, index) => {
                  if (!dayDate) {
                    return <View key={`empty-${index}`} style={styles.dailyCalendarEmptyCell} />;
                  }

                  const dayStart = toDayStart(dayDate);
                  if (
                    dayStart.getTime() < taskCreatedStart.getTime() ||
                    dayStart.getTime() > todayStart.getTime()
                  ) {
                    return <View key={formatDateKey(dayDate)} style={styles.dailyCalendarEmptyCell} />;
                  }

                  const dayKey = formatDateKey(dayDate);
                  const checked = Boolean(dailyCalendarTask?.records?.[dayKey]);
                  const isSelected = dayKey === dailyCalendarSelectedDateKey;
                  return (
                    <Pressable
                      key={dayKey}
                      style={[
                        styles.dailyCalendarCell,
                        checked && styles.dailyCalendarCellDone,
                        isSelected && styles.dailyCalendarCellSelected
                      ]}
                      onPress={() => setDailyCalendarSelectedDateKey(dayKey)}
                    >
                      <Text
                        style={[
                          styles.dailyCalendarCellDate,
                          checked && styles.dailyCalendarCellDateDone,
                          isSelected && styles.dailyCalendarCellDateSelected
                        ]}
                      >
                        {dayDate.getDate()}
                      </Text>
                      <Ionicons
                        name={checked ? "checkmark-circle" : "close-circle-outline"}
                        size={14}
                        color={checked ? "#0b132b" : "#8ea1c0"}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.dailyCalendarNoteWrap}>
                <Text style={styles.dailyCalendarNoteTitle}>
                  {dailyCalendarSelectedDateKey
                    ? `${dailyCalendarSelectedDateKey} note`
                    : "Select a date"}
                </Text>
                <Text style={styles.dailyCalendarNoteText}>
                  {dailyCalendarSelectedDateKey
                    ? selectedDateNote || "No note for this day."
                    : "Tap any valid day to view note."}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={dailyEditModal.visible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit daily task</Text>
                <Pressable onPress={closeDailyTaskEdit}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <View>
                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    value={dailyEditDraft}
                    onChangeText={setDailyEditDraft}
                    placeholder="Daily task title"
                    placeholderTextColor="#8ea1c0"
                    style={styles.modalInput}
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <Pressable style={styles.modalCancel} onPress={closeDailyTaskEdit}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={saveDailyTaskEdit}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070d1f"
  },
  appShell: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 90,
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
  swipeDeleteAction: {
    marginLeft: 8,
    marginBottom: 0,
    backgroundColor: "#fcbf49",
    borderRadius: 14,
    width: 92,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  swipeDeleteText: {
    color: "#0b132b",
    fontSize: 12,
    fontWeight: "700"
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
  },
  bottomTabs: {
    flexDirection: "row",
    backgroundColor: "#101a30",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#15284b"
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12
  },
  bottomTabActive: {
    backgroundColor: "#5ce1e6"
  },
  bottomTabLabel: {
    marginTop: 4,
    color: "#9fb7da",
    fontWeight: "600"
  },
  bottomTabLabelActive: {
    color: "#0b132b"
  },
  dailyPrimaryButton: {
    backgroundColor: "#5ce1e6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14
  },
  dailyPrimaryButtonText: {
    color: "#0b132b",
    fontWeight: "800",
    fontSize: 15
  },
  dailyList: {
    paddingBottom: 24
  },
  dailyTaskCard: {
    backgroundColor: "#15284b",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  dailyTaskHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  dailyTaskTitleWrap: {
    flex: 1
  },
  dailyTaskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dailyTaskTitle: {
    color: "#f5f7fb",
    fontSize: 17,
    fontWeight: "700"
  },
  dailyTitleEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1f3058",
    alignItems: "center",
    justifyContent: "center"
  },
  dailyTaskMeta: {
    color: "#9fb1cd",
    fontSize: 12,
    marginTop: 4
  },
  dailyDoneBadge: {
    backgroundColor: "#5ce1e6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  dailyDoneBadgeText: {
    color: "#0b132b",
    fontWeight: "700",
    fontSize: 11
  },
  dailyTaskActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  dailyTaskActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  dailyTaskAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1f3058",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  dailyTaskActionDisabled: {
    opacity: 0.4
  },
  dailyTaskActionText: {
    color: "#d6e3ff",
    fontSize: 12,
    fontWeight: "600"
  },
  dailyTaskDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3d1e2a",
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  dailyTaskDangerText: {
    color: "#f05d5e",
    fontSize: 12,
    fontWeight: "600"
  },
  dailyFullscreen: {
    flex: 1,
    backgroundColor: "#070d1f"
  },
  dailyFullscreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10
  },
  dailyFullscreenTitle: {
    color: "#f5f7fb",
    fontSize: 30,
    fontWeight: "800"
  },
  dailyExitButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243653",
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  dailyExitButtonText: {
    color: "#9fb7da",
    fontWeight: "700"
  },
  dailySessionEmptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  dailySessionPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 56
  },
  dailySessionQuestion: {
    color: "#f5f7fb",
    fontWeight: "700",
    textAlign: "center"
  },
  dailySessionHint: {
    marginTop: 14,
    color: "#8ea1c0",
    fontSize: 14
  },
  dailyHoldButton: {
    marginTop: 28,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#5ce1e6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5ce1e6",
  },
  dailyHoldButtonDone: {
    backgroundColor: "#4bbf73"
  },
  dailyHoldFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fcbf49"
  },
  dailyHoldInner: {
    zIndex: 2
  },
  dailyHoldHint: {
    marginTop: 12,
    color: "#d6e3ff",
    fontSize: 14,
    fontWeight: "600"
  },
  dailyNoteButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#5ce1e6",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  dailyNoteButtonText: {
    color: "#0b132b",
    fontWeight: "700"
  },
  dailyNotePreview: {
    marginTop: 10,
    backgroundColor: "#15284b",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: 340
  },
  dailyNotePreviewText: {
    color: "#d6e3ff",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18
  },
  dailySessionPager: {
    color: "#9fb7da",
    textAlign: "center",
    paddingBottom: 12,
    fontWeight: "700"
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  celebrationCore: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#5ce1e6"
  },
  celebrationParticle: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9
  },
  celebrationText: {
    color: "#f5f7fb",
    fontSize: 40,
    fontWeight: "900",
    textShadowColor: "rgba(92,225,230,0.6)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 16
  },
  dailyNoteInput: {
    minHeight: 120
  },
  inlineModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 13, 31, 0.85)",
    justifyContent: "center",
    padding: 18
  },
  dailyCalendarMonthHeader: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dailyCalendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1f3058",
    alignItems: "center",
    justifyContent: "center"
  },
  dailyCalendarMonthTitle: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "700"
  },
  dailyCalendarWeekHeader: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dailyCalendarWeekLabel: {
    width: "14.2857%",
    color: "#9fb7da",
    fontSize: 11,
    textAlign: "center"
  },
  dailyCalendarGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dailyCalendarEmptyCell: {
    width: "14.2857%",
    aspectRatio: 1
  },
  dailyCalendarCell: {
    width: "14.2857%",
    aspectRatio: 1,
    backgroundColor: "#15284b",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  dailyCalendarCellDone: {
    backgroundColor: "#5ce1e6"
  },
  dailyCalendarCellSelected: {
    borderWidth: 2,
    borderColor: "#fcbf49"
  },
  dailyCalendarCellDate: {
    color: "#d6e3ff",
    fontSize: 12,
    fontWeight: "600"
  },
  dailyCalendarCellDateDone: {
    color: "#0b132b"
  },
  dailyCalendarCellDateSelected: {
    fontWeight: "800"
  },
  dailyCalendarNoteWrap: {
    marginTop: 14,
    backgroundColor: "#15284b",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  dailyCalendarNoteTitle: {
    color: "#d6e3ff",
    fontWeight: "700",
    fontSize: 12
  },
  dailyCalendarNoteText: {
    color: "#9fb7da",
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18
  },
  goalAddButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#5ce1e6",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 6
  },
  goalAddText: {
    color: "#0b132b",
    fontWeight: "700"
  },
  goalScroll: {
    paddingBottom: 24
  },
  sectionHeading: {
    color: "#f5f7fb",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6
  },
  goalCard: {
    backgroundColor: "#15284b",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  goalCardTitle: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1
  },
  goalAccent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6
  },
  goalTitle: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "700"
  },
  goalMeta: {
    color: "#9fb1cd",
    fontSize: 12,
    marginTop: 4
  },
  goalActions: {
    alignItems: "flex-end",
    gap: 6
  },
  goalActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#1f3058"
  },
  goalActionText: {
    color: "#f5f7fb",
    fontSize: 11,
    fontWeight: "600"
  },
  goalActionMuted: {
    color: "#9fb1cd",
    fontSize: 11,
    fontWeight: "600"
  },
  goalActionDanger: {
    color: "#f05d5e",
    fontSize: 11,
    fontWeight: "600"
  },
  dotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cfd6e6",
    backgroundColor: "#cfd6e6"
  },
  goalPercentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10
  },
  goalPercent: {
    color: "#f5f7fb",
    fontWeight: "700"
  },
  goalPercentBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#243653"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 13, 31, 0.85)",
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    backgroundColor: "#101a30",
    borderRadius: 18,
    padding: 18
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    color: "#f5f7fb",
    fontSize: 18,
    fontWeight: "700"
  },
  modalClose: {
    color: "#9fb7da"
  },
  modalBody: {
    marginTop: 16,
    gap: 16
  },
  modalLabel: {
    color: "#9fb7da",
    fontSize: 12,
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: "#15284b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f5f7fb"
  },
  modalRow: {
    flexDirection: "row",
    gap: 12
  },
  modalColumn: {
    flex: 1
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#243653",
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  optionChipActive: {
    backgroundColor: "#5ce1e6",
    borderColor: "#5ce1e6"
  },
  optionChipText: {
    color: "#9fb7da",
    fontSize: 12,
    fontWeight: "600"
  },
  optionChipTextActive: {
    color: "#0b132b"
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  colorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243653"
  },
  colorChipActive: {
    backgroundColor: "#243653"
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  colorLabel: {
    color: "#d6e3ff",
    fontSize: 12
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 10
  },
  modalCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243653"
  },
  modalCancelText: {
    color: "#9fb7da",
    fontWeight: "600"
  },
  modalSave: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#5ce1e6"
  },
  modalSaveText: {
    color: "#0b132b",
    fontWeight: "700"
  }
});

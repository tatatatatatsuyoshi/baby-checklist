// ==========================================
// 📦 ライブラリのインポート
// ==========================================
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Check, Baby, Heart, Sparkles,
  Link2, StickyNote, Tag, UserCircle, X,
  Search, Wallet, FolderPlus,
  ListChecks, Droplet, Phone, Sun, Moon, Activity,
} from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, setDoc,
} from "firebase/firestore";

import UserSelect from "./UserSelect";
import DiaperLog from "./DiaperLog";
import EmergencyContacts from "./EmergencyContacts";
import LaborTimer from "./LaborTimer";
import Confetti from "./Confetti";

export default function App() {
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("currentUser")
  );
  const [currentPage, setCurrentPage] = useState("checklist");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const [confetti, setConfetti] = useState({ show: false, x: 0, y: 0 });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  // ⏳ ローディング状態
  const [isLoading, setIsLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("中");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [dueDate, setDueDate] = useState("");
  const [isDueDateEditing, setIsDueDateEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState("すべて");
  const [filterPriority, setFilterPriority] = useState("すべて");

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  const handleUserSelect = (user) => {
    localStorage.setItem("currentUser", user);
    setCurrentUser(user);
  };

  const handleUserChange = () => {
    if (window.confirm("ユーザーを切り替えますか?")) {
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const checklistRef = collection(db, "checklist");
    const unsubscribe = onSnapshot(checklistRef, (snapshot) => {
      const firestoreItems = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setItems(firestoreItems);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const categoriesRef = collection(db, "categories");
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const firestoreCategories = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      firestoreCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(firestoreCategories);

      if (firestoreCategories.length > 0 && !newItemCategory) {
        setNewItemCategory(firestoreCategories[0].name);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "dueDate");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDueDate(docSnap.data().value || "");
      }
    });
    return () => unsubscribe();
  }, []);

  const saveDueDate = async (dateStr) => {
    const settingsRef = doc(db, "settings", "dueDate");
    await setDoc(settingsRef, { value: dateStr });
    setIsDueDateEditing(false);
  };

  const getDaysUntilDueDate = () => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const seedInitialData = async () => {
    const initialCategories = [
      { name: "寝具", emoji: "🛏️", colorKey: "blue", order: 1 },
      { name: "衣類", emoji: "👶", colorKey: "pink", order: 2 },
      { name: "おむつ関連", emoji: "🧷", colorKey: "yellow", order: 3 },
      { name: "ママ用品", emoji: "💐", colorKey: "purple", order: 4 },
    ];
    for (const cat of initialCategories) {
      await addDoc(collection(db, "categories"), cat);
    }
    const initialItems = [
      { name: "ベビーベッド", category: "寝具", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "ベビー布団セット", category: "寝具", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "スワドル(おくるみ)", category: "寝具", priority: "中", checked: false, memo: "", url: "", price: "" },
      { name: "短肌着(5〜6枚)", category: "衣類", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "長肌着(3〜4枚)", category: "衣類", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "ツーウェイオール", category: "衣類", priority: "中", checked: false, memo: "", url: "", price: "" },
      { name: "新生児用おむつ", category: "おむつ関連", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "おしりふき", category: "おむつ関連", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "おむつ替えシート", category: "おむつ関連", priority: "中", checked: false, memo: "", url: "", price: "" },
      { name: "産褥ショーツ", category: "ママ用品", priority: "高", checked: false, memo: "", url: "", price: "" },
      { name: "母乳パッド", category: "ママ用品", priority: "中", checked: false, memo: "", url: "", price: "" },
      { name: "授乳クッション", category: "ママ用品", priority: "低", checked: false, memo: "", url: "", price: "" },
    ];
    for (const item of initialItems) {
      await addDoc(collection(db, "checklist"), item);
    }
  };

  const getCategoryStyle = (category) => {
    const colorMap = {
      blue:    { bg: darkMode ? "bg-blue-900/30"   : "bg-blue-50",   border: darkMode ? "border-blue-700"   : "border-blue-200",   text: darkMode ? "text-blue-300"   : "text-blue-700",   bar: "bg-blue-400" },
      pink:    { bg: darkMode ? "bg-pink-900/30"   : "bg-pink-50",   border: darkMode ? "border-pink-700"   : "border-pink-200",   text: darkMode ? "text-pink-300"   : "text-pink-700",   bar: "bg-pink-400" },
      yellow:  { bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50", border: darkMode ? "border-yellow-700" : "border-yellow-200", text: darkMode ? "text-yellow-300" : "text-yellow-700", bar: "bg-yellow-400" },
      purple:  { bg: darkMode ? "bg-purple-900/30" : "bg-purple-50", border: darkMode ? "border-purple-700" : "border-purple-200", text: darkMode ? "text-purple-300" : "text-purple-700", bar: "bg-purple-400" },
      green:   { bg: darkMode ? "bg-green-900/30"  : "bg-green-50",  border: darkMode ? "border-green-700"  : "border-green-200",  text: darkMode ? "text-green-300"  : "text-green-700",  bar: "bg-green-400" },
      orange:  { bg: darkMode ? "bg-orange-900/30" : "bg-orange-50", border: darkMode ? "border-orange-700" : "border-orange-200", text: darkMode ? "text-orange-300" : "text-orange-700", bar: "bg-orange-400" },
      teal:    { bg: darkMode ? "bg-teal-900/30"   : "bg-teal-50",   border: darkMode ? "border-teal-700"   : "border-teal-200",   text: darkMode ? "text-teal-300"   : "text-teal-700",   bar: "bg-teal-400" },
      rose:    { bg: darkMode ? "bg-rose-900/30"   : "bg-rose-50",   border: darkMode ? "border-rose-700"   : "border-rose-200",   text: darkMode ? "text-rose-300"   : "text-rose-700",   bar: "bg-rose-400" },
    };
    const colorKey = category?.colorKey || "blue";
    return { ...colorMap[colorKey], emoji: category?.emoji || "📦" };
  };

  const priorityStyles = darkMode
    ? {
        "高": "bg-rose-900/40 text-rose-300 border-rose-700",
        "中": "bg-amber-900/40 text-amber-300 border-amber-700",
        "低": "bg-emerald-900/40 text-emerald-300 border-emerald-700",
      }
    : {
        "高": "bg-rose-100 text-rose-700 border-rose-200",
        "中": "bg-amber-100 text-amber-700 border-amber-200",
        "低": "bg-emerald-100 text-emerald-700 border-emerald-200",
      };

  const colorKeysAvailable = ["blue", "pink", "yellow", "purple", "green", "orange", "teal", "rose"];
  const emojiOptions = ["📦", "🍼", "🛁", "🚗", "🎀", "🧸", "🎁", "📚", "🌟", "🌸"];

  const addCategory = async () => {
    if (newCategoryName.trim() === "") return;
    if (categories.some((c) => c.name === newCategoryName)) {
      alert("同じ名前のカテゴリが既にあります");
      return;
    }
    const usedColors = categories.map((c) => c.colorKey);
    const availableColor = colorKeysAvailable.find((c) => !usedColors.includes(c)) || "blue";
    const randomEmoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
    await addDoc(collection(db, "categories"), {
      name: newCategoryName,
      emoji: randomEmoji,
      colorKey: availableColor,
      order: categories.length + 1,
    });
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const deleteCategory = async (categoryId, categoryName) => {
    const itemsInCategory = items.filter((i) => i.category === categoryName);
    let confirmMsg = `カテゴリ「${categoryName}」を削除しますか?`;
    if (itemsInCategory.length > 0) {
      confirmMsg += `\n\n⚠️ このカテゴリには ${itemsInCategory.length} 個のアイテムがあります。\nアイテムも一緒に削除されます。`;
    }
    if (window.confirm(confirmMsg)) {
      for (const item of itemsInCategory) {
        await deleteDoc(doc(db, "checklist", item.id));
      }
      await deleteDoc(doc(db, "categories", categoryId));
    }
  };

  const toggleCheck = async (id, currentChecked, event) => {
    let confettiPos = null;
    if (!currentChecked && event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      confettiPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    const itemDoc = doc(db, "checklist", id);
    await updateDoc(itemDoc, {
      checked: !currentChecked,
      checkedBy: !currentChecked ? currentUser : null,
      checkedAt: !currentChecked ? new Date().toISOString() : null,
    });
    if (confettiPos) {
      setConfetti({ show: true, x: confettiPos.x, y: confettiPos.y });
      setTimeout(() => setConfetti({ show: false, x: 0, y: 0 }), 1000);
    }
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "checklist", id));
  };

  const addItem = async () => {
    if (newItemName.trim() === "") return;
    if (!newItemCategory) {
      alert("カテゴリを先に追加してください");
      return;
    }
    await addDoc(collection(db, "checklist"), {
      name: newItemName,
      category: newItemCategory,
      priority: newItemPriority,
      checked: false,
      memo: "",
      url: "",
      price: "",
    });
    setNewItemName("");
  };

  const updateItemDetail = async (id, field, value) => {
    const itemDoc = doc(db, "checklist", id);
    await updateDoc(itemDoc, { [field]: value });
  };

  const totalCount = items.length;
  const checkedCount = items.filter((item) => item.checked).length;
  const progress = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
  const daysUntilDue = getDaysUntilDueDate();

  const purchasedTotal = items
    .filter((item) => item.checked && item.price)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
  const budgetTotal = items
    .filter((item) => item.price)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const filteredItems = items.filter((item) => {
    const keywordMatch =
      searchKeyword === "" ||
      (item.name && item.name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (item.memo && item.memo.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchKeyword.toLowerCase()));
    const categoryMatch = filterCategory === "すべて" || item.category === filterCategory;
    const priorityMatch = filterPriority === "すべて" || item.priority === filterPriority;
    return keywordMatch && categoryMatch && priorityMatch;
  });

  const isFiltering = searchKeyword !== "" || filterCategory !== "すべて" || filterPriority !== "すべて";

  if (!currentUser) {
    return <UserSelect onSelect={handleUserSelect} />;
  }

  // ⏳ ローディング画面
  if (isLoading && currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"}`}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👶</div>
          <p className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            赤ちゃんを呼んでいます...
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    );
  }

  const bgClass = darkMode
    ? "bg-gray-900"
    : "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50";

  const cardClass = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-pink-100";

  const textPrimary = darkMode ? "text-gray-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const inputClass = darkMode
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
    : "border-gray-200";

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4 pb-24 font-sans transition-colors duration-300`}>
      <Confetti show={confetti.show} x={confetti.x} y={confetti.y} />

      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full shadow-sm transition-all ${darkMode ? "bg-gray-800 text-yellow-300 hover:bg-gray-700" : "bg-white/80 text-gray-600 hover:bg-white"}`}
            aria-label="ダークモード切替"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleUserChange}
            className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white/80 text-gray-600 hover:bg-white"}`}
          >
            <UserCircle className="w-3 h-3" />
            {getUserEmoji(currentUser)} {currentUser}
          </button>
        </div>

        {currentPage === "checklist" && (
          <>
            <header className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <Baby className="w-8 h-8 text-pink-400" strokeWidth={1.5} />
              </div>
              <h1 className={`text-2xl font-bold mb-1 ${textPrimary}`}>
                出産準備チェックリスト
              </h1>

              {!isDueDateEditing ? (
                <button
                  onClick={() => setIsDueDateEditing(true)}
                  className={`inline-block mt-2 mb-2 px-4 py-2 rounded-xl transition-all ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white/80 hover:bg-white"}`}
                >
                  {daysUntilDue !== null ? (
                    daysUntilDue > 0 ? (
                      <span className={`text-sm ${textSecondary}`}>
                        🌷 出産予定日まで
                        <span className="text-xl font-bold text-pink-500 mx-1">
                          あと {daysUntilDue}
                        </span>
                        日
                      </span>
                    ) : daysUntilDue === 0 ? (
                      <span className="text-sm font-bold text-pink-500">
                        🎉 今日が予定日です！
                      </span>
                    ) : (
                      <span className={`text-sm ${textSecondary}`}>
                        🍼 予定日から {Math.abs(daysUntilDue)} 日経過
                      </span>
                    )
                  ) : (
                    <span className={`text-sm ${textMuted}`}>
                      📅 出産予定日を設定する
                    </span>
                  )}
                </button>
              ) : (
                <div className={`mt-2 mb-2 p-3 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <label className={`text-xs block mb-2 ${textMuted}`}>
                    出産予定日を入力
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                    />
                    <button
                      onClick={() => saveDueDate(dueDate)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-300 to-purple-300 text-white rounded-lg text-sm font-semibold"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}

              <p className={`text-sm flex items-center justify-center gap-1 ${textMuted}`}>
                <Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
                赤ちゃんを迎える準備を一緒に
                <Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
              </p>

              <div className={`mt-2 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${darkMode ? "bg-gray-800 text-purple-300" : "bg-white/60 text-purple-600"}`}>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                夫婦でリアルタイム共有中
              </div>
            </header>

            {items.length === 0 && categories.length === 0 && (
              <div className={`rounded-2xl shadow-sm p-5 mb-5 border text-center ${cardClass}`}>
                <p className={`text-sm mb-3 ${textSecondary}`}>まだアイテムがありません</p>
                <button
                  onClick={seedInitialData}
                  className="px-6 py-2 bg-gradient-to-r from-pink-300 to-purple-300 text-white rounded-lg font-semibold text-sm"
                >
                  🌱 初期リストを読み込む
                </button>
              </div>
            )}

            {items.length > 0 && (
              <div className={`rounded-2xl shadow-sm p-5 mb-5 border ${cardClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold flex items-center gap-1 ${textSecondary}`}>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    全体の準備率
                  </span>
                  <span className={`text-sm font-bold ${darkMode ? "text-purple-300" : "text-purple-600"}`}>
                    {checkedCount} / {totalCount} 個
                  </span>
                </div>
                <div className={`w-full rounded-full h-4 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <div
                    className="h-full bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-2xl font-bold mt-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {progress}%
                </p>

                {budgetTotal > 0 && (
                  <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <Wallet className="w-4 h-4 text-green-500" />
                      <span className={`text-sm font-semibold ${textSecondary}`}>予算管理</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>✅ 購入済み</span>
                        <span className={`font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                          ¥{purchasedTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>📋 予算合計</span>
                        <span className={`font-bold ${darkMode ? "text-purple-300" : "text-purple-600"}`}>
                          ¥{budgetTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className={`flex justify-between text-xs pt-1 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                        <span className={textMuted}>残り</span>
                        <span className={`font-semibold ${textSecondary}`}>
                          ¥{(budgetTotal - purchasedTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {items.length > 0 && (
              <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${cardClass}`}>
                <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${textSecondary}`}>
                  <Search className="w-4 h-4 text-purple-400" />
                  検索・絞り込み
                </h2>
                <div className="relative mb-2">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="アイテム名・メモで検索"
                    className={`w-full pl-9 pr-9 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                  />
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword("")}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${textMuted} hover:text-gray-600`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                  >
                    <option value="すべて">📁 すべてのカテゴリ</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                  >
                    <option value="すべて">⭐ すべての優先度</option>
                    <option value="高">🔴 優先度:高</option>
                    <option value="中">🟡 優先度:中</option>
                    <option value="低">🟢 優先度:低</option>
                  </select>
                </div>
                {isFiltering && (
                  <div className={`flex items-center justify-between mt-3 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <span className={`text-xs ${textMuted}`}>
                      {filteredItems.length} 件ヒット
                    </span>
                    <button
                      onClick={() => {
                        setSearchKeyword("");
                        setFilterCategory("すべて");
                        setFilterPriority("すべて");
                      }}
                      className={`text-xs font-semibold ${darkMode ? "text-purple-400" : "text-purple-500"} hover:text-purple-700`}
                    >
                      リセット
                    </button>
                  </div>
                )}
              </div>
            )}

            {categories.length > 0 && (
              <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${cardClass}`}>
                <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${textSecondary}`}>
                  <Plus className="w-4 h-4 text-pink-400" />
                  アイテムを追加
                </h2>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="例:哺乳瓶"
                  className={`w-full px-3 py-2 border rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                  >
                    <option value="高">優先度:高</option>
                    <option value="中">優先度:中</option>
                    <option value="低">優先度:低</option>
                  </select>
                </div>
                <button
                  onClick={addItem}
                  className="w-full py-2 bg-gradient-to-r from-pink-300 to-purple-300 text-white rounded-lg font-semibold text-sm hover:from-pink-400 hover:to-purple-400 transition-all shadow-sm"
                >
                  ＋ リストに追加
                </button>
              </div>
            )}

            <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${cardClass}`}>
              {!isAddingCategory ? (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className={`w-full py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${darkMode ? "text-purple-400 hover:bg-gray-700" : "text-purple-600 hover:bg-purple-50"}`}
                >
                  <FolderPlus className="w-4 h-4" />
                  新しいカテゴリを追加
                </button>
              ) : (
                <div>
                  <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${textSecondary}`}>
                    <FolderPlus className="w-4 h-4 text-purple-400" />
                    新しいカテゴリ
                  </h2>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="例:お風呂用品、お出かけグッズ"
                    className={`w-full px-3 py-2 border rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={addCategory}
                      className="py-2 bg-gradient-to-r from-purple-300 to-pink-300 text-white rounded-lg text-sm font-semibold hover:from-purple-400 hover:to-pink-400 transition-all"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}
            </div>

            {categories.map((category) => {
              const categoryItems = filteredItems.filter((item) => item.category === category.name);
              const allCategoryItems = items.filter((item) => item.category === category.name);
              if (isFiltering && categoryItems.length === 0) return null;
              const style = getCategoryStyle(category);
              const catCheckedCount = allCategoryItems.filter((i) => i.checked).length;
              const catTotalCount = allCategoryItems.length;
              const catProgress = catTotalCount === 0 ? 0 : Math.round((catCheckedCount / catTotalCount) * 100);

              return (
                <div key={category.id} className="mb-5">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${style.text}`}>
                      <span className="text-lg">{style.emoji}</span>
                      {category.name}
                      <span className={`text-xs font-normal ${textMuted}`}>
                        ({catCheckedCount} / {catTotalCount})
                      </span>
                    </h2>
                    <button
                      onClick={() => deleteCategory(category.id, category.name)}
                      className={`text-xs p-1 rounded transition-all ${darkMode ? "text-gray-600 hover:text-rose-400" : "text-gray-300 hover:text-rose-400"}`}
                      aria-label="カテゴリ削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {catTotalCount > 0 && (
                    <div className="mb-2 px-2">
                      <div className={`w-full rounded-full h-1.5 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <div
                          className={`h-full ${style.bar} rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${catProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {categoryItems.length === 0 && allCategoryItems.length === 0 && (
                    <p className={`text-xs px-2 py-2 ${textMuted}`}>
                      まだアイテムがありません
                    </p>
                  )}

                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 border transition-all duration-300 ${
                          item.checked
                            ? (darkMode ? "bg-gray-800 border-gray-700 opacity-60" : "bg-gray-50 border-gray-200 opacity-70")
                            : `${style.bg} ${style.border}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => toggleCheck(item.id, item.checked, e)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.checked
                                ? "bg-gradient-to-br from-pink-300 to-purple-300 border-transparent"
                                : (darkMode ? "bg-gray-700 border-gray-500 hover:border-pink-400" : "bg-white border-gray-300 hover:border-pink-300")
                            }`}
                          >
                            {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                item.checked
                                  ? (darkMode ? "line-through text-gray-500" : "line-through text-gray-400")
                                  : textPrimary
                              }`}
                            >
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`inline-block text-xs px-2 py-0.5 rounded-full border ${priorityStyles[item.priority]}`}
                              >
                                優先度:{item.priority}
                              </span>
                              {item.checked && item.checkedBy && (
                                <span className={`inline-flex items-center gap-0.5 text-xs ${textMuted}`}>
                                  <Check className="w-3 h-3" />
                                  {getUserEmoji(item.checkedBy)} {item.checkedBy} が完了
                                </span>
                              )}
                              {item.price && (
                                <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                                  ¥{Number(item.price).toLocaleString()}
                                </span>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-0.5 text-xs ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-700"}`}
                                >
                                  <Link2 className="w-3 h-3" />
                                  サイト
                                </a>
                              )}
                              {item.memo && (
                                <span className={`inline-flex items-center gap-0.5 text-xs ${textMuted}`}>
                                  <StickyNote className="w-3 h-3" />
                                  メモあり
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-400 hover:text-purple-400 hover:bg-gray-700" : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"}`}
                            aria-label="詳細"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-500 hover:text-rose-400 hover:bg-gray-700" : "text-gray-300 hover:text-rose-400 hover:bg-rose-50"}`}
                            aria-label="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {editingItemId === item.id && (
                          <div className={`mt-3 pt-3 border-t space-y-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <div>
                              <label className={`text-xs block mb-1 ${textMuted}`}>💰 値段(円)</label>
                              <input
                                type="number"
                                value={item.price || ""}
                                onChange={(e) => updateItemDetail(item.id, "price", e.target.value)}
                                placeholder="例: 3980"
                                className={`w-full px-3 py-1.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs block mb-1 ${textMuted}`}>🔗 購入サイトURL</label>
                              <input
                                type="url"
                                value={item.url || ""}
                                onChange={(e) => updateItemDetail(item.id, "url", e.target.value)}
                                placeholder="https://..."
                                className={`w-full px-3 py-1.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs block mb-1 ${textMuted}`}>📝 メモ</label>
                              <textarea
                                value={item.memo || ""}
                                onChange={(e) => updateItemDetail(item.id, "memo", e.target.value)}
                                placeholder="色は白希望、退院時に必要など"
                                rows={2}
                                className={`w-full px-3 py-1.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs block mb-1 ${textMuted}`}>🏷️ カテゴリ変更</label>
                              <select
                                value={item.category}
                                onChange={(e) => updateItemDetail(item.id, "category", e.target.value)}
                                className={`w-full px-3 py-1.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-pink-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.name}>
                                    {cat.emoji} {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                              <X className="w-3 h-3" />
                              閉じる
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {isFiltering && filteredItems.length === 0 && (
              <div className={`rounded-2xl shadow-sm p-6 mb-5 border text-center ${cardClass}`}>
                <p className="text-3xl mb-2">🔍</p>
                <p className={`text-sm ${textSecondary}`}>該当するアイテムがありません</p>
              </div>
            )}

            {progress === 100 && totalCount > 0 && (
              <div className={`rounded-2xl p-5 text-center border mt-4 ${darkMode ? "bg-gradient-to-r from-pink-900/40 to-purple-900/40 border-pink-700" : "bg-gradient-to-r from-pink-100 to-purple-100 border-pink-200"}`}>
                <p className="text-2xl mb-2">🎉</p>
                <p className={`text-sm font-bold ${textSecondary}`}>
                  準備完了です！
                </p>
                <p className={`text-xs mt-1 ${textMuted}`}>
                  赤ちゃんとの素敵な出会いを楽しみに ♡
                </p>
              </div>
            )}

            <footer className="text-center mt-6 mb-2">
              <p className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                Made with 🤍 for new parents
              </p>
            </footer>
          </>
        )}

        {currentPage === "diaper" && <DiaperLog currentUser={currentUser} darkMode={darkMode} />}
        {currentPage === "contacts" && <EmergencyContacts darkMode={darkMode} />}
        {currentPage === "labor" && <LaborTimer currentUser={currentUser} darkMode={darkMode} />}
      </div>

      {/* 📱 ボトムナビ(4タブに!) */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t shadow-lg z-50 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <button
            onClick={() => setCurrentPage("checklist")}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-all ${
              currentPage === "checklist"
                ? (darkMode ? "text-pink-400 bg-gray-700" : "text-pink-500 bg-pink-50")
                : (darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            <ListChecks className="w-5 h-5" />
            <span className="text-xs font-semibold">準備</span>
          </button>
          <button
            onClick={() => setCurrentPage("diaper")}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-all ${
              currentPage === "diaper"
                ? (darkMode ? "text-purple-400 bg-gray-700" : "text-purple-500 bg-purple-50")
                : (darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            <Droplet className="w-5 h-5" />
            <span className="text-xs font-semibold">おむつ</span>
          </button>
          <button
            onClick={() => setCurrentPage("labor")}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-all ${
              currentPage === "labor"
                ? (darkMode ? "text-rose-400 bg-gray-700" : "text-rose-500 bg-rose-50")
                : (darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs font-semibold">陣痛</span>
          </button>
          <button
            onClick={() => setCurrentPage("contacts")}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-all ${
              currentPage === "contacts"
                ? (darkMode ? "text-amber-400 bg-gray-700" : "text-amber-500 bg-amber-50")
                : (darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-semibold">連絡先</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

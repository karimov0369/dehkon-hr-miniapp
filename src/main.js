import "./style.css";
import { SUPER_ADMIN_TELEGRAM_ID } from "./config.js";

const tg = window.Telegram?.WebApp;
const app = document.getElementById("app");
const BASE_URL = import.meta.env.BASE_URL;
const MAIN_LOGO = `${BASE_URL}assets/main-logo.png`;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#071832");
  tg.setBackgroundColor("#030814");
}

const STORAGE_KEYS = {
  users: "dehkon_users",
  admins: "dehkon_admins",
  selectedDirection: "dehkon_selected_direction",
  content: "dehkon_content",
  announcements: "dehkon_announcements",
  medicines: "dehkon_medicines",
  testResults: "dehkon_test_results"
};

const directions = {
  bozor: {
    key: "bozor",
    title: "Dehkon Bozor",
    subtitle: "Bozor xodimlari uchun HR Akademiya",
    logo: `${BASE_URL}assets/bozor.png`,
    color: "#2f43a3",
    lightColor: "#eef2ff"
  },
  dorixona: {
    key: "dorixona",
    title: "Dehkon Dorixona",
    subtitle: "Dorixona xodimlari uchun HR Akademiya",
    logo: `${BASE_URL}assets/dorixona.png`,
    color: "#ff7417",
    lightColor: "#fff4e8"
  },
  supermarket: {
    key: "supermarket",
    title: "Dehkon Supermarket",
    subtitle: "Supermarket xodimlari uchun HR Akademiya",
    logo: `${BASE_URL}assets/supermarket2.png`,
    color: "#ff0019",
    lightColor: "#fff0f2"
  }
};

const menuItems = [
  {
    id: "rules",
    number: "1",
    title: "Umumiy Qoidalar",
    text: "Ichki tartib-qoidalar, ish vaqti, uniforma, jarimalar va h.k.",
    icon: "📗",
    color: "#21b56b"
  },
  {
    id: "lessons",
    number: "2",
    title: "Darslar",
    text: "Dorilar, biologik faol qo‘shimchalar, kosmetika va sport fit bo‘yicha darslar",
    icon: "📖",
    color: "#3887d9"
  },
  {
    id: "tests",
    number: "3",
    title: "Testlar",
    text: "Ishga qabul qilish testlari, doimiy xodimlar uchun test",
    icon: "🧾",
    color: "#ff8a00"
  },
  {
    id: "pharmacistRating",
    number: "4",
    title: "Farmatsevtlar reytingi",
    text: "Test ballari, yulduzlar va farmatsevt kategoriyalari",
    icon: "🏆",
    color: "#079455"
  },
  {
    id: "medicine",
    number: "5",
    title: "Dorilar Bazasi",
    text: "Dori qidiruvi, tarkibi, qo‘llanilishi, dozalash va kartochkalar",
    icon: "💊",
    color: "#7c4dff"
  },
  {
    id: "birthdays",
    number: "6",
    title: "Tug‘ilgan kunlar",
    text: "Xodimlarning tug‘ilgan kunlari va yaqin sanalar",
    icon: "🎂",
    color: "#e11d48"
  }
];

let currentScreen = "home";
let historyStack = [];

let selectedMenuItemId = null;
let selectedMaterialId = null;
let selectedTestId = null;
let selectedMedicineId = null;

let selectedProfilePhotoData = null;
let selectedProfilePhotoPosition = "center center";

let selectedMedicineImageData = null;
let selectedMedicineCardImageData = null;

let editingMaterialId = null;
let editingTestId = null;
let editingMedicineId = null;

let telegramBackInitialized = false;

function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function escapeText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTelegramUser() {
  const tgUser = tg?.initDataUnsafe?.user;

  if (tgUser?.id) {
    return {
      telegramId: String(tgUser.id),
      username: tgUser.username || "",
      firstNameFromTelegram: tgUser.first_name || "",
      lastNameFromTelegram: tgUser.last_name || ""
    };
  }

  let localDemoId = localStorage.getItem("dehkon_demo_telegram_id");

  if (!localDemoId) {
    localDemoId = "local_" + Math.floor(Math.random() * 1000000);
    localStorage.setItem("dehkon_demo_telegram_id", localDemoId);
  }

  return {
    telegramId: localDemoId,
    username: "local_test",
    firstNameFromTelegram: "",
    lastNameFromTelegram: ""
  };
}

function loadUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function loadAdmins() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.admins) || "[]");
}

function saveAdmins(admins) {
  localStorage.setItem(STORAGE_KEYS.admins, JSON.stringify(admins));
}

function getCurrentUser() {
  const telegramUser = getTelegramUser();
  const users = loadUsers();

  return users.find((user) => user.telegramId === telegramUser.telegramId) || null;
}

function saveCurrentUser(userData) {
  const users = loadUsers();
  const existingIndex = users.findIndex((user) => user.telegramId === userData.telegramId);

  if (existingIndex >= 0) {
    users[existingIndex] = {
      ...users[existingIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };
  } else {
    users.push({
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveUsers(users);
}

function getSelectedDirection() {
  return localStorage.getItem(STORAGE_KEYS.selectedDirection) || "dorixona";
}

function setSelectedDirection(directionKey) {
  localStorage.setItem(STORAGE_KEYS.selectedDirection, directionKey);
}

function ensureUserDirection(directionKey) {
  const currentUser = getCurrentUser();

  if (!currentUser) return;

  const oldDirections = currentUser.directions?.length
    ? currentUser.directions
    : currentUser.direction
      ? [currentUser.direction]
      : [];

  const directionsSet = new Set(oldDirections);
  directionsSet.add(directionKey);

  saveCurrentUser({
    ...currentUser,
    direction: directionKey,
    lastDirection: directionKey,
    directions: Array.from(directionsSet)
  });
}

function getUserDirectionsLabel(user) {
  const userDirections = user.directions?.length
    ? user.directions
    : user.direction
      ? [user.direction]
      : [];

  if (!userDirections.length) return "Kiritilmagan";

  return userDirections
    .map((key) => directions[key]?.title || key)
    .join(", ");
}

function isSuperAdmin() {
  const telegramUser = getTelegramUser();
  return String(telegramUser.telegramId) === String(SUPER_ADMIN_TELEGRAM_ID);
}

function isAdmin() {
  if (isSuperAdmin()) return true;

  const currentUser = getCurrentUser();
  const telegramUser = getTelegramUser();
  const admins = loadAdmins();

  return admins.some((admin) => {
    if (admin.type === "telegramId") {
      return String(admin.value) === String(telegramUser.telegramId);
    }

    if (admin.type === "pinfl" && currentUser?.pinfl) {
      return String(admin.value) === String(currentUser.pinfl);
    }

    return false;
  });
}

function showToast(message) {
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

/* Content */

function getDefaultContent() {
  const createDirectionContent = () => ({
    rules: {
      materials: [
        {
          id: "rules_company",
          title: "Kompaniya ichki tartib-qoidalari",
          description: "Barcha xodimlar uchun majburiy",
          text: "Bu bo‘limda kompaniyaning asosiy ichki tartib-qoidalari joylanadi.",
          icon: "🏢",
          image: "",
          videoUrl: ""
        },
        {
          id: "rules_uniform",
          title: "Uniforma talablari",
          description: "Ko‘rinish va kiyim standartlari",
          text: "Bu bo‘limda uniforma va tashqi ko‘rinish standartlari haqida ma’lumot bo‘ladi.",
          icon: "🥼",
          image: "",
          videoUrl: ""
        },
        {
          id: "rules_time",
          title: "Ish vaqti",
          description: "Ish vaqti va tanaffuslar",
          text: "Bu bo‘limda ish vaqti, tanaffuslar va ish jadvali haqida ma’lumot bo‘ladi.",
          icon: "🕒",
          image: "",
          videoUrl: ""
        },
        {
          id: "rules_late",
          title: "Kechikish va jarimalar",
          description: "Kechikish qoidalari va jarimalar",
          text: "Bu bo‘limda kechikish, ogohlantirish va jarimalar haqida ma’lumot bo‘ladi.",
          icon: "⏰",
          image: "",
          videoUrl: ""
        },
        {
          id: "rules_clients",
          title: "Mijoz bilan muomala standartlari",
          description: "Mijozlar bilan ishlash qoidalari",
          text: "Bu bo‘limda mijozlar bilan muloqot qilish standartlari joylanadi.",
          icon: "🛡️",
          image: "",
          videoUrl: ""
        }
      ]
    },
    lessons: {
      materials: [
        {
          id: "lesson_medicines",
          title: "Dori vositalari",
          description: "Dorilar bo‘yicha o‘quv materiallari",
          text: "Bu bo‘limda dori vositalari bo‘yicha darslar, qo‘llanmalar va video materiallar joylanadi.",
          icon: "💊",
          image: "",
          videoUrl: ""
        },
        {
          id: "lesson_supplements",
          title: "Biologik faol qo‘shimchalar",
          description: "BFQ mahsulotlari bo‘yicha darslar",
          text: "Bu bo‘limda biologik faol qo‘shimchalar haqida ma’lumotlar, tavsiyalar va darslar joylanadi.",
          icon: "🌿",
          image: "",
          videoUrl: ""
        },
        {
          id: "lesson_sport_pit",
          title: "Sport Pit",
          description: "Sport oziqlanishi bo‘yicha darslar",
          text: "Bu bo‘limda sport oziqlanishi, proteinlar, vitaminlar va sport mahsulotlari haqida darslar joylanadi.",
          icon: "🏋️",
          image: "",
          videoUrl: ""
        },
        {
          id: "lesson_cosmetics",
          title: "Kosmetika",
          description: "Kosmetika mahsulotlari bo‘yicha darslar",
          text: "Bu bo‘limda kosmetika mahsulotlari, parvarish vositalari va mijozga tavsiya berish bo‘yicha darslar joylanadi.",
          icon: "💄",
          image: "",
          videoUrl: ""
        }
      ]
    },
    medicine: {
      materials: []
    },
    tests: {
      tests: [
        {
          id: "test_hiring",
          title: "Dehkon dorixonasiga ishga qabul qilish test sinovlari",
          description: "Yangi xodimlar uchun test",
          questions: [
            {
              question: "Mijoz bilan gaplashganda eng muhim narsa nima?",
              options: [
                "Tez gapirish",
                "Hurmat bilan muomala qilish",
                "E’tibor bermaslik",
                "Faqat narxni aytish"
              ],
              correctIndex: 1
            }
          ]
        },
        {
          id: "test_staff",
          title: "Doimiy xodimlar uchun test",
          description: "Mavjud xodimlar bilimini tekshirish",
          questions: [
            {
              question: "Ish vaqtiga rioya qilish nima uchun muhim?",
              options: [
                "Tartib uchun",
                "Kerak emas",
                "Faqat rahbar uchun",
                "Faqat yangi xodimlar uchun"
              ],
              correctIndex: 0
            }
          ]
        }
      ]
    },
    birthdays: {
      materials: []
    },
    pharmacistRating: {
      materials: []
    }
  });

  return {
    bozor: createDirectionContent(),
    dorixona: createDirectionContent(),
    supermarket: createDirectionContent()
  };
}

function loadContent() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.content) || "null");
  const defaults = getDefaultContent();

  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.content, JSON.stringify(defaults));
    return defaults;
  }

  for (const directionKey of Object.keys(defaults)) {
    if (!saved[directionKey]) {
      saved[directionKey] = defaults[directionKey];
    }

    for (const sectionKey of Object.keys(defaults[directionKey])) {
      if (!saved[directionKey][sectionKey]) {
        saved[directionKey][sectionKey] = defaults[directionKey][sectionKey];
      }
    }

    const lessons = saved[directionKey]?.lessons?.materials || [];
    const hasOnlyOldIntro = lessons.length === 1 && lessons[0]?.id === "lesson_intro";

    const hasNoNewLessons =
      !lessons.some((item) => item.id === "lesson_medicines") &&
      !lessons.some((item) => item.id === "lesson_supplements") &&
      !lessons.some((item) => item.id === "lesson_sport_pit") &&
      !lessons.some((item) => item.id === "lesson_cosmetics");

    if (hasOnlyOldIntro || hasNoNewLessons) {
      saved[directionKey].lessons = defaults[directionKey].lessons;
    }
  }

  saveContent(saved);
  return saved;
}

function saveContent(content) {
  localStorage.setItem(STORAGE_KEYS.content, JSON.stringify(content));
}

function getCurrentSectionContent() {
  const content = loadContent();
  const directionKey = getSelectedDirection();

  return content[directionKey]?.[selectedMenuItemId] || null;
}

/* Announcements */

function loadAnnouncements() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || "[]");
}

function saveAnnouncements(announcements) {
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(announcements));
}

function getUnreadAnnouncementsCount() {
  return loadAnnouncements().length;
}

function createAnnouncement({ title, text }) {
  const announcements = loadAnnouncements();

  announcements.unshift({
    id: createId("announcement"),
    title,
    text,
    createdAt: new Date().toISOString(),
    authorTelegramId: getTelegramUser().telegramId
  });

  saveAnnouncements(announcements);
}

function deleteAnnouncement(id) {
  const announcements = loadAnnouncements().filter((item) => item.id !== id);
  saveAnnouncements(announcements);
}

function formatAnnouncementDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/* Medicines database */

function getDefaultMedicines() {
  return [
    {
      id: "medicine_paracetamol",
      name: "Paracetamol",
      category: "Og‘riq qoldiruvchi va isitma tushiruvchi",
      composition: "Paracetamol 500 mg",
      releaseForm: "Tabletka",
      usage: "Og‘riq sindromi va tana haroratining ko‘tarilishida qo‘llaniladi.",
      dosage: "Kattalar uchun odatda 500 mg dan kuniga 3-4 marta.",
      contraindications: "Paracetamolga yuqori sezuvchanlik, og‘ir jigar kasalliklari.",
      sideEffects: "Allergik reaksiyalar, ko‘ngil aynishi, jigar fermentlari o‘zgarishi mumkin.",
      manufacturer: "Turli ishlab chiqaruvchilar",
      image: "",
      cardImage: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "medicine_ibuprofen",
      name: "Ibuprofen",
      category: "NYAQV",
      composition: "Ibuprofen 200 mg / 400 mg",
      releaseForm: "Tabletka, kapsula, suspenziya",
      usage: "Og‘riq, yallig‘lanish va isitmada qo‘llaniladi.",
      dosage: "Dozalash yosh, vazn va holatga qarab belgilanadi.",
      contraindications: "Oshqozon-ichak yarasi, NYAQVga yuqori sezuvchanlik.",
      sideEffects: "Oshqozon bezovtaligi, ko‘ngil aynishi, allergik reaksiyalar.",
      manufacturer: "Turli ishlab chiqaruvchilar",
      image: "",
      cardImage: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function loadMedicines() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.medicines) || "null");

  if (!saved) {
    const defaults = getDefaultMedicines();
    saveMedicines(defaults);
    return defaults;
  }

  return saved.map((medicine) => ({
    ...medicine,
    image: medicine.image || "",
    cardImage: medicine.cardImage || ""
  }));
}

function saveMedicines(medicines) {
  localStorage.setItem(STORAGE_KEYS.medicines, JSON.stringify(medicines));
}

function getMedicineById(id) {
  return loadMedicines().find((medicine) => medicine.id === id) || null;
}

function searchMedicines(query) {
  const medicines = loadMedicines();
  const normalizedQuery = String(query || "").trim().toLowerCase();

  if (!normalizedQuery) return medicines;

  return medicines.filter((medicine) => {
    const haystack = [
      medicine.name,
      medicine.category,
      medicine.composition,
      medicine.releaseForm,
      medicine.usage,
      medicine.dosage,
      medicine.contraindications,
      medicine.sideEffects,
      medicine.manufacturer
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

/* Test results and rating */

function loadTestResults() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.testResults) || "[]");
}

function saveTestResults(results) {
  localStorage.setItem(STORAGE_KEYS.testResults, JSON.stringify(results));
}

function createTestResult({ test, correct, total }) {
  const currentUser = getCurrentUser();

  if (!currentUser) return;

  const results = loadTestResults();
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  results.unshift({
    id: createId("test_result"),
    telegramId: currentUser.telegramId,
    firstName: currentUser.firstName || "",
    lastName: currentUser.lastName || "",
    testId: test.id,
    testTitle: test.title,
    correct,
    total,
    percent,
    createdAt: new Date().toISOString()
  });

  saveTestResults(results);
}

function getUserTotalScore(telegramId) {
  return loadTestResults()
    .filter((result) => String(result.telegramId) === String(telegramId))
    .reduce((sum, result) => sum + Number(result.correct || 0), 0);
}

function getUserBestPercent(telegramId) {
  const userResults = loadTestResults().filter(
    (result) => String(result.telegramId) === String(telegramId)
  );

  if (!userResults.length) return 0;

  return Math.max(...userResults.map((result) => Number(result.percent || 0)));
}

function getStarsText(stars = 0) {
  const count = Number(stars) || 0;

  if (count <= 0) return "—";

  return "⭐".repeat(Math.min(count, 4));
}

function getPharmacistCategory(stars = 0) {
  const count = Number(stars) || 0;

  if (count === 1) return "Stajyor";
  if (count === 2) return "Yordamchi farmatsevt";
  if (count === 3) return "Farmatsevt";
  if (count >= 4) return "Bosh farmatsevt";

  return "Kategoriya berilmagan";
}

function updateUserStars(telegramId, stars) {
  const users = loadUsers();
  const index = users.findIndex((user) => String(user.telegramId) === String(telegramId));

  if (index < 0) return;

  const normalizedStars = Math.max(0, Math.min(4, Number(stars) || 0));

  users[index] = {
    ...users[index],
    stars: normalizedStars,
    pharmacistCategory: getPharmacistCategory(normalizedStars),
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
}

function formatResultDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getMedal(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return `${index + 1}.`;
}

/* Navigation */

function updateTelegramBackButton() {
  if (!tg?.BackButton) return;

  if (!telegramBackInitialized) {
    tg.BackButton.onClick(goBack);
    telegramBackInitialized = true;
  }

  if (currentScreen === "home" || historyStack.length === 0) {
    tg.BackButton.hide();
  } else {
    tg.BackButton.show();
  }
}

function navigate(screen, options = {}) {
  const { replace = false } = options;

  if (!replace && currentScreen !== screen) {
    historyStack.push(currentScreen);
  }

  currentScreen = screen;
  renderScreen(screen);
  updateTelegramBackButton();
}

function goBack() {
  if (historyStack.length > 0) {
    const previousScreen = historyStack.pop();

    if (previousScreen === "registration" && getCurrentUser()) {
      goBack();
      return;
    }

    currentScreen = previousScreen;
    renderScreen(previousScreen);
    updateTelegramBackButton();
    return;
  }

  if (currentScreen !== "home") {
    currentScreen = "home";
    renderHome();
    updateTelegramBackButton();
  }
}

function renderScreen(screen) {
  if (screen === "home") renderHome();
  if (screen === "registration") renderRegistration();
  if (screen === "menu") renderMainMenu();
  if (screen === "profile") renderProfile();
  if (screen === "announcements") renderAnnouncements();
  if (screen === "admin") renderAdminPanel();
  if (screen === "menuDetail") renderMenuDetail();
  if (screen === "materialDetail") renderMaterialDetail();
  if (screen === "materialForm") renderMaterialForm();
  if (screen === "testForm") renderTestForm();
  if (screen === "takeTest") renderTakeTest();
  if (screen === "medicineDetail") renderMedicineDetail();
  if (screen === "medicineForm") renderMedicineForm();
  if (screen === "testResults") renderTestResultsPage();
  if (screen === "pharmacistRating") renderPharmacistRatingPage();
}

function renderTopBar(title = "") {
  return `
    <header class="top-bar">
      <button class="top-back-btn" id="topBackBtn">
        <span class="back-icon">←</span>
        <span class="back-text">Orqaga</span>
      </button>

      <h2>${escapeText(title)}</h2>

      <div class="top-dots">•••</div>
    </header>
  `;
}

function attachTopBackButton() {
  const button = document.getElementById("topBackBtn");

  if (button) {
    button.addEventListener("click", goBack);
  }
}

/* Home */

function renderHome() {
  if (tg) {
    tg.setHeaderColor("#071832");
    tg.setBackgroundColor("#030814");
  }

  app.innerHTML = `
    <main class="landing-page">
      <section class="hero">
        <div class="avatar-wrapper">
          <div class="avatar-glow"></div>
          <img src="${BASE_URL}assets/hr.jpg" alt="Dehkon HR" class="avatar" />
        </div>

        <h1>
          Dehkon <span>HR</span><br />
          Akademiya
        </h1>
      </section>

      <section class="direction-buttons direction-buttons-raised">
        <button class="direction-btn blue" data-direction="bozor">
          <img src="${BASE_URL}assets/bozor.png" alt="Dehkon Bozor" />
        </button>

        <button class="direction-btn orange" data-direction="dorixona">
          <img src="${BASE_URL}assets/dorixona.png" alt="Dehkon Dorixona" />
        </button>

        <button class="direction-btn red" data-direction="supermarket">
          <img src="${BASE_URL}assets/supermarket2.png" alt="Dehkon Supermarket" />
        </button>
      </section>

      <section class="home-bottom-slogan">
        <p class="subtitle">
          Bilim, intizom va natija — muvaffaqiyat kaliti!
        </p>

        <div class="divider"></div>
      </section>
    </main>
  `;

  document.querySelectorAll(".direction-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const directionKey = button.dataset.direction;

      setSelectedDirection(directionKey);

      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred("light");
      }

      const currentUser = getCurrentUser();

      if (currentUser) {
        ensureUserDirection(directionKey);
        navigate("menu");
      } else {
        navigate("registration");
      }
    });
  });
}

/* Registration */

function renderRegistration() {
  if (tg) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f4f6fb");
  }

  const telegramUser = getTelegramUser();
  const direction = directions[getSelectedDirection()];

  app.innerHTML = `
    <main class="auth-page">
      <div class="auth-card">
        ${renderTopBar("Ro‘yxatdan o‘tish")}

        <div class="auth-logo-box" style="background:${direction.lightColor}">
          <img src="${direction.logo}" alt="${direction.title}" />
        </div>

        <h2>Ro‘yxatdan o‘tish</h2>

        <p class="auth-desc">
          Davom etish uchun ma’lumotlaringizni kiriting.
        </p>

        <form id="registrationForm" class="form">
          <label>
            Ism
            <input
              type="text"
              name="firstName"
              placeholder="Ismingiz"
              value="${escapeText(telegramUser.firstNameFromTelegram || "")}"
              required
            />
          </label>

          <label>
            Familiya
            <input
              type="text"
              name="lastName"
              placeholder="Familiyangiz"
              value="${escapeText(telegramUser.lastNameFromTelegram || "")}"
              required
            />
          </label>

          <label>
            Tug‘ilgan sana
            <input
              type="date"
              name="birthDate"
              required
            />
          </label>

          <button type="submit" class="primary-btn" style="background:${direction.color}">
            Davom etish
          </button>
        </form>
      </div>
    </main>
  `;

  attachTopBackButton();

  document.getElementById("registrationForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const selectedDirection = getSelectedDirection();

    const userData = {
      telegramId: telegramUser.telegramId,
      username: telegramUser.username,
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      birthDate: formData.get("birthDate"),
      direction: selectedDirection,
      lastDirection: selectedDirection,
      directions: [selectedDirection],
      photo: "",
      photoPosition: "center center",
      stars: 0,
      pharmacistCategory: getPharmacistCategory(0),
      gender: "",
      documentType: "",
      documentNumber: "",
      pinfl: "",
      workFrom: "",
      workTo: ""
    };

    saveCurrentUser(userData);
    historyStack = historyStack.filter((screen) => screen !== "registration");

    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("success");
    }

    navigate("menu", { replace: true });
  });
}

/* Main menu */

function renderMainMenu() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    navigate("registration");
    return;
  }

  const selectedDirection = getSelectedDirection();
  ensureUserDirection(selectedDirection);

  const direction = directions[selectedDirection];

  if (tg) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f4f6fb");
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(direction.title)}

      <section class="top-banner" style="background:${direction.color}">
        <div>
          <img src="${direction.logo}" alt="${direction.title}" class="banner-logo" />
          <p>${direction.subtitle}</p>
        </div>

        <div class="banner-illustration">
          <img src="${MAIN_LOGO}" alt="Dehkon" class="animated-side-logo" />
        </div>
      </section>

      <section class="welcome-card">
        <h3>
          Xush kelibsiz, ${escapeText(currentUser.firstName)} ${escapeText(currentUser.lastName)}! 👋
        </h3>
        <p>
          O‘zingizni qiziqtirgan bo‘limni tanlang va o‘rganishni boshlang.
        </p>
      </section>

      <section class="menu-list">
        ${menuItems
          .map(
            (item) => `
              <button class="menu-card" data-menu="${item.id}">
                <div class="menu-icon" style="background:${item.color}">
                  ${item.icon}
                </div>

                <div class="menu-content">
                  <h4>${item.number}. ${item.title}</h4>
                  <p>${item.text}</p>
                </div>

                <div class="menu-arrow">›</div>
              </button>
            `
          )
          .join("")}
      </section>

      ${renderAdminShortcut()}

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();

  document.querySelectorAll(".menu-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMenuItemId = button.dataset.menu;
      navigate("menuDetail");
    });
  });

  attachBottomNavEvents();
  attachAdminShortcutEvent();
}

/* Menu detail */

function renderMenuDetail() {
  const item = menuItems.find((menuItem) => menuItem.id === selectedMenuItemId) || menuItems[0];
  const sectionContent = getCurrentSectionContent();

  if (tg) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f4f6fb");
  }

  if (selectedMenuItemId === "tests") {
    renderTestsPage(item, sectionContent);
    return;
  }

  if (selectedMenuItemId === "pharmacistRating") {
    renderPharmacistRatingPage();
    return;
  }

  if (selectedMenuItemId === "medicine") {
    renderMedicinePage(item);
    return;
  }

  if (selectedMenuItemId === "birthdays") {
    renderBirthdaysPage(item);
    return;
  }

  const materials = sectionContent?.materials || [];

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(`${item.number}. ${item.title}`)}

      ${
        isAdmin()
          ? `
            <section class="admin-content-actions">
              <button id="addMaterialBtn" class="admin-add-btn">＋ Material qo‘shish</button>
            </section>
          `
          : ""
      }

      <section class="inner-list">
        ${materials
          .map(
            (material) => `
              <div class="inner-row-wrap">
                <button class="inner-row" data-material="${material.id}">
                  <div class="inner-icon">${material.icon || item.icon}</div>

                  <div class="inner-content">
                    <h4>${escapeText(material.title)}</h4>
                    <p>${escapeText(material.description || "")}</p>
                  </div>

                  <div class="inner-arrow">›</div>
                </button>

                ${
                  isAdmin()
                    ? `
                      <div class="row-admin-controls">
                        <button data-edit-material="${material.id}">Tahrirlash</button>
                        <button data-delete-material="${material.id}" class="danger">O‘chirish</button>
                      </div>
                    `
                    : ""
                }
              </div>
            `
          )
          .join("")}
      </section>

      <section class="green-callout">
        ⓘ Qoidalarni bilish — muvaffaqiyat kaliti!
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  document.querySelectorAll("[data-material]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMaterialId = button.dataset.material;
      navigate("materialDetail");
    });
  });

  if (isAdmin()) {
    document.getElementById("addMaterialBtn").addEventListener("click", () => {
      editingMaterialId = null;
      navigate("materialForm");
    });

    document.querySelectorAll("[data-edit-material]").forEach((button) => {
      button.addEventListener("click", () => {
        editingMaterialId = button.dataset.editMaterial;
        navigate("materialForm");
      });
    });

    document.querySelectorAll("[data-delete-material]").forEach((button) => {
      button.addEventListener("click", () => {
        const materialId = button.dataset.deleteMaterial;

        if (!confirm("Material o‘chirilsinmi?")) return;

        const content = loadContent();
        const directionKey = getSelectedDirection();

        content[directionKey][selectedMenuItemId].materials =
          content[directionKey][selectedMenuItemId].materials.filter(
            (material) => material.id !== materialId
          );

        saveContent(content);
        renderMenuDetail();
      });
    });
  }
}/* Medicine */

function renderMedicineRows(medicines) {
  if (!medicines.length) {
    return `
      <div class="medicine-empty">
        <div>🔎</div>
        <h3>Natija topilmadi</h3>
        <p>Boshqa nom bilan qidirib ko‘ring yoki admin yangi dori qo‘shishi mumkin.</p>
      </div>
    `;
  }

  return medicines
    .map(
      (medicine) => `
        <div class="medicine-row-wrap">
          <button class="medicine-row" data-medicine="${medicine.id}">
            <div class="medicine-row-photo">
              ${
                medicine.image
                  ? `<img src="${medicine.image}" alt="${escapeText(medicine.name)}" />`
                  : medicine.cardImage
                    ? `<img src="${medicine.cardImage}" alt="${escapeText(medicine.name)}" />`
                    : `<span>💊</span>`
              }
            </div>

            <div class="medicine-row-content">
              <h4>${escapeText(medicine.name)}</h4>
              <p>${escapeText(medicine.category || medicine.composition || "")}</p>
              ${
                medicine.cardImage
                  ? `<small>📋 Kartochka mavjud</small>`
                  : ""
              }
            </div>

            <div class="medicine-row-arrow">›</div>
          </button>

          ${
            isAdmin()
              ? `
                <div class="row-admin-controls">
                  <button data-edit-medicine="${medicine.id}">Tahrirlash</button>
                  <button data-delete-medicine="${medicine.id}" class="danger">O‘chirish</button>
                </div>
              `
              : ""
          }
        </div>
      `
    )
    .join("");
}

function attachMedicineRowEvents(item) {
  document.querySelectorAll("[data-medicine]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMedicineId = button.dataset.medicine;
      navigate("medicineDetail");
    });
  });

  if (isAdmin()) {
    document.querySelectorAll("[data-edit-medicine]").forEach((button) => {
      button.addEventListener("click", () => {
        editingMedicineId = button.dataset.editMedicine;
        navigate("medicineForm");
      });
    });

    document.querySelectorAll("[data-delete-medicine]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!confirm("Dori bazadan o‘chirilsinmi?")) return;

        const medicineId = button.dataset.deleteMedicine;
        const medicines = loadMedicines().filter((medicine) => medicine.id !== medicineId);

        saveMedicines(medicines);
        showToast("Dori o‘chirildi.");

        const query = document.getElementById("medicineSearchInput")?.value || "";
        const list = document.getElementById("medicineList");

        if (list) {
          list.innerHTML = renderMedicineRows(searchMedicines(query));
          attachMedicineRowEvents(item);
        }
      });
    });
  }
}

function renderMedicinePage(item) {
  const query = sessionStorage.getItem("dehkon_medicine_search") || "";
  const medicines = searchMedicines(query);

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(`${item.number}. ${item.title}`)}

      <section class="medicine-search-card">
        <div class="medicine-search-icon">💊</div>

        <div>
          <h3>Dorilar bazasi</h3>
          <p>Dori nomi, tarkibi yoki ishlab chiqaruvchi bo‘yicha qidiring.</p>
        </div>
      </section>

      <section class="medicine-search-box">
        <input
          type="search"
          id="medicineSearchInput"
          placeholder="Dori nomini kiriting..."
          value="${escapeText(query)}"
          autocomplete="off"
          inputmode="search"
        />
      </section>

      ${
        isAdmin()
          ? `
            <section class="admin-content-actions">
              <button id="addMedicineBtn" class="admin-add-btn">＋ Dori qo‘shish</button>
            </section>
          `
          : ""
      }

      <section class="medicine-list" id="medicineList">
        ${renderMedicineRows(medicines)}
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();
  attachMedicineRowEvents(item);

  const searchInput = document.getElementById("medicineSearchInput");
  const list = document.getElementById("medicineList");

  searchInput.addEventListener("input", (event) => {
    const value = event.target.value;

    sessionStorage.setItem("dehkon_medicine_search", value);

    if (list) {
      list.innerHTML = renderMedicineRows(searchMedicines(value));
      attachMedicineRowEvents(item);
    }
  });

  if (isAdmin()) {
    document.getElementById("addMedicineBtn").addEventListener("click", () => {
      editingMedicineId = null;
      navigate("medicineForm");
    });
  }
}

function renderMedicineDetail() {
  const medicine = getMedicineById(selectedMedicineId);

  if (!medicine) {
    goBack();
    return;
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(medicine.name)}

      <section class="medicine-detail-card">
        ${
          medicine.image
            ? `<img src="${medicine.image}" alt="${escapeText(medicine.name)}" class="medicine-detail-image" />`
            : `<div class="medicine-detail-placeholder">💊</div>`
        }

        <h2>${escapeText(medicine.name)}</h2>

        ${
          medicine.category
            ? `<p class="medicine-category">${escapeText(medicine.category)}</p>`
            : ""
        }

        ${
          isAdmin() && !medicine.image
            ? `
              <div class="medicine-admin-hint">
                <p>Bu doriga rasm qo‘shilmagan.</p>
                <button id="addCurrentMedicineImage" class="secondary-btn">Rasm qo‘shish</button>
              </div>
            `
            : ""
        }

        ${
          medicine.cardImage
            ? `
              <div class="medicine-card-image-box">
                <h3>📋 Dori kartochkasi</h3>
                <img
                  src="${medicine.cardImage}"
                  alt="${escapeText(medicine.name)} kartochkasi"
                  class="medicine-card-image"
                />
              </div>
            `
            : ""
        }

        <div class="medicine-info-list">
          ${renderMedicineInfoBlock("Tarkibi", medicine.composition)}
          ${renderMedicineInfoBlock("Chiqarilish shakli", medicine.releaseForm)}
          ${renderMedicineInfoBlock("Qo‘llanilishi", medicine.usage)}
          ${renderMedicineInfoBlock("Dozalash", medicine.dosage)}
          ${renderMedicineInfoBlock("Qarshi ko‘rsatmalar", medicine.contraindications)}
          ${renderMedicineInfoBlock("Nojo‘ya ta’sirlar", medicine.sideEffects)}
          ${renderMedicineInfoBlock("Ishlab chiqaruvchi", medicine.manufacturer)}
        </div>

        ${
          isAdmin()
            ? `
              <div class="material-admin-actions">
                <button id="editCurrentMedicine" class="secondary-btn">Tahrirlash</button>
              </div>
            `
            : ""
        }
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  if (isAdmin()) {
    document.getElementById("editCurrentMedicine").addEventListener("click", () => {
      editingMedicineId = medicine.id;
      navigate("medicineForm");
    });

    const addImageButton = document.getElementById("addCurrentMedicineImage");

    if (addImageButton) {
      addImageButton.addEventListener("click", () => {
        editingMedicineId = medicine.id;
        navigate("medicineForm");
      });
    }
  }
}

function renderMedicineInfoBlock(title, value) {
  if (!value) return "";

  return `
    <div class="medicine-info-block">
      <h4>${escapeText(title)}</h4>
      <p>${escapeText(value).replaceAll("\n", "<br />")}</p>
    </div>
  `;
}

function renderMedicineForm() {
  if (!isAdmin()) {
    showToast("Sizda admin huquqi yo‘q.");
    goBack();
    return;
  }

  const medicines = loadMedicines();
  const medicine = editingMedicineId
    ? medicines.find((entry) => entry.id === editingMedicineId)
    : null;

  selectedMedicineImageData = medicine?.image || "";
  selectedMedicineCardImageData = medicine?.cardImage || "";

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(medicine ? "Dorini tahrirlash" : "Dori qo‘shish")}

      <section class="profile-card">
        <form id="medicineForm" class="form">
          <label>
            Dori nomi
            <input
              type="text"
              name="name"
              value="${escapeText(medicine?.name || "")}"
              placeholder="Masalan: Paracetamol"
              required
            />
          </label>

          <label>
            Kategoriya
            <input
              type="text"
              name="category"
              value="${escapeText(medicine?.category || "")}"
              placeholder="Masalan: Og‘riq qoldiruvchi"
            />
          </label>

          <label>
            Tarkibi
            <textarea name="composition" rows="4">${escapeText(medicine?.composition || "")}</textarea>
          </label>

          <label>
            Chiqarilish shakli
            <input
              type="text"
              name="releaseForm"
              value="${escapeText(medicine?.releaseForm || "")}"
              placeholder="Tabletka, kapsula, sirop..."
            />
          </label>

          <label>
            Qo‘llanilishi
            <textarea name="usage" rows="5">${escapeText(medicine?.usage || "")}</textarea>
          </label>

          <label>
            Dozalash
            <textarea name="dosage" rows="5">${escapeText(medicine?.dosage || "")}</textarea>
          </label>

          <label>
            Qarshi ko‘rsatmalar
            <textarea name="contraindications" rows="5">${escapeText(medicine?.contraindications || "")}</textarea>
          </label>

          <label>
            Nojo‘ya ta’sirlar
            <textarea name="sideEffects" rows="5">${escapeText(medicine?.sideEffects || "")}</textarea>
          </label>

          <label>
            Ishlab chiqaruvchi
            <input
              type="text"
              name="manufacturer"
              value="${escapeText(medicine?.manufacturer || "")}"
            />
          </label>

          <label>
            Dori rasmi
            <input type="file" id="medicineImageInput" accept="image/*" />
          </label>

          <div id="medicineImagePreview">
            ${
              selectedMedicineImageData
                ? `<img src="${selectedMedicineImageData}" class="material-image-preview" />`
                : `<div class="image-empty-preview">Dori rasmi hali tanlanmagan</div>`
            }
          </div>

          <label>
            Dori kartochkasi rasmi
            <input type="file" id="medicineCardImageInput" accept="image/*" />
          </label>

          <div id="medicineCardImagePreview">
            ${
              selectedMedicineCardImageData
                ? `<img src="${selectedMedicineCardImageData}" class="medicine-card-preview" />`
                : `<div class="image-empty-preview">Kartochka rasmi hali tanlanmagan</div>`
            }
          </div>

          <button type="submit" class="primary-btn">
            Saqlash
          </button>
        </form>
      </section>
    </main>
  `;

  attachTopBackButton();

  document.getElementById("medicineImageInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    selectedMedicineImageData = await readFileAsDataUrl(file);

    document.getElementById("medicineImagePreview").innerHTML = `
      <img src="${selectedMedicineImageData}" class="material-image-preview" />
    `;
  });

  document.getElementById("medicineCardImageInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    selectedMedicineCardImageData = await readFileAsDataUrl(file);

    document.getElementById("medicineCardImagePreview").innerHTML = `
      <img src="${selectedMedicineCardImageData}" class="medicine-card-preview" />
    `;
  });

  document.getElementById("medicineForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const savedMedicine = {
      id: medicine?.id || createId("medicine"),
      name: formData.get("name").trim(),
      category: formData.get("category").trim(),
      composition: formData.get("composition").trim(),
      releaseForm: formData.get("releaseForm").trim(),
      usage: formData.get("usage").trim(),
      dosage: formData.get("dosage").trim(),
      contraindications: formData.get("contraindications").trim(),
      sideEffects: formData.get("sideEffects").trim(),
      manufacturer: formData.get("manufacturer").trim(),
      image: selectedMedicineImageData || medicine?.image || "",
      cardImage: selectedMedicineCardImageData || medicine?.cardImage || "",
      createdAt: medicine?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (medicine) {
      const index = medicines.findIndex((entry) => entry.id === medicine.id);
      medicines[index] = savedMedicine;
    } else {
      medicines.unshift(savedMedicine);
    }

    saveMedicines(medicines);

    selectedMedicineId = savedMedicine.id;
    showToast("Dori saqlandi.");
    navigate("medicineDetail", { replace: true });
  });
}

/* Birthdays */

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birthday = new Date(birthDate);

  if (Number.isNaN(birthday.getTime())) return null;

  const currentYear = today.getFullYear();

  let nextBirthday = new Date(
    currentYear,
    birthday.getMonth(),
    birthday.getDate()
  );

  today.setHours(0, 0, 0, 0);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday < today) {
    nextBirthday = new Date(
      currentYear + 1,
      birthday.getMonth(),
      birthday.getDate()
    );
  }

  const diff = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatBirthDate(birthDate) {
  if (!birthDate) return "Kiritilmagan";

  const date = new Date(birthDate);

  if (Number.isNaN(date.getTime())) return "Kiritilmagan";

  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long"
  });
}

function renderBirthdaysPage(item) {
  const users = loadUsers();

  const sortedUsers = [...users].sort((a, b) => {
    const daysA = getDaysUntilBirthday(a.birthDate);
    const daysB = getDaysUntilBirthday(b.birthDate);

    return (daysA ?? 9999) - (daysB ?? 9999);
  });

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(`${item.number}. ${item.title}`)}

      <section class="birthday-hero">
        <div class="birthday-hero-icon">🎂</div>
        <div>
          <h3>Tug‘ilgan kunlar</h3>
          <p>Ro‘yxatdan o‘tgan xodimlar va yaqin tug‘ilgan kunlar shu yerda ko‘rinadi.</p>
        </div>
      </section>

      <section class="birthday-list">
        ${
          sortedUsers.length
            ? sortedUsers
                .map((user) => {
                  const daysLeft = getDaysUntilBirthday(user.birthDate);
                  const isSoon = daysLeft !== null && daysLeft <= 10;
                  const isToday = daysLeft === 0;

                  return `
                    <div class="birthday-row ${isSoon ? "soon" : ""}">
                      <div class="birthday-photo-wrap">
                        ${
                          user.photo
                            ? `
                              <img
                                src="${user.photo}"
                                alt="User photo"
                                class="birthday-photo"
                                style="object-position: ${escapeText(user.photoPosition || "center center")};"
                              />
                            `
                            : `<div class="birthday-photo-placeholder">${getInitials(user.firstName, user.lastName)}</div>`
                        }
                      </div>

                      <div class="birthday-info">
                        <h4>${escapeText(user.firstName || "")} ${escapeText(user.lastName || "")}</h4>
                        <p>${escapeText(formatBirthDate(user.birthDate))}</p>
                      </div>

                      <div class="birthday-badge ${isToday ? "today" : ""}">
                        ${
                          isToday
                            ? "Bugun"
                            : isSoon
                              ? `${daysLeft} kun`
                              : `${daysLeft ?? "—"} kun`
                        }
                      </div>
                    </div>
                  `;
                })
                .join("")
            : `
              <div class="empty-birthday-card">
                <div>🎈</div>
                <h3>Hali foydalanuvchilar yo‘q</h3>
                <p>Ro‘yxatdan o‘tgan foydalanuvchilar shu yerda ko‘rinadi.</p>
              </div>
            `
        }
      </section>

      <section class="local-storage-note">
        <b>Ma’lumot:</b> hozircha foydalanuvchilar shu qurilma xotirasidan olinadi. Hamma xodimlar bir-birini ko‘rishi uchun umumiy baza ulanadi.
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();
}

/* Test results pages */

function renderTestResultsPage() {
  const results = [...loadTestResults()].sort((a, b) => {
    if (Number(b.correct) !== Number(a.correct)) {
      return Number(b.correct) - Number(a.correct);
    }

    if (Number(b.percent) !== Number(a.percent)) {
      return Number(b.percent) - Number(a.percent);
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar("Test natijalari")}

      <section class="rating-hero">
        <div class="rating-hero-icon">🧾</div>
        <div>
          <h3>Test natijalari</h3>
          <p>Eng yuqori ball olgan xodimlar yuqorida ko‘rinadi.</p>
        </div>
      </section>

      <section class="result-list">
        ${
          results.length
            ? results
                .map(
                  (result, index) => `
                    <div class="result-row">
                      <div class="result-place">${getMedal(index)}</div>

                      <div class="result-info">
                        <h4>${escapeText(result.firstName)} ${escapeText(result.lastName)}</h4>
                        <p>${escapeText(result.testTitle)}</p>
                        <small>${escapeText(formatResultDate(result.createdAt))}</small>
                      </div>

                      <div class="result-score">
                        <b>${result.correct}/${result.total}</b>
                        <span>${result.percent}%</span>
                      </div>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="empty-rating-card">
                <div>📭</div>
                <h3>Hali natijalar yo‘q</h3>
                <p>Foydalanuvchilar test topshirgandan keyin natijalar shu yerda chiqadi.</p>
              </div>
            `
        }
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();
}

function renderPharmacistRatingPage() {
  const users = loadUsers();

  const ratingUsers = users
    .map((user) => ({
      ...user,
      totalScore: getUserTotalScore(user.telegramId),
      bestPercent: getUserBestPercent(user.telegramId),
      stars: Number(user.stars || 0)
    }))
    .sort((a, b) => {
      if (Number(b.totalScore) !== Number(a.totalScore)) {
        return Number(b.totalScore) - Number(a.totalScore);
      }

      return Number(b.bestPercent) - Number(a.bestPercent);
    });

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar("Farmatsevtlar reytingi")}

      <section class="pharmacist-rating-hero">
        <div class="rating-hero-icon">🏆</div>
        <div>
          <h3>Farmatsevtlar reytingi</h3>
          <p>Test ballari, yulduzlar va kategoriyalar bo‘yicha umumiy reyting.</p>
        </div>
      </section>

      <section class="pharmacist-rating-list">
        ${
          ratingUsers.length
            ? ratingUsers
                .map(
                  (user, index) => `
                    <div class="pharmacist-rating-row">
                      <div class="rating-medal">${getMedal(index)}</div>

                      <div class="rating-user-photo-wrap">
                        ${
                          user.photo
                            ? `
                              <img
                                src="${user.photo}"
                                alt="User photo"
                                class="rating-user-photo"
                                style="object-position: ${escapeText(user.photoPosition || "center center")};"
                              />
                            `
                            : `<div class="rating-user-photo-placeholder">${getInitials(user.firstName, user.lastName)}</div>`
                        }
                      </div>

                      <div class="rating-user-info">
                        <h4>${escapeText(user.firstName || "")} ${escapeText(user.lastName || "")}</h4>

                        <p class="rating-stars">
                          ${getStarsText(user.stars)}
                        </p>

                        <p class="rating-category">
                          ${escapeText(getPharmacistCategory(user.stars))}
                        </p>

                        <small>
                          Umumiy ball: <b>${user.totalScore}</b>
                          ${
                            user.bestPercent
                              ? ` · Eng yaxshi natija: <b>${user.bestPercent}%</b>`
                              : ""
                          }
                        </small>
                      </div>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="empty-rating-card">
                <div>🏆</div>
                <h3>Hali foydalanuvchilar yo‘q</h3>
                <p>Ro‘yxatdan o‘tgan xodimlar shu yerda ko‘rinadi.</p>
              </div>
            `
        }
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();
}

/* Tests */

function renderTestsPage(item, sectionContent) {
  const tests = sectionContent?.tests || [];

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(`${item.number}. ${item.title}`)}

      ${
        isAdmin()
          ? `
            <section class="admin-content-actions">
              <button id="addTestBtn" class="admin-add-btn">＋ Test qo‘shish</button>
            </section>
          `
          : ""
      }

      <section class="inner-list">
        ${tests
          .map(
            (test) => `
              <div class="inner-row-wrap">
                <div class="test-row">
                  <div class="inner-icon">📝</div>

                  <div class="inner-content">
                    <h4>${escapeText(test.title)}</h4>
                    <p>${escapeText(test.description || "")}</p>
                  </div>

                  <button class="test-start-btn" data-start-test="${test.id}">
                    Boshlash
                  </button>
                </div>

                ${
                  isAdmin()
                    ? `
                      <div class="row-admin-controls">
                        <button data-edit-test="${test.id}">Tahrirlash</button>
                        <button data-delete-test="${test.id}" class="danger">O‘chirish</button>
                      </div>
                    `
                    : ""
                }
              </div>
            `
          )
          .join("")}

        <button class="inner-row" id="testAnswersBtn">
          <div class="inner-icon">📊</div>

          <div class="inner-content">
            <h4>Test javoblari</h4>
            <p>Natijalar va tahlillar</p>
          </div>

          <div class="inner-arrow">›</div>
        </button>
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  document.querySelectorAll("[data-start-test]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTestId = button.dataset.startTest;
      navigate("takeTest");
    });
  });

  document.getElementById("testAnswersBtn").addEventListener("click", () => {
    navigate("testResults");
  });

  if (isAdmin()) {
    document.getElementById("addTestBtn").addEventListener("click", () => {
      editingTestId = null;
      navigate("testForm");
    });

    document.querySelectorAll("[data-edit-test]").forEach((button) => {
      button.addEventListener("click", () => {
        editingTestId = button.dataset.editTest;
        navigate("testForm");
      });
    });

    document.querySelectorAll("[data-delete-test]").forEach((button) => {
      button.addEventListener("click", () => {
        const testId = button.dataset.deleteTest;

        if (!confirm("Test o‘chirilsinmi?")) return;

        const content = loadContent();
        const directionKey = getSelectedDirection();

        content[directionKey].tests.tests =
          content[directionKey].tests.tests.filter((test) => test.id !== testId);

        saveContent(content);
        renderMenuDetail();
      });
    });
  }
}

function renderTestForm() {
  if (!isAdmin()) {
    showToast("Sizda admin huquqi yo‘q.");
    goBack();
    return;
  }

  const content = loadContent();
  const directionKey = getSelectedDirection();
  const tests = content[directionKey].tests.tests || [];
  const test = editingTestId
    ? tests.find((entry) => entry.id === editingTestId)
    : null;

  const questions = test?.questions?.length
    ? test.questions
    : [
        {
          question: "",
          options: ["", "", "", ""],
          correctIndex: 0
        }
      ];

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(test ? "Testni tahrirlash" : "Test qo‘shish")}

      <section class="profile-card">
        <form id="testForm" class="form">
          <label>
            Test nomi
            <input
              type="text"
              name="title"
              value="${escapeText(test?.title || "")}"
              placeholder="Masalan: Farmatsevtlar uchun test"
              required
            />
          </label>

          <label>
            Qisqa izoh
            <input
              type="text"
              name="description"
              value="${escapeText(test?.description || "")}"
              placeholder="Masalan: Dorilar bo‘yicha bilimni tekshirish"
            />
          </label>

          <div class="test-builder-head">
            <h3>Savollar</h3>
            <p>To‘g‘ri javobni faqat admin ko‘radi. Oddiy foydalanuvchilar test paytida faqat variantlarni ko‘radi.</p>
          </div>

          <div id="questionsBuilder" class="questions-builder">
            ${questions.map((question, index) => renderQuestionBuilderCard(question, index)).join("")}
          </div>

          <button type="button" id="addQuestionBtn" class="secondary-btn">
            ＋ Savol qo‘shish
          </button>

          <button type="submit" class="primary-btn">
            Saqlash
          </button>
        </form>
      </section>
    </main>
  `;

  attachTopBackButton();
  attachTestBuilderEvents();

  document.getElementById("addQuestionBtn").addEventListener("click", () => {
    const builder = document.getElementById("questionsBuilder");
    const index = builder.querySelectorAll("[data-question-card]").length;

    builder.insertAdjacentHTML(
      "beforeend",
      renderQuestionBuilderCard(
        {
          question: "",
          options: ["", "", "", ""],
          correctIndex: 0
        },
        index
      )
    );

    attachTestBuilderEvents();
  });

  document.getElementById("testForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const questionCards = document.querySelectorAll("[data-question-card]");
    const savedQuestions = [];

    for (const card of questionCards) {
      const questionInput = card.querySelector("[data-question-input]");
      const optionInputs = card.querySelectorAll("[data-option-input]");
      const correctInput = card.querySelector("[data-correct-radio]:checked");

      const questionText = questionInput.value.trim();
      const options = Array.from(optionInputs)
        .map((input) => input.value.trim())
        .filter(Boolean);

      if (!questionText) {
        showToast("Savol matnini kiriting.");
        return;
      }

      if (options.length < 2) {
        showToast("Har bir savolda kamida 2 ta javob varianti bo‘lishi kerak.");
        return;
      }

      const selectedCorrectIndex = Number(correctInput?.value || 0);

      if (selectedCorrectIndex >= options.length) {
        showToast("To‘g‘ri javob varianti noto‘g‘ri tanlangan.");
        return;
      }

      savedQuestions.push({
        question: questionText,
        options,
        correctIndex: selectedCorrectIndex
      });
    }

    const savedTest = {
      id: test?.id || createId("test"),
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      questions: savedQuestions,
      updatedAt: new Date().toISOString()
    };

    if (test) {
      const index = tests.findIndex((entry) => entry.id === test.id);
      tests[index] = savedTest;
    } else {
      tests.push(savedTest);
    }

    content[directionKey].tests.tests = tests;
    saveContent(content);

    selectedTestId = savedTest.id;
    showToast("Test saqlandi.");
    navigate("menuDetail", { replace: true });
  });
}

function renderQuestionBuilderCard(question, questionIndex) {
  const options = question.options?.length ? question.options : ["", "", "", ""];
  const correctIndex = Number(question.correctIndex || 0);

  return `
    <div class="question-builder-card" data-question-card>
      <div class="question-builder-top">
        <h4>Savol ${questionIndex + 1}</h4>

        <button type="button" class="question-delete-btn" data-delete-question>
          O‘chirish
        </button>
      </div>

      <label>
        Savol matni
        <textarea
          data-question-input
          rows="3"
          placeholder="Savolni yozing..."
          required
        >${escapeText(question.question || "")}</textarea>
      </label>

      <div class="options-builder" data-options-builder>
        ${options.map((option, optionIndex) =>
          renderOptionBuilderRow(option, optionIndex, correctIndex)
        ).join("")}
      </div>

      <button type="button" class="add-option-btn" data-add-option>
        ＋ Javob varianti qo‘shish
      </button>

      <div class="correct-answer-note">
        ✅ To‘g‘ri javobni tanlang. Bu belgi faqat admin tahrirlash oynasida ko‘rinadi.
      </div>
    </div>
  `;
}

function renderOptionBuilderRow(option, optionIndex, correctIndex) {
  return `
    <div class="option-builder-row" data-option-row>
      <label class="correct-radio-label">
        <input
          type="radio"
          name="correct_temp"
          value="${optionIndex}"
          data-correct-radio
          ${optionIndex === correctIndex ? "checked" : ""}
        />
        <span>To‘g‘ri</span>
      </label>

      <input
        type="text"
        data-option-input
        value="${escapeText(option || "")}"
        placeholder="Javob varianti"
        required
      />

      <button type="button" class="option-delete-btn" data-delete-option>
        ×
      </button>
    </div>
  `;
}

function refreshQuestionBuilderNumbers() {
  document.querySelectorAll("[data-question-card]").forEach((card, questionIndex) => {
    const title = card.querySelector(".question-builder-top h4");

    if (title) {
      title.textContent = `Savol ${questionIndex + 1}`;
    }

    const radios = card.querySelectorAll("[data-correct-radio]");
    const uniqueName = `correct_question_${questionIndex}`;

    radios.forEach((radio, optionIndex) => {
      radio.name = uniqueName;
      radio.value = String(optionIndex);
    });
  });
}

function attachTestBuilderEvents() {
  refreshQuestionBuilderNumbers();

  document.querySelectorAll("[data-delete-question]").forEach((button) => {
    button.onclick = () => {
      const cards = document.querySelectorAll("[data-question-card]");

      if (cards.length <= 1) {
        showToast("Kamida bitta savol bo‘lishi kerak.");
        return;
      }

      button.closest("[data-question-card]")?.remove();
      refreshQuestionBuilderNumbers();
    };
  });

  document.querySelectorAll("[data-add-option]").forEach((button) => {
    button.onclick = () => {
      const card = button.closest("[data-question-card]");
      const optionsBuilder = card?.querySelector("[data-options-builder]");

      if (!card || !optionsBuilder) return;

      const optionCount = optionsBuilder.querySelectorAll("[data-option-row]").length;

      optionsBuilder.insertAdjacentHTML(
        "beforeend",
        renderOptionBuilderRow("", optionCount, -1)
      );

      attachTestBuilderEvents();
    };
  });

  document.querySelectorAll("[data-delete-option]").forEach((button) => {
    button.onclick = () => {
      const card = button.closest("[data-question-card]");
      const optionRows = card?.querySelectorAll("[data-option-row]") || [];

      if (optionRows.length <= 2) {
        showToast("Kamida 2 ta javob varianti bo‘lishi kerak.");
        return;
      }

      const row = button.closest("[data-option-row]");
      const wasCorrect = row?.querySelector("[data-correct-radio]")?.checked;

      row?.remove();

      const firstRadio = card?.querySelector("[data-correct-radio]");

      if (wasCorrect && firstRadio) {
        firstRadio.checked = true;
      }

      refreshQuestionBuilderNumbers();
    };
  });
}

function renderTakeTest() {
  const content = loadContent();
  const directionKey = getSelectedDirection();
  const test = content[directionKey].tests.tests.find((entry) => entry.id === selectedTestId);

  if (!test) {
    goBack();
    return;
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(test.title)}

      <section class="profile-card">
        <h3>${escapeText(test.title)}</h3>
        <p class="muted">${escapeText(test.description || "")}</p>

        <form id="takeTestForm" class="test-form">
          ${test.questions
            .map(
              (question, questionIndex) => `
                <div class="question-card">
                  <h4>${questionIndex + 1}. ${escapeText(question.question)}</h4>

                  ${question.options
                    .map(
                      (option, optionIndex) => `
                        <label class="answer-option">
                          <input
                            type="radio"
                            name="question_${questionIndex}"
                            value="${optionIndex}"
                            required
                          />
                          <span>${escapeText(option)}</span>
                        </label>
                      `
                    )
                    .join("")}
                </div>
              `
            )
            .join("")}

          <button type="submit" class="primary-btn">
            Testni yakunlash
          </button>
        </form>
      </section>
    </main>
  `;

  attachTopBackButton();

  document.getElementById("takeTestForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    let correct = 0;

    test.questions.forEach((question, questionIndex) => {
      const answer = Number(formData.get(`question_${questionIndex}`));

      if (answer === Number(question.correctIndex)) {
        correct += 1;
      }
    });

    createTestResult({
      test,
      correct,
      total: test.questions.length
    });

    showToast(`Natija: ${correct}/${test.questions.length}`);
    navigate("testResults", { replace: true });
  });
}

/* Material detail/form */

function renderMaterialDetail() {
  const item = menuItems.find((menuItem) => menuItem.id === selectedMenuItemId) || menuItems[0];
  const sectionContent = getCurrentSectionContent();
  const material = sectionContent?.materials?.find((entry) => entry.id === selectedMaterialId);

  if (!material) {
    goBack();
    return;
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(material.title)}

      <section class="material-detail-card">
        <div class="detail-icon">${material.icon || item.icon}</div>

        <h2>${escapeText(material.title)}</h2>
        <p class="material-description">${escapeText(material.description || "")}</p>

        ${
          material.image
            ? `<img src="${material.image}" alt="${escapeText(material.title)}" class="material-image" />`
            : ""
        }

        <div class="material-text">
          ${escapeText(material.text || "Matn hali qo‘shilmagan.").replaceAll("\n", "<br />")}
        </div>

        ${
          material.videoUrl
            ? `
              <a href="${escapeText(material.videoUrl)}" target="_blank" class="video-link">
                ▶ Videoni ochish
              </a>
            `
            : ""
        }

        ${
          isAdmin()
            ? `
              <div class="material-admin-actions">
                <button id="editCurrentMaterial" class="secondary-btn">Tahrirlash</button>
              </div>
            `
            : ""
        }
      </section>

      ${renderBottomNav("home")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  if (isAdmin()) {
    document.getElementById("editCurrentMaterial").addEventListener("click", () => {
      editingMaterialId = material.id;
      navigate("materialForm");
    });
  }
}

function renderMaterialForm() {
  if (!isAdmin()) {
    showToast("Sizda admin huquqi yo‘q.");
    goBack();
    return;
  }

  const content = loadContent();
  const directionKey = getSelectedDirection();
  const materials = content[directionKey][selectedMenuItemId].materials || [];
  const material = editingMaterialId
    ? materials.find((entry) => entry.id === editingMaterialId)
    : null;

  let selectedImageData = material?.image || "";

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar(material ? "Materialni tahrirlash" : "Material qo‘shish")}

      <section class="profile-card">
        <form id="materialForm" class="form">
          <label>
            Ikonka
            <input
              type="text"
              name="icon"
              placeholder="Masalan: 📗"
              value="${escapeText(material?.icon || "")}"
            />
          </label>

          <label>
            Sarlavha
            <input
              type="text"
              name="title"
              value="${escapeText(material?.title || "")}"
              required
            />
          </label>

          <label>
            Qisqa izoh
            <input
              type="text"
              name="description"
              value="${escapeText(material?.description || "")}"
            />
          </label>

          <label>
            Asosiy matn
            <textarea name="text" rows="8">${escapeText(material?.text || "")}</textarea>
          </label>

          <label>
            Rasm
            <input type="file" id="materialImageInput" accept="image/*" />
          </label>

          <div id="materialImagePreview">
            ${
              selectedImageData
                ? `<img src="${selectedImageData}" class="material-image-preview" />`
                : ""
            }
          </div>

          <label>
            Video havola
            <input
              type="url"
              name="videoUrl"
              placeholder="https://..."
              value="${escapeText(material?.videoUrl || "")}"
            />
          </label>

          <button type="submit" class="primary-btn">
            Saqlash
          </button>
        </form>
      </section>
    </main>
  `;

  attachTopBackButton();

  document.getElementById("materialImageInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    selectedImageData = await readFileAsDataUrl(file);

    document.getElementById("materialImagePreview").innerHTML = `
      <img src="${selectedImageData}" class="material-image-preview" />
    `;
  });

  document.getElementById("materialForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const savedMaterial = {
      id: material?.id || createId("material"),
      icon: formData.get("icon").trim() || "📄",
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      text: formData.get("text").trim(),
      image: selectedImageData,
      videoUrl: formData.get("videoUrl").trim(),
      updatedAt: new Date().toISOString()
    };

    if (material) {
      const index = materials.findIndex((entry) => entry.id === material.id);
      materials[index] = savedMaterial;
    } else {
      materials.push(savedMaterial);
    }

    content[directionKey][selectedMenuItemId].materials = materials;
    saveContent(content);

    selectedMaterialId = savedMaterial.id;
    navigate("materialDetail", { replace: true });
  });
}

/* Admin */

function renderAdminShortcut() {
  if (!isAdmin()) return "";

  return `
    <section class="admin-shortcut">
      <button id="openAdminPanel" class="admin-btn">
        ⚙️ Admin panel
      </button>
    </section>
  `;
}

function attachAdminShortcutEvent() {
  const button = document.getElementById("openAdminPanel");

  if (button) {
    button.addEventListener("click", () => {
      navigate("admin");
    });
  }
}

function renderAdminPanel() {
  if (!isAdmin()) {
    showToast("Sizda admin huquqi yo‘q.");
    navigate("menu");
    return;
  }

  const users = loadUsers();
  const admins = loadAdmins();
  const announcements = loadAnnouncements();

  if (tg) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f4f6fb");
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar("Admin panel")}

      <section class="admin-panel">
        <p class="muted">
          Superadmin boshqa foydalanuvchilarga admin huquqi bera oladi.
        </p>

        <div class="admin-status-card">
          <p><b>Sizning Telegram ID:</b> ${escapeText(getTelegramUser().telegramId)}</p>
          <p><b>Rol:</b> ${isSuperAdmin() ? "Superadmin" : "Admin"}</p>
        </div>

        <div class="admin-announcement-card">
          <h3>E’lon qo‘shish</h3>

          <form id="announcementForm" class="form">
            <label>
              E’lon sarlavhasi
              <input
                type="text"
                name="title"
                placeholder="Masalan: Yangi dars joylandi"
                required
              />
            </label>

            <label>
              E’lon matni
              <textarea
                name="text"
                rows="4"
                placeholder="E’lon matnini yozing..."
                required
              ></textarea>
            </label>

            <button type="submit" class="primary-btn">
              E’lonni chiqarish
            </button>
          </form>
        </div>

        <div class="admin-announcement-card">
          <h3>Chiqarilgan e’lonlar</h3>

          <div class="admin-announcement-list">
            ${
              announcements.length
                ? announcements
                    .map(
                      (announcement) => `
                        <div class="admin-announcement-item">
                          <div>
                            <b>${escapeText(announcement.title)}</b>
                            <p>${escapeText(announcement.text)}</p>
                            <small>${escapeText(formatAnnouncementDate(announcement.createdAt))}</small>
                          </div>

                          <button data-delete-announcement="${announcement.id}">
                            O‘chirish
                          </button>
                        </div>
                      `
                    )
                    .join("")
                : `<p class="empty-text">Hozircha e’lonlar yo‘q.</p>`
            }
          </div>
        </div>

        ${
          isSuperAdmin()
            ? `
              <form id="adminForm" class="form admin-form">
                <label>
                  Huquq berish turi
                  <select name="type" required>
                    <option value="telegramId">Telegram ID / Chat ID</option>
                    <option value="pinfl">PINFL</option>
                  </select>
                </label>

                <label>
                  Qiymat
                  <input
                    type="text"
                    name="value"
                    placeholder="Masalan: 123456789 yoki PINFL"
                    required
                  />
                </label>

                <button type="submit" class="primary-btn">
                  Admin qilish
                </button>
              </form>
            `
            : `
              <div class="warning-card">
                Faqat superadmin yangi admin qo‘sha oladi.
              </div>
            `
        }

        <h3>Adminlar</h3>

        <div class="admin-list">
          <div class="admin-list-item super">
            <div>
              <b>Superadmin</b>
              <p>${escapeText(SUPER_ADMIN_TELEGRAM_ID)}</p>
            </div>
            <span>Owner</span>
          </div>

          ${
            admins.length
              ? admins
                  .map(
                    (admin, index) => `
                      <div class="admin-list-item">
                        <div>
                          <b>${admin.type === "telegramId" ? "Telegram ID" : "PINFL"}</b>
                          <p>${escapeText(admin.value)}</p>
                        </div>

                        ${
                          isSuperAdmin()
                            ? `<button class="delete-admin-btn" data-index="${index}">O‘chirish</button>`
                            : ""
                        }
                      </div>
                    `
                  )
                  .join("")
              : `<p class="empty-text">Hozircha adminlar yo‘q.</p>`
          }
        </div>

        <h3>Ro‘yxatdan o‘tgan foydalanuvchilar</h3>

        <div class="users-list">
          ${
            users.length
              ? users
                  .map(
                    (user) => `
                      <div class="user-row">
                        <div class="user-row-left">
                          ${
                            user.photo
                              ? `
                                <img
                                  src="${user.photo}"
                                  alt="User photo"
                                  class="admin-user-photo"
                                  style="object-position: ${escapeText(user.photoPosition || "center center")};"
                                />
                              `
                              : `<div class="admin-user-photo-placeholder">${getInitials(user.firstName, user.lastName)}</div>`
                          }

                          <div class="admin-user-info">
                            <b>${escapeText(user.firstName || "")} ${escapeText(user.lastName || "")}</b>
                            <p>Telegram ID: ${escapeText(user.telegramId)}</p>
                            <p>PINFL: ${escapeText(user.pinfl || "Kiritilmagan")}</p>
                            <p>Bo‘limlar: ${escapeText(getUserDirectionsLabel(user))}</p>
                            <p>Oxirgi bo‘lim: ${escapeText(directions[user.lastDirection || user.direction]?.title || "Kiritilmagan")}</p>
                            <p>Yulduzlar: ${getStarsText(user.stars)}</p>
                            <p>Kategoriya: ${escapeText(getPharmacistCategory(user.stars))}</p>
                            <p>Umumiy ball: ${getUserTotalScore(user.telegramId)}</p>

                            ${
                              isSuperAdmin()
                                ? `
                                  <div class="admin-stars-control" data-star-user="${escapeText(user.telegramId)}">
                                    <label>
                                      Yulduz berish
                                      <select data-star-select>
                                        <option value="0" ${Number(user.stars || 0) === 0 ? "selected" : ""}>0 — Kategoriya yo‘q</option>
                                        <option value="1" ${Number(user.stars || 0) === 1 ? "selected" : ""}>1 — Stajyor</option>
                                        <option value="2" ${Number(user.stars || 0) === 2 ? "selected" : ""}>2 — Yordamchi farmatsevt</option>
                                        <option value="3" ${Number(user.stars || 0) === 3 ? "selected" : ""}>3 — Farmatsevt</option>
                                        <option value="4" ${Number(user.stars || 0) === 4 ? "selected" : ""}>4 — Bosh farmatsevt</option>
                                      </select>
                                    </label>

                                    <button data-save-stars>
                                      Saqlash
                                    </button>
                                  </div>
                                `
                                : ""
                            }
                          </div>
                        </div>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="empty-text">Foydalanuvchilar hali yo‘q.</p>`
          }
        </div>

        <button id="backToMenu" class="secondary-btn">
          Asosiy menyuga qaytish
        </button>
      </section>
    </main>
  `;

  attachTopBackButton();

  document.getElementById("backToMenu").addEventListener("click", () => {
    navigate("menu", { replace: true });
  });

  document.getElementById("announcementForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    createAnnouncement({
      title: formData.get("title").trim(),
      text: formData.get("text").trim()
    });

    showToast("E’lon chiqarildi.");
    renderAdminPanel();
  });

  document.querySelectorAll("[data-delete-announcement]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirm("E’lon o‘chirilsinmi?")) return;

      deleteAnnouncement(button.dataset.deleteAnnouncement);

      showToast("E’lon o‘chirildi.");
      renderAdminPanel();
    });
  });

  document.querySelectorAll("[data-save-stars]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest("[data-star-user]");
      const select = wrapper?.querySelector("[data-star-select]");

      if (!wrapper || !select) return;

      updateUserStars(wrapper.dataset.starUser, Number(select.value));

      showToast("Yulduzlar saqlandi.");
      renderAdminPanel();
    });
  });

  if (isSuperAdmin()) {
    document.getElementById("adminForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const type = formData.get("type");
      const value = formData.get("value").trim();

      if (!value) {
        showToast("Qiymat kiriting.");
        return;
      }

      const currentAdmins = loadAdmins();

      const exists = currentAdmins.some(
        (admin) => admin.type === type && String(admin.value) === String(value)
      );

      if (exists) {
        showToast("Bu admin allaqachon qo‘shilgan.");
        return;
      }

      currentAdmins.push({
        type,
        value,
        createdAt: new Date().toISOString()
      });

      saveAdmins(currentAdmins);

      showToast("Admin qo‘shildi.");
      renderAdminPanel();
    });

    document.querySelectorAll(".delete-admin-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const currentAdmins = loadAdmins();

        currentAdmins.splice(index, 1);
        saveAdmins(currentAdmins);

        showToast("Admin o‘chirildi.");
        renderAdminPanel();
      });
    });
  }
}

/* Profile */

function renderProfile() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    navigate("registration");
    return;
  }

  selectedProfilePhotoData = null;
  selectedProfilePhotoPosition = currentUser.photoPosition || "center center";

  const direction = directions[getSelectedDirection()];
  const profilePhoto = currentUser.photo || "";

  if (tg) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f4f6fb");
  }

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar("Profilim")}

      <section class="profile-header">
        <div class="profile-photo-wrap" id="profilePhotoPreview">
          ${
            profilePhoto
              ? `
                <img
                  src="${profilePhoto}"
                  alt="Profile photo"
                  class="profile-photo"
                  style="object-position: ${escapeText(selectedProfilePhotoPosition)};"
                />
              `
              : `<div class="profile-avatar">${getInitials(currentUser.firstName, currentUser.lastName)}</div>`
          }
        </div>

        <div>
          <h2>${escapeText(currentUser.firstName)} ${escapeText(currentUser.lastName)}</h2>
          <p>Telegram ID: ${escapeText(currentUser.telegramId)}</p>
          ${currentUser.username ? `<p>@${escapeText(currentUser.username)}</p>` : ""}
          <p>Bo‘limlar: ${escapeText(getUserDirectionsLabel(currentUser))}</p>
          <p>Yulduzlar: ${getStarsText(currentUser.stars)}</p>
          <p>Kategoriya: ${escapeText(getPharmacistCategory(currentUser.stars))}</p>
          <p>Umumiy ball: ${getUserTotalScore(currentUser.telegramId)}</p>
        </div>
      </section>

      <section class="profile-card">
        <h3>Profil ma’lumotlari</h3>

        <form id="profileForm" class="form">
          <label>
            Profil rasmi
            <input
              type="file"
              name="photo"
              id="profilePhotoInput"
              accept="image/*"
            />
          </label>

          <div class="photo-position-box">
            <p>Rasm markazini tanlang:</p>

            <div class="photo-position-grid">
              <button type="button" data-photo-position="center 35%">Yuqoriroq</button>
              <button type="button" data-photo-position="center center">Markaz</button>
              <button type="button" data-photo-position="center 65%">Pastroq</button>
              <button type="button" data-photo-position="35% center">Chaproq</button>
              <button type="button" data-photo-position="65% center">O‘ngroq</button>
            </div>
          </div>

          <label>
            Ism
            <input
              type="text"
              name="firstName"
              value="${escapeText(currentUser.firstName || "")}"
              required
            />
          </label>

          <label>
            Familiya
            <input
              type="text"
              name="lastName"
              value="${escapeText(currentUser.lastName || "")}"
              required
            />
          </label>

          <label>
            Tug‘ilgan sana
            <input
              type="date"
              name="birthDate"
              value="${escapeText(currentUser.birthDate || "")}"
              required
            />
          </label>

          <label>
            Jins
            <select name="gender">
              <option value="">Tanlang</option>
              <option value="male" ${currentUser.gender === "male" ? "selected" : ""}>Erkak</option>
              <option value="female" ${currentUser.gender === "female" ? "selected" : ""}>Ayol</option>
            </select>
          </label>

          <label>
            Hujjat turi
            <select name="documentType">
              <option value="">Tanlang</option>
              <option value="id_card" ${currentUser.documentType === "id_card" ? "selected" : ""}>ID karta</option>
              <option value="passport" ${currentUser.documentType === "passport" ? "selected" : ""}>Pasport</option>
            </select>
          </label>

          <label>
            ID karta yoki pasport raqami
            <input
              type="text"
              name="documentNumber"
              placeholder="AA1234567"
              value="${escapeText(currentUser.documentNumber || "")}"
            />
          </label>

          <label>
            PINFL
            <input
              type="text"
              name="pinfl"
              placeholder="14 xonali PINFL"
              maxlength="14"
              value="${escapeText(currentUser.pinfl || "")}"
            />
          </label>

          <div class="two-columns">
            <label>
              Ish boshlanishi
              <input
                type="time"
                name="workFrom"
                value="${escapeText(currentUser.workFrom || "")}"
              />
            </label>

            <label>
              Ish tugashi
              <input
                type="time"
                name="workTo"
                value="${escapeText(currentUser.workTo || "")}"
              />
            </label>
          </div>

          <button type="submit" class="primary-btn" style="background:${direction.color}">
            Saqlash
          </button>
        </form>
      </section>

      ${renderBottomNav("profile")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  document.getElementById("profilePhotoInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    selectedProfilePhotoData = await readFileAsDataUrl(file);
    selectedProfilePhotoPosition = "center center";

    updateProfilePhotoPreview(selectedProfilePhotoData, selectedProfilePhotoPosition);
    updatePhotoPositionButtons();
  });

  document.querySelectorAll("[data-photo-position]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProfilePhotoPosition = button.dataset.photoPosition;

      const photo = selectedProfilePhotoData || currentUser.photo || "";

      if (photo) {
        updateProfilePhotoPreview(photo, selectedProfilePhotoPosition);
      }

      updatePhotoPositionButtons();
    });
  });

  updatePhotoPositionButtons();

  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const updatedUser = {
      ...currentUser,
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      birthDate: formData.get("birthDate"),
      gender: formData.get("gender"),
      documentType: formData.get("documentType"),
      documentNumber: formData.get("documentNumber").trim(),
      pinfl: formData.get("pinfl").trim(),
      workFrom: formData.get("workFrom"),
      workTo: formData.get("workTo"),
      photo: selectedProfilePhotoData || currentUser.photo || "",
      photoPosition: selectedProfilePhotoPosition || currentUser.photoPosition || "center center",
      stars: Number(currentUser.stars || 0),
      pharmacistCategory: getPharmacistCategory(currentUser.stars)
    };

    saveCurrentUser(updatedUser);

    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("success");
    }

    showToast("Profil ma’lumotlari saqlandi.");
    renderProfile();
  });
}

/* Announcements */

function renderAnnouncements() {
  const announcements = loadAnnouncements();

  app.innerHTML = `
    <main class="app-page light-page">
      ${renderTopBar("E’lonlar")}

      <section class="score-card">
        <div class="score-icon">🏆</div>

        <div>
          <p>Sizning yutuqlaringiz</p>
          <h2>${getUserTotalScore(getCurrentUser()?.telegramId)} ball</h2>
          <span>${getStarsText(getCurrentUser()?.stars)} · ${escapeText(getPharmacistCategory(getCurrentUser()?.stars))}</span>
        </div>
      </section>

      <section class="announcement-block">
        <div class="block-title-row">
          <h3>📣 E’lonlar</h3>
          <button>${announcements.length} ta e’lon</button>
        </div>

        ${
          announcements.length
            ? announcements
                .map(
                  (announcement) => `
                    <div class="announcement-row real-announcement-row">
                      <div class="announcement-red-dot"></div>

                      <div class="announcement-date">
                        ${escapeText(formatAnnouncementDate(announcement.createdAt))}
                      </div>

                      <h4>${escapeText(announcement.title)}</h4>
                      <p>${escapeText(announcement.text)}</p>

                      <span>›</span>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="announcement-empty">
                <div>📭</div>
                <h4>Hozircha e’lonlar yo‘q</h4>
                <p>Admin e’lon qo‘shganda shu yerda ko‘rinadi.</p>
              </div>
            `
        }
      </section>

      <section class="quick-actions">
        <h3>Tezkor tugmalar</h3>

        <div class="quick-grid">
          <button data-quick="tests">🧑‍🏫 Testlar</button>
          <button data-quick="pharmacistRating">🏆 Reyting</button>
          <button data-quick="medicine">✅ Dorilar bazasi</button>
          <button data-quick="lessons">🎓 Darslar</button>
          <button data-quick="rules">📘 Hujjatlar</button>
          <button data-quick="birthdays">🎂 Tug‘ilgan kunlar</button>
        </div>
      </section>

      ${renderBottomNav("announcements")}
    </main>
  `;

  attachTopBackButton();
  attachBottomNavEvents();

  document.querySelectorAll("[data-quick]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMenuItemId = button.dataset.quick;
      navigate("menuDetail");
    });
  });
}

/* Bottom nav */

function renderBottomNav(active) {
  const announcementsCount = getUnreadAnnouncementsCount();

  return `
    <nav class="bottom-nav bottom-nav-three">
      <button class="${active === "home" ? "active" : ""}" data-nav="menu">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Asosiy menyu</span>
      </button>

      <button class="${active === "announcements" ? "active" : ""}" data-nav="announcements">
        <span class="nav-icon nav-icon-wrap">
          📣
          ${
            announcementsCount > 0
              ? `<em class="nav-badge">${announcementsCount > 99 ? "99+" : announcementsCount}</em>`
              : ""
          }
        </span>
        <span class="nav-label">E’lonlar</span>
      </button>

      <button class="${active === "profile" ? "active" : ""}" data-nav="profile">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Profilim</span>
      </button>
    </nav>
  `;
}

function attachBottomNavEvents() {
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = button.dataset.nav;

      if (nav === "menu") navigate("menu");
      if (nav === "announcements") navigate("announcements");
      if (nav === "profile") navigate("profile");
    });
  });
}

/* Helpers */

function getInitials(firstName = "", lastName = "") {
  const first = firstName.trim()[0] || "";
  const last = lastName.trim()[0] || "";

  return `${first}${last}`.toUpperCase() || "U";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function updateProfilePhotoPreview(photo, position = "center center") {
  const preview = document.getElementById("profilePhotoPreview");

  if (!preview) return;

  preview.innerHTML = `
    <img
      src="${photo}"
      alt="Profile photo"
      class="profile-photo"
      style="object-position: ${escapeText(position)};"
    />
  `;
}

function updatePhotoPositionButtons() {
  document.querySelectorAll("[data-photo-position]").forEach((button) => {
    const isActive = button.dataset.photoPosition === selectedProfilePhotoPosition;

    button.classList.toggle("active", isActive);
  });
}

/* Start */

loadContent();
loadMedicines();
renderHome();
updateTelegramBackButton();
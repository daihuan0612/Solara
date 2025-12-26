const dom = {
    container: document.getElementById("mainContainer"),
    backgroundStage: document.getElementById("backgroundStage"),
    backgroundBaseLayer: document.getElementById("backgroundBaseLayer"),
    backgroundTransitionLayer: document.getElementById("backgroundTransitionLayer"),
    playlist: document.getElementById("playlist"),
    playlistItems: document.getElementById("playlistItems"),
    favorites: document.getElementById("favorites"),
    favoriteItems: document.getElementById("favoriteItems"),
    lyrics: document.getElementById("lyrics"),
    lyricsScroll: document.getElementById("lyricsScroll"),
    lyricsContent: document.getElementById("lyricsContent"),
    mobileInlineLyrics: document.getElementById("mobileInlineLyrics"),
    mobileInlineLyricsScroll: document.getElementById("mobileInlineLyricsScroll"),
    mobileInlineLyricsContent: document.getElementById("mobileInlineLyricsContent"),
    audioPlayer: document.getElementById("audioPlayer"),
    themeToggleButton: document.getElementById("themeToggleButton"),
    loadOnlineBtn: document.getElementById("loadOnlineBtn"),
    showPlaylistBtn: document.getElementById("showPlaylistBtn"),
    showLyricsBtn: document.getElementById("showLyricsBtn"),
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    sourceSelectButton: document.getElementById("sourceSelectButton"),
    sourceSelectLabel: document.getElementById("sourceSelectLabel"),
    sourceMenu: document.getElementById("sourceMenu"),
    searchResults: document.getElementById("searchResults"),
    searchResultsList: document.getElementById("searchResultsList"),
    notification: document.getElementById("notification"),
    albumCover: document.getElementById("albumCover"),
    currentSongTitle: document.getElementById("currentSongTitle"),
    currentSongArtist: document.getElementById("currentSongArtist"),
    debugInfo: document.getElementById("debugInfo"),
    importSelectedBtn: document.getElementById("importSelectedBtn"),
    importSelectedCount: document.getElementById("importSelectedCount"),
    importSelectedMenu: document.getElementById("importSelectedMenu"),
    importToPlaylist: document.getElementById("importToPlaylist"),
    importToFavorites: document.getElementById("importToFavorites"),
    importPlaylistBtn: document.getElementById("importPlaylistBtn"),
    exportPlaylistBtn: document.getElementById("exportPlaylistBtn"),
    importPlaylistInput: document.getElementById("importPlaylistInput"),
    clearPlaylistBtn: document.getElementById("clearPlaylistBtn"),
    mobileImportPlaylistBtn: document.getElementById("mobileImportPlaylistBtn"),
    mobileExportPlaylistBtn: document.getElementById("mobileExportPlaylistBtn"),
    playModeBtn: document.getElementById("playModeBtn"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    progressBar: document.getElementById("progressBar"),
    currentTimeDisplay: document.getElementById("currentTimeDisplay"),
    durationDisplay: document.getElementById("durationDisplay"),
    volumeSlider: document.getElementById("volumeSlider"),
    volumeIcon: document.getElementById("volumeIcon"),
    qualityToggle: document.getElementById("qualityToggle"),
    playerQualityMenu: document.getElementById("playerQualityMenu"),
    qualityLabel: document.getElementById("qualityLabel"),
    mobileToolbarTitle: document.getElementById("mobileToolbarTitle"),
    mobileSearchToggle: document.getElementById("mobileSearchToggle"),
    mobileSearchClose: document.getElementById("mobileSearchClose"),
    mobilePanelClose: document.getElementById("mobilePanelClose"),
    mobileClearPlaylistBtn: document.getElementById("mobileClearPlaylistBtn"),
    mobilePlaylistActions: document.getElementById("mobilePlaylistActions"),
    mobileFavoritesActions: document.getElementById("mobileFavoritesActions"),
    mobileAddAllFavoritesBtn: document.getElementById("mobileAddAllFavoritesBtn"),
    mobileImportFavoritesBtn: document.getElementById("mobileImportFavoritesBtn"),
    mobileExportFavoritesBtn: document.getElementById("mobileExportFavoritesBtn"),
    mobileClearFavoritesBtn: document.getElementById("mobileClearFavoritesBtn"),
    mobileOverlayScrim: document.getElementById("mobileOverlayScrim"),
    mobileExploreButton: document.getElementById("mobileExploreButton"),
    mobileQualityToggle: document.getElementById("mobileQualityToggle"),
    mobileQualityLabel: document.getElementById("mobileQualityLabel"),
    mobilePanel: document.getElementById("mobilePanel"),
    mobileQueueToggle: document.getElementById("mobileQueueToggle"),
    shuffleToggleBtn: document.getElementById("shuffleToggleBtn"),
    searchArea: document.getElementById("searchArea"),
    libraryTabs: Array.from(document.querySelectorAll(".playlist-tab[data-target]")),
    addAllFavoritesBtn: document.getElementById("addAllFavoritesBtn"),
    importFavoritesBtn: document.getElementById("importFavoritesBtn"),
    exportFavoritesBtn: document.getElementById("exportFavoritesBtn"),
    importFavoritesInput: document.getElementById("importFavoritesInput"),
    clearFavoritesBtn: document.getElementById("clearFavoritesBtn"),
    currentFavoriteToggle: document.getElementById("currentFavoriteToggle"),
};
window.SolaraDom = dom;

const isMobileView = Boolean(window.__SOLARA_IS_MOBILE);

const mobileBridge = window.SolaraMobileBridge || {};
mobileBridge.handlers = mobileBridge.handlers || {};
mobileBridge.queue = Array.isArray(mobileBridge.queue) ? mobileBridge.queue : [];
window.SolaraMobileBridge = mobileBridge;

function invokeMobileHook(name, ...args) {
    if (!isMobileView) {
        return undefined;
    }
    const handler = mobileBridge.handlers[name];
    if (typeof handler === "function") {
        return handler(...args);
    }
    mobileBridge.queue.push({ name, args });
    return undefined;
}

function initializeMobileUI() {
    return invokeMobileHook("initialize");
}

function updateMobileToolbarTitle() {
    return invokeMobileHook("updateToolbarTitle");
}

function runAfterOverlayFrame(callback) {
    if (typeof callback !== "function" || !isMobileView) {
        return;
    }
    const runner = () => {
        if (!document.body) {
            return;
        }
        callback();
    };
    if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(runner);
    } else {
        window.setTimeout(runner, 0);
    }
}

function syncMobileOverlayVisibility() {
    if (!isMobileView || !document.body) {
        return;
    }
    const searchOpen = document.body.classList.contains("mobile-search-open");
    const panelOpen = document.body.classList.contains("mobile-panel-open");
    if (dom.searchArea) {
        dom.searchArea.setAttribute("aria-hidden", searchOpen ? "false" : "true");
    }
    if (dom.mobileOverlayScrim) {
        dom.mobileOverlayScrim.setAttribute("aria-hidden", (searchOpen || panelOpen) ? "false" : "true");
    }
}

function updateMobileClearPlaylistVisibility() {
    if (!isMobileView) {
        return;
    }
    const button = dom.mobileClearPlaylistBtn;
    if (!button) {
        return;
    }
    const playlistElement = dom.playlist;
    const body = document.body;
    const currentView = body ? body.getAttribute("data-mobile-panel-view") : null;
    const isPlaylistView = !body || !currentView || currentView === "playlist";
    const playlistSongs = (typeof state !== "undefined" && Array.isArray(state.playlistSongs)) ? state.playlistSongs : [];
    const isEmpty = playlistSongs.length === 0 || !playlistElement || playlistElement.classList.contains("empty");
    const isPlaylistVisible = Boolean(playlistElement && !playlistElement.hasAttribute("hidden"));
    const shouldShow = isPlaylistView && isPlaylistVisible && !isEmpty;
    button.hidden = !shouldShow;
    button.setAttribute("aria-hidden", shouldShow ? "false" : "true");
}

function updateMobileLibraryActionVisibility(showFavorites) {
    if (!isMobileView) {
        return;
    }
    const playlistGroup = dom.mobilePlaylistActions;
    const favoritesGroup = dom.mobileFavoritesActions;
    const showFavoritesGroup = Boolean(showFavorites);

    if (playlistGroup) {
        if (showFavoritesGroup) {
            playlistGroup.setAttribute("hidden", "");
            playlistGroup.setAttribute("aria-hidden", "true");
        } else {
            playlistGroup.removeAttribute("hidden");
            playlistGroup.setAttribute("aria-hidden", "false");
        }
    }

    if (favoritesGroup) {
        if (showFavoritesGroup) {
            favoritesGroup.removeAttribute("hidden");
            favoritesGroup.setAttribute("aria-hidden", "false");
        } else {
            favoritesGroup.setAttribute("hidden", "");
            favoritesGroup.setAttribute("aria-hidden", "true");
        }
    }
}

function forceCloseMobileSearchOverlay() {
    if (!isMobileView || !document.body) {
        return;
    }
    document.body.classList.remove("mobile-search-open");
    if (dom.searchInput) {
        dom.searchInput.blur();
    }
    syncMobileOverlayVisibility();
}

function forceCloseMobilePanelOverlay() {
    if (!isMobileView || !document.body) {
        return;
    }
    document.body.classList.remove("mobile-panel-open");
    syncMobileOverlayVisibility();
}

function openMobileSearch() {
    return invokeMobileHook("openSearch");
}

function closeMobileSearch() {
    const result = invokeMobileHook("closeSearch");
    runAfterOverlayFrame(forceCloseMobileSearchOverlay);
    return result;
}

function toggleMobileSearch() {
    return invokeMobileHook("toggleSearch");
}

function openMobilePanel(view = "playlist") {
    return invokeMobileHook("openPanel", view);
}

function closeMobilePanel() {
    const result = invokeMobileHook("closePanel");
    runAfterOverlayFrame(forceCloseMobilePanelOverlay);
    return result;
}

function toggleMobilePanel(view = "playlist") {
    return invokeMobileHook("togglePanel", view);
}

function closeAllMobileOverlays() {
    const result = invokeMobileHook("closeAllOverlays");
    runAfterOverlayFrame(() => {
        forceCloseMobileSearchOverlay();
        forceCloseMobilePanelOverlay();
    });
    return result;
}

function updateMobileInlineLyricsAria(isOpen) {
    if (!dom.mobileInlineLyrics) {
        return;
    }
    dom.mobileInlineLyrics.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

function setMobileInlineLyricsOpen(isOpen) {
    if (!isMobileView || !document.body || !dom.mobileInlineLyrics) {
        return;
    }
    state.isMobileInlineLyricsOpen = Boolean(isOpen);
    document.body.classList.toggle("mobile-inline-lyrics-open", Boolean(isOpen));
    updateMobileInlineLyricsAria(Boolean(isOpen));
}

function hasInlineLyricsContent() {
    const content = dom.mobileInlineLyricsContent;
    if (!content) {
        return false;
    }
    return content.textContent.trim().length > 0;
}

function canOpenMobileInlineLyrics() {
    if (!isMobileView || !document.body) {
        return false;
    }
    const hasSong = Boolean(state.currentSong);
    return hasSong && hasInlineLyricsContent();
}

function closeMobileInlineLyrics(options = {}) {
    if (!isMobileView || !document.body) {
        return false;
    }
    if (!document.body.classList.contains("mobile-inline-lyrics-open")) {
        updateMobileInlineLyricsAria(false);
        state.isMobileInlineLyricsOpen = false;
        return false;
    }
    setMobileInlineLyricsOpen(false);
    if (options.force) {
        state.userScrolledLyrics = false;
    }
    return true;
}

function openMobileInlineLyrics() {
    if (!isMobileView || !document.body) {
        return false;
    }
    if (!canOpenMobileInlineLyrics()) {
        return false;
    }
    setMobileInlineLyricsOpen(true);
    state.userScrolledLyrics = false;
    window.requestAnimationFrame(() => {
        const container = dom.mobileInlineLyricsScroll || dom.mobileInlineLyrics;
        const activeLyric = dom.mobileInlineLyricsContent?.querySelector(".current") ||
            dom.mobileInlineLyricsContent?.querySelector("div[data-index]");
        if (container && activeLyric) {
            scrollToCurrentLyric(activeLyric, container);
        }
    });
    syncLyrics();
    return true;
}

function toggleMobileInlineLyrics() {
    if (!isMobileView || !document.body) {
        return;
    }
    if (document.body.classList.contains("mobile-inline-lyrics-open")) {
        closeMobileInlineLyrics();
    } else {
        openMobileInlineLyrics();
    }
}

const PLACEHOLDER_HTML = `<div class="placeholder"><i class="fas fa-music"></i></div>`;
const paletteCache = new Map();
const PALETTE_STORAGE_KEY = "paletteCache.v1";
let paletteAbortController = null;
const BACKGROUND_TRANSITION_DURATION = 850;
let backgroundTransitionTimer = null;
const PALETTE_APPLY_DELAY = 140;
let pendingPaletteTimer = null;
let deferredPaletteHandle = null;
let deferredPaletteType = "";
let deferredPaletteUrl = null;
const themeDefaults = {
    light: {
        gradient: "",
        primaryColor: "",
        primaryColorDark: "",
    },
    dark: {
        gradient: "",
        primaryColor: "",
        primaryColorDark: "",
    }
};
let paletteRequestId = 0;

const REMOTE_STORAGE_ENDPOINT = "/api/storage";
let remoteSyncEnabled = false;
const STORAGE_KEYS_TO_SYNC = new Set([
    "playlistSongs",
    "currentTrackIndex",
    "playMode",
    "playbackQuality",
    "playerVolume",
    "currentPlaylist",
    "currentList",
    "currentSong",
    "currentPlaybackTime",
    "favoriteSongs",
    "currentFavoriteIndex",
    "favoritePlayMode",
    "favoritePlaybackTime",
    "searchSource",
    "lastSearchState.v1",
]);

function createPersistentStorageClient() {
    let availabilityPromise = null;
    let remoteAvailable = false;

    const checkAvailability = async () => {
        if (availabilityPromise) {
            return availabilityPromise;
        }
        availabilityPromise = (async () => {
            try {
                const url = new URL(REMOTE_STORAGE_ENDPOINT, window.location.origin);
                url.searchParams.set("status", "1");
                const response = await fetch(url.toString(), { method: "GET" });
                if (!response.ok) {
                    return false;
                }
                const result = await response.json().catch(() => ({}));
                remoteAvailable = Boolean(result && result.d1Available);
                return remoteAvailable;
            } catch (error) {
                console.warn("检查远程存储可用性失败", error);
                return false;
            }
        })();
        return availabilityPromise;
    };

    const getItems = async (keys = []) => {
        const available = await checkAvailability();
        if (!available || !Array.isArray(keys) || keys.length === 0) {
            return null;
        }
        try {
            const url = new URL(REMOTE_STORAGE_ENDPOINT, window.location.origin);
            url.searchParams.set("keys", keys.join(","));
            const response = await fetch(url.toString(), { method: "GET" });
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.warn("获取远程存储数据失败", error);
            return null;
        }
    };

    const setItems = async (items) => {
        const available = await checkAvailability();
        if (!available || !items || typeof items !== "object") {
            return false;
        }
        try {
            await fetch(REMOTE_STORAGE_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: items }),
            });
            return true;
        } catch (error) {
            console.warn("写入远程存储失败", error);
            return false;
        }
    };

    const removeItems = async (keys = []) => {
        const available = await checkAvailability();
        if (!available || !Array.isArray(keys) || keys.length === 0) {
            return false;
        }
        try {
            await fetch(REMOTE_STORAGE_ENDPOINT, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keys }),
            });
            return true;
        } catch (error) {
            console.warn("删除远程存储数据失败", error);
            return false;
        }
    };

    return {
        checkAvailability,
        getItems,
        setItems,
        removeItems,
    };
}

const persistentStorage = createPersistentStorageClient();

function shouldSyncStorageKey(key) {
    return STORAGE_KEYS_TO_SYNC.has(key);
}

function persistStorageItems(items) {
    if (!items || typeof items !== "object") {
        return;
    }
    persistentStorage.setItems(items).catch((error) => {
        console.warn("同步远程存储失败", error);
    });
}

function removePersistentItems(keys = []) {
    if (!Array.isArray(keys) || keys.length === 0) {
        return;
    }
    persistentStorage.removeItems(keys).catch((error) => {
        console.warn("移除远程存储数据失败", error);
    });
}

function safeGetLocalStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn(`读取本地存储失败: ${key}`, error);
        return null;
    }
}

function safeSetLocalStorage(key, value, options = {}) {
    const { skipRemote = false } = options;
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn(`写入本地存储失败: ${key}`, error);
    }
    if (!skipRemote && remoteSyncEnabled && shouldSyncStorageKey(key)) {
        persistStorageItems({ [key]: value });
    }
}

function safeRemoveLocalStorage(key, options = {}) {
    const { skipRemote = false } = options;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`移除本地存储失败: ${key}`, error);
    }
    if (!skipRemote && remoteSyncEnabled && shouldSyncStorageKey(key)) {
        removePersistentItems([key]);
    }
}

function parseJSON(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return parsed;
    } catch (error) {
        console.warn("解析本地存储 JSON 失败", error);
        return fallback;
    }
}

function cloneSearchResults(results) {
    if (!Array.isArray(results)) {
        return [];
    }
    try {
        return JSON.parse(JSON.stringify(results));
    } catch (error) {
        console.warn("复制搜索结果失败，回退到浅拷贝", error);
        return results.map((item) => {
            if (item && typeof item === "object") {
                return { ...item };
            }
            return item;
        });
    }
}

function sanitizeStoredSearchState(data, defaultSource = SOURCE_OPTIONS[0].value) {
    if (!data || typeof data !== "object") {
        return null;
    }

    const keyword = typeof data.keyword === "string" ? data.keyword : "";
    const sourceValue = typeof data.source === "string" ? data.source : defaultSource;
    const source = normalizeSource(sourceValue);
    const page = Number.isInteger(data.page) && data.page > 0 ? data.page : 1;
    const hasMore = typeof data.hasMore === "boolean" ? data.hasMore : true;
    const results = cloneSearchResults(data.results);

    return { keyword, source, page, hasMore, results };
}

function loadStoredPalettes() {
    const stored = safeGetLocalStorage(PALETTE_STORAGE_KEY);
    if (!stored) {
        return;
    }

    try {
        const entries = JSON.parse(stored);
        if (Array.isArray(entries)) {
            for (const entry of entries) {
                if (Array.isArray(entry) && typeof entry[0] === "string" && entry[1] && typeof entry[1] === "object") {
                    paletteCache.set(entry[0], entry[1]);
                }
            }
        }
    } catch (error) {
        console.warn("解析调色板缓存失败", error);
    }
}

function persistPaletteCache() {
    const maxEntries = 20;
    const entries = Array.from(paletteCache.entries()).slice(-maxEntries);
    try {
        safeSetLocalStorage(PALETTE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
        console.warn("保存调色板缓存失败", error);
    }
}

function preferHttpsUrl(url) {
    if (!url || typeof url !== "string") return url;

    try {
        const parsedUrl = new URL(url, window.location.href);
        if (parsedUrl.protocol === "http:" && window.location.protocol === "https:") {
            parsedUrl.protocol = "https:";
            return parsedUrl.toString();
        }
        return parsedUrl.toString();
    } catch (error) {
        if (window.location.protocol === "https:" && url.startsWith("http://")) {
            return "https://" + url.substring("http://".length);
        }
        return url;
    }
}

function toAbsoluteUrl(url) {
    if (!url) {
        return "";
    }

    try {
        const absolute = new URL(url, window.location.href);
        return absolute.href;
    } catch (_) {
        return url;
    }
}

function buildAudioProxyUrl(url) {
    if (!url || typeof url !== "string") return url;

    try {
        const parsedUrl = new URL(url, window.location.href);
        // 新API返回的URL已经是完整的代理URL，不需要额外处理
        return parsedUrl.toString();
    } catch (error) {
        console.warn("无法解析音频地址，跳过代理", error);
        return url;
    }
}

const SOURCE_OPTIONS = [
    { value: "netease", label: "网易云音乐" },
    { value: "kuwo", label: "酷我音乐" },
    { value: "qq", label: "QQ音乐" }
];

function normalizeSource(value) {
    const allowed = SOURCE_OPTIONS.map(option => option.value);
    return allowed.includes(value) ? value : SOURCE_OPTIONS[0].value;
}

const QUALITY_OPTIONS = [
    { value: "mp3", label: "MP3音质", description: "自动选择" },
    { value: "999", label: "无损音质", description: "FLAC" }
];

function normalizeQuality(value) {
    // 处理MP3选项，返回默认的MP3质量
    if (value === "mp3") {
        return "mp3";
    }
    
    const match = QUALITY_OPTIONS.find(option => option.value === value);
    return match ? match.value : "mp3";
}

const savedPlaylistSongs = (() => {
    const stored = safeGetLocalStorage("playlistSongs");
    const playlist = parseJSON(stored, []);
    return Array.isArray(playlist) ? playlist : [];
})();

const PLAYLIST_EXPORT_VERSION = 1;

const savedFavoriteSongs = (() => {
    const stored = safeGetLocalStorage("favoriteSongs");
    const favorites = parseJSON(stored, []);
    return Array.isArray(favorites) ? favorites : [];
})();

const FAVORITE_EXPORT_VERSION = 1;

const savedCurrentFavoriteIndex = (() => {
    const stored = safeGetLocalStorage("currentFavoriteIndex");
    const index = Number.parseInt(stored, 10);
    return Number.isInteger(index) && index >= 0 ? index : 0;
})();

const savedFavoritePlayMode = (() => {
    const stored = safeGetLocalStorage("favoritePlayMode");
    const normalized = stored === "order" ? "list" : stored;
    const modes = ["list", "single", "random"];
    return modes.includes(normalized) ? normalized : "list";
})();

const savedFavoritePlaybackTime = (() => {
    const stored = safeGetLocalStorage("favoritePlaybackTime");
    const time = Number.parseFloat(stored);
    return Number.isFinite(time) && time >= 0 ? time : 0;
})();

const savedCurrentList = (() => {
    const stored = safeGetLocalStorage("currentList");
    return stored === "favorite" ? "favorite" : "playlist";
})();

const savedCurrentTrackIndex = (() => {
    const stored = safeGetLocalStorage("currentTrackIndex");
    const index = Number.parseInt(stored, 10);
    return Number.isInteger(index) ? index : -1;
})();

const savedPlayMode = (() => {
    const stored = safeGetLocalStorage("playMode");
    const modes = ["list", "single", "random"];
    return modes.includes(stored) ? stored : "list";
})();

const savedPlaybackQuality = normalizeQuality(safeGetLocalStorage("playbackQuality"));

const savedVolume = (() => {
    const stored = safeGetLocalStorage("playerVolume");
    const volume = Number.parseFloat(stored);
    if (Number.isFinite(volume)) {
        return Math.min(Math.max(volume, 0), 1);
    }
    return 0.8;
})();

const savedSearchSource = (() => {
    const stored = safeGetLocalStorage("searchSource");
    return normalizeSource(stored);
})();

const LAST_SEARCH_STATE_STORAGE_KEY = "lastSearchState.v1";

const savedLastSearchState = (() => {
    const stored = safeGetLocalStorage(LAST_SEARCH_STATE_STORAGE_KEY);
    const parsed = parseJSON(stored, null);
    return sanitizeStoredSearchState(parsed, savedSearchSource || SOURCE_OPTIONS[0].value);
})();

let lastSearchStateCache = savedLastSearchState
    ? { ...savedLastSearchState, results: cloneSearchResults(savedLastSearchState.results) }
    : null;

const savedPlaybackTime = (() => {
    const stored = safeGetLocalStorage("currentPlaybackTime");
    const time = Number.parseFloat(stored);
    return Number.isFinite(time) && time >= 0 ? time : 0;
})();

const savedCurrentSong = (() => {
    const stored = safeGetLocalStorage("currentSong");
    return parseJSON(stored, null);
})();

const savedCurrentPlaylist = (() => {
    const stored = safeGetLocalStorage("currentPlaylist");
    const playlists = ["playlist", "online", "search", "favorites"];
    return playlists.includes(stored) ? stored : "playlist";
})();

// API配置 - 符合TuneHub API规范
const API = {
    baseUrl: "https://music-dl.sayqz.com",

    fetchJson: async (url, options = {}) => {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                debugLog(`API请求 (尝试 ${attempt}/${maxRetries}): ${url}`);
                const response = await fetch(url, {
                    headers: {
                        "Accept": "application/json",
                        ...options.headers,
                    },
                    ...options,
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    console.warn("JSON parse failed, returning raw text", parseError);
                    return text;
                }
            } catch (error) {
                debugLog(`API请求失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`);
                if (attempt < maxRetries) {
                    debugLog(`等待 ${retryDelay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    console.error("API请求最终失败:", error);
                    throw error;
                }
            }
        }
    },

    search: async (keyword, source = "netease", count = 20, page = 1) => {
        const url = `${API.baseUrl}/api/?source=${source}&type=search&keyword=${encodeURIComponent(keyword)}&limit=${count}`;

        try {
            debugLog(`API请求: ${url}`);
            const data = await API.fetchJson(url);
            debugLog(`API响应: ${JSON.stringify(data).substring(0, 200)}...`);

            if (!data || data.code !== 200 || !Array.isArray(data.data.results)) {
                throw new Error("搜索结果格式错误");
            }

            return data.data.results.map(song => ({
                id: song.id,
                name: song.name,
                artist: song.artist,
                album: song.album,
                source: song.platform || source,
                // 新API返回的URL已经是完整的API链接，我们需要提取id用于后续请求
                pic_id: song.id,
                url_id: song.id,
                lyric_id: song.id,
            }));
        } catch (error) {
            debugLog(`API错误: ${error.message}`);
            throw error;
        }
    },

    getRadarPlaylist: async (playlistId = "3778678", options = {}) => {
        const url = `${API.baseUrl}/api/?source=netease&id=${playlistId}&type=playlist`;

        try {
            const data = await API.fetchJson(url);
            const tracks = data && data.code === 200 && data.data && Array.isArray(data.data.list)
                ? data.data.list
                : [];

            if (tracks.length === 0) throw new Error("No tracks found");

            return tracks.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artist || "",
                album: track.album || "",
                source: "netease",
                lyric_id: track.id,
                pic_id: track.id,
            }));
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    },

    getSongUrl: (song, quality = "320") => {
        // 根据API文档，quality参数需要映射为128k, 192k, 320k, flac
        const qualityMap = {
            "128": "128k",
            "192": "192k",
            "320": "320k",
            "999": "flac"
        };
        
        // 处理MP3选项，返回默认的MP3质量
        if (quality === "mp3") {
            quality = "320";
        }
        
        // 确保使用有效的音质映射，支持192k
        const validQuality = quality in qualityMap ? quality : "320";
        const br = qualityMap[validQuality];
        
        // 构建API URL，支持不同类型的请求
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=url&br=${br}`;
    },

    getLyric: (song) => {
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=lrc`;
    },

    getPicUrl: (song) => {
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=pic`;
    },

    getSongInfo: async (songId, source = "netease") => {
        const url = `${API.baseUrl}/api/?source=${source}&id=${songId}&type=info`;
        try {
            const data = await API.fetchJson(url);
            if (data && data.code === 200) {
                return data.data;
            }
            throw new Error("获取歌曲信息失败");
        } catch (error) {
            console.error("获取歌曲信息错误:", error);
            throw error;
        }
    }
};

Object.freeze(API);

// ================================================
// 辅助检测函数
// ================================================

// 检测是否为 iOS PWA 独立运行模式
const isIOSPWA = () => {
    // 方法1：iOS Safari 的 navigator.standalone
    if (window.navigator.standalone === true) {
        return true;
    }
    
    // 方法2：标准的 display-mode: standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // 方法3：检查用户代理 + 全屏模式
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && (
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches
    )) {
        return true;
    }
    
    return false;
};

// 检测是否锁屏/后台
const isLockScreen = () => document.visibilityState === 'hidden';

// 判断是否应该使用隐身模式
const shouldUseStealthMode = () => isIOSPWA() && isLockScreen();

// 获取封面图片列表（用于锁屏控制台）
function getArtworkListForLockScreen(song) {
    // 确保使用有效的封面URL，优先顺序：
    // 1. 当前已加载的封面
    // 2. 从歌曲信息获取的封面
    // 3. 应用图标（确保使用绝对路径，避免404）
    let artworkUrl = state.currentArtworkUrl;
    if (!artworkUrl && song.pic_id) {
        artworkUrl = API.getPicUrl(song);
    }
    // 使用一个可靠的默认图标，确保它存在
    if (!artworkUrl) {
        // 尝试使用favicon，确保使用绝对路径
        artworkUrl = window.location.origin + '/favicon.png';
    }
    
    return [
        { src: artworkUrl, sizes: '512x512', type: 'image/png' },
        { src: artworkUrl, sizes: '384x384', type: 'image/png' },
        { src: artworkUrl, sizes: '256x256', type: 'image/png' },
        { src: artworkUrl, sizes: '192x192', type: 'image/png' }
    ];
}

const state = {
    onlineSongs: [],
    pendingUpdates: null, // 🔥 v13.0 核心：用于存储锁屏时的欠账
    searchResults: cloneSearchResults(savedLastSearchState?.results) || [],
    renderedSearchCount: 0,
    currentTrackIndex: savedCurrentTrackIndex,
    currentAudioUrl: null,
    lyricsData: [],
    currentLyricLine: -1,
    currentPlaylist: savedCurrentPlaylist, // 'online', 'search', or 'playlist'
    searchPage: savedLastSearchState?.page || 1,
    searchKeyword: savedLastSearchState?.keyword || "", // 确保这里有初始值
    searchSource: savedLastSearchState ? savedLastSearchState.source : savedSearchSource,
    hasMoreResults: typeof savedLastSearchState?.hasMore === "boolean" ? savedLastSearchState.hasMore : true,
    currentSong: savedCurrentSong,
    currentArtworkUrl: null,
    debugMode: false,
    isSearchMode: false, // 新增：搜索模式状态
    playlistSongs: savedPlaylistSongs, // 新增：统一播放列表
    playMode: savedPlayMode, // 新增：播放模式 'list', 'single', 'random'
    playlistLastNonRandomMode: savedPlayMode === "random" ? "list" : savedPlayMode,
    favoriteSongs: savedFavoriteSongs,
    isPlaying: false, // 新增：播放状态标志
    currentFavoriteIndex: savedCurrentFavoriteIndex,
    currentList: savedCurrentList,
    favoritePlayMode: savedFavoritePlayMode,
    favoriteLastNonRandomMode: savedFavoritePlayMode === "random" ? "list" : savedFavoritePlayMode,
    favoritePlaybackTime: savedFavoritePlaybackTime,
    playbackQuality: savedPlaybackQuality,
    volume: savedVolume,
    currentPlaybackTime: savedPlaybackTime,
    lastSavedPlaybackTime: savedPlaybackTime,
    favoriteLastSavedPlaybackTime: savedFavoritePlaybackTime,
    pendingSeekTime: null,
    isSeeking: false,
    qualityMenuOpen: false,
    sourceMenuOpen: false,
    userScrolledLyrics: false, // 新增：用户是否手动滚动歌词
    lyricsScrollTimeout: null, // 新增：歌词滚动超时
    themeDefaultsCaptured: false,
    dynamicPalette: null,
    currentPaletteImage: null,
    pendingPaletteData: null,
    pendingPaletteImage: null,
    pendingPaletteImmediate: false,
    pendingPaletteReady: false,
    audioReadyForPalette: true,
    currentGradient: '',
    isMobileInlineLyricsOpen: false,
    selectedSearchResults: new Set(),
    needUpdateOnUnlock: false, // 新增：iOS PWA 解锁后是否需要更新UI
    pendingStealthUpdate: null, // 新增：隐身模式下待更新的信息
    forceUIUpdate: false, // 新增：强制UI更新标志
};

let importSelectedMenuOutsideHandler = null;

if (state.currentList === "favorite" && (!Array.isArray(state.favoriteSongs) || state.favoriteSongs.length === 0)) {
    state.currentList = "playlist";
}
if (state.currentList === "favorite") {
    state.currentPlaylist = "favorites";
}
state.favoriteSongs = ensureFavoriteSongsArray()
    .map((song) => sanitizeImportedSong(song) || song)
    .filter((song) => song && typeof song === "object");
if (!Array.isArray(state.favoriteSongs) || state.favoriteSongs.length === 0) {
    state.currentFavoriteIndex = 0;
} else if (state.currentFavoriteIndex >= state.favoriteSongs.length) {
    state.currentFavoriteIndex = state.favoriteSongs.length - 1;
}
saveFavoriteState();

async function bootstrapPersistentStorage() {
    // 禁用远程存储同步，确保每个设备的播放列表独立
    // 注释掉远程存储加载和同步启用代码
    /*
    try {
        const remoteKeys = Array.from(STORAGE_KEYS_TO_SYNC);
        const snapshot = await persistentStorage.getItems(remoteKeys);
        if (!snapshot || !snapshot.d1Available || !snapshot.data) {
            return;
        }
        applyPersistentSnapshotFromRemote(snapshot.data);
    } catch (error) {
        console.warn("加载远程存储失败", error);
    } finally {
        remoteSyncEnabled = true;
    }
    */
    remoteSyncEnabled = false;
}

function applyPersistentSnapshotFromRemote(data) {
    if (!data || typeof data !== "object") {
        return;
    }

    let playlistUpdated = false;

    if (typeof data.playlistSongs === "string") {
        const playlist = parseJSON(data.playlistSongs, []);
        if (Array.isArray(playlist)) {
            state.playlistSongs = playlist;
            safeSetLocalStorage("playlistSongs", data.playlistSongs, { skipRemote: true });
            playlistUpdated = true;
        }
    }

    if (typeof data.currentTrackIndex === "string") {
        const index = Number.parseInt(data.currentTrackIndex, 10);
        if (Number.isInteger(index)) {
            state.currentTrackIndex = index;
            safeSetLocalStorage("currentTrackIndex", data.currentTrackIndex, { skipRemote: true });
        }
    }

    if (typeof data.playMode === "string") {
        state.playMode = ["list", "single", "random"].includes(data.playMode) ? data.playMode : state.playMode;
        safeSetLocalStorage("playMode", state.playMode, { skipRemote: true });
    }

    if (typeof data.playbackQuality === "string") {
        state.playbackQuality = normalizeQuality(data.playbackQuality);
        safeSetLocalStorage("playbackQuality", state.playbackQuality, { skipRemote: true });
    }

    if (typeof data.playerVolume === "string") {
        const volume = Number.parseFloat(data.playerVolume);
        if (Number.isFinite(volume)) {
            const clamped = Math.min(Math.max(volume, 0), 1);
            state.volume = clamped;
            safeSetLocalStorage("playerVolume", String(clamped), { skipRemote: true });
        }
    }

    if (typeof data.currentPlaylist === "string") {
        state.currentPlaylist = data.currentPlaylist;
        safeSetLocalStorage("currentPlaylist", data.currentPlaylist, { skipRemote: true });
    }

    if (typeof data.currentList === "string") {
        state.currentList = data.currentList === "favorite" ? "favorite" : "playlist";
        safeSetLocalStorage("currentList", state.currentList, { skipRemote: true });
    }

    if (typeof data.currentSong === "string" && data.currentSong) {
        const currentSong = parseJSON(data.currentSong, null);
        if (currentSong) {
            state.currentSong = currentSong;
            safeSetLocalStorage("currentSong", data.currentSong, { skipRemote: true });
        }
    }

    if (typeof data.currentPlaybackTime === "string") {
        const playbackTime = Number.parseFloat(data.currentPlaybackTime);
        if (Number.isFinite(playbackTime) && playbackTime >= 0) {
            state.currentPlaybackTime = playbackTime;
            safeSetLocalStorage("currentPlaybackTime", data.currentPlaybackTime, { skipRemote: true });
        }
    }

    if (typeof data.favoriteSongs === "string") {
        const favorites = parseJSON(data.favoriteSongs, []);
        if (Array.isArray(favorites)) {
            state.favoriteSongs = favorites;
            safeSetLocalStorage("favoriteSongs", data.favoriteSongs, { skipRemote: true });
        }
    }

    if (typeof data.currentFavoriteIndex === "string") {
        const favoriteIndex = Number.parseInt(data.currentFavoriteIndex, 10);
        if (Number.isInteger(favoriteIndex)) {
            state.currentFavoriteIndex = favoriteIndex;
            safeSetLocalStorage("currentFavoriteIndex", data.currentFavoriteIndex, { skipRemote: true });
        }
    }

    if (state.currentList === "favorite" && (!Array.isArray(state.favoriteSongs) || state.favoriteSongs.length === 0)) {
        state.currentList = "playlist";
    }

    if (typeof data.favoritePlayMode === "string") {
        state.favoritePlayMode = ["list", "single", "random"].includes(data.favoritePlayMode)
            ? data.favoritePlayMode
            : state.favoritePlayMode;
        safeSetLocalStorage("favoritePlayMode", state.favoritePlayMode, { skipRemote: true });
    }

    if (typeof data.favoritePlaybackTime === "string") {
        const favoritePlaybackTime = Number.parseFloat(data.favoritePlaybackTime);
        if (Number.isFinite(favoritePlaybackTime) && favoritePlaybackTime >= 0) {
            state.favoritePlaybackTime = favoritePlaybackTime;
            safeSetLocalStorage("favoritePlaybackTime", data.favoritePlaybackTime, { skipRemote: true });
        }
    }

    if (typeof data.searchSource === "string") {
        state.searchSource = normalizeSource(data.searchSource);
        safeSetLocalStorage("searchSource", state.searchSource, { skipRemote: true });
        updateSourceLabel();
        buildSourceMenu();
    }

    if (typeof data[LAST_SEARCH_STATE_STORAGE_KEY] === "string") {
        const restoredSearch = parseJSON(data[LAST_SEARCH_STATE_STORAGE_KEY], null);
        const restored = restoreStateFromSnapshot(restoredSearch);
        if (restored) {
            safeSetLocalStorage(LAST_SEARCH_STATE_STORAGE_KEY, data[LAST_SEARCH_STATE_STORAGE_KEY], { skipRemote: true });
            restoreSearchResultsList();
        }
    }

    dom.audioPlayer.volume = state.volume;
    dom.volumeSlider.value = state.volume;
    updateVolumeSliderBackground(state.volume);
    updateVolumeIcon(state.volume);

    renderFavorites();
    switchLibraryTab(state.currentList === "favorite" ? "favorites" : "playlist");
    updatePlayModeUI();
    updateQualityLabel();
    updatePlayPauseButton();

    if (state.favoriteSongs.length === 0) {
        state.currentFavoriteIndex = 0;
    } else if (state.currentFavoriteIndex >= state.favoriteSongs.length) {
        state.currentFavoriteIndex = state.favoriteSongs.length - 1;
    }

    if (playlistUpdated) {
        let restoredIndex = state.currentTrackIndex;
        if (!Number.isInteger(restoredIndex) || restoredIndex < 0 || restoredIndex >= state.playlistSongs.length) {
            restoredIndex = 0;
            state.currentTrackIndex = restoredIndex;
        }
        state.currentPlaylist = "playlist";
        renderPlaylist();

        const restoredSong = state.playlistSongs[restoredIndex];
        if (restoredSong) {
            state.currentSong = restoredSong;
            updatePlaylistHighlight();
            updateCurrentSongInfo(restoredSong, { updateBackground: true }).catch((error) => {
                console.error("恢复远程歌曲信息失败:", error);
            });
        }
    } else if (dom.playlist) {
        dom.playlist.classList.add("empty");
        if (dom.playlistItems) {
            dom.playlistItems.innerHTML = "";
        }
    }

    savePlayerState({ skipRemote: true });
    saveFavoriteState({ skipRemote: true });
    updatePlaylistActionStates();
    updateMobileClearPlaylistVisibility();
}

bootstrapPersistentStorage();

// ==== Media Session integration (Safari/iOS Lock Screen) ====
(() => {
    const audio = dom.audioPlayer;
    if (!('mediaSession' in navigator) || !audio) return;

    let handlersBound = false;
    let lastPositionUpdateTime = 0;
    const MEDIA_SESSION_ENDED_FLAG = '__solaraMediaSessionHandledEnded';

    const preferLockScreenTrackControls = (() => {
        if (typeof navigator === 'undefined') {
            return false;
        }
        const ua = navigator.userAgent || '';
        const platform = navigator.platform || '';
        const isIOS = /iP(ad|hone|od)/.test(ua);
        const isTouchMac = !isIOS && platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
        return isIOS || isTouchMac;
    })();
    const allowLockScreenScrubbing = typeof navigator.mediaSession.setPositionState === 'function' && !preferLockScreenTrackControls;

    function triggerMediaSessionMetadataRefresh() {
        let refreshed = false;
        if (typeof window.__SOLARA_UPDATE_MEDIA_METADATA === 'function') {
            try {
                window.__SOLARA_UPDATE_MEDIA_METADATA();
                refreshed = true;
            } catch (error) {
                console.warn('刷新媒体信息失败:', error);
            }
        }
        if (!refreshed) {
            updateMediaMetadata();
        }
    }

    function getArtworkMime(url) {
        if (!url) {
            return 'image/png';
        }

        const normalized = url.split('?')[0].toLowerCase();
        if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
            return 'image/jpeg';
        }
        if (normalized.endsWith('.webp')) {
            return 'image/webp';
        }
        if (normalized.endsWith('.gif')) {
            return 'image/gif';
        }
        if (normalized.endsWith('.bmp')) {
            return 'image/bmp';
        }
        if (normalized.endsWith('.svg')) {
            return 'image/svg+xml';
        }
        return 'image/png';
    }

    function getArtworkList(url) {
        // iOS/Safari 建议多尺寸封面；你的 API 已有 pic_id -> pic url（300），这里做兜底多尺寸
        // 注意：尽量提供 https 链接；你的项目里已有 preferHttpsUrl/buildAudioProxyUrl 工具函数
        const src = (typeof preferHttpsUrl === 'function') ? preferHttpsUrl(url) : (url || '');
        // 如果没有封面，用默认封面兜底
        const fallback = '/favicon.png';
        const baseSrc = src || fallback;
        const base = toAbsoluteUrl(baseSrc);
        const type = getArtworkMime(base);
        return [
            { src: base, sizes: '1024x1024', type },
            { src: base, sizes: '640x640', type },
            { src: base, sizes: '512x512', type },
            { src: base, sizes: '384x384', type },
            { src: base, sizes: '256x256', type },
            { src: base, sizes: '192x192', type },
            { src: base, sizes: '128x128', type },
            { src: base, sizes: '96x96',  type }
        ];
    }

    function updateMediaMetadata() {
        // 依赖现有全局 state.currentSong；已在项目中使用 localStorage 保存/恢复。:contentReference[oaicite:7]{index=7}
        const song = state.currentSong || {};
        const title = song.name || dom.currentSongTitle?.textContent || 'Solara';
        const artist = song.artist || dom.currentSongArtist?.textContent || '';
        const artworkUrl = state.currentArtworkUrl || '';

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title,
                artist,
                album: song.album || '',
                artwork: getArtworkList(artworkUrl)
            });
        } catch (e) {
            // 某些旧 iOS 可能对 artwork 尺寸挑剔，失败时用最小配置重试
            try {
                navigator.mediaSession.metadata = new MediaMetadata({ title, artist });
            } catch (_) {}
        }
    }

    function updatePositionState() {
        // iOS 15+ 支持 setPositionState；用于让锁屏进度条可拖动与显示
        if (!allowLockScreenScrubbing) return;
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        const playbackRate = Number.isFinite(audio.playbackRate) ? audio.playbackRate : 1;
        navigator.mediaSession.setPositionState({ duration, position, playbackRate });
    }

    ['currentSong', 'currentArtworkUrl'].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(state, key)) {
            return;
        }
        let internalValue = state[key];
        Object.defineProperty(state, key, {
            configurable: true,
            enumerable: true,
            get() {
                return internalValue;
            },
            set(nextValue) {
                internalValue = nextValue;
                triggerMediaSessionMetadataRefresh();
            }
        });
    });

    function bindActionHandlersOnce() {
        if (handlersBound) return;
        handlersBound = true;

        // 播放/暂停交给 <audio> 默认行为即可
        try {
            navigator.mediaSession.setActionHandler('previoustrack', async () => {
                // 直接复用你已有的全局函数（HTML 里也在用）:contentReference[oaicite:9]{index=9}
                if (typeof window.playPrevious === 'function') {
                    try {
                        // 调用playPrevious并等待可能的异步操作完成
                        const result = window.playPrevious();
                        if (result && typeof result.then === 'function') {
                            await result;
                        }
                        triggerMediaSessionMetadataRefresh();
                    } catch (error) {
                        console.error('上一曲播放失败:', error);
                    }
                }
            });
            navigator.mediaSession.setActionHandler('nexttrack', async () => {
                if (typeof window.playNext === 'function') {
                    try {
                        // 调用playNext并等待可能的异步操作完成
                        const result = window.playNext();
                        if (result && typeof result.then === 'function') {
                            await result;
                        }
                        triggerMediaSessionMetadataRefresh();
                    } catch (error) {
                        console.error('下一曲播放失败:', error);
                    }
                }
            });

            navigator.mediaSession.setActionHandler('seekbackward', null);
            navigator.mediaSession.setActionHandler('seekforward', null);

            if (allowLockScreenScrubbing) {
                // 关键：让锁屏支持拖动进度到任意位置
                navigator.mediaSession.setActionHandler('seekto', (e) => {
                    if (!e || typeof e.seekTime !== 'number') return;
                    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, e.seekTime));
                    if (e.fastSeek && typeof audio.fastSeek === 'function') {
                        audio.fastSeek(audio.currentTime);
                    }
                    updatePositionState();
                });
            } else {
                try {
                    navigator.mediaSession.setActionHandler('seekto', null);
                } catch (_) {}
            }

            // 可选：切换播放状态（大部分系统自己会处理）
            navigator.mediaSession.setActionHandler('play', async () => {
                try { await audio.play(); } catch(_) {}
            });
            navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        } catch (_) {
            // 某些平台不支持全部动作
        }
    }

    // 监听 audio 事件，同步锁屏信息与进度
    audio.addEventListener('loadedmetadata', () => {
        triggerMediaSessionMetadataRefresh();
        updatePositionState();
        lastPositionUpdateTime = Date.now();
        bindActionHandlersOnce();
    });

    audio.addEventListener('play', () => {
        navigator.mediaSession.playbackState = 'playing';
        updatePositionState();
        lastPositionUpdateTime = Date.now();
    });

    audio.addEventListener('pause', () => {
        navigator.mediaSession.playbackState = 'paused';
        updatePositionState();
        lastPositionUpdateTime = Date.now();
    });

    audio.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastPositionUpdateTime >= 1000) {
            lastPositionUpdateTime = now;
            updatePositionState();
        }
    });

    audio.addEventListener('durationchange', updatePositionState);
    audio.addEventListener('ratechange', updatePositionState);
    audio.addEventListener('seeking', updatePositionState);
    audio.addEventListener('seeked', updatePositionState);

    audio.addEventListener('ended', () => {
        // 不要立即设置为paused，先尝试自动播放下一首
        updatePositionState();
        const refresh = () => {
            triggerMediaSessionMetadataRefresh();
            audio[MEDIA_SESSION_ENDED_FLAG] = false;
        };
        if (typeof autoPlayNext === 'function') {
            try {
                audio[MEDIA_SESSION_ENDED_FLAG] = 'handling';
                // 使用异步方式处理，确保媒体会话保持活跃
                (async () => {
                    await autoPlayNext();
                    // 播放成功后更新媒体会话状态
                    if (navigator.mediaSession && !audio.paused) {
                        navigator.mediaSession.playbackState = 'playing';
                    }
                    audio[MEDIA_SESSION_ENDED_FLAG] = 'skip';
                    refresh();
                })();
                return;
            } catch (error) {
                console.warn('自动播放下一首失败:', error);
                // 只有在失败时才设置为paused
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'paused';
                }
            }
        }
        audio[MEDIA_SESSION_ENDED_FLAG] = 'skip';
        if (typeof window.playNext === 'function') {
            try {
                // 使用异步方式处理
                (async () => {
                    const result = window.playNext();
                    if (typeof updatePlayPauseButton === 'function') {
                        updatePlayPauseButton();
                    }
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                    // 播放成功后更新媒体会话状态
                    if (navigator.mediaSession && !audio.paused) {
                        navigator.mediaSession.playbackState = 'playing';
                    }
                    refresh();
                })();
                return;
            } catch (error) {
                console.warn('自动播放下一首失败:', error);
                // 只有在失败时才设置为paused
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'paused';
                }
            }
        }
        // 只有在没有下一首可播放时才设置为paused
        if (navigator.mediaSession) {
            navigator.mediaSession.playbackState = 'paused';
        }
        refresh();
    });

    // 当你在应用内切歌（更新 state.currentSong / 封面 / 标题）时，也调用一次：
    // window.__SOLARA_UPDATE_MEDIA_METADATA = updateMediaMetadata;
    // 这样在你现有的切歌逻辑里，设置完新的 audio.src 后手动调用它可立即更新锁屏封面/文案。
    if (typeof window.__SOLARA_UPDATE_MEDIA_METADATA !== 'function') {
        window.__SOLARA_UPDATE_MEDIA_METADATA = updateMediaMetadata;
    }

    triggerMediaSessionMetadataRefresh();
})();

let sourceMenuPositionFrame = null;
let qualityMenuPositionFrame = null;
let floatingMenuListenersAttached = false;
let qualityMenuAnchor = null;

function runWithoutTransition(element, callback) {
    if (!element || typeof callback !== "function") return;
    const previousTransition = element.style.transition;
    element.style.transition = "none";
    callback();
    void element.offsetHeight;
    if (previousTransition) {
        element.style.transition = previousTransition;
    } else {
        element.style.removeProperty("transition");
    }
}

function cancelSourceMenuPositionUpdate() {
    if (sourceMenuPositionFrame !== null) {
        window.cancelAnimationFrame(sourceMenuPositionFrame);
        sourceMenuPositionFrame = null;
    }
}

function scheduleSourceMenuPositionUpdate() {
    if (!state.sourceMenuOpen) {
        cancelSourceMenuPositionUpdate();
        return;
    }
    if (sourceMenuPositionFrame !== null) {
        return;
    }
    sourceMenuPositionFrame = window.requestAnimationFrame(() => {
        sourceMenuPositionFrame = null;
        updateSourceMenuPosition();
    });
}

function cancelPlayerQualityMenuPositionUpdate() {
    if (qualityMenuPositionFrame !== null) {
        window.cancelAnimationFrame(qualityMenuPositionFrame);
        qualityMenuPositionFrame = null;
    }
}

function schedulePlayerQualityMenuPositionUpdate() {
    if (!state.qualityMenuOpen) {
        cancelPlayerQualityMenuPositionUpdate();
        return;
    }
    if (qualityMenuPositionFrame !== null) {
        return;
    }
    qualityMenuPositionFrame = window.requestAnimationFrame(() => {
        qualityMenuPositionFrame = null;
        updatePlayerQualityMenuPosition();
    });
}

function handleFloatingMenuResize() {
    if (state.sourceMenuOpen) {
        scheduleSourceMenuPositionUpdate();
    }
    if (state.qualityMenuOpen) {
        schedulePlayerQualityMenuPositionUpdate();
    }
}

function handleFloatingMenuScroll() {
    if (state.sourceMenuOpen) {
        scheduleSourceMenuPositionUpdate();
    }
    if (state.qualityMenuOpen) {
        schedulePlayerQualityMenuPositionUpdate();
    }
}

function ensureFloatingMenuListeners() {
    if (floatingMenuListenersAttached) {
        return;
    }
    window.addEventListener("resize", handleFloatingMenuResize);
    window.addEventListener("scroll", handleFloatingMenuScroll, { passive: true, capture: true });
    floatingMenuListenersAttached = true;
}

function releaseFloatingMenuListenersIfIdle() {
    if (state.sourceMenuOpen || state.qualityMenuOpen) {
        return;
    }
    if (!floatingMenuListenersAttached) {
        return;
    }
    window.removeEventListener("resize", handleFloatingMenuResize);
    window.removeEventListener("scroll", handleFloatingMenuScroll, true);
    floatingMenuListenersAttached = false;
}

state.currentGradient = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-gradient")
    .trim();

function setGlobalThemeProperty(name, value) {
    if (typeof name !== "string") {
        return;
    }
    document.documentElement.style.setProperty(name, value);
    if (document.body) {
        document.body.style.setProperty(name, value);
    }
}

function removeGlobalThemeProperty(name) {
    if (typeof name !== "string") {
        return;
    }
    document.documentElement.style.removeProperty(name);
    if (document.body) {
        document.body.style.removeProperty(name);
    }
}

if (state.currentGradient) {
    setGlobalThemeProperty("--bg-gradient-next", state.currentGradient);
}

function captureThemeDefaults() {
    // 总是更新主题默认值，确保CSS修改后能及时反映
    const initialIsDark = document.body.classList.contains("dark-mode");
    document.body.classList.remove("dark-mode");
    const lightStyles = getComputedStyle(document.body);
    themeDefaults.light.gradient = lightStyles.getPropertyValue("--bg-gradient").trim();
    themeDefaults.light.primaryColor = lightStyles.getPropertyValue("--primary-color").trim();
    themeDefaults.light.primaryColorDark = lightStyles.getPropertyValue("--primary-color-dark").trim();

    document.body.classList.add("dark-mode");
    const darkStyles = getComputedStyle(document.body);
    themeDefaults.dark.gradient = darkStyles.getPropertyValue("--bg-gradient").trim();
    themeDefaults.dark.primaryColor = darkStyles.getPropertyValue("--primary-color").trim();
    themeDefaults.dark.primaryColorDark = darkStyles.getPropertyValue("--primary-color-dark").trim();

    if (!initialIsDark) {
        document.body.classList.remove("dark-mode");
    }

    state.themeDefaultsCaptured = true;
}

function applyThemeTokens(tokens) {
    if (!tokens) return;
    if (tokens.primaryColor) {
        setGlobalThemeProperty("--primary-color", tokens.primaryColor);
    }
    if (tokens.primaryColorDark) {
        setGlobalThemeProperty("--primary-color-dark", tokens.primaryColorDark);
    }
}

function setDocumentGradient(gradient, { immediate = false } = {}) {
    const normalized = (gradient || "").trim();
    const current = (state.currentGradient || "").trim();
    const shouldSkipTransition = immediate || normalized === current;

    if (!dom.backgroundTransitionLayer || !dom.backgroundBaseLayer) {
        if (normalized) {
            setGlobalThemeProperty("--bg-gradient", normalized);
            setGlobalThemeProperty("--bg-gradient-next", normalized);
        } else {
            removeGlobalThemeProperty("--bg-gradient");
            removeGlobalThemeProperty("--bg-gradient-next");
        }
        state.currentGradient = normalized;
        return;
    }

    window.clearTimeout(backgroundTransitionTimer);

    if (shouldSkipTransition) {
        if (normalized) {
            setGlobalThemeProperty("--bg-gradient", normalized);
            setGlobalThemeProperty("--bg-gradient-next", normalized);
        } else {
            removeGlobalThemeProperty("--bg-gradient");
            removeGlobalThemeProperty("--bg-gradient-next");
        }
        document.body.classList.remove("background-transitioning");
        state.currentGradient = normalized;
        return;
    }

    if (normalized) {
        setGlobalThemeProperty("--bg-gradient-next", normalized);
    } else {
        removeGlobalThemeProperty("--bg-gradient-next");
    }

    requestAnimationFrame(() => {
        document.body.classList.add("background-transitioning");
        backgroundTransitionTimer = window.setTimeout(() => {
            if (normalized) {
                setGlobalThemeProperty("--bg-gradient", normalized);
                setGlobalThemeProperty("--bg-gradient-next", normalized);
            } else {
                removeGlobalThemeProperty("--bg-gradient");
                removeGlobalThemeProperty("--bg-gradient-next");
            }
            document.body.classList.remove("background-transitioning");
            state.currentGradient = normalized;
        }, BACKGROUND_TRANSITION_DURATION);
    });
}

function applyDynamicGradient(options = {}) {
    // 每次调用都更新主题默认值，确保CSS修改后能及时反映
    captureThemeDefaults();
    const isDark = document.body.classList.contains("dark-mode");
    const mode = isDark ? "dark" : "light";
    const defaults = themeDefaults[mode];

    let targetGradient = defaults.gradient || "";
    applyThemeTokens(defaults);

    const palette = state.dynamicPalette;
    if (palette && palette.gradients) {
        const gradients = palette.gradients;
        let gradientMode = mode;
        let gradientInfo = gradients[gradientMode] || null;

        if (!gradientInfo) {
            const fallbackModes = gradientMode === "dark" ? ["light"] : ["dark"];
            for (const candidate of fallbackModes) {
                if (gradients[candidate]) {
                    gradientMode = candidate;
                    gradientInfo = gradients[candidate];
                    break;
                }
            }
            if (!gradientInfo) {
                const availableModes = Object.keys(gradients);
                if (availableModes.length) {
                    const candidate = availableModes[0];
                    gradientMode = candidate;
                    gradientInfo = gradients[candidate];
                }
            }
        }

        if (gradientInfo && gradientInfo.gradient) {
            targetGradient = gradientInfo.gradient;
        }

        if (palette.tokens) {
            const tokens = palette.tokens[gradientMode] || palette.tokens[mode];
            if (tokens) {
                applyThemeTokens(tokens);
            }
        }
    }

    setDocumentGradient(targetGradient, options);
}

function queueDefaultPalette(options = {}) {
    window.clearTimeout(pendingPaletteTimer);
    pendingPaletteTimer = null;
    cancelDeferredPaletteUpdate();
    state.pendingPaletteData = null;
    state.pendingPaletteImage = null;
    state.pendingPaletteImmediate = Boolean(options.immediate);
    state.pendingPaletteReady = true;
    attemptPaletteApplication();
}

function resetDynamicBackground(options = {}) {
    paletteRequestId += 1;
    cancelDeferredPaletteUpdate();
    if (paletteAbortController) {
        paletteAbortController.abort();
        paletteAbortController = null;
    }
    state.dynamicPalette = null;
    state.currentPaletteImage = null;
    queueDefaultPalette(options);
}

function queuePaletteApplication(palette, imageUrl, options = {}) {
    window.clearTimeout(pendingPaletteTimer);
    pendingPaletteTimer = null;
    state.pendingPaletteData = palette || null;
    state.pendingPaletteImage = imageUrl || null;
    state.pendingPaletteImmediate = Boolean(options.immediate);
    state.pendingPaletteReady = true;
    attemptPaletteApplication();
}

function cancelDeferredPaletteUpdate() {
    if (deferredPaletteHandle === null) {
        return;
    }
    if (deferredPaletteType === "idle" && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(deferredPaletteHandle);
    } else {
        window.clearTimeout(deferredPaletteHandle);
    }
    deferredPaletteHandle = null;
    deferredPaletteType = "";
    deferredPaletteUrl = null;
}

function scheduleDeferredPaletteUpdate(imageUrl, options = {}) {
    const immediate = Boolean(options.immediate);
    if (!imageUrl) {
        cancelDeferredPaletteUpdate();
        if (immediate) {
            resetDynamicBackground();
        }
        return;
    }

    if (immediate) {
        cancelDeferredPaletteUpdate();
        updateDynamicBackground(imageUrl);
        return;
    }

    if (deferredPaletteHandle !== null) {
        if (deferredPaletteType === "idle" && typeof window.cancelIdleCallback === "function") {
            window.cancelIdleCallback(deferredPaletteHandle);
        } else {
            window.clearTimeout(deferredPaletteHandle);
        }
    }

    deferredPaletteUrl = imageUrl;
    const runner = () => {
        deferredPaletteHandle = null;
        deferredPaletteType = "";
        const targetUrl = deferredPaletteUrl;
        deferredPaletteUrl = null;
        if (targetUrl) {
            updateDynamicBackground(targetUrl);
        }
    };

    if (typeof window.requestIdleCallback === "function") {
        deferredPaletteType = "idle";
        deferredPaletteHandle = window.requestIdleCallback(runner, { timeout: 800 });
    } else {
        deferredPaletteType = "timeout";
        deferredPaletteHandle = window.setTimeout(runner, 120);
    }
}

function attemptPaletteApplication() {
    if (!state.pendingPaletteReady) {
        return;
    }

    const palette = state.pendingPaletteData || null;
    const imageUrl = state.pendingPaletteImage || null;
    const immediate = state.pendingPaletteImmediate;

    state.pendingPaletteData = null;
    state.pendingPaletteImage = null;
    state.pendingPaletteImmediate = false;
    state.pendingPaletteReady = false;

    const apply = () => {
        pendingPaletteTimer = null;
        state.dynamicPalette = palette;
        state.currentPaletteImage = imageUrl;
        applyDynamicGradient({ immediate: false });
    };

    if (immediate) {
        pendingPaletteTimer = null;
        state.dynamicPalette = palette;
        state.currentPaletteImage = imageUrl;
        applyDynamicGradient({ immediate: true });
        return;
    }

    pendingPaletteTimer = window.setTimeout(apply, PALETTE_APPLY_DELAY);
}

function showAlbumCoverPlaceholder() {
    dom.albumCover.innerHTML = PLACEHOLDER_HTML;
    dom.albumCover.classList.remove("loading");
    state.currentArtworkUrl = toAbsoluteUrl('/favicon.png');
    queueDefaultPalette();
    if (typeof window.__SOLARA_UPDATE_MEDIA_METADATA === 'function') {
        window.__SOLARA_UPDATE_MEDIA_METADATA();
    }
}

function setAlbumCoverImage(url) {
    const safeUrl = toAbsoluteUrl(preferHttpsUrl(url));
    state.currentArtworkUrl = safeUrl;
    dom.albumCover.innerHTML = `<img src="${safeUrl}" alt="专辑封面">`;
    dom.albumCover.classList.remove("loading");
    if (typeof window.__SOLARA_UPDATE_MEDIA_METADATA === 'function') {
        window.__SOLARA_UPDATE_MEDIA_METADATA();
    }
}

loadStoredPalettes();

// 本地取色逻辑：使用 Canvas API 从图片中提取颜色
function getLocalPalette(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                
                // 调整画布大小，缩小图片以提高性能
                const maxSize = 100;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                // 简单的颜色提取：计算平均颜色
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3];
                    if (alpha > 128) { // 只考虑不透明的像素
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                
                if (count === 0) {
                    resolve(null);
                    return;
                }
                
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                
                // 创建调色板数据
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                // 创建非常微妙的渐变，变化幅度很小
                // 最浅的地方只比主色调浅60%，几乎看不出明显变化
                const palette = {
                    gradients: {
                        light: {
                            // 超微渐变：变化幅度极小，最浅处仅比主色调浅60%
                            gradient: `linear-gradient(90deg, ${hex}99 0%, ${hex}cc 50%, ${hex} 100%)`
                        },
                        dark: {
                            // 超微渐变：变化幅度极小，最浅处仅比主色调浅60%
                            gradient: `linear-gradient(90deg, ${hex}88 0%, ${hex}aa 50%, ${hex} 100%)`
                        }
                    },
                    tokens: {
                        light: {
                            primaryColor: hex,
                            primaryColorDark: hex
                        },
                        dark: {
                            primaryColor: hex,
                            primaryColorDark: hex
                        }
                    }
                };
                
                resolve(palette);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => {
            resolve(null);
        };
        img.src = imageUrl;
    });
}

async function fetchPaletteData(imageUrl, signal) {
    if (paletteCache.has(imageUrl)) {
        const cached = paletteCache.get(imageUrl);
        paletteCache.delete(imageUrl);
        paletteCache.set(imageUrl, cached);
        return cached;
    }

    try {
        // 优先尝试本地取色
        const localPalette = await getLocalPalette(imageUrl);
        if (localPalette) {
            paletteCache.set(imageUrl, localPalette);
            persistPaletteCache();
            return localPalette;
        }
    } catch (error) {
        console.warn("本地取色失败:", error);
    }

    // 如果本地取色失败，返回默认调色板
    const defaultPalette = {
        gradients: {
            light: {
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            },
            dark: {
                gradient: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
            }
        },
        tokens: {
            light: {
                primaryColor: "#667eea",
                primaryColorDark: "#764ba2"
            },
            dark: {
                primaryColor: "#3498db",
                primaryColorDark: "#2980b9"
            }
        }
    };
    
    paletteCache.set(imageUrl, defaultPalette);
    persistPaletteCache();
    return defaultPalette;
}

async function updateDynamicBackground(imageUrl) {
    paletteRequestId += 1;
    const requestId = paletteRequestId;

    if (!imageUrl) {
        resetDynamicBackground();
        return;
    }

    debugLog(`动态背景: 更新至新的图片 ${imageUrl}`);

    if (paletteAbortController) {
        paletteAbortController.abort();
        paletteAbortController = null;
    }

    if (paletteCache.has(imageUrl)) {
        const cached = paletteCache.get(imageUrl);
        paletteCache.delete(imageUrl);
        paletteCache.set(imageUrl, cached);
        queuePaletteApplication(cached, imageUrl);
        return;
    }

    if (state.currentPaletteImage === imageUrl && state.dynamicPalette) {
        queuePaletteApplication(state.dynamicPalette, imageUrl);
        return;
    }

    let controller = null;
    try {
        if (paletteAbortController) {
            paletteAbortController.abort();
        }

        controller = new AbortController();
        paletteAbortController = controller;

        const palette = await fetchPaletteData(imageUrl, controller.signal);
        if (requestId !== paletteRequestId) {
            return;
        }
        queuePaletteApplication(palette, imageUrl);
    } catch (error) {
        if (error?.name === "AbortError") {
            return;
        }
        console.warn("获取动态背景失败:", error);
        debugLog(`动态背景加载失败: ${error}`);
        if (requestId === paletteRequestId) {
            resetDynamicBackground();
        }
    } finally {
        if (controller && paletteAbortController === controller) {
            paletteAbortController = null;
        }
    }
}

function savePlayerState(options = {}) {
    const { skipRemote = false } = options;
    safeSetLocalStorage("playlistSongs", JSON.stringify(state.playlistSongs), { skipRemote });
    safeSetLocalStorage("currentTrackIndex", String(state.currentTrackIndex), { skipRemote });
    safeSetLocalStorage("playMode", state.playMode, { skipRemote });
    safeSetLocalStorage("playbackQuality", state.playbackQuality, { skipRemote });
    safeSetLocalStorage("playerVolume", String(state.volume), { skipRemote });
    safeSetLocalStorage("currentPlaylist", state.currentPlaylist, { skipRemote });
    safeSetLocalStorage("currentList", state.currentList, { skipRemote });
    if (state.currentSong) {
        safeSetLocalStorage("currentSong", JSON.stringify(state.currentSong), { skipRemote });
    } else {
        safeSetLocalStorage("currentSong", "", { skipRemote });
    }
    safeSetLocalStorage("currentPlaybackTime", String(state.currentPlaybackTime || 0), { skipRemote });
}

function saveFavoriteState(options = {}) {
    const { skipRemote = false } = options;
    safeSetLocalStorage("favoriteSongs", JSON.stringify(state.favoriteSongs), { skipRemote });
    safeSetLocalStorage("currentFavoriteIndex", String(state.currentFavoriteIndex), { skipRemote });
    safeSetLocalStorage("favoritePlayMode", state.favoritePlayMode, { skipRemote });
    safeSetLocalStorage("favoritePlaybackTime", String(state.favoritePlaybackTime || 0), { skipRemote });
}

// 调试日志函数
function debugLog(message) {
    console.log(`[DEBUG] ${message}`);
    if (state.debugMode) {
        const debugInfo = dom.debugInfo;
        const entry = document.createElement("div");
        entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        debugInfo.appendChild(entry);

        while (debugInfo.childNodes.length > 50) {
            debugInfo.removeChild(debugInfo.firstChild);
        }

        debugInfo.classList.add("show");
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }
}

// 启用调试模式（按Ctrl+D）
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        state.debugMode = !state.debugMode;
        if (state.debugMode) {
            dom.debugInfo.classList.add("show");
            debugLog("调试模式已启用");
        } else {
            dom.debugInfo.classList.remove("show");
        }
    }
});

// 新增：切换搜索模式
function toggleSearchMode(enable) {
    state.isSearchMode = enable;
    if (enable) {
        dom.container.classList.add("search-mode");
        debugLog("进入搜索模式");
    } else {
        dom.container.classList.remove("search-mode");
        debugLog("退出搜索模式");
    }
}

// 新增：显示搜索结果
function showSearchResults(options = {}) {
    const { restore = false } = options;
    toggleSearchMode(true);
    if (state.sourceMenuOpen) {
        scheduleSourceMenuPositionUpdate();
    }
    if (state.qualityMenuOpen) {
        schedulePlayerQualityMenuPositionUpdate();
    }
    if (restore) {
        restoreSearchResultsList();
    }
}

// 新增：隐藏搜索结果 - 优化立即收起
function hideSearchResults() {
    toggleSearchMode(false);
    if (state.sourceMenuOpen) {
        scheduleSourceMenuPositionUpdate();
    }
    if (state.qualityMenuOpen) {
        schedulePlayerQualityMenuPositionUpdate();
    }
    // 立即清空搜索结果内容
    const container = dom.searchResultsList || dom.searchResults;
    if (container) {
        container.innerHTML = "";
    }
    state.renderedSearchCount = 0;
    resetSelectedSearchResults();
    closeImportSelectedMenu();
}

function createSearchStateSnapshot() {
    return {
        keyword: typeof state.searchKeyword === "string" ? state.searchKeyword : "",
        source: normalizeSource(state.searchSource),
        page: Number.isInteger(state.searchPage) && state.searchPage > 0 ? state.searchPage : 1,
        hasMore: Boolean(state.hasMoreResults),
        results: cloneSearchResults(state.searchResults),
    };
}

function persistLastSearchState() {
    const snapshot = createSearchStateSnapshot();
    if (!snapshot.keyword) {
        lastSearchStateCache = null;
        safeRemoveLocalStorage(LAST_SEARCH_STATE_STORAGE_KEY);
        return;
    }
    lastSearchStateCache = { ...snapshot, results: cloneSearchResults(snapshot.results) };
    safeSetLocalStorage(LAST_SEARCH_STATE_STORAGE_KEY, JSON.stringify(snapshot));
}

function restoreStateFromSnapshot(snapshot) {
    const sanitized = sanitizeStoredSearchState(snapshot, state.searchSource || SOURCE_OPTIONS[0].value);
    if (!sanitized || !sanitized.keyword) {
        return false;
    }
    state.searchKeyword = sanitized.keyword;
    state.searchSource = sanitized.source;
    state.searchPage = sanitized.page;
    state.hasMoreResults = sanitized.hasMore;
    state.searchResults = cloneSearchResults(sanitized.results);
    lastSearchStateCache = { ...sanitized, results: cloneSearchResults(sanitized.results) };
    safeSetLocalStorage("searchSource", state.searchSource);
    updateSourceLabel();
    buildSourceMenu();
    return true;
}

function restoreSearchResultsList() {
    const container = dom.searchResultsList || dom.searchResults;
    if (!container) {
        return;
    }
    if (container.childElementCount > 0) {
        return;
    }
    const results = Array.isArray(state.searchResults) ? state.searchResults : [];
    state.renderedSearchCount = 0;
    displaySearchResults(results, {
        reset: true,
        totalCount: results.length,
    });
}

function handleSearchInputFocus() {
    if (!dom.searchInput) {
        return;
    }

    const currentValue = dom.searchInput.value.trim();
    if (currentValue && state.searchKeyword && currentValue !== state.searchKeyword) {
        return;
    }

    const hasKeyword = typeof state.searchKeyword === "string" && state.searchKeyword.length > 0;
    const hasResults = Array.isArray(state.searchResults) && state.searchResults.length > 0;

    if (!hasKeyword || !hasResults) {
        const restored = restoreStateFromSnapshot(lastSearchStateCache);
        if (!restored) {
            return;
        }
    }

    if (!dom.searchInput.value.trim()) {
        dom.searchInput.value = state.searchKeyword;
        window.requestAnimationFrame(() => {
            try {
                dom.searchInput.select();
            } catch (error) {
                console.warn("选择搜索文本失败", error);
            }
        });
    }

    showSearchResults({ restore: true });
}

const playModeTexts = {
    "list": "列表循环",
    "single": "单曲循环",
    "random": "随机播放"
};

const playModeIcons = {
    "list": "fa-repeat",
    "single": "fa-redo",
    "random": "fa-shuffle"
};

function getActivePlayMode() {
    return state.currentList === "favorite" ? state.favoritePlayMode : state.playMode;
}

function getLastNonRandomMode() {
    if (state.currentList === "favorite") {
        return state.favoriteLastNonRandomMode || "list";
    }
    return state.playlistLastNonRandomMode || "list";
}

function rememberLastNonRandomMode() {
    const currentMode = getActivePlayMode();
    if (currentMode === "random") {
        return;
    }
    const mode = currentMode || "list";
    if (state.currentList === "favorite") {
        state.favoriteLastNonRandomMode = mode;
    } else {
        state.playlistLastNonRandomMode = mode;
    }
}

function updateShuffleButtonUI() {
    const button = dom.shuffleToggleBtn;
    if (!button) {
        return;
    }
    const mode = getActivePlayMode();
    const isRandom = mode === "random";
    button.setAttribute("aria-pressed", isRandom ? "true" : "false");
    const iconClass = isRandom ? "shuffle-icon shuffle-icon--on" : "shuffle-icon shuffle-icon--off";
    button.innerHTML = `<i class="fas fa-shuffle ${iconClass}"></i>`;
    const label = isRandom ? "关闭随机播放" : "开启随机播放";
    button.title = label;
    button.setAttribute("aria-label", label);
}

function updatePlayModeUI() {
    const mode = getActivePlayMode();
    if (dom.playModeBtn) {
        dom.playModeBtn.innerHTML = `<i class="fas ${playModeIcons[mode] || playModeIcons.list}"></i>`;
        dom.playModeBtn.title = `播放模式: ${playModeTexts[mode] || playModeTexts.list}`;
    }
    updateShuffleButtonUI();
}

function setPlayMode(mode, { announce = true } = {}) {
    const validModes = ["list", "single", "random"];
    if (!validModes.includes(mode)) {
        return getActivePlayMode();
    }
    const isFavoriteList = state.currentList === "favorite";
    const key = isFavoriteList ? "favoritePlayMode" : "playMode";
    const previousMode = state[key];
    if (previousMode === mode) {
        updatePlayModeUI();
        return mode;
    }

    state[key] = mode;
    if (mode !== "random") {
        if (isFavoriteList) {
            state.favoriteLastNonRandomMode = mode;
        } else {
            state.playlistLastNonRandomMode = mode;
        }
    }

    if (isFavoriteList) {
        saveFavoriteState();
    } else {
        savePlayerState();
    }

    updatePlayModeUI();

    if (announce) {
        const modeText = playModeTexts[mode] || playModeTexts.list;
        showNotification(`播放模式: ${modeText}`);
        debugLog(`播放模式切换为: ${mode} (列表: ${state.currentList})`);
    }

    return mode;
}

// 新增：播放模式切换
function togglePlayMode() {
    const modes = isMobileView ? ["list", "single", "random"] : ["list", "single"];
    const currentMode = getActivePlayMode();
    let currentIndex = modes.indexOf(currentMode);
    if (currentIndex === -1) {
        currentIndex = 0;
    }
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    if (nextMode === "random") {
        rememberLastNonRandomMode();
    }
    setPlayMode(nextMode);
}

function toggleShuffleMode() {
    const currentMode = getActivePlayMode();
    if (currentMode === "random") {
        const fallback = getLastNonRandomMode();
        setPlayMode(fallback);
        return;
    }
    rememberLastNonRandomMode();
    setPlayMode("random");
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
    }
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updatePlayPauseButton() {
    if (!dom.playPauseBtn) return;
    const isPlaying = !dom.audioPlayer.paused && !dom.audioPlayer.ended;
    dom.playPauseBtn.innerHTML = `<i class="fas ${isPlaying ? "fa-pause" : "fa-play"}"></i>`;
    dom.playPauseBtn.title = isPlaying ? "暂停" : "播放";
    if (document.body) {
        document.body.classList.toggle("is-playing", isPlaying);
    }
}

function updateProgressBarBackground(value = Number(dom.progressBar.value), max = Number(dom.progressBar.max)) {
    const duration = Number.isFinite(max) && max > 0 ? max : 0;
    const progressValue = Number.isFinite(value) ? Math.max(value, 0) : 0;
    const percent = duration > 0 ? Math.min(progressValue / duration, 1) * 100 : 0;
    dom.progressBar.style.setProperty("--progress", `${percent}%`);
}

function updateVolumeSliderBackground(volume = dom.audioPlayer.volume) {
    const clamped = Math.min(Math.max(Number.isFinite(volume) ? volume : 0, 0), 1);
    dom.volumeSlider.style.setProperty("--volume-progress", `${clamped * 100}%`);
}

function updateVolumeIcon(volume) {
    if (!dom.volumeIcon) return;
    const clamped = Math.min(Math.max(Number.isFinite(volume) ? volume : 0, 0), 1);
    let icon = "fa-volume-high";
    if (clamped === 0) {
        icon = "fa-volume-xmark";
    } else if (clamped < 0.4) {
        icon = "fa-volume-low";
    }
    dom.volumeIcon.className = `fas ${icon}`;
}

function onAudioVolumeChange() {
    const volume = dom.audioPlayer.volume;
    state.volume = volume;
    dom.volumeSlider.value = volume;
    updateVolumeSliderBackground(volume);
    updateVolumeIcon(volume);
    savePlayerState();
}

function handleVolumeChange(event) {
    const volume = Number.parseFloat(event.target.value);
    const clamped = Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : dom.audioPlayer.volume;
    dom.audioPlayer.volume = clamped;
    state.volume = clamped;
    updateVolumeSliderBackground(clamped);
    updateVolumeIcon(clamped);
    safeSetLocalStorage("playerVolume", String(clamped));
}

function handleTimeUpdate() {
    const currentTime = dom.audioPlayer.currentTime || 0;
    if (!state.isSeeking) {
        dom.progressBar.value = currentTime;
        dom.currentTimeDisplay.textContent = formatTime(currentTime);
        updateProgressBarBackground(currentTime, Number(dom.progressBar.max));
    }

    syncLyrics();

    if (state.currentList === "favorite") {
        state.favoritePlaybackTime = currentTime;
        if (Math.abs(currentTime - state.favoriteLastSavedPlaybackTime) >= 2) {
            state.favoriteLastSavedPlaybackTime = currentTime;
            safeSetLocalStorage("favoritePlaybackTime", currentTime.toFixed(1));
        }
    } else {
        state.currentPlaybackTime = currentTime;
        if (Math.abs(currentTime - state.lastSavedPlaybackTime) >= 2) {
            state.lastSavedPlaybackTime = currentTime;
            safeSetLocalStorage("currentPlaybackTime", currentTime.toFixed(1));
        }
    }
}

function handleLoadedMetadata() {
    const duration = dom.audioPlayer.duration || 0;
    dom.progressBar.max = duration;
    dom.durationDisplay.textContent = formatTime(duration);
    const storedTime = state.currentList === "favorite"
        ? state.favoritePlaybackTime
        : state.currentPlaybackTime;
    dom.progressBar.value = storedTime;
    dom.currentTimeDisplay.textContent = formatTime(storedTime);
    updateProgressBarBackground(storedTime, duration);

    if (state.pendingSeekTime != null) {
        setAudioCurrentTime(state.pendingSeekTime);
        state.pendingSeekTime = null;
    }
}

function setAudioCurrentTime(time) {
    if (!Number.isFinite(time)) return;
    const duration = dom.audioPlayer.duration || Number(dom.progressBar.max) || 0;
    const clamped = duration > 0 ? Math.min(Math.max(time, 0), duration) : Math.max(time, 0);
    try {
        dom.audioPlayer.currentTime = clamped;
    } catch (error) {
        console.warn("设置播放进度失败", error);
    }
    dom.progressBar.value = clamped;
    dom.currentTimeDisplay.textContent = formatTime(clamped);
    updateProgressBarBackground(clamped, duration);
    if (state.currentList === "favorite") {
        state.favoritePlaybackTime = clamped;
    } else {
        state.currentPlaybackTime = clamped;
    }
}

function handleProgressInput() {
    state.isSeeking = true;
    const value = Number(dom.progressBar.value);
    dom.currentTimeDisplay.textContent = formatTime(value);
    updateProgressBarBackground(value, Number(dom.progressBar.max));
}

function handleProgressChange() {
    const value = Number(dom.progressBar.value);
    state.isSeeking = false;
    seekAudio(value);
}

function seekAudio(value) {
    if (!Number.isFinite(value)) return;
    setAudioCurrentTime(value);
    if (state.currentList === "favorite") {
        state.favoriteLastSavedPlaybackTime = state.favoritePlaybackTime;
        safeSetLocalStorage("favoritePlaybackTime", state.favoritePlaybackTime.toFixed(1));
    } else {
        state.lastSavedPlaybackTime = state.currentPlaybackTime;
        safeSetLocalStorage("currentPlaybackTime", state.currentPlaybackTime.toFixed(1));
    }
}

async function togglePlayPause() {
    if (!state.currentSong) {
        if (state.playlistSongs.length > 0) {
            const targetIndex = state.currentTrackIndex >= 0 && state.currentTrackIndex < state.playlistSongs.length
                ? state.currentTrackIndex
                : 0;
            await playPlaylistSong(targetIndex);
        } else {
            showNotification("播放列表为空，请先添加歌曲", "error");
        }
        return;
    }

    if (!dom.audioPlayer.src) {
        try {
            await playSong(state.currentSong, {
                autoplay: true,
                startTime: state.currentPlaybackTime,
                preserveProgress: true,
            });
        } catch (error) {
            console.error("恢复播放失败:", error);
            showNotification("播放失败，请稍后重试", "error");
        }
        return;
    }

    if (dom.audioPlayer.paused) {
        state.isPlaying = true;
        const playPromise = dom.audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("play() Promise被拒绝:", error);
                
                // 关键修复：检查实际播放状态，而不仅仅依赖Promise结果
                if (!dom.audioPlayer.paused) {
                    console.log("✅ 虽然play() Promise被拒绝，但音频实际播放成功");
                    state.isPlaying = true;
                } else {
                    console.error("播放确实失败:", error);
                    showNotification("播放失败，请检查网络连接", "error");
                    state.isPlaying = false;
                }
            });
        }
    } else {
        state.isPlaying = false;
        dom.audioPlayer.pause();
    }
    updatePlayPauseButton();
}

function buildSourceMenu() {
    if (!dom.sourceMenu) return;
    const optionsHtml = SOURCE_OPTIONS.map(option => {
        const isActive = option.value === state.searchSource;
        return `
            <div class="source-option${isActive ? " active" : ""}" data-source="${option.value}" role="option" aria-selected="${isActive}">
                <span>${option.label}</span>
                ${isActive ? '<i class="fas fa-check" aria-hidden="true"></i>' : ""}
            </div>
        `;
    }).join("");
    dom.sourceMenu.innerHTML = optionsHtml;
    if (state.sourceMenuOpen) {
        scheduleSourceMenuPositionUpdate();
    }
}

function updateSourceLabel() {
    const option = SOURCE_OPTIONS.find(item => item.value === state.searchSource) || SOURCE_OPTIONS[0];
    if (!option || !dom.sourceSelectLabel || !dom.sourceSelectButton) return;
    dom.sourceSelectLabel.textContent = option.label;
    dom.sourceSelectButton.dataset.source = option.value;
    dom.sourceSelectButton.setAttribute("aria-expanded", state.sourceMenuOpen ? "true" : "false");
    dom.sourceSelectButton.setAttribute("aria-label", `当前音源：${option.label}，点击切换音源`);
    dom.sourceSelectButton.setAttribute("title", `音源：${option.label}`);
}

function updateSourceMenuPosition() {
    if (!state.sourceMenuOpen || !dom.sourceMenu || !dom.sourceSelectButton) return;

    const menu = dom.sourceMenu;
    const button = dom.sourceSelectButton;
    const spacing = 10;
    const buttonWidth = Math.ceil(button.getBoundingClientRect().width);
    const effectiveWidth = Math.max(buttonWidth, 140);

    menu.style.left = "0px";
    menu.style.width = `${effectiveWidth}px`;
    menu.style.minWidth = `${effectiveWidth}px`;
    menu.style.maxWidth = `${effectiveWidth}px`;

    const menuHeight = Math.max(menu.scrollHeight, 0);
    const buttonRect = button.getBoundingClientRect();
    const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    const spaceBelow = Math.max(viewportHeight - buttonRect.bottom - spacing, 0);
    const canOpenUpwards = buttonRect.top - spacing - menuHeight >= 0;
    const shouldOpenUpwards = menuHeight > spaceBelow && canOpenUpwards;

    if (shouldOpenUpwards) {
        menu.classList.add("open-upwards");
        menu.classList.remove("open-downwards");
        menu.style.top = "";
        menu.style.bottom = `${button.offsetHeight + spacing}px`;
    } else {
        menu.classList.add("open-downwards");
        menu.classList.remove("open-upwards");
        menu.style.bottom = "";
        menu.style.top = `${button.offsetHeight + spacing}px`;
    }
}

function resetSourceMenuPosition() {
    if (!dom.sourceMenu) return;
    dom.sourceMenu.classList.remove("open-upwards", "open-downwards");
    dom.sourceMenu.style.top = "";
    dom.sourceMenu.style.left = "";
    dom.sourceMenu.style.bottom = "";
    dom.sourceMenu.style.minWidth = "";
    dom.sourceMenu.style.maxWidth = "";
    dom.sourceMenu.style.width = "";
}

function openSourceMenu() {
    if (!dom.sourceMenu || !dom.sourceSelectButton) return;
    state.sourceMenuOpen = true;
    ensureFloatingMenuListeners();
    buildSourceMenu();
    dom.sourceMenu.classList.add("show");
    dom.sourceSelectButton.classList.add("active");
    dom.sourceSelectButton.setAttribute("aria-expanded", "true");
    updateSourceMenuPosition();
    scheduleSourceMenuPositionUpdate();
}

function closeSourceMenu() {
    if (!dom.sourceMenu) return;
    dom.sourceMenu.classList.remove("show");
    dom.sourceSelectButton.classList.remove("active");
    dom.sourceSelectButton.setAttribute("aria-expanded", "false");
    state.sourceMenuOpen = false;
    cancelSourceMenuPositionUpdate();
    resetSourceMenuPosition();
    releaseFloatingMenuListenersIfIdle();
}

function toggleSourceMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if (state.sourceMenuOpen) {
        closeSourceMenu();
    } else {
        openSourceMenu();
    }
}

function handleSourceSelection(event) {
    const option = event.target.closest(".source-option");
    if (!option) return;
    event.preventDefault();
    event.stopPropagation();
    const { source } = option.dataset;
    if (source) {
        selectSearchSource(source);
    }
}

function selectSearchSource(source) {
    const normalized = normalizeSource(source);
    if (normalized === state.searchSource) {
        closeSourceMenu();
        return;
    }
    state.searchSource = normalized;
    safeSetLocalStorage("searchSource", normalized);
    updateSourceLabel();
    buildSourceMenu();
    closeSourceMenu();
}

function buildQualityMenu() {
    if (!dom.playerQualityMenu) return;
    const optionsHtml = QUALITY_OPTIONS.map(option => {
        const isActive = option.value === state.playbackQuality;
        return `
            <div class="player-quality-option${isActive ? " active" : ""}" data-quality="${option.value}">
                <span>${option.label}</span>
                <small>${option.description}</small>
            </div>
        `;
    }).join("");
    dom.playerQualityMenu.innerHTML = optionsHtml;
    if (state.qualityMenuOpen) {
        schedulePlayerQualityMenuPositionUpdate();
    }
}

function isElementNode(value) {
    return Boolean(value) && typeof value === "object" && value.nodeType === 1;
}

function resolveQualityAnchor(anchor) {
    if (isElementNode(anchor)) {
        return anchor;
    }
    if (isElementNode(dom.qualityToggle)) {
        return dom.qualityToggle;
    }
    if (isElementNode(dom.mobileQualityToggle)) {
        return dom.mobileQualityToggle;
    }
    return null;
}

function setQualityAnchorState(anchor, expanded) {
    if (!isElementNode(anchor)) {
        return;
    }
    anchor.classList.toggle("active", Boolean(expanded));
    if (typeof anchor.setAttribute === "function") {
        anchor.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
}

function getQualityMenuAnchor() {
    if (isElementNode(qualityMenuAnchor) && (!document.body || document.body.contains(qualityMenuAnchor))) {
        return qualityMenuAnchor;
    }
    const fallback = resolveQualityAnchor();
    qualityMenuAnchor = fallback;
    return fallback;
}

function updateQualityLabel() {
    const option = QUALITY_OPTIONS.find(item => item.value === state.playbackQuality) || QUALITY_OPTIONS[0];
    if (!option) return;
    dom.qualityLabel.textContent = option.label;
    dom.qualityToggle.title = `音质: ${option.label} (${option.description})`;
    if (dom.mobileQualityLabel) {
        dom.mobileQualityLabel.textContent = option.label;
    }
    if (dom.mobileQualityToggle) {
        dom.mobileQualityToggle.title = `音质: ${option.label} (${option.description})`;
    }
}

function togglePlayerQualityMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const anchor = resolveQualityAnchor(event && event.currentTarget ? event.currentTarget : qualityMenuAnchor);
    if (!anchor) {
        return;
    }
    if (state.qualityMenuOpen && qualityMenuAnchor === anchor) {
        closePlayerQualityMenu();
    } else {
        openPlayerQualityMenu(anchor);
    }
}

function updatePlayerQualityMenuPosition() {
    if (!state.qualityMenuOpen || !dom.playerQualityMenu) return;

    const anchor = getQualityMenuAnchor();
    if (!isElementNode(anchor)) {
        return;
    }
    const menu = dom.playerQualityMenu;
    const toggleRect = anchor.getBoundingClientRect();
    const viewportWidth = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    const spacing = 10;

    menu.classList.add("floating");

    const targetWidth = Math.max(Math.round(toggleRect.width), 180);
    menu.style.minWidth = `${targetWidth}px`;
    menu.style.maxWidth = `${targetWidth}px`;
    menu.style.width = `${targetWidth}px`;
    menu.style.right = "auto";

    const menuRect = menu.getBoundingClientRect();
    const menuHeight = Math.round(menuRect.height);
    const menuWidth = Math.round(menuRect.width) || targetWidth;

    let top = Math.round(toggleRect.bottom + spacing);
    let openUpwards = false;
    if (top + menuHeight > viewportHeight - spacing) {
        const upwardTop = Math.round(toggleRect.top - spacing - menuHeight);
        if (upwardTop >= spacing) {
            top = upwardTop;
            openUpwards = true;
        } else {
            top = Math.max(spacing, viewportHeight - spacing - menuHeight);
        }
    }

    const isPortraitOrientation = (() => {
        if (typeof window.matchMedia === "function") {
            const portraitQuery = window.matchMedia("(orientation: portrait)");
            if (typeof portraitQuery.matches === "boolean") {
                return portraitQuery.matches;
            }
        }
        return viewportHeight >= viewportWidth;
    })();

    let left;
    if (isMobileView && isPortraitOrientation) {
        left = Math.round(toggleRect.left + (toggleRect.width - menuWidth) / 2);
    } else {
        left = Math.round(toggleRect.right - menuWidth);
    }

    const minLeft = spacing;
    const maxLeft = Math.max(minLeft, viewportWidth - spacing - menuWidth);
    left = Math.min(Math.max(left, minLeft), maxLeft);

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.classList.toggle("open-upwards", openUpwards);
    menu.classList.toggle("open-downwards", !openUpwards);
}

function resetPlayerQualityMenuPosition() {
    if (!dom.playerQualityMenu) return;
    dom.playerQualityMenu.classList.remove("floating", "open-upwards", "open-downwards");
    dom.playerQualityMenu.style.top = "";
    dom.playerQualityMenu.style.left = "";
    dom.playerQualityMenu.style.right = "";
    dom.playerQualityMenu.style.minWidth = "";
    dom.playerQualityMenu.style.maxWidth = "";
    dom.playerQualityMenu.style.width = "";
}

function openPlayerQualityMenu(anchor) {
    if (!dom.playerQualityMenu) return;
    const targetAnchor = resolveQualityAnchor(anchor);
    if (!targetAnchor) {
        return;
    }
    if (qualityMenuAnchor && qualityMenuAnchor !== targetAnchor) {
        setQualityAnchorState(qualityMenuAnchor, false);
    }
    qualityMenuAnchor = targetAnchor;
    state.qualityMenuOpen = true;
    ensureFloatingMenuListeners();
    const menu = dom.playerQualityMenu;
    setQualityAnchorState(qualityMenuAnchor, true);
    menu.classList.add("floating");
    menu.classList.remove("show");

    runWithoutTransition(menu, () => {
        updatePlayerQualityMenuPosition();
    });

    requestAnimationFrame(() => {
        if (!state.qualityMenuOpen) return;
        menu.classList.add("show");
    });

    schedulePlayerQualityMenuPositionUpdate();
}

function closePlayerQualityMenu() {
    if (!dom.playerQualityMenu) return;
    const menu = dom.playerQualityMenu;
    const wasOpen = state.qualityMenuOpen || menu.classList.contains("show");

    if (!wasOpen) {
        resetPlayerQualityMenuPosition();
        setQualityAnchorState(qualityMenuAnchor, false);
        qualityMenuAnchor = null;
        releaseFloatingMenuListenersIfIdle();
        return;
    }

    const finalizeClose = () => {
        if (finalizeClose._timeout) {
            window.clearTimeout(finalizeClose._timeout);
            finalizeClose._timeout = null;
        }
        menu.removeEventListener("transitionend", handleTransitionEnd);
        if (state.qualityMenuOpen || menu.classList.contains("show")) {
            return;
        }
        resetPlayerQualityMenuPosition();
        releaseFloatingMenuListenersIfIdle();
    };

    const handleTransitionEnd = (event) => {
        if (event.target !== menu) {
            return;
        }
        if (event.propertyName && !["opacity", "transform"].includes(event.propertyName)) {
            return;
        }
        finalizeClose();
    };

    menu.addEventListener("transitionend", handleTransitionEnd);
    finalizeClose._timeout = window.setTimeout(finalizeClose, 250);

    menu.classList.remove("show");
    state.qualityMenuOpen = false;
    cancelPlayerQualityMenuPositionUpdate();
    setQualityAnchorState(qualityMenuAnchor, false);
    qualityMenuAnchor = null;
}

function handlePlayerQualitySelection(event) {
    const option = event.target.closest(".player-quality-option");
    if (!option) return;
    event.preventDefault();
    event.stopPropagation();
    const { quality } = option.dataset;
    if (quality) {
        selectPlaybackQuality(quality);
    }
}

async function selectPlaybackQuality(quality) {
    const normalized = normalizeQuality(quality);
    if (normalized === state.playbackQuality) {
        closePlayerQualityMenu();
        return;
    }

    state.playbackQuality = normalized;
    updateQualityLabel();
    buildQualityMenu();
    savePlayerState();
    closePlayerQualityMenu();

    const option = QUALITY_OPTIONS.find(item => item.value === normalized);
    if (option) {
        showNotification(`音质已切换为 ${option.label} (${option.description})`);
    }

    if (state.currentSong) {
        const success = await reloadCurrentSong();
        if (!success) {
            showNotification("切换音质失败，请稍后重试", "error");
        }
    }
}

async function reloadCurrentSong() {
    if (!state.currentSong) return true;
    const wasPlaying = !dom.audioPlayer.paused;
    const targetTime = dom.audioPlayer.currentTime || state.currentPlaybackTime || 0;
    try {
        await playSong(state.currentSong, {
            autoplay: wasPlaying,
            startTime: targetTime,
            preserveProgress: true,
        });
        if (!wasPlaying) {
            dom.audioPlayer.pause();
            updatePlayPauseButton();
        }
        return true;
    } catch (error) {
        console.error("切换音质失败:", error);
        return false;
    }
}

async function restoreCurrentSongState() {
    if (!state.currentSong) return;
    try {
        await playSong(state.currentSong, {
            autoplay: false,
            startTime: state.currentPlaybackTime,
            preserveProgress: true,
        });
        dom.audioPlayer.pause();
        updatePlayPauseButton();
    } catch (error) {
        console.warn("恢复音频失败:", error);
    }
}

// ================================================
// 锁屏操作拦截器
// ================================================





    
    console.log('✅ iOS PWA 锁屏修复方案已加载');
}

// ================================================
// 隐身模式专用：更新锁屏媒体信息
// ================================================


// ================================================
// 解锁恢复机制
// ================================================


// 修复：更新当前歌曲信息和封面
function updateCurrentSongInfo(song, options = {}) {
    const { loadArtwork = true, updateBackground = true } = options;
    
    // 如果是隐身模式，跳过UI更新
    if (shouldUseStealthMode() && !state.forceUIUpdate) {
        console.log('🔒 隐身模式：跳过UI更新');
        return Promise.resolve();
    }
    
    // 只有在 updateBackground 为 true 时才更新当前歌曲状态
    if (updateBackground) {
        state.currentSong = song;
        dom.currentSongTitle.textContent = song.name;
        updateMobileToolbarTitle();
        updateFavoriteIcons();

        // 修复艺人名称显示问题 - 使用正确的字段名
        const artistText = Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || '未知艺术家');
        dom.currentSongArtist.textContent = artistText;
    }

    cancelDeferredPaletteUpdate();

    if (!loadArtwork) {
        if (updateBackground) {
            dom.albumCover.classList.add("loading");
            dom.albumCover.innerHTML = PLACEHOLDER_HTML;
            state.currentArtworkUrl = null;
        }
        return Promise.resolve();
    }

    // 加载封面
    if (song.pic_id || song.id) {
        cancelDeferredPaletteUpdate();
        dom.albumCover.classList.add("loading");
        const picUrl = API.getPicUrl(song);
        
        // 直接使用图片URL，不通过JSON解析
        debugLog(`直接使用封面URL: ${picUrl}`);
        
        const img = new Image();
        const preferredImageUrl = preferHttpsUrl(picUrl);
        const absoluteImageUrl = toAbsoluteUrl(preferredImageUrl);
        
        if (state.currentSong === song) {
            state.currentArtworkUrl = absoluteImageUrl;
            if (typeof window.__SOLARA_UPDATE_MEDIA_METADATA === 'function') {
                window.__SOLARA_UPDATE_MEDIA_METADATA();
            }
        }
        
        img.crossOrigin = "anonymous";
        img.onload = () => {
            if (state.currentSong !== song) {
                return;
            }
            if (updateBackground) {
                setAlbumCoverImage(preferredImageUrl);
                // 优化：总是立即应用调色板，加快视觉效果
                scheduleDeferredPaletteUpdate(preferredImageUrl, { immediate: true });
            }
        };
        img.onerror = () => {
            if (state.currentSong !== song) {
                return;
            }
            if (updateBackground) {
                cancelDeferredPaletteUpdate();
                showAlbumCoverPlaceholder();
            }
        };
        
        img.src = preferredImageUrl;
    } else {
        cancelDeferredPaletteUpdate();
        if (updateBackground) {
            showAlbumCoverPlaceholder();
        }
    }

    return Promise.resolve();
}

// 搜索功能 - 修复搜索下拉框显示问题
async function performSearch(isLiveSearch = false) {
    const query = dom.searchInput.value.trim();
    if (!query) {
        showNotification("请输入搜索关键词", "error");
        return;
    }

    if (state.sourceMenuOpen) {
        closeSourceMenu();
    }

    const source = normalizeSource(state.searchSource);
    state.searchSource = source;
    safeSetLocalStorage("searchSource", source);
    updateSourceLabel();
    buildSourceMenu();

    // 重置搜索状态
    if (!isLiveSearch) {
        state.searchPage = 1;
        state.searchKeyword = query;
        state.searchSource = source;
        state.searchResults = [];
        state.hasMoreResults = true;
        state.renderedSearchCount = 0;
        resetSelectedSearchResults();
        const listContainer = dom.searchResultsList || dom.searchResults;
        if (listContainer) {
            listContainer.innerHTML = "";
        }
        debugLog(`开始新搜索: ${query}, 来源: ${source}`);
    } else {
        state.searchKeyword = query;
        state.searchSource = source;
    }

    try {
        // 禁用搜索按钮并显示加载状态
        dom.searchBtn.disabled = true;
        dom.searchBtn.innerHTML = '<span class="loader"></span><span>搜索中...</span>';

        // 立即显示搜索模式
        showSearchResults();
        debugLog("已切换到搜索模式");

        // 执行搜索
        const results = await API.search(query, source, 20, state.searchPage);
        debugLog(`API返回结果数量: ${results.length}`);

        if (state.searchPage === 1) {
            state.searchResults = results;
        } else {
            state.searchResults = [...state.searchResults, ...results];
        }

        state.hasMoreResults = results.length === 20;

        // 显示搜索结果
        displaySearchResults(results, {
            reset: state.searchPage === 1,
            totalCount: state.searchResults.length,
        });
        persistLastSearchState();
        debugLog(`搜索完成: 总共显示 ${state.searchResults.length} 个结果`);

        // 如果没有结果，显示提示
        if (state.searchResults.length === 0) {
            showNotification("未找到相关歌曲", "error");
        }

    } catch (error) {
        console.error("搜索失败:", error);
        showNotification("搜索失败，请稍后重试", "error");
        hideSearchResults();
        debugLog(`搜索失败: ${error.message}`);
    } finally {
        // 恢复搜索按钮状态
        dom.searchBtn.disabled = false;
        dom.searchBtn.innerHTML = '<i class="fas fa-search"></i><span>搜索</span>';
    }
}

// 加载更多搜索结果
async function loadMoreResults() {
    if (!state.hasMoreResults || !state.searchKeyword) {
        debugLog("没有更多结果或搜索关键词为空");
        return;
    }

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (!loadMoreBtn) {
        debugLog("找不到加载更多按钮");
        return;
    }

    try {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span class="loader"></span><span>加载中...</span>';

        state.searchPage++;
        debugLog(`加载第 ${state.searchPage} 页结果`);

        const source = normalizeSource(state.searchSource);
        state.searchSource = source;
        safeSetLocalStorage("searchSource", source);
        const results = await API.search(state.searchKeyword, source, 20, state.searchPage);

        if (results.length > 0) {
            state.searchResults = [...state.searchResults, ...results];
            state.hasMoreResults = results.length === 20;
            displaySearchResults(results, {
                totalCount: state.searchResults.length,
            });
            persistLastSearchState();
            debugLog(`加载完成: 新增 ${results.length} 个结果`);
        } else {
            state.hasMoreResults = false;
            showNotification("没有更多结果了");
            debugLog("没有更多结果");
        }
    } catch (error) {
        console.error("加载更多失败:", error);
        showNotification("加载失败，请稍后重试", "error");
        state.searchPage--; // 回退页码
    } finally {
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = "<i class=\"fas fa-plus\"></i><span>加载更多</span>";
        }
    }
}

function createSearchResultItem(song, index) {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.dataset.index = String(index);

    const selectionToggle = document.createElement("button");
    selectionToggle.className = "search-result-select";
    selectionToggle.type = "button";
    selectionToggle.innerHTML = '<i class="fas fa-check"></i>';
    selectionToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSearchResultSelection(index);
    });

    const info = document.createElement("div");
    info.className = "search-result-info";

    const title = document.createElement("div");
    title.className = "search-result-title";
    title.textContent = song.name || "未知歌曲";

    const artist = document.createElement("div");
    artist.className = "search-result-artist";
    const artistName = Array.isArray(song.artist)
        ? song.artist.join(', ')
        : (song.artist || "未知艺术家");
    const albumText = song.album ? ` - ${song.album}` : "";
    artist.textContent = `${artistName}${albumText}`;

    info.appendChild(title);
    info.appendChild(artist);

    const actions = document.createElement("div");
    actions.className = "search-result-actions";

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "action-btn favorite favorite-toggle";
    favoriteButton.type = "button";
    favoriteButton.title = "收藏";
    favoriteButton.dataset.favoriteKey = getSongKey(song) || `search-${index}`;
    favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
    favoriteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavorite(song);
    });

    const playButton = document.createElement("button");
    playButton.className = "action-btn play";
    playButton.type = "button";
    playButton.title = "播放";
    playButton.innerHTML = '<i class="fas fa-play"></i>';
    playButton.addEventListener("click", (event) => {
        event.stopPropagation();
        playSearchResult(index);
    });

    const downloadButton = document.createElement("button");
    downloadButton.className = "action-btn download";
    downloadButton.type = "button";
    downloadButton.title = "下载";
    downloadButton.innerHTML = '<i class="fas fa-download"></i>';
    downloadButton.addEventListener("click", (event) => {
        event.stopPropagation();
        showQualityMenu(event, index, "search");
    });

    actions.appendChild(favoriteButton);
    actions.appendChild(playButton);
    actions.appendChild(downloadButton);

    item.appendChild(selectionToggle);
    item.appendChild(info);
    item.appendChild(actions);

    applySelectionStateToElement(item, state.selectedSearchResults.has(index));

    item.addEventListener("click", (event) => {
        if (event.target.closest(".search-result-actions")) {
            return;
        }
        if (event.target.closest(".search-result-select")) {
            return;
        }
        toggleSearchResultSelection(index);
    });

    return item;
}

function ensureSelectedSearchResultsSet() {
    if (!(state.selectedSearchResults instanceof Set)) {
        state.selectedSearchResults = new Set();
    }
}

function applySelectionStateToElement(item, isSelected) {
    if (!item) {
        return;
    }
    item.classList.toggle("selected", Boolean(isSelected));
    const toggle = item.querySelector(".search-result-select");
    if (toggle) {
        toggle.setAttribute("aria-pressed", isSelected ? "true" : "false");
        toggle.setAttribute("aria-label", isSelected ? "取消选择" : "选择歌曲");
    }
}

function updateSearchResultSelectionUI(index) {
    const container = dom.searchResultsList || dom.searchResults;
    if (!container) {
        return;
    }
    const numericIndex = Number(index);
    const item = container.querySelector(`.search-result-item[data-index="${numericIndex}"]`);
    ensureSelectedSearchResultsSet();
    applySelectionStateToElement(item, state.selectedSearchResults.has(numericIndex));
}

function updateImportSelectedButton() {
    const button = dom.importSelectedBtn;
    if (!button) {
        return;
    }
    ensureSelectedSearchResultsSet();
    const count = state.selectedSearchResults.size;
    button.disabled = count === 0;
    button.setAttribute("aria-disabled", count === 0 ? "true" : "false");
    if (count === 0) {
        closeImportSelectedMenu();
    }
    const countLabel = dom.importSelectedCount;
    if (countLabel) {
        countLabel.textContent = count > 0 ? `(${count})` : "";
    }
    const label = count > 0 ? `导入已选 (${count})` : "导入已选";
    button.title = label;
    button.setAttribute("aria-label", count > 0 ? `导入已选 ${count} 首歌曲` : "导入已选");
}

function toggleSearchResultSelection(index) {
    const numericIndex = Number(index);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
        return;
    }
    ensureSelectedSearchResultsSet();
    if (state.selectedSearchResults.has(numericIndex)) {
        state.selectedSearchResults.delete(numericIndex);
    } else {
        state.selectedSearchResults.add(numericIndex);
    }
    updateSearchResultSelectionUI(numericIndex);
    updateImportSelectedButton();
}

function resetSelectedSearchResults() {
    ensureSelectedSearchResultsSet();
    if (state.selectedSearchResults.size === 0) {
        updateImportSelectedButton();
        return;
    }
    const indices = Array.from(state.selectedSearchResults);
    state.selectedSearchResults.clear();
    indices.forEach(updateSearchResultSelectionUI);
    updateImportSelectedButton();
}

function closeImportSelectedMenu() {
    if (!dom.importSelectedMenu || !dom.importSelectedBtn) {
        return;
    }
    if (!dom.importSelectedMenu.hasAttribute("hidden")) {
        dom.importSelectedMenu.setAttribute("hidden", "");
        dom.importSelectedBtn.setAttribute("aria-expanded", "false");
    }
    if (importSelectedMenuOutsideHandler) {
        document.removeEventListener("click", importSelectedMenuOutsideHandler);
        importSelectedMenuOutsideHandler = null;
    }
}

function openImportSelectedMenu() {
    if (!dom.importSelectedMenu || !dom.importSelectedBtn || dom.importSelectedBtn.disabled) {
        return;
    }
    dom.importSelectedMenu.removeAttribute("hidden");
    dom.importSelectedBtn.setAttribute("aria-expanded", "true");
    if (importSelectedMenuOutsideHandler) {
        document.removeEventListener("click", importSelectedMenuOutsideHandler);
    }
    importSelectedMenuOutsideHandler = (event) => {
        if (!dom.importSelectedMenu || !dom.importSelectedBtn) {
            return;
        }
        if (dom.importSelectedMenu.contains(event.target) || dom.importSelectedBtn.contains(event.target)) {
            return;
        }
        closeImportSelectedMenu();
    };
    window.requestAnimationFrame(() => {
        document.addEventListener("click", importSelectedMenuOutsideHandler);
    });
}

function importSelectedSearchResults(target = "playlist") {
    ensureSelectedSearchResultsSet();
    if (state.selectedSearchResults.size === 0) {
        return;
    }

    const indices = Array.from(state.selectedSearchResults).filter((value) => Number.isInteger(value) && value >= 0);
    if (indices.length === 0) {
        resetSelectedSearchResults();
        return;
    }

    const songsToAdd = indices
        .map((index) => state.searchResults[index])
        .filter((song) => song && typeof song === "object");

    if (songsToAdd.length === 0) {
        resetSelectedSearchResults();
        showNotification("未找到可导入的歌曲", "warning");
        return;
    }

    const processedIndices = [...indices];
    state.selectedSearchResults.clear();
    processedIndices.forEach(updateSearchResultSelectionUI);
    updateImportSelectedButton();

    if (target === "favorites") {
        const favorites = ensureFavoriteSongsArray();
        const existingKeys = new Set(
            favorites
                .map(getSongKey)
                .filter((key) => typeof key === "string" && key !== "")
        );

        let added = 0;
        let duplicates = 0;

        songsToAdd.forEach((song) => {
            const normalized = sanitizeImportedSong(song) || song;
            const key = getSongKey(normalized);
            if (key && existingKeys.has(key)) {
                duplicates++;
                return;
            }
            favorites.push(normalized);
            if (key) {
                existingKeys.add(key);
            }
            added++;
        });

        if (added > 0) {
            saveFavoriteState();
            renderFavorites();
            const duplicateHint = duplicates > 0 ? `，${duplicates} 首已存在` : "";
            showNotification(`成功导入 ${added} 首收藏歌曲${duplicateHint}`, "success");
        } else {
            updateFavoriteActionStates();
            showNotification("选中的歌曲已在收藏列表中", "warning");
        }
        updateFavoriteIcons();
        return;
    }

    if (!Array.isArray(state.playlistSongs)) {
        state.playlistSongs = [];
    }

    const existingKeys = new Set(
        state.playlistSongs
            .map(getSongKey)
            .filter((key) => typeof key === "string" && key !== "")
    );

    let added = 0;
    let duplicates = 0;

    songsToAdd.forEach((song) => {
        const key = getSongKey(song);
        if (key && existingKeys.has(key)) {
            duplicates++;
            return;
        }
        state.playlistSongs.push(song);
        if (key) {
            existingKeys.add(key);
        }
        added++;
    });

    if (added > 0) {
        renderPlaylist();
        const duplicateHint = duplicates > 0 ? `，${duplicates} 首已存在` : "";
        showNotification(`成功导入 ${added} 首歌曲${duplicateHint}`, "success");
    } else {
        updatePlaylistActionStates();
        showNotification("选中的歌曲已在播放列表中", "warning");
    }
    updateFavoriteIcons();
}

function createLoadMoreButton() {
    const button = document.createElement("button");
    button.id = "loadMoreBtn";
    button.className = "load-more-btn";
    button.type = "button";
    button.innerHTML = '<i class="fas fa-plus"></i><span>加载更多</span>';
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        loadMoreResults();
    });
    return button;
}

function displaySearchResults(newItems, options = {}) {
    dom.playlist.classList.remove("empty");
    const container = dom.searchResultsList || dom.searchResults;
    if (!container) {
        return;
    }

    const { reset = false, totalCount = state.searchResults.length } = options;

    if (reset) {
        container.innerHTML = "";
        state.renderedSearchCount = 0;
        resetSelectedSearchResults();
    }

    const existingLoadMore = container.querySelector("#loadMoreBtn");
    if (existingLoadMore) {
        existingLoadMore.remove();
    }

    const itemsToAppend = Array.isArray(newItems) ? newItems : [];

    if (itemsToAppend.length === 0 && state.renderedSearchCount === 0 && totalCount === 0) {
        container.innerHTML = "<div style=\"text-align: center; color: var(--text-secondary-color); padding: 20px;\">未找到相关歌曲</div>";
        state.renderedSearchCount = 0;
        debugLog("显示搜索结果: 0 个结果, 无可用数据");
        return;
    }

    if (itemsToAppend.length > 0) {
        const fragment = document.createDocumentFragment();
        const startIndex = state.renderedSearchCount;
        itemsToAppend.forEach((song, offset) => {
            fragment.appendChild(createSearchResultItem(song, startIndex + offset));
        });
        container.appendChild(fragment);
        state.renderedSearchCount += itemsToAppend.length;
    }

    if (state.hasMoreResults) {
        container.appendChild(createLoadMoreButton());
    }

    const appendedCount = itemsToAppend.length;
    const totalRendered = state.renderedSearchCount;
    debugLog(`显示搜索结果: 新增 ${appendedCount} 个结果, 总计 ${totalRendered} 个, 加载更多按钮: ${state.hasMoreResults ? "显示" : "隐藏"}`);
    updateFavoriteIcons();
}

// 显示质量选择菜单
function showQualityMenu(event, index, type) {
    event.stopPropagation();

    // 移除现有的质量菜单
    const existingMenu = document.querySelector(".dynamic-quality-menu");
    if (existingMenu) {
        existingMenu.remove();
    }

    // 创建新的质量菜单
    const menu = document.createElement("div");
    menu.className = "dynamic-quality-menu";
    menu.innerHTML = `
        <div class="quality-option" onclick="downloadWithQuality(event, ${index}, '${type}', 'mp3')">MP3音质</div>
        <div class="quality-option" onclick="downloadWithQuality(event, ${index}, '${type}', '999')">无损音质</div>
    `;

    // 设置菜单位置
    const button = event.target.closest("button");
    const rect = button.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = (rect.bottom + 5) + "px";
    menu.style.left = (rect.left - 50) + "px";
    menu.style.zIndex = "10000";

    // 添加到body
    document.body.appendChild(menu);

    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener("click", function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        });
    }, 0);
}

// 根据质量下载 - 支持播放列表模式
async function downloadWithQuality(event, index, type, quality) {
    event.stopPropagation();
    let song;

    if (type === "search") {
        song = state.searchResults[index];
    } else if (type === "online") {
        song = state.onlineSongs[index];
    } else if (type === "playlist") {
        song = state.playlistSongs[index];
    } else if (type === "favorites") {
        song = state.favoriteSongs[index];
    }

    if (!song) return;

    // 关闭菜单并移除 menu-active 类
    document.querySelectorAll(".quality-menu").forEach(menu => {
        menu.classList.remove("show");
        const parentItem = menu.closest(".search-result-item");
        if (parentItem) parentItem.classList.remove("menu-active");
    });

    // 关闭动态质量菜单
    const dynamicMenu = document.querySelector(".dynamic-quality-menu");
    if (dynamicMenu) {
        dynamicMenu.remove();
    }

    try {
        await downloadSong(song, quality);
    } catch (error) {
        console.error("下载失败:", error);
        showNotification("下载失败，请稍后重试", "error");
    }
}

// 修复：播放搜索结果 - 添加到播放列表而不是清空
async function playSearchResult(index) {
    const song = state.searchResults[index];
    if (!song) return;

    try {
        // 立即隐藏搜索结果，显示播放界面
        hideSearchResults();
        dom.searchInput.value = "";
        if (isMobileView) {
            closeMobileSearch();
        }

        // 检查歌曲是否已在播放列表中
        const existingIndex = state.playlistSongs.findIndex(s => s.id === song.id && s.source === song.source);

        if (existingIndex !== -1) {
            // 如果歌曲已存在，直接播放
            state.currentTrackIndex = existingIndex;
            state.currentPlaylist = "playlist";
            state.currentList = "playlist";
        } else {
            // 如果歌曲不存在，添加到播放列表
            state.playlistSongs.push(song);
            state.currentTrackIndex = state.playlistSongs.length - 1;
            state.currentPlaylist = "playlist";
            state.currentList = "playlist";
        }

        // 更新播放列表显示
        renderPlaylist();

        // 播放歌曲
        await playSong(song);
        updatePlayModeUI();

        showNotification(`正在播放: ${song.name}`);

    } catch (error) {
        console.error("播放失败:", error);
        showNotification("播放失败，请稍后重试", "error");
    }
}

function resolveSongId(song) {
    if (!song || typeof song !== "object") {
        return null;
    }
    const candidates = [
        "id",
        "songId",
        "songid",
        "songmid",
        "mid",
        "hash",
        "sid",
        "rid",
        "trackId"
    ];
    for (const key of candidates) {
        if (Object.prototype.hasOwnProperty.call(song, key)) {
            const value = song[key];
            if (typeof value === "number" && Number.isFinite(value)) {
                return String(value);
            }
            if (typeof value === "string" && value.trim() !== "") {
                return value.trim();
            }
        }
    }
    return null;
}

function normalizeArtistValue(value) {
    if (Array.isArray(value)) {
        const names = value.map((item) => {
            if (typeof item === "string") {
                return item.trim();
            }
            if (item && typeof item === "object" && typeof item.name === "string") {
                return item.name.trim();
            }
            return "";
        }).filter(Boolean);
        if (names.length === 0) {
            return undefined;
        }
        if (names.length === 1) {
            return names[0];
        }
        return names;
    }
    if (value && typeof value === "object" && typeof value.name === "string") {
        const name = value.name.trim();
        return name || undefined;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || undefined;
    }
    return undefined;
}

function getSongKey(song) {
    if (!song || typeof song !== "object") {
        return null;
    }
    const source = typeof song.source === "string" && song.source.trim() !== ""
        ? song.source.trim().toLowerCase()
        : (typeof song.platform === "string" && song.platform.trim() !== ""
            ? song.platform.trim().toLowerCase()
            : "netease");
    const id = resolveSongId(song);
    if (id) {
        return `${source}:${id}`;
    }
    const name = typeof song.name === "string" ? song.name.trim().toLowerCase() : "";
    if (!name) {
        return null;
    }
    const artistValue = song.artist ?? song.artists ?? song.singers ?? song.singer;
    let artistText = "";
    if (Array.isArray(artistValue)) {
        artistText = artistValue.map((item) => {
            if (typeof item === "string") {
                return item.trim().toLowerCase();
            }
            if (item && typeof item === "object" && typeof item.name === "string") {
                return item.name.trim().toLowerCase();
            }
            return "";
        }).filter(Boolean).join(",");
    } else if (artistValue && typeof artistValue === "object" && typeof artistValue.name === "string") {
        artistText = artistValue.name.trim().toLowerCase();
    } else if (typeof artistValue === "string") {
        artistText = artistValue.trim().toLowerCase();
    }
    return `${source}:${name}::${artistText}`;
}

function sanitizeImportedSong(rawSong) {
    if (!rawSong || typeof rawSong !== "object") {
        return null;
    }
    const name = typeof rawSong.name === "string" ? rawSong.name.trim() : "";
    if (!name) {
        return null;
    }

    const normalized = { ...rawSong, name };
    const sourceCandidate = rawSong.source || rawSong.platform || rawSong.provider || rawSong.vendor;
    normalized.source = typeof sourceCandidate === "string" && sourceCandidate.trim() !== ""
        ? sourceCandidate.trim()
        : "netease";

    const resolvedId = resolveSongId(rawSong);
    if (resolvedId) {
        normalized.id = resolvedId;
    }

    const artistValue = rawSong.artist ?? rawSong.artists ?? rawSong.singers ?? rawSong.singer;
    const normalizedArtist = normalizeArtistValue(artistValue);
    if (normalizedArtist !== undefined) {
        normalized.artist = normalizedArtist;
    }

    if (normalized.album && typeof normalized.album === "object" && typeof normalized.album.name === "string") {
        normalized.album = normalized.album.name.trim();
    }

    return normalized;
}

function extractPlaylistItems(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && typeof payload === "object") {
        const possibleKeys = ["items", "songs", "playlist", "tracks", "data"];
        for (const key of possibleKeys) {
            if (Array.isArray(payload[key])) {
                return payload[key];
            }
        }
    }
    return [];
}

function updatePlaylistActionStates() {
    const hasSongs = Array.isArray(state.playlistSongs) && state.playlistSongs.length > 0;
    if (dom.exportPlaylistBtn) {
        dom.exportPlaylistBtn.disabled = !hasSongs;
        dom.exportPlaylistBtn.setAttribute("aria-disabled", hasSongs ? "false" : "true");
    }
    if (dom.mobileExportPlaylistBtn) {
        dom.mobileExportPlaylistBtn.disabled = !hasSongs;
        dom.mobileExportPlaylistBtn.setAttribute("aria-disabled", hasSongs ? "false" : "true");
    }
    if (dom.clearPlaylistBtn) {
        dom.clearPlaylistBtn.disabled = !hasSongs;
        dom.clearPlaylistBtn.setAttribute("aria-disabled", hasSongs ? "false" : "true");
    }
    if (dom.mobileClearPlaylistBtn) {
        dom.mobileClearPlaylistBtn.disabled = !hasSongs;
        dom.mobileClearPlaylistBtn.setAttribute("aria-disabled", hasSongs ? "false" : "true");
    }
}

function exportPlaylist() {
    if (!Array.isArray(state.playlistSongs) || state.playlistSongs.length === 0) {
        showNotification("播放列表为空，无法导出", "warning");
        return;
    }

    try {
        const payload = {
            meta: {
                app: "Solara",
                version: PLAYLIST_EXPORT_VERSION,
                exportedAt: new Date().toISOString(),
                itemCount: state.playlistSongs.length
            },
            items: state.playlistSongs
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const formattedTimestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `solara-playlist-${formattedTimestamp}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        showNotification(`已导出 ${state.playlistSongs.length} 首歌曲`, "success");
    } catch (error) {
        console.error("导出播放列表失败:", error);
        showNotification("导出失败，请稍后重试", "error");
    }
}

function handleImportedPlaylistItems(rawItems) {
    if (!Array.isArray(state.playlistSongs)) {
        state.playlistSongs = [];
    }

    const sanitizedSongs = rawItems
        .map(sanitizeImportedSong)
        .filter((song) => song && typeof song === "object");

    if (sanitizedSongs.length === 0) {
        throw new Error("NO_VALID_SONGS");
    }

    const existingKeys = new Set(
        state.playlistSongs
            .map(getSongKey)
            .filter((key) => typeof key === "string" && key !== "")
    );

    let added = 0;
    let duplicates = 0;

    sanitizedSongs.forEach((song) => {
        const key = getSongKey(song);
        if (key && existingKeys.has(key)) {
            duplicates++;
            return;
        }
        state.playlistSongs.push(song);
        if (key) {
            existingKeys.add(key);
        }
        added++;
    });

    if (added > 0) {
        renderPlaylist();
    } else {
        updatePlaylistActionStates();
    }

    return { added, duplicates };
}

function handleImportPlaylistChange(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const text = typeof reader.result === "string" ? reader.result : "";
            if (!text) {
                throw new Error("EMPTY_FILE");
            }

            const payload = parseJSON(text, null);
            if (!payload) {
                throw new Error("INVALID_JSON");
            }

            const items = extractPlaylistItems(payload);
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error("NO_SONGS");
            }

            const { added, duplicates } = handleImportedPlaylistItems(items);
            if (added > 0) {
                const duplicateHint = duplicates > 0 ? `，${duplicates} 首已存在` : "";
                showNotification(`成功导入 ${added} 首歌曲${duplicateHint}`, "success");
            } else {
                showNotification("文件中的歌曲已在播放列表中", "warning");
            }
        } catch (error) {
            console.error("导入播放列表失败:", error);
            showNotification("导入失败，请确认文件格式", "error");
        } finally {
            if (input) {
                input.value = "";
            }
        }
    };

    reader.onerror = () => {
        console.error("读取播放列表文件失败:", reader.error);
        showNotification("无法读取播放列表文件", "error");
        if (input) {
            input.value = "";
        }
    };

    reader.readAsText(file, "utf-8");
}

// 新增：渲染统一播放列表
function renderPlaylist() {
    if (!dom.playlistItems) return;

    if (state.playlistSongs.length === 0) {
        dom.playlist.classList.add("empty");
        dom.playlistItems.innerHTML = "";
        savePlayerState();
        updateFavoriteIcons();
        updatePlaylistHighlight();
        updateMobileClearPlaylistVisibility();
        updatePlaylistActionStates();
        return;
    }

    dom.playlist.classList.remove("empty");
    const playlistHtml = state.playlistSongs.map((song, index) => {
        const artistValue = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : (song.artist || "未知艺术家");
        const songKey = getSongKey(song) || `playlist-${index}`;
        return `
        <div class="playlist-item" data-index="${index}" role="button" tabindex="0" aria-label="播放 ${song.name}" data-favorite-key="${songKey}">
            ${song.name} - ${artistValue}
            <button class="playlist-item-favorite action-btn favorite favorite-toggle" type="button" data-playlist-action="favorite" data-index="${index}" data-favorite-key="${songKey}" title="收藏" aria-label="收藏">
                <i class="fa-regular fa-heart"></i>
            </button>
            <button class="playlist-item-download" type="button" data-playlist-action="download" data-index="${index}" title="下载">
                <i class="fas fa-download"></i>
            </button>
            <button class="playlist-item-remove" type="button" data-playlist-action="remove" data-index="${index}" title="从播放列表移除">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    }).join("");

    dom.playlistItems.innerHTML = playlistHtml;
    savePlayerState();
    updateFavoriteIcons();
    updatePlaylistHighlight();
    updateMobileClearPlaylistVisibility();
    updatePlaylistActionStates();
}

function ensureFavoriteSongsArray() {
    if (!Array.isArray(state.favoriteSongs)) {
        state.favoriteSongs = [];
    }
    return state.favoriteSongs;
}

function isSongFavorited(song) {
    const key = getSongKey(song);
    if (!key) {
        return false;
    }
    return ensureFavoriteSongsArray().some((item) => getSongKey(item) === key);
}

function updateFavoriteIcons() {
    const favorites = ensureFavoriteSongsArray();
    const favoriteKeys = new Set(
        favorites
            .map(getSongKey)
            .filter((key) => typeof key === "string" && key !== "")
    );

    const toggleButtons = document.querySelectorAll('.favorite-toggle[data-favorite-key]');
    toggleButtons.forEach((button) => {
        const key = button.dataset.favoriteKey;
        const isActive = key && favoriteKeys.has(key);
        button.classList.toggle('is-active', Boolean(isActive));
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fas', Boolean(isActive));
            icon.classList.toggle('far', !isActive);
            icon.classList.toggle('fa-solid', Boolean(isActive));
            icon.classList.toggle('fa-regular', !isActive);
        }
        if (isActive) {
            button.setAttribute('title', '取消收藏');
            button.setAttribute('aria-label', '取消收藏');
        } else {
            button.setAttribute('title', '收藏');
            button.setAttribute('aria-label', '收藏');
        }
    });

    if (dom.currentFavoriteToggle) {
        const currentSong = state.currentSong;
        const key = currentSong ? getSongKey(currentSong) : null;
        const isActive = key && favoriteKeys.has(key);
        dom.currentFavoriteToggle.disabled = !currentSong;
        dom.currentFavoriteToggle.setAttribute('aria-disabled', currentSong ? 'false' : 'true');
        dom.currentFavoriteToggle.classList.toggle('is-active', Boolean(isActive));
        dom.currentFavoriteToggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        const label = isActive ? '取消收藏当前歌曲' : '收藏当前歌曲';
        dom.currentFavoriteToggle.setAttribute('aria-label', label);
        dom.currentFavoriteToggle.setAttribute('title', label);
        const icon = dom.currentFavoriteToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fas', Boolean(isActive));
            icon.classList.toggle('far', !isActive);
            icon.classList.toggle('fa-solid', Boolean(isActive));
            icon.classList.toggle('fa-regular', !isActive);
        }
    }
}

function switchLibraryTab(target) {
    const showFavorites = target === "favorites";

    if (Array.isArray(dom.libraryTabs) && dom.libraryTabs.length > 0) {
        dom.libraryTabs.forEach((tab) => {
            if (!(tab instanceof HTMLElement)) {
                return;
            }
            const target = tab.dataset.target === "favorites" ? "favorites" : "playlist";
            const isActive = showFavorites ? target === "favorites" : target === "playlist";
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }

    if (dom.playlist) {
        if (showFavorites) {
            dom.playlist.classList.remove("active");
            dom.playlist.setAttribute("hidden", "");
        } else {
            dom.playlist.classList.add("active");
            dom.playlist.removeAttribute("hidden");
        }
    }

    if (dom.favorites) {
        if (showFavorites) {
            dom.favorites.classList.add("active");
            dom.favorites.removeAttribute("hidden");
        } else {
            dom.favorites.classList.remove("active");
            dom.favorites.setAttribute("hidden", "");
        }
    }

    updateMobileLibraryActionVisibility(showFavorites);
    updateMobileClearPlaylistVisibility();
    closeImportSelectedMenu();
}

// 新增：从播放列表移除歌曲
function removeFromPlaylist(index) {
    if (index < 0 || index >= state.playlistSongs.length) return;

    const removingCurrent = state.currentPlaylist === "playlist" && state.currentTrackIndex === index;

    if (removingCurrent) {
        if (state.playlistSongs.length === 1) {
            dom.audioPlayer.pause();
            dom.audioPlayer.src = "";
            state.currentTrackIndex = -1;
            state.currentSong = null;
            state.currentAudioUrl = null;
            state.currentPlaybackTime = 0;
            state.lastSavedPlaybackTime = 0;
            dom.progressBar.value = 0;
            dom.progressBar.max = 0;
            dom.currentTimeDisplay.textContent = "00:00";
            dom.durationDisplay.textContent = "00:00";
            updateProgressBarBackground(0, 1);
            dom.currentSongTitle.textContent = "选择一首歌曲开始播放";
            updateMobileToolbarTitle();
            dom.currentSongArtist.textContent = "未知艺术家";
            showAlbumCoverPlaceholder();
            clearLyricsContent();
            if (dom.lyrics) {
                dom.lyrics.dataset.placeholder = "default";
            }
            dom.lyrics.classList.add("empty");
            updatePlayPauseButton();
        } else if (index === state.playlistSongs.length - 1) {
            state.currentTrackIndex = index - 1;
        }
    } else if (state.currentPlaylist === "playlist" && state.currentTrackIndex > index) {
        state.currentTrackIndex--;
    }

    state.playlistSongs.splice(index, 1);

    if (state.playlistSongs.length === 0) {
        dom.playlist.classList.add("empty");
        if (dom.playlistItems) {
            dom.playlistItems.innerHTML = "";
        }
        state.currentPlaylist = "playlist";
        updateMobileClearPlaylistVisibility();
    } else {
        if (state.currentPlaylist === "playlist" && state.currentTrackIndex < 0) {
            state.currentTrackIndex = 0;
        }

        renderPlaylist();

        if (removingCurrent && state.currentPlaylist === "playlist" && state.currentTrackIndex >= 0) {
            const targetIndex = Math.min(state.currentTrackIndex, state.playlistSongs.length - 1);
            state.currentTrackIndex = targetIndex;
            playPlaylistSong(targetIndex);
        } else {
            updatePlaylistHighlight();
        }
    }

    updatePlaylistActionStates();
    savePlayerState();
    showNotification("已从播放列表移除", "success");
    clearLyricsIfLibraryEmpty();
}

function addSongToPlaylist(song) {
    if (!song || typeof song !== "object") {
        return false;
    }
    if (!Array.isArray(state.playlistSongs)) {
        state.playlistSongs = [];
    }
    const key = getSongKey(song);
    const exists = state.playlistSongs.some((item) => getSongKey(item) === key);
    if (exists) {
        return false;
    }
    state.playlistSongs.push(song);
    return true;
}

function updateFavoriteActionStates() {
    const hasFavorites = Array.isArray(state.favoriteSongs) && state.favoriteSongs.length > 0;
    if (dom.exportFavoritesBtn) {
        dom.exportFavoritesBtn.disabled = !hasFavorites;
        dom.exportFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
    if (dom.mobileExportFavoritesBtn) {
        dom.mobileExportFavoritesBtn.disabled = !hasFavorites;
        dom.mobileExportFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
    if (dom.clearFavoritesBtn) {
        dom.clearFavoritesBtn.disabled = !hasFavorites;
        dom.clearFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
    if (dom.mobileClearFavoritesBtn) {
        dom.mobileClearFavoritesBtn.disabled = !hasFavorites;
        dom.mobileClearFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
    if (dom.addAllFavoritesBtn) {
        dom.addAllFavoritesBtn.disabled = !hasFavorites;
        dom.addAllFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
    if (dom.mobileAddAllFavoritesBtn) {
        dom.mobileAddAllFavoritesBtn.disabled = !hasFavorites;
        dom.mobileAddAllFavoritesBtn.setAttribute("aria-disabled", hasFavorites ? "false" : "true");
    }
}

function renderFavorites() {
    if (!dom.favoriteItems || !dom.favorites) {
        return;
    }

    const favorites = ensureFavoriteSongsArray();

    if (favorites.length === 0) {
        dom.favorites.classList.add("empty");
        dom.favoriteItems.innerHTML = "";
        updateFavoriteIcons();
        updateFavoriteActionStates();
        return;
    }

    dom.favorites.classList.remove("empty");
    const favoritesHtml = favorites.map((song, index) => {
        const artistValue = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : (song.artist || "未知艺术家");
        const isCurrent = state.currentList === "favorite" && index === state.currentFavoriteIndex;
        const songKey = getSongKey(song) || `favorite-${index}`;
        return `
        <div class="playlist-item${isCurrent ? " current" : ""}" data-index="${index}" role="button" tabindex="0" aria-label="播放 ${song.name}" data-favorite-key="${songKey}">
            ${song.name} - ${artistValue}
            <button class="favorite-item-action favorite-item-action--add" type="button" data-favorite-action="add" data-index="${index}" title="添加到播放列表" aria-label="添加到播放列表">
                <i class="fas fa-plus"></i>
            </button>
            <button class="favorite-item-action favorite-item-action--download" type="button" data-favorite-action="download" data-index="${index}" title="下载" aria-label="下载">
                <i class="fas fa-download"></i>
            </button>
            <button class="favorite-item-action favorite-item-action--remove" type="button" data-favorite-action="remove" data-index="${index}" title="从收藏列表移除" aria-label="从收藏列表移除">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    }).join("");

    dom.favoriteItems.innerHTML = favoritesHtml;
    updateFavoriteHighlight();
    updateFavoriteIcons();
    updateFavoriteActionStates();
}

function updateFavoriteHighlight() {
    if (!dom.favoriteItems) {
        return;
    }
    const items = dom.favoriteItems.querySelectorAll(".playlist-item");
    items.forEach((item, index) => {
        const isCurrent = state.currentList === "favorite" && index === state.currentFavoriteIndex;
        item.classList.toggle("current", isCurrent);
        item.setAttribute("aria-current", isCurrent ? "true" : "false");
        item.setAttribute("aria-pressed", isCurrent ? "true" : "false");
    });
}

function removeFavoriteAtIndex(index) {
    const favorites = ensureFavoriteSongsArray();
    if (index < 0 || index >= favorites.length) {
        return null;
    }
    const [removed] = favorites.splice(index, 1);

    if (state.currentList === "favorite") {
        if (state.currentFavoriteIndex === index) {
            if (favorites.length === 0) {
                state.currentFavoriteIndex = 0;
                state.favoritePlaybackTime = 0;
                state.favoriteLastSavedPlaybackTime = 0;
                state.currentList = "playlist";
                state.currentPlaylist = "playlist";
                savePlayerState();
            } else if (state.currentFavoriteIndex >= favorites.length) {
                state.currentFavoriteIndex = favorites.length - 1;
            }
        } else if (state.currentFavoriteIndex > index) {
            state.currentFavoriteIndex--;
        }
    }

    saveFavoriteState();
    renderFavorites();
    updatePlayModeUI();
    clearLyricsIfLibraryEmpty();
    return removed;
}

function toggleFavorite(song) {
    if (!song || typeof song !== "object") {
        return;
    }

    const normalizedSong = sanitizeImportedSong(song) || { ...song };
    const key = getSongKey(normalizedSong);
    if (!key) {
        showNotification("无法收藏该歌曲", "error");
        return;
    }

    const favorites = ensureFavoriteSongsArray();
    const existingIndex = favorites.findIndex((item) => getSongKey(item) === key);

    if (existingIndex >= 0) {
        removeFavoriteAtIndex(existingIndex);
        showNotification("已从收藏列表移除", "success");
    } else {
        favorites.push(normalizedSong);
        saveFavoriteState();
        renderFavorites();
        showNotification("已添加到收藏列表", "success");
    }
}

async function playFavoriteSong(index) {
    const favorites = ensureFavoriteSongsArray();
    if (index < 0 || index >= favorites.length) {
        return;
    }

    const song = favorites[index];
    state.currentFavoriteIndex = index;
    state.currentList = "favorite";
    state.currentPlaylist = "favorites";

    try {
        await playSong(song);
        updateFavoriteHighlight();
        updatePlayModeUI();
        saveFavoriteState();
        if (isMobileView) {
            closeMobilePanel();
        }
    } catch (error) {
        console.error("播放收藏歌曲失败:", error);
        showNotification("播放收藏歌曲失败", "error");
    }
}

function addAllFavoritesToPlaylist() {
    const favorites = ensureFavoriteSongsArray();
    if (favorites.length === 0) {
        showNotification("收藏列表为空", "warning");
        return;
    }

    if (!Array.isArray(state.playlistSongs)) {
        state.playlistSongs = [];
    }

    const existingKeys = new Set(
        state.playlistSongs
            .map(getSongKey)
            .filter((key) => typeof key === "string" && key !== "")
    );

    let added = 0;
    let duplicates = 0;

    favorites.forEach((song) => {
        const key = getSongKey(song);
        if (key && existingKeys.has(key)) {
            duplicates++;
            return;
        }
        state.playlistSongs.push(song);
        if (key) {
            existingKeys.add(key);
        }
        added++;
    });

    if (added > 0) {
        renderPlaylist();
        const duplicateHint = duplicates > 0 ? `，${duplicates} 首已存在` : "";
        showNotification(`已添加 ${added} 首收藏歌曲到播放列表${duplicateHint}`, "success");
    } else {
        updatePlaylistActionStates();
        showNotification("收藏歌曲均已在播放列表中", "warning");
    }
}

function clearFavorites() {
    const favorites = ensureFavoriteSongsArray();
    if (favorites.length === 0) {
        showNotification("收藏列表为空", "warning");
        return;
    }

    if (!window.confirm("确定清空收藏列表吗？")) {
        return;
    }

    state.favoriteSongs = [];
    state.currentFavoriteIndex = 0;
    state.favoritePlaybackTime = 0;
    state.favoriteLastSavedPlaybackTime = 0;
    if (state.currentList === "favorite") {
        state.currentList = "playlist";
        state.currentPlaylist = "playlist";
    }
    saveFavoriteState();
    savePlayerState();
    renderFavorites();
    updateFavoriteIcons();
    updatePlayModeUI();
    showNotification("收藏列表已清空", "success");
    clearLyricsIfLibraryEmpty();
}

function exportFavorites() {
    const favorites = ensureFavoriteSongsArray();
    if (favorites.length === 0) {
        showNotification("收藏列表为空，无法导出", "warning");
        return;
    }

    try {
        const payload = {
            meta: {
                app: "Solara",
                version: FAVORITE_EXPORT_VERSION,
                exportedAt: new Date().toISOString(),
                itemCount: favorites.length,
                type: "favorites"
            },
            items: favorites
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const formattedTimestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `solara-favorites-${formattedTimestamp}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        showNotification(`已导出 ${favorites.length} 首收藏歌曲`, "success");
    } catch (error) {
        console.error("导出收藏列表失败:", error);
        showNotification("导出收藏列表失败", "error");
    }
}

function handleImportedFavoriteItems(rawItems) {
    const favorites = ensureFavoriteSongsArray();

    const sanitizedSongs = rawItems
        .map(sanitizeImportedSong)
        .filter((song) => song && typeof song === "object");

    if (sanitizedSongs.length === 0) {
        throw new Error("NO_VALID_SONGS");
    }

    const existingKeys = new Set(
        favorites
            .map(getSongKey)
            .filter((key) => typeof key === "string" && key !== "")
    );

    let added = 0;
    let duplicates = 0;

    sanitizedSongs.forEach((song) => {
        const key = getSongKey(song);
        if (key && existingKeys.has(key)) {
            duplicates++;
            return;
        }
        favorites.push(song);
        if (key) {
            existingKeys.add(key);
        }
        added++;
    });

    if (added > 0) {
        saveFavoriteState();
        renderFavorites();
    } else {
        updateFavoriteActionStates();
        updateFavoriteIcons();
    }

    return { added, duplicates };
}

function handleImportFavoritesChange(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const text = typeof reader.result === "string" ? reader.result : "";
            if (!text) {
                throw new Error("EMPTY_FILE");
            }

            const payload = parseJSON(text, null);
            if (!payload) {
                throw new Error("INVALID_JSON");
            }

            const meta = payload.meta || {};
            if (meta.version && Number(meta.version) > FAVORITE_EXPORT_VERSION) {
                console.warn("收藏列表文件版本较新，尝试兼容导入");
            }

            const items = Array.isArray(payload.items)
                ? payload.items
                : extractPlaylistItems(payload);

            if (!Array.isArray(items) || items.length === 0) {
                throw new Error("NO_SONGS");
            }

            const { added, duplicates } = handleImportedFavoriteItems(items);
            if (added > 0) {
                const duplicateHint = duplicates > 0 ? `，${duplicates} 首已存在` : "";
                showNotification(`成功导入 ${added} 首收藏歌曲${duplicateHint}`, "success");
            } else {
                showNotification("文件中的歌曲已在收藏列表中", "warning");
            }
        } catch (error) {
            console.error("导入收藏列表失败:", error);
            showNotification("导入收藏列表失败，请确认文件格式", "error");
        } finally {
            if (input) {
                input.value = "";
            }
        }
    };

    reader.onerror = () => {
        console.error("读取收藏列表文件失败:", reader.error);
        showNotification("无法读取收藏列表文件", "error");
        if (input) {
            input.value = "";
        }
    };

    reader.readAsText(file, "utf-8");
}

// 新增：清空播放列表
function clearPlaylist() {
    if (state.playlistSongs.length === 0) return;

    if (state.currentPlaylist === "playlist") {
        dom.audioPlayer.pause();
        dom.audioPlayer.src = "";
        state.currentTrackIndex = -1;
        state.currentSong = null;
        state.currentAudioUrl = null;
        state.currentPlaybackTime = 0;
        state.lastSavedPlaybackTime = 0;
        dom.progressBar.value = 0;
        dom.progressBar.max = 0;
        dom.currentTimeDisplay.textContent = "00:00";
        dom.durationDisplay.textContent = "00:00";
        updateProgressBarBackground(0, 1);
        dom.currentSongTitle.textContent = "选择一首歌曲开始播放";
        updateMobileToolbarTitle();
        dom.currentSongArtist.textContent = "未知艺术家";
        showAlbumCoverPlaceholder();
        clearLyricsContent();
        if (dom.lyrics) {
            dom.lyrics.dataset.placeholder = "default";
        }
        dom.lyrics.classList.add("empty");
        updatePlayPauseButton();
    }

    state.playlistSongs = [];
    dom.playlist.classList.add("empty");
    if (dom.playlistItems) {
        dom.playlistItems.innerHTML = "";
    }
    state.currentPlaylist = "playlist";
    updateMobileClearPlaylistVisibility();
    updatePlaylistActionStates();

    savePlayerState();
    showNotification("播放列表已清空", "success");
    clearLyricsIfLibraryEmpty();
}

// 新增：播放播放列表中的歌曲
async function playPlaylistSong(index) {
    if (index < 0 || index >= state.playlistSongs.length) return;

    const song = state.playlistSongs[index];
    state.currentTrackIndex = index;
    state.currentPlaylist = "playlist";
    state.currentList = "playlist";

    try {
        await playSong(song);
        updatePlaylistHighlight();
        updatePlayModeUI();
        if (isMobileView) {
            closeMobilePanel();
        }
    } catch (error) {
        console.error("播放失败:", error);
        showNotification("播放失败，请稍后重试", "error");
    }
}

// 新增：更新播放列表高亮
function updatePlaylistHighlight() {
    if (!dom.playlistItems) return;
    const playlistItems = dom.playlistItems.querySelectorAll(".playlist-item");
    playlistItems.forEach((item, index) => {
        const isCurrent = state.currentPlaylist === "playlist" && index === state.currentTrackIndex;
        item.classList.toggle("current", isCurrent);
        item.setAttribute("aria-current", isCurrent ? "true" : "false");
        item.setAttribute("aria-pressed", isCurrent ? "true" : "false");
    });
}

// ============================================================
// 最终核弹级修复：iOS PWA 锁屏播放函数 (v3.0 抢占式激活版)
// ============================================================
// ================================================
// iOS PWA 兼容版 playSong 函数
// ================================================
// ================================================ 
// 🎵 辅助模块：锁屏元数据 & 音频守护 
// ================================================ 

// 1. 锁屏元数据更新 
 



// ================================================
// iOS PWA 终极版 playSong (v7.4 Ghost Fix)
// 修复：锁屏切歌有进度无声音、按钮卡死
// ================================================


// 修复：播放歌曲函数 - 支持统一播放列表
function waitForAudioReady(player) {
    if (!player) return Promise.resolve();
    if (player.readyState >= 1) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const cleanup = () => {
            player.removeEventListener('loadedmetadata', onLoaded);
            player.removeEventListener('error', onError);
        };
        const onLoaded = () => {
            cleanup();
            resolve();
        };
        const onError = () => {
            cleanup();
            reject(new Error('音频加载失败'));
        };
        player.addEventListener('loadedmetadata', onLoaded, { once: true });
        player.addEventListener('error', onError, { once: true });
    });
}

function scheduleDeferredSongAssets(song, playPromise) {
    const run = () => {
        if (state.currentSong !== song) {
            return;
        }

        updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: true });
        loadLyrics(song);
        state.audioReadyForPalette = true;
        attemptPaletteApplication();
    };

    const kickoff = () => {
        if (state.currentSong !== song) {
            return;
        }

        if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(() => {
                if (state.currentSong !== song) {
                    return;
                }

                if (typeof window.requestIdleCallback === "function") {
                    window.requestIdleCallback(() => {
                        if (state.currentSong !== song) {
                            return;
                        }
                        run();
                    }, { timeout: 600 });
                } else {
                    run();
                }
            });
        } else {
            window.setTimeout(run, 0);
        }
    };

    if (playPromise && typeof playPromise.finally === "function") {
        playPromise.finally(kickoff);
    } else {
        kickoff();
    }
}

// 修复：自动播放下一首 (带状态重置)


// 修复：播放下一首 - 支持播放模式和统一播放列表
async function playNext() {
    if (state.currentList === "favorite") {
        const favorites = ensureFavoriteSongsArray();
        if (favorites.length === 0) {
            clearLyricsIfLibraryEmpty();
            return;
        }
        const mode = state.favoritePlayMode || "list";
        let nextIndex = state.currentFavoriteIndex;
        if (mode === "random") {
            nextIndex = Math.floor(Math.random() * favorites.length);
        } else if (mode === "list") {
            nextIndex = (state.currentFavoriteIndex + 1) % favorites.length;
        }
        if (mode !== "single") {
            state.currentFavoriteIndex = nextIndex;
        }
        return playFavoriteSong(state.currentFavoriteIndex);
    }

    let nextIndex = -1;
    let playlist = [];

    if (state.currentPlaylist === "playlist") {
        playlist = state.playlistSongs;
    } else if (state.currentPlaylist === "online") {
        playlist = state.onlineSongs;
    } else if (state.currentPlaylist === "search") {
        playlist = state.searchResults;
    }

    if (playlist.length === 0) {
        clearLyricsIfLibraryEmpty();
        return;
    }

    const mode = state.playMode || "list";
    if (mode === "random") {
        // 随机播放
        nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (mode === "list") {
        // 列表循环
        nextIndex = (state.currentTrackIndex + 1) % playlist.length;
    } else if (mode === "single") {
        nextIndex = state.currentTrackIndex >= 0 ? state.currentTrackIndex : 0;
    }

    if (mode !== "single") {
        state.currentTrackIndex = nextIndex;
    }

    const targetIndex = mode === "single" ? state.currentTrackIndex : nextIndex;

    if (state.currentPlaylist === "playlist") {
        return playPlaylistSong(targetIndex);
    } else if (state.currentPlaylist === "online") {
        return playOnlineSong(targetIndex);
    } else if (state.currentPlaylist === "search") {
        return playSearchResult(targetIndex);
    }
}

// 修复：播放上一首 - 支持播放模式和统一播放列表
async function playPrevious() {
    if (state.currentList === "favorite") {
        const favorites = ensureFavoriteSongsArray();
        if (favorites.length === 0) {
            return;
        }
        const mode = state.favoritePlayMode || "list";
        let prevIndex = state.currentFavoriteIndex;
        if (mode === "random") {
            prevIndex = Math.floor(Math.random() * favorites.length);
        } else if (mode === "list") {
            prevIndex = state.currentFavoriteIndex - 1;
            if (prevIndex < 0) {
                prevIndex = favorites.length - 1;
            }
        }
        if (mode !== "single") {
            state.currentFavoriteIndex = prevIndex;
        }
        return playFavoriteSong(state.currentFavoriteIndex);
    }

    let prevIndex = -1;
    let playlist = [];

    if (state.currentPlaylist === "playlist") {
        playlist = state.playlistSongs;
    } else if (state.currentPlaylist === "online") {
        playlist = state.onlineSongs;
    } else if (state.currentPlaylist === "search") {
        playlist = state.searchResults;
    }

    if (playlist.length === 0) return;

    const mode = state.playMode || "list";
    if (mode === "random") {
        // 随机播放
        prevIndex = Math.floor(Math.random() * playlist.length);
    } else if (mode === "list") {
        // 列表循环
        prevIndex = state.currentTrackIndex - 1;
        if (prevIndex < 0) prevIndex = playlist.length - 1;
    } else if (mode === "single") {
        prevIndex = state.currentTrackIndex >= 0 ? state.currentTrackIndex : 0;
    }

    if (mode !== "single") {
        state.currentTrackIndex = prevIndex;
    }

    const targetIndex = mode === "single" ? state.currentTrackIndex : prevIndex;

    if (state.currentPlaylist === "playlist") {
        return playPlaylistSong(targetIndex);
    } else if (state.currentPlaylist === "online") {
        return playOnlineSong(targetIndex);
    } else if (state.currentPlaylist === "search") {
        return playSearchResult(targetIndex);
    }
}

// 修复：在线音乐播放函数
async function playOnlineSong(index) {
    const song = state.onlineSongs[index];
    if (!song) return;

    state.currentTrackIndex = index;
    state.currentPlaylist = "online";
    state.currentList = "playlist";

    try {
        await playSong(song);
        updateOnlineHighlight();
        updatePlayModeUI();
    } catch (error) {
        console.error("播放失败:", error);
        showNotification("播放失败，请稍后重试", "error");
    }
}

// 修复：更新在线音乐高亮
function updateOnlineHighlight() {
    if (!dom.playlistItems) return;
    const playlistItems = dom.playlistItems.querySelectorAll(".playlist-item");
    playlistItems.forEach((item, index) => {
        if (state.currentPlaylist === "online" && index === state.currentTrackIndex) {
            item.classList.add("current");
        } else {
            item.classList.remove("current");
        }
    });
}

const EXPLORE_RADAR_GENRES = [
    "流行",
    "排行榜",
    "每日排行榜",
    "每日排行",
    "民谣",
];

function pickRandomExploreGenre() {
    if (!Array.isArray(EXPLORE_RADAR_GENRES) || EXPLORE_RADAR_GENRES.length === 0) {
        return "流行";
    }
    const index = Math.floor(Math.random() * EXPLORE_RADAR_GENRES.length);
    return EXPLORE_RADAR_GENRES[index];
}

const EXPLORE_RADAR_SOURCES = ["netease"];

function pickRandomExploreSource() {
    if (!Array.isArray(EXPLORE_RADAR_SOURCES) || EXPLORE_RADAR_SOURCES.length === 0) {
        return "netease";
    }
    const index = Math.floor(Math.random() * EXPLORE_RADAR_SOURCES.length);
    return EXPLORE_RADAR_SOURCES[index];
}

// 探索雷达：通过代理后端随机搜歌并刷新播放列表
async function exploreOnlineMusic() {
    const desktopButton = dom.loadOnlineBtn;
    const mobileButton = dom.mobileExploreButton;
    const btnText = desktopButton ? desktopButton.querySelector(".btn-text") : null;
    const loader = desktopButton ? desktopButton.querySelector(".loader") : null;

    const setLoadingState = (isLoading) => {
        if (desktopButton) {
            desktopButton.disabled = isLoading;
            desktopButton.classList.toggle("is-loading", Boolean(isLoading));
            if (btnText) {
                btnText.style.display = isLoading ? "none" : "";
            }
            if (loader) {
                loader.style.display = isLoading ? "inline-flex" : "none";
            }
        }
        if (mobileButton) {
            mobileButton.disabled = isLoading;
            mobileButton.setAttribute("aria-disabled", isLoading ? "true" : "false");
        }
    };

    try {
        setLoadingState(true);

        const randomGenre = pickRandomExploreGenre();
        const source = pickRandomExploreSource();
        const results = await API.search(randomGenre, source, 10, 1);

        if (!Array.isArray(results) || results.length === 0) {
            showNotification("探索雷达：未找到歌曲", "error");
            debugLog(`探索雷达未找到歌曲，关键词：${randomGenre}，音源：${source}`);
            return;
        }

        const normalizedSongs = results.map((song) => ({
            id: song.id,
            name: song.name,
            artist: Array.isArray(song.artist) ? song.artist.join(" / ") : (song.artist || "未知艺术家"),
            album: song.album || "",
            source: song.source || source,
            lyric_id: song.lyric_id || song.id,
            pic_id: song.pic_id || song.pic || "",
            url_id: song.url_id,
        }));

        const existingSongs = Array.isArray(state.playlistSongs) ? state.playlistSongs.slice() : [];
        const existingKeys = new Set(existingSongs
            .map((song) => getSongKey(song))
            .filter((key) => typeof key === "string" && key.length > 0));

        const appendedSongs = [];
        for (const song of normalizedSongs) {
            const key = getSongKey(song);
            if (key && existingKeys.has(key)) {
                continue;
            }
            appendedSongs.push(song);
            if (key) {
                existingKeys.add(key);
            }
        }

        if (appendedSongs.length === 0) {
            showNotification("探索雷达：本次未找到新的歌曲，当前列表已包含这些曲目", "info");
            debugLog(`探索雷达无新增歌曲，关键词：${randomGenre}`);
            return;
        }

        // 优化1：分批添加歌曲，减少UI阻塞
        const batchSize = 10;
        const totalAppended = appendedSongs.length;
        
        for (let i = 0; i < totalAppended; i += batchSize) {
            const batch = appendedSongs.slice(i, i + batchSize);
            state.playlistSongs = [...existingSongs, ...appendedSongs.slice(0, i + batchSize)];
            state.onlineSongs = state.playlistSongs.slice();
            state.currentPlaylist = "playlist";
            state.currentList = "playlist";
            
            // 渲染当前批次
            renderPlaylist();
            updatePlaylistHighlight();
            
            // 等待一小段时间，让UI有时间更新
            if (i + batchSize < totalAppended) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        showNotification(`探索雷达：新增${appendedSongs.length}首 ${randomGenre} 歌曲`);
        debugLog(`探索雷达加载成功，关键词：${randomGenre}，音源：${source}，新增歌曲数：${appendedSongs.length}`);

        const shouldAutoplay = existingSongs.length === 0 && state.playlistSongs.length > 0;
        if (shouldAutoplay) {
            // 优化2：预加载第一首歌的音频，减少播放延迟
            const firstSong = state.playlistSongs[0];
            if (firstSong) {
                // 直接播放，不再预加载，避免可能的abort错误
                await playPlaylistSong(0);
            }
        } else {
            savePlayerState();
        }
    } catch (error) {
        console.error("探索雷达错误:", error);
        showNotification("探索雷达获取失败，请稍后重试", "error");
    } finally {
        setLoadingState(false);
    }
}

// 修复：加载歌词
async function loadLyrics(song) {
    // 如果是隐身模式，跳过歌词加载
    if (shouldUseStealthMode() && !state.forceUIUpdate) {
        console.log('🔒 隐身模式：跳过歌词加载');
        return;
    }
    
    try {
        const lyricUrl = API.getLyric(song);
        debugLog(`获取歌词URL: ${lyricUrl}`);

        const lyricData = await API.fetchJson(lyricUrl);
        debugLog(`歌词API返回数据: ${JSON.stringify(lyricData).substring(0, 200)}...`);

        // 处理不同格式的歌词数据
        let lyricText = '';
        
        if (typeof lyricData === 'string') {
            // 如果直接返回字符串，可能就是歌词文本
            lyricText = lyricData;
        } else if (lyricData && lyricData.lyric) {
            // 标准格式：{ lyric: "歌词文本" }
            lyricText = lyricData.lyric;
        } else if (lyricData && lyricData.data && lyricData.data.lyric) {
            // 可能的格式：{ data: { lyric: "歌词文本" } }
            lyricText = lyricData.data.lyric;
        } else if (lyricData && lyricData.lrc && lyricData.lrc.lyric) {
            // 网易云音乐API格式
            lyricText = lyricData.lrc.lyric;
        } else if (lyricData && lyricData.content) {
            // 可能的格式：{ content: "歌词文本" }
            lyricText = lyricData.content;
        }
        
        if (lyricText && lyricText.trim()) {
            parseLyrics(lyricText.trim());
            dom.lyrics.classList.remove("empty");
            dom.lyrics.dataset.placeholder = "default";
            debugLog(`歌词加载成功: ${state.lyricsData.length} 行`);
        } else {
            setLyricsContentHtml("<div>暂无歌词</div>");
            dom.lyrics.classList.add("empty");
            dom.lyrics.dataset.placeholder = "message";
            state.lyricsData = [];
            state.currentLyricLine = -1;
            debugLog("歌词加载失败: 无歌词数据");
        }
    } catch (error) {
        console.error("加载歌词失败:", error);
        setLyricsContentHtml("<div>歌词加载失败</div>");
        dom.lyrics.classList.add("empty");
        dom.lyrics.dataset.placeholder = "message";
        state.lyricsData = [];
        state.currentLyricLine = -1;
        debugLog(`歌词加载失败: ${error}`);
    }
}

// 修复：解析歌词
function parseLyrics(lyricText) {
    const lines = lyricText.split('\n');
    const lyrics = [];

    lines.forEach(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = match[4].trim();

            if (text) {
                lyrics.push({ time, text });
            }
        }
    });

    state.lyricsData = lyrics.sort((a, b) => a.time - b.time);
    displayLyrics();
    debugLog(`解析歌词完成: ${state.lyricsData.length} 行`);
}

function setLyricsContentHtml(html) {
    if (dom.lyricsContent) {
        dom.lyricsContent.innerHTML = html;
    }
    if (dom.mobileInlineLyricsContent) {
        dom.mobileInlineLyricsContent.innerHTML = html;
    }
}

function clearLyricsContent() {
    setLyricsContentHtml("");
    state.lyricsData = [];
    state.currentLyricLine = -1;
    if (isMobileView) {
        closeMobileInlineLyrics({ force: true });
    }
}

function clearLyricsIfLibraryEmpty() {
    const playlistEmpty = !Array.isArray(state.playlistSongs) || state.playlistSongs.length === 0;
    const favoritesEmpty = !Array.isArray(state.favoriteSongs) || state.favoriteSongs.length === 0;
    if (!playlistEmpty || !favoritesEmpty) {
        return;
    }

    const player = dom.audioPlayer;
    const hasActiveAudio = Boolean(player && player.src && !player.ended && !player.paused);
    if (hasActiveAudio) {
        return;
    }

    clearLyricsContent();
    if (dom.lyrics) {
        dom.lyrics.classList.add("empty");
        dom.lyrics.dataset.placeholder = "default";
    }
}

// 修复：显示歌词
function displayLyrics() {
    const lyricsHtml = state.lyricsData.map((lyric, index) =>
        `<div data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`
    ).join("");
    setLyricsContentHtml(lyricsHtml);
    if (dom.lyrics) {
        dom.lyrics.dataset.placeholder = "default";
    }
    if (state.isMobileInlineLyricsOpen) {
        syncLyrics();
    }
}

// 修复：同步歌词
function syncLyrics() {
    if (state.lyricsData.length === 0) return;

    const currentTime = dom.audioPlayer.currentTime;
    let currentIndex = -1;
    // 歌词提前0.5秒聚焦
    const advanceTime = 0.5;

    for (let i = 0; i < state.lyricsData.length; i++) {
        if (currentTime + advanceTime >= state.lyricsData[i].time) {
            currentIndex = i;
        } else {
            break;
        }
    }

    if (currentIndex !== state.currentLyricLine) {
        state.currentLyricLine = currentIndex;

        const lyricTargets = [];
        if (dom.lyricsContent) {
            lyricTargets.push({
                elements: dom.lyricsContent.querySelectorAll("div[data-index]"),
                container: dom.lyricsScroll || dom.lyrics,
            });
        }
        if (dom.mobileInlineLyricsContent) {
            lyricTargets.push({
                elements: dom.mobileInlineLyricsContent.querySelectorAll("div[data-index]"),
                container: dom.mobileInlineLyricsScroll || dom.mobileInlineLyrics,
                inline: true,
            });
        }

        lyricTargets.forEach(({ elements, container, inline }) => {
            elements.forEach((element, index) => {
                if (index === currentIndex) {
                    element.classList.add("current");
                    const shouldScroll = !state.userScrolledLyrics && (!inline || state.isMobileInlineLyricsOpen);
                    if (shouldScroll) {
                        scrollToCurrentLyric(element, container);
                    }
                } else {
                    element.classList.remove("current");
                }
            });
        });
    }
}

// 新增：滚动到当前歌词 - 修复居中显示问题
function scrollToCurrentLyric(element, containerOverride) {
    const container = containerOverride || dom.lyricsScroll || dom.lyrics;
    if (!container || !element) {
        return;
    }
    const containerHeight = container.clientHeight;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 计算元素在容器内部的可视位置，避免受到 offsetParent 影响
    const elementOffsetTop = elementRect.top - containerRect.top + container.scrollTop;
    const elementHeight = elementRect.height;

    // 目标滚动位置：让当前歌词的中心与容器中心对齐
    const targetScrollTop = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);

    const maxScrollTop = container.scrollHeight - containerHeight;
    const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

    if (Math.abs(container.scrollTop - finalScrollTop) > 1) {
        if (typeof container.scrollTo === "function") {
            container.scrollTo({
                top: finalScrollTop,
                behavior: 'smooth'
            });
        } else {
            container.scrollTop = finalScrollTop;
        }
    }

}

// 修复：下载歌曲 - 使用Blob URL，确保触发下载而非新窗口播放
// ============================================================
// 最终稳妥版下载函数：直链跳转 (放弃重命名，保证成功率)
// ============================================================
async function downloadSong(song) {
    try {
        const quality = state.playbackQuality || '320';
        showNotification(`正在获取 ${song.name} 下载地址...`, 'info');

        // 1. 获取链接
        const downloadUrl = API.getSongUrl(song, quality);
        if (!downloadUrl) {
            throw new Error('无法获取链接');
        }

        // 2. 简单的跳转下载
        // 既然 JS 没法重命名，就不搞那些花里胡哨的 Blob 了，直接让浏览器打开
        
        // 创建一个临时链接
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank'; // 新窗口打开，这是最不容易被拦截的方式
        
        // 哪怕浏览器忽略，我们也试着写一下，万一有些旧浏览器支持呢
        link.download = `${song.artist} - ${song.name}.mp3`;
        
        // 3. 触发
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('已弹出下载窗口 (如果变成了播放，请按 Ctrl+S 保存)', 'success');

    } catch (error) {
        console.error('下载出错:', error);
        showNotification('获取下载地址失败', 'error');
    }
}

// 修复：移动端视图切换
function switchMobileView(view) {
    if (view === "playlist") {
        if (dom.showPlaylistBtn) {
            dom.showPlaylistBtn.classList.add("active");
        }
        if (dom.showLyricsBtn) {
            dom.showLyricsBtn.classList.remove("active");
        }
        dom.playlist.classList.add("active");
        dom.lyrics.classList.remove("active");
    } else if (view === "lyrics") {
        if (dom.showLyricsBtn) {
            dom.showLyricsBtn.classList.add("active");
        }
        if (dom.showPlaylistBtn) {
            dom.showPlaylistBtn.classList.remove("active");
        }
        dom.lyrics.classList.add("active");
        dom.playlist.classList.remove("active");
    }
    if (isMobileView && document.body) {
        document.body.setAttribute("data-mobile-panel-view", view);
        updateMobileClearPlaylistVisibility();
    }
}

// 修复：显示通知
function showNotification(message, type = "success") {
    const notification = dom.notification;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// 
========================================================================== 
// 🚀 v13.0 终极核心模块 (Flash Mode + UI Fix) - Final Clean 
// ========================================================================== 

// 1. ⚡ 闪电刷新：解锁瞬间修复 UI 
function performInstantUIRefresh() { 
    console.log('⚡ 闪电侠模式：界面复活'); 
    requestAnimationFrame(() => { 
        try { 
            // 补全欠下的 UI 更新 
            if (state.pendingUpdates && state.pendingUpdates.song) { 
                const { song, needsArtwork, needsBackground, needsLyrics } = state.pendingUpdates; 
                
                // 瞬间恢复文字 
                if (dom.currentSongTitle) dom.currentSongTitle.textContent = song.name; 
                const artistText = Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || '未知'); 
                if (dom.currentSongArtist) dom.currentSongArtist.textContent = artistText; 
                
                // 延迟恢复图片（防止卡顿） 
                if (needsArtwork) { 
                    setTimeout(() => updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: needsBackground }), 50); 
                } 
                if (needsLyrics) { 
                    setTimeout(() => loadLyrics(song), 200); 
                } 
                state.pendingUpdates = null; 
            } 
            
            // 恢复媒体会话 
            if ('mediaSession' in navigator && state.currentSong) { 
                setTimeout(() => { 
                    try { 
                        let artworkUrl = API.getPicUrl(state.currentSong); 
                        if (!artworkUrl.startsWith('http')) artworkUrl = new URL(artworkUrl, window.location.origin).href; 
                        
                        navigator.mediaSession.metadata = new MediaMetadata({ 
                            title: state.currentSong.name, 
                            artist: Array.isArray(state.currentSong.artist) ? state.currentSong.artist.join(', ') : '未知', 
                            album: state.currentSong.album || '', 
                            artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }] 
                        }); 
                        setupMediaSessionControls(); 
                    } catch (e) {} 
                }, 300); 
            } 
            
            updatePlayPauseButton(); 
            if (typeof setupLoopStrategy === 'function') setupLoopStrategy(); 
            
        } catch (e) { console.error('闪电刷新异常:', e); } 
    }); 
} 

// 2. 🧠 智能管家：只负责解锁检测 
class SmartAudioContextManager { 
    constructor() { 
        this.isLocked = false; 
        this.unlockTime = 0; 
        this.init(); 
    } 
    
    init() { 
        // 监听解锁 
        document.addEventListener('visibilitychange', () => { 
            const isNowLocked = document.visibilityState === 'hidden'; 
            if (this.isLocked && !isNowLocked) { 
                // 刚才锁屏，现在解锁了 -> 执行闪电刷新 
                this.unlockTime = Date.now(); 
                console.log('🔓 屏幕解锁 -> 闪电刷新'); 
                performInstantUIRefresh(); 
                this.checkZombie(); 
            } else if (isNowLocked) { 
                // 刚锁屏 -> 开启 Loop 保活 
                if (typeof setupLoopStrategy === 'function') setupLoopStrategy(); 
            } 
            this.isLocked = isNowLocked; 
        }); 
        
        // 点击恢复（最后防线） 
        document.addEventListener('click', () => { 
              const player = dom.audioPlayer; 
              // 如果显示在播但实际停了，点一下就重置 
              if (state.isPlaying && player.paused && !this.isLocked) { 
                  player.play().catch(() => this.rebuild()); 
              } 
        }, true); 
    } 
    
    checkZombie() { 
        // 解锁后 0.8秒 检查一下是不是假死 
        setTimeout(() => { 
            const player = dom.audioPlayer; 
            const isZombie = state.isPlaying && (player.paused || player.readyState === 0) && player.src && !player.ended; 
            if (isZombie) { 
                console.warn('🧟‍♂️ 发现僵尸 -> 重建节点'); 
                player.play().catch(() => this.rebuild()); 
            } 
        }, 800); 
    } 
    
    rebuild() { 
        console.log('🔨 重建音频节点'); 
        const oldP = dom.audioPlayer; 
        const newP = oldP.cloneNode(true); 
        oldP.parentNode.replaceChild(newP, oldP); 
        dom.audioPlayer = newP; 
        bindAudioPlayerEvents(newP); 
        setTimeout(() => newP.play().catch(() => {}), 100); 
    } 
} 
const audioManager = new SmartAudioContextManager(); 

// 3. 🎵 新版播放函数 (自动分流) 
async function playSong(song, options = {}) { 
    // 如果锁屏，走极简模式；如果解锁，走正常模式 
    if (document.visibilityState === 'hidden') return await playSongLockScreen(song, options); 
    else return await playSongNormal(song, options); 
} 

// 🔒 锁屏模式：只换链接，不修图，不更新UI 
async function playSongLockScreen(song, options = {}) { 
    console.log('🔒 锁屏播放'); 
    try { 
        const player = dom.audioPlayer; 
        const quality = state.playbackQuality || '320'; 
        let url = API.getSongUrl(song, quality); 
        if (!url.startsWith('http')) url = new URL(url, window.location.origin).href; 
        
        // 加个时间戳，防止缓存死锁 
        player.src = `${url.split('?')[0]}?_lock=${Date.now()}`; 
        player.load(); 
        
        // 开启 Loop 保活 
        if (typeof setupLoopStrategy === 'function') setupLoopStrategy(); 
        
        state.currentSong = song; 
        
        // 极简媒体会话 (只发文字，不发图片，省内存) 
        if ('mediaSession' in navigator) { 
            try { 
                navigator.mediaSession.metadata = new MediaMetadata({ 
                    title: song.name, 
                    artist: Array.isArray(song.artist) ? song.artist.join(', ') : '未知', 
                    album: song.album || '', 
                    artwork: [{ src: window.location.origin + '/favicon.png', sizes: '512x512', type: 'image/png' }] 
                }); 
                navigator.mediaSession.playbackState = 'playing'; 
            } catch(e) {} 
        } 
        
        if (options.autoplay !== false) { 
            player.play().catch(() => {}); 
            state.isPlaying = true; 
        } 
        
        // 🔥 写欠条：记下这首歌，等解锁了再刷新封面 
        state.pendingUpdates = { 
            type: 'song', song: song, timestamp: Date.now(), 
            needsArtwork: true, needsBackground: true, needsLyrics: true 
        }; 
        return true; 
    } catch (e) { return false; } 
} 

// 📱 正常模式：完整流程 
async function playSongNormal(song, options = {}) { 
    console.log('📱 正常播放'); 
    const { autoplay = true, startTime = 0 } = options; 
    try { 
        const player = dom.audioPlayer; 
        state.isPlaying = false; 
        
        const quality = state.playbackQuality || '320'; 
        let url = API.getSongUrl(song, quality); 
        if (!url.startsWith('http')) url = new URL(url, window.location.origin).href; 
        
        player.src = `${url.split('?')[0]}?_=${Date.now()}`; 
        player.removeAttribute('crossOrigin'); 
        player.preload = 'auto'; 
        player.muted = false; 
        
        if (typeof setupLoopStrategy === 'function') setupLoopStrategy(); 
        
        // 立即更新 UI 
        state.currentSong = song; 
        if (dom.currentSongTitle) dom.currentSongTitle.textContent = song.name; 
        if (dom.currentSongArtist) dom.currentSongArtist.textContent = Array.isArray(song.artist) ? song.artist.join(', ') : '未知'; 
        
        if (autoplay) { 
            // 用 Promise 等待就绪，比 setTimeout 稳 
            const safePlay = async () => { 
                try { 
                    await new Promise((resolve) => { 
                        if (player.readyState >= 2) { resolve(); return; } 
                        const t = setTimeout(() => resolve(), 3000); 
                        player.addEventListener('canplay', () => { clearTimeout(t); resolve(); }, { once: true }); 
                    }); 
                    if (startTime > 0) player.currentTime = startTime; 
                    await player.play(); 
                    state.isPlaying = true; 
                    updatePlayPauseButton(); 
                } catch (e) { if (state.isPlaying) { state.isPlaying = false; updatePlayPauseButton(); } } 
            }; 
            safePlay(); 
        } 
        
        // 完整媒体会话 
        if ('mediaSession' in navigator) { 
            setTimeout(() => { 
                try { 
                    navigator.mediaSession.metadata = new MediaMetadata({ 
                        title: song.name, artist: Array.isArray(song.artist) ? song.artist.join(', ') : '未知', album: song.album || '' 
                    }); 
                    navigator.mediaSession.playbackState = 'playing'; 
                } catch(e){} 
            }, 500); 
        } 
        
        // 加载图片和歌词 
        setTimeout(() => { 
            if (state.currentSong === song) { 
                loadLyrics(song); 
                updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: true }); 
            } 
        }, 1000); 
        savePlayerState(); 
        return true; 
    } catch (e) { return false; } 
} 

async function autoPlayNext() { 
    // 锁屏切歌稍微慢一点，给硬件缓冲 
    const delay = document.visibilityState === 'hidden' ? 300 : 0; 
    setTimeout(() => { if (typeof playNext === 'function') playNext(); }, delay); 
    updatePlayPauseButton(); 
} 

// 4. 🛠️ 辅助函数库 
function setupMediaSessionControls() { 
    if (!('mediaSession' in navigator)) return; 
    try { 
        navigator.mediaSession.setActionHandler('play', () => dom.audioPlayer.play()); 
        navigator.mediaSession.setActionHandler('pause', () => dom.audioPlayer.pause()); 
        navigator.mediaSession.setActionHandler('previoustrack', () => typeof playPrevious === 'function' && playPrevious()); 
        navigator.mediaSession.setActionHandler('nexttrack', () => typeof playNext === 'function' && playNext()); 
        ['seekbackward', 'seekforward', 'seekto'].forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch(e){} }); 
    } catch(e) {} 
} 

function setupLoopStrategy() { 
    const player = dom.audioPlayer; 
    if (!player) return; 
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); 
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone; 
    // 只有 iOS PWA 锁屏时才 Loop 保活 
    if (isIOS && isPWA && document.visibilityState === 'hidden') player.loop = true; 
    else player.loop = false; 
} 

function bindAudioPlayerEvents(player) { 
    player.onplay = null; player.onpause = null; player.ontimeupdate = null; player.onloadedmetadata = null; player.onvolumechange = null; player.onended = null; 
    player.addEventListener('play', () => { state.isPlaying = true; updatePlayPauseButton(); }); 
    player.addEventListener('pause', () => { state.isPlaying = false; updatePlayPauseButton(); }); 
    if (typeof handleTimeUpdate === 'function') player.addEventListener('timeupdate', handleTimeUpdate); 
    player.addEventListener('loadedmetadata', handleLoadedMetadata); 
    player.addEventListener('volumechange', onAudioVolumeChange); 
    player.addEventListener('ended', () => { if (typeof autoPlayNext === 'function') setTimeout(autoPlayNext, 300); }); 
} 

// ================================================ 
// 🚀 UI 优化 & 初始化：移除加载遮罩 (实现秒开) 
// ================================================ 
function removeLoadingMask() { 
    const mask = document.getElementById('app-loading-mask'); 
    if (mask) { 
        mask.classList.add('loaded'); // 触发CSS淡出 
        mask.style.pointerEvents = 'none'; // 确保点击穿透 
        setTimeout(() => { 
            if (mask.parentNode) mask.parentNode.removeChild(mask); 
        }, 600); 
    } 
} 

// 💀 清理旧 SW 
async function exterminateServiceWorkers() { 
    if (!('serviceWorker' in navigator)) return; 
    try { 
        const regs = await navigator.serviceWorker.getRegistrations(); 
        if (regs.length > 0) { 
            console.log('🧹 清理旧 SW'); 
            await Promise.all(regs.map(r => r.unregister())); 
        } 
    } catch (e) {} 
} 

// 🔥 最终入口 
document.addEventListener('DOMContentLoaded', () => { 
    // 1. 清理 
    exterminateServiceWorkers(); 
    
    // 2. 初始化播放器 
    const player = dom.audioPlayer; 
    if (player) { 
        player.removeAttribute('crossOrigin'); 
        player.preload = "none"; 
        player.setAttribute('playsinline', ''); 
        player.setAttribute('webkit-playsinline', ''); 
        
        // 绑定事件 (v13.0) 
        bindAudioPlayerEvents(player); 
        
        // 交互解锁 
        const enableAutoplay = () => { 
            player.autoplay = true; 
            document.removeEventListener('click', enableAutoplay); 
            document.removeEventListener('touchstart', enableAutoplay); 
        }; 
        document.addEventListener('click', enableAutoplay); 
        document.addEventListener('touchstart', enableAutoplay); 
    } 
    
    // 3. 延迟初始化媒体控制 
    setTimeout(setupMediaSessionControls, 1000); 
    
    // 4. 🚀 关键：移除遮罩，展示界面 
    setTimeout(removeLoadingMask, 100); 
});

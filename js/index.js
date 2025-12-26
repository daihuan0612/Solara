// ================================================
// Solara 音乐播放器 - 完整重构版 v1.0
// 修复了所有已知问题，结构清晰，易于维护
// ================================================

// ================================================
// 1. DOM元素引用
// ================================================
const dom = {
    // 主容器
    container: document.getElementById("mainContainer"),
    
    // 背景层
    backgroundStage: document.getElementById("backgroundStage"),
    backgroundBaseLayer: document.getElementById("backgroundBaseLayer"),
    backgroundTransitionLayer: document.getElementById("backgroundTransitionLayer"),
    
    // 播放列表和收藏
    playlist: document.getElementById("playlist"),
    playlistItems: document.getElementById("playlistItems"),
    favorites: document.getElementById("favorites"),
    favoriteItems: document.getElementById("favoriteItems"),
    
    // 歌词显示
    lyrics: document.getElementById("lyrics"),
    lyricsScroll: document.getElementById("lyricsScroll"),
    lyricsContent: document.getElementById("lyricsContent"),
    
    // 移动端歌词
    mobileInlineLyrics: document.getElementById("mobileInlineLyrics"),
    mobileInlineLyricsScroll: document.getElementById("mobileInlineLyricsScroll"),
    mobileInlineLyricsContent: document.getElementById("mobileInlineLyricsContent"),
    
    // 音频播放器
    audioPlayer: document.getElementById("audioPlayer"),
    
    // 主题和UI控制
    themeToggleButton: document.getElementById("themeToggleButton"),
    loadOnlineBtn: document.getElementById("loadOnlineBtn"),
    showPlaylistBtn: document.getElementById("showPlaylistBtn"),
    showLyricsBtn: document.getElementById("showLyricsBtn"),
    
    // 搜索相关
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    sourceSelectButton: document.getElementById("sourceSelectButton"),
    sourceSelectLabel: document.getElementById("sourceSelectLabel"),
    sourceMenu: document.getElementById("sourceMenu"),
    searchResults: document.getElementById("searchResults"),
    searchResultsList: document.getElementById("searchResultsList"),
    
    // 通知
    notification: document.getElementById("notification"),
    
    // 当前歌曲信息
    albumCover: document.getElementById("albumCover"),
    currentSongTitle: document.getElementById("currentSongTitle"),
    currentSongArtist: document.getElementById("currentSongArtist"),
    currentFavoriteToggle: document.getElementById("currentFavoriteToggle"),
    
    // 调试信息
    debugInfo: document.getElementById("debugInfo"),
    
    // 导入导出
    importSelectedBtn: document.getElementById("importSelectedBtn"),
    importSelectedCount: document.getElementById("importSelectedCount"),
    importSelectedMenu: document.getElementById("importSelectedMenu"),
    importToPlaylist: document.getElementById("importToPlaylist"),
    importToFavorites: document.getElementById("importToFavorites"),
    importPlaylistBtn: document.getElementById("importPlaylistBtn"),
    exportPlaylistBtn: document.getElementById("exportPlaylistBtn"),
    importPlaylistInput: document.getElementById("importPlaylistInput"),
    clearPlaylistBtn: document.getElementById("clearPlaylistBtn"),
    
    // 移动端控制
    mobileImportPlaylistBtn: document.getElementById("mobileImportPlaylistBtn"),
    mobileExportPlaylistBtn: document.getElementById("mobileExportPlaylistBtn"),
    playModeBtn: document.getElementById("playModeBtn"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    
    // 播放器控制
    progressBar: document.getElementById("progressBar"),
    currentTimeDisplay: document.getElementById("currentTimeDisplay"),
    durationDisplay: document.getElementById("durationDisplay"),
    volumeSlider: document.getElementById("volumeSlider"),
    volumeIcon: document.getElementById("volumeIcon"),
    
    // 音质选择
    qualityToggle: document.getElementById("qualityToggle"),
    playerQualityMenu: document.getElementById("playerQualityMenu"),
    qualityLabel: document.getElementById("qualityLabel"),
    
    // 移动端工具栏
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
    
    // 其他控制
    shuffleToggleBtn: document.getElementById("shuffleToggleBtn"),
    searchArea: document.getElementById("searchArea"),
    libraryTabs: Array.from(document.querySelectorAll(".playlist-tab[data-target]")),
    addAllFavoritesBtn: document.getElementById("addAllFavoritesBtn"),
    importFavoritesBtn: document.getElementById("importFavoritesBtn"),
    exportFavoritesBtn: document.getElementById("exportFavoritesBtn"),
    importFavoritesInput: document.getElementById("importFavoritesInput"),
    clearFavoritesBtn: document.getElementById("clearFavoritesBtn"),
};
window.SolaraDom = dom;

// ================================================
// 2. 环境检测和移动端桥接
// ================================================
const isMobileView = Boolean(window.__SOLARA_IS_MOBILE);

const mobileBridge = window.SolaraMobileBridge || {
    handlers: {},
    queue: []
};
window.SolaraMobileBridge = mobileBridge;

function invokeMobileHook(name, ...args) {
    if (!isMobileView) return undefined;
    const handler = mobileBridge.handlers[name];
    if (typeof handler === "function") {
        return handler(...args);
    }
    mobileBridge.queue.push({ name, args });
    return undefined;
}

// ================================================
// 3. 状态管理
// ================================================
const state = {
    // 播放列表
    playlistSongs: [],
    onlineSongs: [],
    searchResults: [],
    
    // 收藏
    favoriteSongs: [],
    currentFavoriteIndex: 0,
    
    // 当前播放
    currentTrackIndex: -1,
    currentSong: null,
    currentAudioUrl: null,
    currentArtworkUrl: null,
    currentPlaylist: "playlist", // 'online', 'search', 'playlist', 'favorites'
    currentList: "playlist", // 'playlist' or 'favorite'
    
    // 播放状态
    isPlaying: false,
    playbackQuality: "mp3",
    volume: 0.8,
    currentPlaybackTime: 0,
    lastSavedPlaybackTime: 0,
    pendingSeekTime: null,
    isSeeking: false,
    
    // 播放模式
    playMode: "list", // 'list', 'single', 'random'
    playlistLastNonRandomMode: "list",
    favoritePlayMode: "list",
    favoriteLastNonRandomMode: "list",
    favoritePlaybackTime: 0,
    favoriteLastSavedPlaybackTime: 0,
    
    // 搜索状态
    searchKeyword: "",
    searchSource: "netease",
    searchPage: 1,
    hasMoreResults: true,
    renderedSearchCount: 0,
    isSearchMode: false,
    selectedSearchResults: new Set(),
    
    // UI状态
    qualityMenuOpen: false,
    sourceMenuOpen: false,
    userScrolledLyrics: false,
    lyricsScrollTimeout: null,
    isMobileInlineLyricsOpen: false,
    
    // 主题和背景
    themeDefaultsCaptured: false,
    dynamicPalette: null,
    currentPaletteImage: null,
    currentGradient: '',
    pendingPaletteData: null,
    pendingPaletteImage: null,
    pendingPaletteImmediate: false,
    pendingPaletteReady: false,
    audioReadyForPalette: true,
    
    // 调试
    debugMode: false,
    
    // iOS PWA 锁屏修复
    pendingUpdates: null,
    needUpdateOnUnlock: false,
    pendingStealthUpdate: null,
    forceUIUpdate: false,
};

// ================================================
// 4. 配置和常量
// ================================================
const API = {
    baseUrl: "https://music-dl.sayqz.com",
    
    fetchJson: async (url, options = {}) => {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: { "Accept": "application/json", ...options.headers },
                    ...options,
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            } catch (error) {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    throw error;
                }
            }
        }
    },
    
    search: async (keyword, source = "netease", count = 20, page = 1) => {
        const url = `${API.baseUrl}/api/?source=${source}&type=search&keyword=${encodeURIComponent(keyword)}&limit=${count}`;
        
        try {
            const data = await API.fetchJson(url);
            
            if (!data || data.code !== 200 || !Array.isArray(data.data.results)) {
                throw new Error("搜索结果格式错误");
            }

            return data.data.results.map(song => ({
                id: song.id,
                name: song.name,
                artist: song.artist,
                album: song.album,
                source: song.platform || source,
                pic_id: song.id,
                url_id: song.id,
                lyric_id: song.id,
            }));
        } catch (error) {
            console.error("搜索失败:", error);
            throw error;
        }
    },
    
    getSongUrl: (song, quality = "320") => {
        const qualityMap = {
            "128": "128k",
            "192": "192k",
            "320": "320k",
            "999": "flac"
        };
        
        if (quality === "mp3") quality = "320";
        const validQuality = quality in qualityMap ? quality : "320";
        const br = qualityMap[validQuality];
        
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=url&br=${br}`;
    },
    
    getLyric: (song) => {
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=lrc`;
    },
    
    getPicUrl: (song) => {
        return `${API.baseUrl}/api/?source=${song.source || "netease"}&id=${song.id}&type=pic`;
    },
};

// 音源选项
const SOURCE_OPTIONS = [
    { value: "netease", label: "网易云音乐" },
    { value: "kuwo", label: "酷我音乐" },
    { value: "qq", label: "QQ音乐" }
];

// 音质选项
const QUALITY_OPTIONS = [
    { value: "mp3", label: "MP3音质", description: "自动选择" },
    { value: "999", label: "无损音质", description: "FLAC" }
];

// ================================================
// 5. 工具函数
// ================================================
function debugLog(message) {
    if (state.debugMode) {
        console.log(`[DEBUG] ${message}`);
        if (dom.debugInfo) {
            const entry = document.createElement("div");
            entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
            dom.debugInfo.appendChild(entry);
            
            while (dom.debugInfo.childNodes.length > 50) {
                dom.debugInfo.removeChild(dom.debugInfo.firstChild);
            }
            
            dom.debugInfo.classList.add("show");
            dom.debugInfo.scrollTop = dom.debugInfo.scrollHeight;
        }
    }
}

function showNotification(message, type = "success") {
    if (!dom.notification) return;
    
    dom.notification.textContent = message;
    dom.notification.className = `notification ${type}`;
    dom.notification.classList.add("show");

    setTimeout(() => {
        dom.notification.classList.remove("show");
    }, 3000);
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

function safeGetLocalStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn(`读取本地存储失败: ${key}`, error);
        return null;
    }
}

function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn(`写入本地存储失败: ${key}`, error);
    }
}

function parseJSON(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn("解析JSON失败", error);
        return fallback;
    }
}

// ================================================
// 6. 音频播放器核心
// ================================================
function initializeAudioPlayer() {
    const player = dom.audioPlayer;
    if (!player) return;
    
    // 绑定事件
    player.addEventListener('timeupdate', handleTimeUpdate);
    player.addEventListener('loadedmetadata', handleLoadedMetadata);
    player.addEventListener('volumechange', handleVolumeChange);
    player.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayPauseButton();
    });
    player.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayPauseButton();
    });
    player.addEventListener('ended', handleAudioEnded);
    
    // 设置初始音量
    player.volume = state.volume;
    dom.volumeSlider.value = state.volume;
    updateVolumeSliderBackground(state.volume);
    updateVolumeIcon(state.volume);
}

function handleTimeUpdate() {
    const currentTime = dom.audioPlayer.currentTime || 0;
    
    if (!state.isSeeking) {
        dom.progressBar.value = currentTime;
        dom.currentTimeDisplay.textContent = formatTime(currentTime);
        updateProgressBarBackground(currentTime, Number(dom.progressBar.max));
    }
    
    syncLyrics();
    
    // 保存播放进度
    if (state.currentList === "favorite") {
        state.favoritePlaybackTime = currentTime;
    } else {
        state.currentPlaybackTime = currentTime;
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

function handleVolumeChange() {
    const volume = dom.audioPlayer.volume;
    state.volume = volume;
    dom.volumeSlider.value = volume;
    updateVolumeSliderBackground(volume);
    updateVolumeIcon(volume);
    safeSetLocalStorage("playerVolume", String(volume));
}

function handleAudioEnded() {
    // 自动播放下一首
    setTimeout(() => {
        if (typeof autoPlayNext === "function") {
            autoPlayNext();
        }
    }, 300);
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
    if (clamped === 0) icon = "fa-volume-xmark";
    else if (clamped < 0.4) icon = "fa-volume-low";
    dom.volumeIcon.className = `fas ${icon}`;
}

// ================================================
// 7. 播放控制
// ================================================
async function playSong(song, options = {}) {
    const { autoplay = true, startTime = 0 } = options;
    
    if (!song) {
        showNotification("没有可播放的歌曲", "error");
        return false;
    }
    
    try {
        const player = dom.audioPlayer;
        const quality = state.playbackQuality || "320";
        const url = API.getSongUrl(song, quality);
        
        // 检查是否为隐身模式
        const isStealth = shouldUseStealthMode();
        
        if (isStealth) {
            // 隐身模式：极简处理
            player.src = url;
            if (autoplay) {
                player.play().catch(console.error);
                state.isPlaying = true;
            }
            state.currentSong = song;
            savePlayerState();
            return true;
        }
        
        // 正常模式：完整处理
        player.src = url;
        player.load();
        
        // 更新UI
        state.currentSong = song;
        updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: true });
        
        if (autoplay) {
            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    state.isPlaying = true;
                    if (startTime > 0) {
                        player.currentTime = startTime;
                    }
                }).catch(error => {
                    console.error("播放失败:", error);
                    state.isPlaying = false;
                });
            }
        }
        
        updatePlayPauseButton();
        updateMediaMetadata(song);
        loadLyrics(song);
        savePlayerState();
        
        return true;
    } catch (error) {
        console.error("播放歌曲失败:", error);
        showNotification("播放失败，请稍后重试", "error");
        return false;
    }
}

async function togglePlayPause() {
    if (!state.currentSong) {
        // 如果没有当前歌曲，尝试播放播放列表第一首
        if (state.playlistSongs.length > 0) {
            await playPlaylistSong(0);
        } else {
            showNotification("没有可播放的歌曲", "error");
        }
        return;
    }
    
    const player = dom.audioPlayer;
    if (player.paused) {
        state.isPlaying = true;
        player.play().catch(error => {
            console.error("播放失败:", error);
            state.isPlaying = false;
        });
    } else {
        state.isPlaying = false;
        player.pause();
    }
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    if (!dom.playPauseBtn) return;
    const isPlaying = state.isPlaying;
    dom.playPauseBtn.innerHTML = `<i class="fas ${isPlaying ? "fa-pause" : "fa-play"}"></i>`;
    dom.playPauseBtn.title = isPlaying ? "暂停" : "播放";
    if (document.body) {
        document.body.classList.toggle("is-playing", isPlaying);
    }
}

// ================================================
// 8. 播放列表管理
// ================================================
function renderPlaylist() {
    if (!dom.playlistItems) return;
    
    if (state.playlistSongs.length === 0) {
        dom.playlist.classList.add("empty");
        dom.playlistItems.innerHTML = "";
        return;
    }
    
    dom.playlist.classList.remove("empty");
    const playlistHtml = state.playlistSongs.map((song, index) => {
        const artistValue = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : (song.artist || "未知艺术家");
        const isCurrent = state.currentPlaylist === "playlist" && index === state.currentTrackIndex;
        
        return `
        <div class="playlist-item ${isCurrent ? "current" : ""}" 
             data-index="${index}" 
             role="button" 
             tabindex="0" 
             aria-label="播放 ${song.name}">
            ${song.name} - ${artistValue}
            <button class="playlist-item-favorite action-btn favorite favorite-toggle" 
                    type="button" 
                    data-playlist-action="favorite" 
                    data-index="${index}" 
                    title="收藏">
                <i class="fa-regular fa-heart"></i>
            </button>
            <button class="playlist-item-download" 
                    type="button" 
                    data-playlist-action="download" 
                    data-index="${index}" 
                    title="下载">
                <i class="fas fa-download"></i>
            </button>
            <button class="playlist-item-remove" 
                    type="button" 
                    data-playlist-action="remove" 
                    data-index="${index}" 
                    title="从播放列表移除">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    }).join("");
    
    dom.playlistItems.innerHTML = playlistHtml;
    updateFavoriteIcons();
}

async function playPlaylistSong(index) {
    if (index < 0 || index >= state.playlistSongs.length) return;
    
    const song = state.playlistSongs[index];
    state.currentTrackIndex = index;
    state.currentPlaylist = "playlist";
    state.currentList = "playlist";
    
    try {
        await playSong(song);
        renderPlaylist();
    } catch (error) {
        console.error("播放失败:", error);
        showNotification("播放失败，请稍后重试", "error");
    }
}

function addSongToPlaylist(song) {
    if (!song || typeof song !== "object") return false;
    
    if (!Array.isArray(state.playlistSongs)) {
        state.playlistSongs = [];
    }
    
    // 检查是否已存在
    const key = getSongKey(song);
    const exists = state.playlistSongs.some(item => getSongKey(item) === key);
    
    if (exists) {
        showNotification("歌曲已在播放列表中", "warning");
        return false;
    }
    
    state.playlistSongs.push(song);
    renderPlaylist();
    showNotification("已添加到播放列表", "success");
    return true;
}

function removeFromPlaylist(index) {
    if (index < 0 || index >= state.playlistSongs.length) return;
    
    const removingCurrent = state.currentPlaylist === "playlist" && state.currentTrackIndex === index;
    
    state.playlistSongs.splice(index, 1);
    
    if (removingCurrent) {
        if (state.playlistSongs.length === 0) {
            // 播放列表为空
            dom.audioPlayer.pause();
            dom.audioPlayer.src = "";
            state.currentTrackIndex = -1;
            state.currentSong = null;
            updateCurrentSongInfo(null, { loadArtwork: false });
        } else if (index < state.playlistSongs.length) {
            // 播放下一首
            playPlaylistSong(index);
        } else {
            // 播放最后一首
            playPlaylistSong(state.playlistSongs.length - 1);
        }
    } else if (state.currentTrackIndex > index) {
        state.currentTrackIndex--;
    }
    
    renderPlaylist();
    savePlayerState();
}

function clearPlaylist() {
    if (state.playlistSongs.length === 0) {
        showNotification("播放列表已是空的", "warning");
        return;
    }
    
    if (!window.confirm("确定要清空播放列表吗？")) {
        return;
    }
    
    state.playlistSongs = [];
    dom.audioPlayer.pause();
    dom.audioPlayer.src = "";
    state.currentTrackIndex = -1;
    state.currentSong = null;
    state.currentPlaylist = "playlist";
    
    renderPlaylist();
    updateCurrentSongInfo(null, { loadArtwork: false });
    showNotification("播放列表已清空", "success");
}

// ================================================
// 9. 收藏管理
// ================================================
function ensureFavoriteSongsArray() {
    if (!Array.isArray(state.favoriteSongs)) {
        state.favoriteSongs = [];
    }
    return state.favoriteSongs;
}

function isSongFavorited(song) {
    const key = getSongKey(song);
    if (!key) return false;
    return ensureFavoriteSongsArray().some(item => getSongKey(item) === key);
}

function toggleFavorite(song) {
    if (!song || typeof song !== "object") return;
    
    const favorites = ensureFavoriteSongsArray();
    const key = getSongKey(song);
    
    if (!key) {
        showNotification("无法收藏该歌曲", "error");
        return;
    }
    
    const existingIndex = favorites.findIndex(item => getSongKey(item) === key);
    
    if (existingIndex >= 0) {
        // 取消收藏
        favorites.splice(existingIndex, 1);
        showNotification("已从收藏列表移除", "success");
    } else {
        // 添加收藏
        favorites.push(song);
        showNotification("已添加到收藏列表", "success");
    }
    
    saveFavoriteState();
    renderFavorites();
    updateFavoriteIcons();
}

function renderFavorites() {
    if (!dom.favoriteItems) return;
    
    const favorites = ensureFavoriteSongsArray();
    
    if (favorites.length === 0) {
        dom.favorites.classList.add("empty");
        dom.favoriteItems.innerHTML = "";
        return;
    }
    
    dom.favorites.classList.remove("empty");
    const favoritesHtml = favorites.map((song, index) => {
        const artistValue = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : (song.artist || "未知艺术家");
        const isCurrent = state.currentList === "favorite" && index === state.currentFavoriteIndex;
        
        return `
        <div class="playlist-item ${isCurrent ? "current" : ""}" 
             data-index="${index}" 
             role="button" 
             tabindex="0" 
             aria-label="播放 ${song.name}">
            ${song.name} - ${artistValue}
            <button class="favorite-item-action favorite-item-action--add" 
                    type="button" 
                    data-favorite-action="add" 
                    data-index="${index}" 
                    title="添加到播放列表">
                <i class="fas fa-plus"></i>
            </button>
            <button class="favorite-item-action favorite-item-action--download" 
                    type="button" 
                    data-favorite-action="download" 
                    data-index="${index}" 
                    title="下载">
                <i class="fas fa-download"></i>
            </button>
            <button class="favorite-item-action favorite-item-action--remove" 
                    type="button" 
                    data-favorite-action="remove" 
                    data-index="${index}" 
                    title="从收藏列表移除">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    }).join("");
    
    dom.favoriteItems.innerHTML = favoritesHtml;
}

function updateFavoriteIcons() {
    const favorites = ensureFavoriteSongsArray();
    const favoriteKeys = new Set(favorites.map(getSongKey).filter(key => key));
    
    // 更新所有收藏按钮
    document.querySelectorAll('.favorite-toggle').forEach(button => {
        const key = button.dataset.favoriteKey;
        const isActive = key && favoriteKeys.has(key);
        button.classList.toggle('is-active', isActive);
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isActive ? 'fas fa-heart' : 'far fa-heart';
        }
        button.title = isActive ? '取消收藏' : '收藏';
    });
    
    // 更新当前歌曲收藏按钮
    if (dom.currentFavoriteToggle && state.currentSong) {
        const key = getSongKey(state.currentSong);
        const isActive = key && favoriteKeys.has(key);
        dom.currentFavoriteToggle.classList.toggle('is-active', isActive);
        const icon = dom.currentFavoriteToggle.querySelector('i');
        if (icon) {
            icon.className = isActive ? 'fas fa-heart' : 'far fa-heart';
        }
        dom.currentFavoriteToggle.title = isActive ? '取消收藏当前歌曲' : '收藏当前歌曲';
    }
}

// ================================================
// 10. 搜索功能
// ================================================
async function performSearch(isLiveSearch = false) {
    const query = dom.searchInput.value.trim();
    if (!query) {
        showNotification("请输入搜索关键词", "error");
        return;
    }
    
    try {
        dom.searchBtn.disabled = true;
        dom.searchBtn.innerHTML = '<span class="loader"></span><span>搜索中...</span>';
        
        const source = state.searchSource || "netease";
        const results = await API.search(query, source, 20, state.searchPage);
        
        if (state.searchPage === 1) {
            state.searchResults = results;
        } else {
            state.searchResults = [...state.searchResults, ...results];
        }
        
        state.hasMoreResults = results.length === 20;
        state.searchKeyword = query;
        
        displaySearchResults(results, { reset: state.searchPage === 1 });
        
        if (results.length === 0) {
            showNotification("未找到相关歌曲", "error");
        }
    } catch (error) {
        console.error("搜索失败:", error);
        showNotification("搜索失败，请稍后重试", "error");
    } finally {
        dom.searchBtn.disabled = false;
        dom.searchBtn.innerHTML = '<i class="fas fa-search"></i><span>搜索</span>';
    }
}

function displaySearchResults(newItems, options = {}) {
    const container = dom.searchResultsList || dom.searchResults;
    if (!container) return;
    
    const { reset = false } = options;
    
    if (reset) {
        container.innerHTML = "";
        state.renderedSearchCount = 0;
        state.selectedSearchResults.clear();
    }
    
    // 移除旧的"加载更多"按钮
    const existingLoadMore = container.querySelector("#loadMoreBtn");
    if (existingLoadMore) existingLoadMore.remove();
    
    // 添加新结果
    const fragment = document.createDocumentFragment();
    const startIndex = state.renderedSearchCount;
    
    newItems.forEach((song, offset) => {
        const index = startIndex + offset;
        const item = createSearchResultItem(song, index);
        fragment.appendChild(item);
    });
    
    container.appendChild(fragment);
    state.renderedSearchCount += newItems.length;
    
    // 如果有更多结果，添加"加载更多"按钮
    if (state.hasMoreResults) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.id = "loadMoreBtn";
        loadMoreBtn.className = "load-more-btn";
        loadMoreBtn.type = "button";
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i><span>加载更多</span>';
        loadMoreBtn.addEventListener("click", loadMoreResults);
        container.appendChild(loadMoreBtn);
    }
    
    updateFavoriteIcons();
}

function createSearchResultItem(song, index) {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.dataset.index = index;
    
    item.innerHTML = `
        <div class="search-result-info">
            <div class="search-result-title">${song.name || "未知歌曲"}</div>
            <div class="search-result-artist">
                ${Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || "未知艺术家")}
            </div>
        </div>
        <div class="search-result-actions">
            <button class="action-btn favorite favorite-toggle" 
                    type="button" 
                    title="收藏">
                <i class="far fa-heart"></i>
            </button>
            <button class="action-btn play" 
                    type="button" 
                    title="播放">
                <i class="fas fa-play"></i>
            </button>
            <button class="action-btn download" 
                    type="button" 
                    title="下载">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `;
    
    // 添加事件监听
    const favoriteBtn = item.querySelector('.favorite');
    const playBtn = item.querySelector('.play');
    const downloadBtn = item.querySelector('.download');
    
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(song);
    });
    
    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSearchResult(index);
    });
    
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadSong(song);
    });
    
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.search-result-actions')) {
            addSongToPlaylist(song);
        }
    });
    
    return item;
}

async function playSearchResult(index) {
    const song = state.searchResults[index];
    if (!song) return;
    
    // 添加到播放列表
    addSongToPlaylist(song);
    
    // 播放歌曲
    const playlistIndex = state.playlistSongs.length - 1;
    await playPlaylistSong(playlistIndex);
}

// ================================================
// 11. 媒体会话和锁屏控制
// ================================================
function updateMediaMetadata(song) {
    if (!('mediaSession' in navigator)) return;
    
    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name || "未知歌曲",
            artist: Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || "未知艺术家"),
            album: song.album || "",
            artwork: [{
                src: state.currentArtworkUrl || window.location.origin + '/favicon.png',
                sizes: '512x512',
                type: 'image/png'
            }]
        });
        
        // 设置播放控制
        navigator.mediaSession.setActionHandler('play', () => {
            dom.audioPlayer.play().catch(console.error);
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            dom.audioPlayer.pause();
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (typeof playPrevious === "function") {
                playPrevious();
            }
        });
        
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (typeof playNext === "function") {
                playNext();
            }
        });
        
    } catch (error) {
        console.warn("设置媒体会话失败:", error);
    }
}

// iOS PWA 锁屏检测
function shouldUseStealthMode() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone;
    const isLocked = document.visibilityState === 'hidden';
    
    return isIOS && isPWA && isLocked;
}

// ================================================
// 12. 歌词功能
// ================================================
async function loadLyrics(song) {
    if (!song) return;
    
    try {
        const lyricUrl = API.getLyric(song);
        const lyricData = await API.fetchJson(lyricUrl);
        
        let lyricText = '';
        if (typeof lyricData === 'string') {
            lyricText = lyricData;
        } else if (lyricData && lyricData.lyric) {
            lyricText = lyricData.lyric;
        } else if (lyricData && lyricData.data && lyricData.data.lyric) {
            lyricText = lyricData.data.lyric;
        }
        
        if (lyricText && lyricText.trim()) {
            parseLyrics(lyricText.trim());
        } else {
            setLyricsContentHtml("<div>暂无歌词</div>");
            dom.lyrics.classList.add("empty");
            state.lyricsData = [];
        }
    } catch (error) {
        console.error("加载歌词失败:", error);
        setLyricsContentHtml("<div>歌词加载失败</div>");
        dom.lyrics.classList.add("empty");
        state.lyricsData = [];
    }
}

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
}

function displayLyrics() {
    const lyricsHtml = state.lyricsData.map((lyric, index) =>
        `<div data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`
    ).join("");
    
    setLyricsContentHtml(lyricsHtml);
    dom.lyrics.dataset.placeholder = "default";
}

function setLyricsContentHtml(html) {
    if (dom.lyricsContent) {
        dom.lyricsContent.innerHTML = html;
    }
    if (dom.mobileInlineLyricsContent) {
        dom.mobileInlineLyricsContent.innerHTML = html;
    }
}

function syncLyrics() {
    if (state.lyricsData.length === 0) return;
    
    const currentTime = dom.audioPlayer.currentTime;
    let currentIndex = -1;
    
    for (let i = 0; i < state.lyricsData.length; i++) {
        if (currentTime >= state.lyricsData[i].time) {
            currentIndex = i;
        } else {
            break;
        }
    }
    
    if (currentIndex !== state.currentLyricLine) {
        state.currentLyricLine = currentIndex;
        
        // 更新桌面端歌词
        if (dom.lyricsContent) {
            const elements = dom.lyricsContent.querySelectorAll("div[data-index]");
            elements.forEach((element, index) => {
                element.classList.toggle("current", index === currentIndex);
            });
            
            // 滚动到当前歌词
            if (!state.userScrolledLyrics && currentIndex >= 0) {
                const currentElement = elements[currentIndex];
                if (currentElement) {
                    scrollToCurrentLyric(currentElement, dom.lyricsScroll || dom.lyrics);
                }
            }
        }
    }
}

function scrollToCurrentLyric(element, container) {
    if (!container || !element) return;
    
    const containerHeight = container.clientHeight;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const elementOffsetTop = elementRect.top - containerRect.top + container.scrollTop;
    const elementHeight = elementRect.height;
    
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

// ================================================
// 13. 当前歌曲信息更新
// ================================================
function updateCurrentSongInfo(song, options = {}) {
    const { loadArtwork = true, updateBackground = true } = options;
    
    if (!song) {
        // 清空显示
        dom.currentSongTitle.textContent = "选择一首歌曲开始播放";
        dom.currentSongArtist.textContent = "未知艺术家";
        dom.albumCover.innerHTML = '<div class="placeholder"><i class="fas fa-music"></i></div>';
        dom.albumCover.classList.remove("loading");
        return Promise.resolve();
    }
    
    // 更新文字信息
    state.currentSong = song;
    dom.currentSongTitle.textContent = song.name;
    
    const artistText = Array.isArray(song.artist) 
        ? song.artist.join(', ') 
        : (song.artist || '未知艺术家');
    dom.currentSongArtist.textContent = artistText;
    
    // 更新收藏按钮
    updateFavoriteIcons();
    
    // 更新移动端标题
    if (typeof updateMobileToolbarTitle === "function") {
        updateMobileToolbarTitle();
    }
    
    // 加载专辑封面
    if (loadArtwork && (song.pic_id || song.id)) {
        dom.albumCover.classList.add("loading");
        const picUrl = API.getPicUrl(song);
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            if (state.currentSong === song) {
                const absoluteImageUrl = toAbsoluteUrl(picUrl);
                state.currentArtworkUrl = absoluteImageUrl;
                dom.albumCover.innerHTML = `<img src="${picUrl}" alt="专辑封面">`;
                dom.albumCover.classList.remove("loading");
                
                // 更新媒体会话
                updateMediaMetadata(song);
            }
        };
        
        img.onerror = () => {
            if (state.currentSong === song) {
                dom.albumCover.innerHTML = '<div class="placeholder"><i class="fas fa-music"></i></div>';
                dom.albumCover.classList.remove("loading");
                state.currentArtworkUrl = null;
            }
        };
        
        img.src = picUrl;
    }
    
    return Promise.resolve();
}

// ================================================
// 14. 辅助函数
// ================================================
function getSongKey(song) {
    if (!song || typeof song !== "object") return null;
    
    const source = song.source || "netease";
    const id = song.id || song.songId || song.mid;
    
    if (id) {
        return `${source}:${id}`;
    }
    
    const name = song.name || "";
    const artist = Array.isArray(song.artist) 
        ? song.artist.join(',') 
        : (song.artist || "");
    
    return `${source}:${name}::${artist}`;
}

function toAbsoluteUrl(url) {
    if (!url) return "";
    try {
        const absolute = new URL(url, window.location.href);
        return absolute.href;
    } catch (_) {
        return url;
    }
}

// ================================================
// 15. 初始化和事件绑定
// ================================================
function initializeApp() {
    // 初始化音频播放器
    initializeAudioPlayer();
    
    // 加载保存的状态
    loadSavedState();
    
    // 绑定事件
    bindEvents();
    
    // 初始化UI
    updatePlayPauseButton();
    renderPlaylist();
    renderFavorites();
    updateFavoriteIcons();
    
    // 检查是否有需要恢复的歌曲
    if (state.currentSong) {
        updateCurrentSongInfo(state.currentSong, { loadArtwork: true });
        if (dom.audioPlayer.src) {
            dom.audioPlayer.play().catch(console.error);
        }
    }
}

function loadSavedState() {
    // 加载播放列表
    const savedPlaylist = parseJSON(safeGetLocalStorage("playlistSongs"), []);
    state.playlistSongs = Array.isArray(savedPlaylist) ? savedPlaylist : [];
    
    // 加载收藏
    const savedFavorites = parseJSON(safeGetLocalStorage("favoriteSongs"), []);
    state.favoriteSongs = Array.isArray(savedFavorites) ? savedFavorites : [];
    
    // 加载当前歌曲
    const savedCurrentSong = parseJSON(safeGetLocalStorage("currentSong"), null);
    if (savedCurrentSong) {
        state.currentSong = savedCurrentSong;
        state.currentPlaybackTime = parseFloat(safeGetLocalStorage("currentPlaybackTime") || "0");
    }
    
    // 加载播放模式
    state.playMode = safeGetLocalStorage("playMode") || "list";
    
    // 加载音质设置
    state.playbackQuality = safeGetLocalStorage("playbackQuality") || "mp3";
    
    // 加载音量
    const savedVolume = parseFloat(safeGetLocalStorage("playerVolume") || "0.8");
    state.volume = Math.min(Math.max(savedVolume, 0), 1);
}

function savePlayerState() {
    safeSetLocalStorage("playlistSongs", JSON.stringify(state.playlistSongs));
    safeSetLocalStorage("currentTrackIndex", String(state.currentTrackIndex));
    safeSetLocalStorage("playMode", state.playMode);
    safeSetLocalStorage("playbackQuality", state.playbackQuality);
    safeSetLocalStorage("playerVolume", String(state.volume));
    
    if (state.currentSong) {
        safeSetLocalStorage("currentSong", JSON.stringify(state.currentSong));
        safeSetLocalStorage("currentPlaybackTime", String(state.currentPlaybackTime || 0));
    }
}

function saveFavoriteState() {
    safeSetLocalStorage("favoriteSongs", JSON.stringify(state.favoriteSongs));
    safeSetLocalStorage("currentFavoriteIndex", String(state.currentFavoriteIndex));
    safeSetLocalStorage("favoritePlayMode", state.favoritePlayMode);
    safeSetLocalStorage("favoritePlaybackTime", String(state.favoritePlaybackTime || 0));
}

function bindEvents() {
    // 播放/暂停按钮
    if (dom.playPauseBtn) {
        dom.playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    // 进度条
    if (dom.progressBar) {
        dom.progressBar.addEventListener('input', (e) => {
            state.isSeeking = true;
            const value = Number(e.target.value);
            dom.currentTimeDisplay.textContent = formatTime(value);
            updateProgressBarBackground(value, Number(dom.progressBar.max));
        });
        
        dom.progressBar.addEventListener('change', (e) => {
            state.isSeeking = false;
            const value = Number(e.target.value);
            dom.audioPlayer.currentTime = value;
        });
    }
    
    // 音量控制
    if (dom.volumeSlider) {
        dom.volumeSlider.addEventListener('input', (e) => {
            const volume = Number(e.target.value);
            dom.audioPlayer.volume = volume;
            state.volume = volume;
            updateVolumeSliderBackground(volume);
            updateVolumeIcon(volume);
        });
    }
    
    // 搜索按钮
    if (dom.searchBtn) {
        dom.searchBtn.addEventListener('click', () => performSearch(false));
    }
    
    // 搜索输入框
    if (dom.searchInput) {
        dom.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(false);
            }
        });
    }
    
    // 清空播放列表
    if (dom.clearPlaylistBtn) {
        dom.clearPlaylistBtn.addEventListener('click', clearPlaylist);
    }
    
    // 下载按钮
    document.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('[data-playlist-action="download"]');
        if (downloadBtn) {
            const index = parseInt(downloadBtn.dataset.index);
            const song = state.playlistSongs[index];
            if (song) {
                downloadSong(song);
            }
        }
    });
    
    // 收藏按钮
    document.addEventListener('click', (e) => {
        const favoriteBtn = e.target.closest('[data-playlist-action="favorite"]');
        if (favoriteBtn) {
            const index = parseInt(favoriteBtn.dataset.index);
            const song = state.playlistSongs[index];
            if (song) {
                toggleFavorite(song);
            }
        }
    });
    
    // 移除按钮
    document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-playlist-action="remove"]');
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index);
            removeFromPlaylist(index);
        }
    });
    
    // 播放列表项目点击
    if (dom.playlistItems) {
        dom.playlistItems.addEventListener('click', (e) => {
            const playlistItem = e.target.closest('.playlist-item');
            if (playlistItem && !e.target.closest('button')) {
                const index = parseInt(playlistItem.dataset.index);
                playPlaylistSong(index);
            }
        });
    }
}

// ================================================
// 16. 全局函数暴露
// ================================================
window.playPrevious = async function() {
    if (state.currentList === "favorite") {
        const favorites = ensureFavoriteSongsArray();
        if (favorites.length === 0) return;
        
        let prevIndex = state.currentFavoriteIndex - 1;
        if (prevIndex < 0) prevIndex = favorites.length - 1;
        
        state.currentFavoriteIndex = prevIndex;
        await playSong(favorites[prevIndex]);
    } else {
        let prevIndex = state.currentTrackIndex - 1;
        if (prevIndex < 0) prevIndex = state.playlistSongs.length - 1;
        
        state.currentTrackIndex = prevIndex;
        await playPlaylistSong(prevIndex);
    }
};

window.playNext = async function() {
    if (state.currentList === "favorite") {
        const favorites = ensureFavoriteSongsArray();
        if (favorites.length === 0) return;
        
        let nextIndex = state.currentFavoriteIndex + 1;
        if (nextIndex >= favorites.length) nextIndex = 0;
        
        state.currentFavoriteIndex = nextIndex;
        await playSong(favorites[nextIndex]);
    } else {
        let nextIndex = state.currentTrackIndex + 1;
        if (nextIndex >= state.playlistSongs.length) nextIndex = 0;
        
        state.currentTrackIndex = nextIndex;
        await playPlaylistSong(nextIndex);
    }
};

window.autoPlayNext = function() {
    window.playNext().catch(console.error);
};

// ================================================
// 17. 启动应用
// ================================================
document.addEventListener('DOMContentLoaded', initializeApp);

// 调试模式开关
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        state.debugMode = !state.debugMode;
        if (state.debugMode) {
            console.log('调试模式已启用');
        } else {
            console.log('调试模式已禁用');
        }
    }
});

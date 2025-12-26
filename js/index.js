// 修复：自动播放下一首 (移除会导致中断的 skip 标记判断)
function autoPlayNext() {
    // 移除之前的 __solaraMediaSessionHandledEnded 判断
    // 那个标记会导致第二首歌播放结束后，逻辑被错误拦截
    
    const mode = getActivePlayMode();
    if (mode === "single") {
        // 单曲循环：重置进度并播放
        if (dom.audioPlayer) {
            dom.audioPlayer.currentTime = 0;
            dom.audioPlayer.play().catch(console.warn);
        }
        return;
    }

    // 正常切歌
    console.log('🔄 自动播放下一首...');
    playNext();
    updatePlayPauseButton();
}
// ================================================ 
// 🎵 辅助模块：锁屏元数据 & 音频守护 (v7.3 Final) 
// ================================================ 

// 1. 锁屏元数据更�?(修复封面不显�? 
function updateMediaMetadataForLockScreen(song) { 
    if (!('mediaSession' in navigator)) return; 
    try { 
        let coverUrl = ''; 
        if (song.pic_id || song.id) { 
            coverUrl = API.getPicUrl(song); 
            if (coverUrl.startsWith('http://')) coverUrl = coverUrl.replace('http://', 'https://'); 
        } 
        if (!coverUrl) coverUrl = window.location.origin + '/favicon.png'; 
        
        const artistName = Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || '未知艺术家'); 
        
        navigator.mediaSession.metadata = new MediaMetadata({ 
            title: song.name || '未知歌曲', 
            artist: artistName, 
            album: song.album || '', 
            artwork: [ 
                { src: coverUrl, sizes: '512x512', type: 'image/png' }, 
                { src: coverUrl, sizes: '256x256', type: 'image/png' }, 
                { src: coverUrl, sizes: '128x128', type: 'image/png' } 
            ] 
        }); 
    } catch (e) { console.warn('锁屏元数据更新轻微错误', e); } 
} 

// 2. 音频守护进程 (修复切歌断连 & 静音键问�? 
(function() { 
    if (!window.solaraAudioGuard) { 
        window.solaraAudioGuard = { 
            isActive: false, 
            audioCtx: null, 
            osc: null, 
            start: function() { 
                if (this.isActive) return; 
                try { 
                    const AC = window.AudioContext || window.webkitAudioContext; 
                    if (!AC) return; 
                    this.audioCtx = new AC(); 
                    this.osc = this.audioCtx.createOscillator(); 
                    const gain = this.audioCtx.createGain(); 
                    this.osc.type = 'sine'; 
                    this.osc.frequency.value = 1; // 1Hz 人耳听不见 
                    gain.gain.value = 0.001; // 极低音量 
                    this.osc.connect(gain); 
                    gain.connect(this.audioCtx.destination); 
                    this.osc.start(); 
                    this.isActive = true; 
                    console.log('🛡�?守护启动 (占位)'); 
                } catch (e) { console.error('守护启动失败:', e); } 
            }, 
            stop: function() { 
                if (!this.isActive) return; 
                try { 
                    if (this.osc) { this.osc.stop(); this.osc.disconnect(); } 
                    if (this.audioCtx) { this.audioCtx.close(); } 
                    this.isActive = false; 
                    console.log('🛡�?守护停止 (释放通道)'); 
                } catch (e) { console.error('守护停止失败:', e); } 
            } 
        }; 
    } 
})(); 

// ================================================ 
// iOS PWA 终极�?playSong (v7.3 Sound Fix) 
// 修复：秒开、保活、锁屏、静音键免疫 
// ================================================ 
async function playSong(song, options = {}) { 
    const { autoplay = true, startTime = 0, preserveProgress = false } = options; 
    
    // 环境检�?
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); 
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone === true); 
    const isIOSPWA = isIOS && isPWA; 
    const isLockScreen = document.visibilityState === 'hidden'; 
    
    console.log(`🎵 准备播放: ${song.name}`); 

    try { 
        if (state._isPlayingSong) return false; 
        state._isPlayingSong = true; 
        state.currentSong = song; 
        const player = dom.audioPlayer; 

        // 1. 启动守护 (填补切歌间隙) 
        if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.start(); 

        // 2. 抢占锁屏 
        updateMediaMetadataForLockScreen(song); 

        // 3. 暂停并保留音�?
        let safeVolume = player.volume; 
        if (!safeVolume || safeVolume < 0.1) safeVolume = 1.0; 
        
        if (!player.paused) { 
            player.pause(); 
            await new Promise(r => setTimeout(r, 50)); 
        } 

        // 4. 构建防缓�?URL (秒开核心) 
        const quality = state.playbackQuality || '320'; 
        let rawUrl = API.getSongUrl(song, quality); 
        if (!rawUrl.startsWith('http')) rawUrl = new URL(rawUrl, window.location.origin).href; 
        const separator = rawUrl.includes('?') ? '&' : '?'; 
        const streamUrl = `${rawUrl}${separator}_t=${Date.now()}_r=${Math.random().toString(36).substr(2,5)}`; 
        console.log('🚀 音频直连:', streamUrl); 

        // 5. 柔性切�?(Soft Switch) 
        player.removeAttribute('crossOrigin'); 
        player.setAttribute('playsinline', ''); 
        player.setAttribute('webkit-playsinline', ''); 
        
        player.src = streamUrl; 
        state.currentAudioUrl = streamUrl; 
        
        // ⚡️ 预先解除静音 
        player.muted = false; 
        player.volume = safeVolume; 
        
        player.preload = 'auto'; 
        player.load(); 

        // 6. 等待加载 
        await new Promise((resolve) => { 
            let resolved = false; 
            const timer = setTimeout(() => { if(!resolved) { resolved=true; resolve(); } }, 5000); 
            const done = () => { if(!resolved) { resolved=true; clearTimeout(timer); resolve(); } }; 
            player.addEventListener('canplay', done, { once: true }); 
            player.addEventListener('error', done, { once: true }); 
        }); 

        // 7. 恢复进度 
        let targetTime = startTime; 
        if (preserveProgress) { 
            targetTime = state.currentList === "favorite" ? state.favoritePlaybackTime : state.currentPlaybackTime; 
        } 
        if (targetTime > 0) player.currentTime = targetTime; 

        // 8. UI 更新 (带淡入淡出优�? 
        if (isIOSPWA && isLockScreen) { 
            state.needUpdateOnUnlock = true; 
        } else { 
            // 给封面添�?loading 类，触发 CSS 变淡效果 (需配合 CSS) 
            if (dom.albumCover) dom.albumCover.classList.add('loading'); 
            
            setTimeout(() => { 
                updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: true, immediate: true }); 
                // 稍微延迟移除 loading �?
                setTimeout(() => { if (dom.albumCover) dom.albumCover.classList.remove('loading'); }, 300); 
            }, 150); 
        } 

        // 9. 播放逻辑 
        if (autoplay) { 
            state.isPlaying = true; 
            updatePlayPauseButton(); 
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; 

            await new Promise(r => setTimeout(r, 100)); 

            try { 
                await player.play(); 
                console.log('�?播放成功'); 

                // ⚡️⚡️ [核心修复] 强制开�?⚡️⚡️ 
                player.muted = false; 
                player.volume = safeVolume; 
                
                // ⚡️⚡️ [核心修复] 停止守护，免疫静音键 ⚡️⚡️ 
                if (isIOSPWA && window.solaraAudioGuard) { 
                    window.solaraAudioGuard.stop(); 
                    console.log('🛑 守护停止，音频通道已接管'); 
                } 
                
                setTimeout(() => updateMediaMetadataForLockScreen(song), 500); 

            } catch (error) { 
                console.warn('⚠️ 播放受阻，尝试强力修复', error.message); 
                try { 
                    player.muted = true; 
                    await player.play(); 
                    setTimeout(() => { 
                        player.muted = false; 
                        player.volume = safeVolume; 
                        console.log('🔊 强力修复成功'); 
                    }, 200); 
                } catch (e) { 
                    console.error('�?播放失败:', e); 
                    state.isPlaying = false; 
                    updatePlayPauseButton(); 
                    if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
                } 
            } 
        } else { 
            state.isPlaying = false; 
            updatePlayPauseButton(); 
            if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
        } 

        savePlayerState(); 
        setTimeout(() => loadLyrics(song), 1000); 
        return true; 

    } catch (error) { 
        console.error("异常:", error); 
        state.isPlaying = false; 
        updatePlayPauseButton(); 
        if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
        return false; 
    } finally { 
        state._isPlayingSong = false; 
    } 
} 

// ... 这里的其他辅助函�?playNext/playPrevious 保持不变�?
// ... 如果你删除了它们，请记得补回来，或者只替换 playSong 本身�?
// ... (为了安全起见，建议保留你原文件里�?playNext/playPrevious 等逻辑，只替换 playSong) 

// ================================================ 
// 💀 启动清理 & 初始�?(解决卡顿和布局挤压) 
// ================================================ 
async function exterminateServiceWorkers() { 
    if (!('serviceWorker' in navigator)) return; 
    try { 
        const regs = await navigator.serviceWorker.getRegistrations(); 
        if (regs.length > 0) { 
            console.warn(`⚠️ 清除 ${regs.length} 个僵尸SW`); 
            await Promise.all(regs.map(r => r.unregister())); 
        } 
        if ('caches' in window) { 
            const keys = await caches.keys(); 
            for (const k of keys) { 
                if (k.includes('sw') || k.includes('workbox') || k.includes('precache')) await caches.delete(k); 
            } 
        } 
    } catch (e) { console.error('清理失败:', e); } 
} 

// 移除加载遮罩 (解决界面挤压问题) 
function removeLoadingMask() { 
    const mask = document.getElementById('app-loading-mask'); 
    if (mask) { 
        mask.classList.add('loaded'); // 触发CSS淡出 
        setTimeout(() => mask.remove(), 600); 
    } 
} 

document.addEventListener('DOMContentLoaded', () => { 
    // 1. 立即清理僵尸进程 (解决2分钟卡顿) 
    exterminateServiceWorkers(); 
    
    // 2. 初始化播放器 
    const player = dom.audioPlayer; 
    if (player) { 
        player.removeAttribute('crossOrigin'); 
        player.preload = "none"; 
        player.setAttribute('playsinline', ''); 
        player.setAttribute('webkit-playsinline', ''); 
        
        player.addEventListener('canplaythrough', () => { player.preload = "auto"; }, { once: true }); 
    } 
    
    // 3. 移除加载遮罩 (解决FOUC布局错乱) 
    // 稍微延迟一点点，确�?CSS 媒体查询已生�?
    setTimeout(removeLoadingMask, 100); 
}); 

// 作为兜底，如�?load 事件触发（所有资源加载完），也尝试移除遮�?
window.addEventListener('load', () => setTimeout(removeLoadingMask, 200));

// ================================================ 
// 🎵 辅助模块：锁屏元数据 & 音频守护 (v7.3 Final) 
// ================================================ 

// 1. 锁屏元数据更新 (修复封面不显示) 
function updateMediaMetadataForLockScreen(song) { 
    if (!('mediaSession' in navigator)) return; 
    try { 
        let coverUrl = ''; 
        if (song.pic_id || song.id) { 
            coverUrl = API.getPicUrl(song); 
            if (coverUrl.startsWith('http://')) coverUrl = coverUrl.replace('http://', 'https://'); 
        } 
        if (!coverUrl) coverUrl = window.location.origin + '/favicon.png'; 
        
        const artistName = Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || '未知艺术家'); 
        
        navigator.mediaSession.metadata = new MediaMetadata({ 
            title: song.name || '未知歌曲', 
            artist: artistName, 
            album: song.album || '', 
            artwork: [ 
                { src: coverUrl, sizes: '512x512', type: 'image/png' }, 
                { src: coverUrl, sizes: '256x256', type: 'image/png' }, 
                { src: coverUrl, sizes: '128x128', type: 'image/png' } 
            ] 
        }); 
    } catch (e) { console.warn('锁屏元数据更新轻微错误:', e); } 
} 

// 2. 音频守护进程 (修复切歌断连 & 静音键问题) 
(function() { 
    if (!window.solaraAudioGuard) { 
        window.solaraAudioGuard = { 
            isActive: false, 
            audioCtx: null, 
            osc: null, 
            start: function() { 
                if (this.isActive) return; 
                try { 
                    const AC = window.AudioContext || window.webkitAudioContext; 
                    if (!AC) return; 
                    this.audioCtx = new AC(); 
                    this.osc = this.audioCtx.createOscillator(); 
                    const gain = this.audioCtx.createGain(); 
                    this.osc.type = 'sine'; 
                    this.osc.frequency.value = 1; // 1Hz 人耳听不见 
                    gain.gain.value = 0.001; // 极低音量 
                    this.osc.connect(gain); 
                    gain.connect(this.audioCtx.destination); 
                    this.osc.start(); 
                    this.isActive = true; 
                    console.log('🛡️ 守护启动 (占位)'); 
                } catch (e) { console.error('守护启动失败:', e); } 
            }, 
            stop: function() { 
                if (!this.isActive) return; 
                try { 
                    if (this.osc) { this.osc.stop(); this.osc.disconnect(); } 
                    if (this.audioCtx) { this.audioCtx.close(); } 
                    this.isActive = false; 
                    console.log('🛡️ 守护停止 (释放通道)'); 
                } catch (e) { console.error('守护停止失败:', e); } 
            } 
        }; 
    } 
})(); 

// ================================================ 
// iOS PWA 终极版 playSong (v7.3 Sound Fix) 
// 修复：秒开、保活、锁屏、静音键免疫 
// ================================================ 
async function playSong(song, options = {}) { 
    const { autoplay = true, startTime = 0, preserveProgress = false } = options; 
    
    // 环境检测 
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); 
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone === true); 
    const isIOSPWA = isIOS && isPWA; 
    const isLockScreen = document.visibilityState === 'hidden'; 
    
    console.log(`🎵 准备播放: ${song.name}`); 

    try { 
        if (state._isPlayingSong) return false; 
        state._isPlayingSong = true; 
        state.currentSong = song; 
        const player = dom.audioPlayer; 

        // 1. 启动守护 (填补切歌间隙) 
        if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.start(); 

        // 2. 抢占锁屏 
        updateMediaMetadataForLockScreen(song); 

        // 3. 暂停并保留音量 
        let safeVolume = player.volume; 
        if (!safeVolume || safeVolume < 0.1) safeVolume = 1.0; 
        
        if (!player.paused) { 
            player.pause(); 
            await new Promise(r => setTimeout(r, 50)); 
        } 

        // 4. 构建防缓存 URL (秒开核心) 
        const quality = state.playbackQuality || '320'; 
        let rawUrl = API.getSongUrl(song, quality); 
        if (!rawUrl.startsWith('http')) rawUrl = new URL(rawUrl, window.location.origin).href; 
        const separator = rawUrl.includes('?') ? '&' : '?'; 
        const streamUrl = `${rawUrl}${separator}_t=${Date.now()}_r=${Math.random().toString(36).substr(2,5)}`; 
        console.log('🚀 音频直连:', streamUrl); 

        // 5. 柔性切换 (Soft Switch) 
        player.removeAttribute('crossOrigin'); 
        player.setAttribute('playsinline', ''); 
        player.setAttribute('webkit-playsinline', ''); 
        
        player.src = streamUrl; 
        state.currentAudioUrl = streamUrl; 
        
        // ⚡️ 预先解除静音 
        player.muted = false; 
        player.volume = safeVolume; 
        
        player.preload = 'auto'; 
        player.load(); 

        // 6. 等待加载 
        await new Promise((resolve) => { 
            let resolved = false; 
            const timer = setTimeout(() => { if(!resolved) { resolved=true; resolve(); } }, 5000); 
            const done = () => { if(!resolved) { resolved=true; clearTimeout(timer); resolve(); } }; 
            player.addEventListener('canplay', done, { once: true }); 
            player.addEventListener('error', done, { once: true }); 
        }); 

        // 7. 恢复进度 
        let targetTime = startTime; 
        if (preserveProgress) { 
            targetTime = state.currentList === "favorite" ? state.favoritePlaybackTime : state.currentPlaybackTime; 
        } 
        if (targetTime > 0) player.currentTime = targetTime; 

        // 8. UI 更新 (带淡入淡出优化) 
        if (isIOSPWA && isLockScreen) { 
            state.needUpdateOnUnlock = true; 
        } else { 
            // 给封面添加 loading 类，触发 CSS 变淡效果 (需配合 CSS) 
            if (dom.albumCover) dom.albumCover.classList.add('loading'); 
            
            setTimeout(() => { 
                updateCurrentSongInfo(song, { loadArtwork: true, updateBackground: true, immediate: true }); 
                // 稍微延迟移除 loading 类 
                setTimeout(() => { if (dom.albumCover) dom.albumCover.classList.remove('loading'); }, 300); 
            }, 150); 
        } 

        // 9. 播放逻辑 
        if (autoplay) { 
            state.isPlaying = true; 
            updatePlayPauseButton(); 
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; 

            await new Promise(r => setTimeout(r, 100)); 

            try { 
                await player.play(); 
                console.log('✅ 播放成功'); 

                // ⚡️⚡️ [核心修复] 强制开嗓 ⚡️⚡️ 
                player.muted = false; 
                player.volume = safeVolume; 
                
                // ⚡️⚡️ [核心修复] 停止守护，免疫静音键 ⚡️⚡️ 
                if (isIOSPWA && window.solaraAudioGuard) { 
                    window.solaraAudioGuard.stop(); 
                    console.log('🛑 守护停止，音频通道已接管'); 
                } 
                
                setTimeout(() => updateMediaMetadataForLockScreen(song), 500); 

            } catch (error) { 
                console.warn('⚠️ 播放受阻，尝试强力修复:', error.message); 
                try { 
                    player.muted = true; 
                    await player.play(); 
                    setTimeout(() => { 
                        player.muted = false; 
                        player.volume = safeVolume; 
                        console.log('🔊 强力修复成功'); 
                    }, 200); 
                } catch (e) { 
                    console.error('❌ 播放失败:', e); 
                    state.isPlaying = false; 
                    updatePlayPauseButton(); 
                    if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
                } 
            } 
        } else { 
            state.isPlaying = false; 
            updatePlayPauseButton(); 
            if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
        } 

        savePlayerState(); 
        setTimeout(() => loadLyrics(song), 1000); 
        return true; 

    } catch (error) { 
        console.error("异常:", error); 
        state.isPlaying = false; 
        updatePlayPauseButton(); 
        if (isIOSPWA && window.solaraAudioGuard) window.solaraAudioGuard.stop(); 
        return false; 
    } finally { 
        state._isPlayingSong = false; 
    } 
} 

// ... 这里的其他辅助函数 playNext/playPrevious 保持不变， 
// ... 如果你删除了它们，请记得补回来，或者只替换 playSong 本身。 
// ... (为了安全起见，建议保留你原文件里的 playNext/playPrevious 等逻辑，只替换 playSong) 

// ================================================ 
// 💀 启动清理 & 初始化 (解决卡顿和布局挤压) 
// ================================================ 
async function exterminateServiceWorkers() { 
    if (!('serviceWorker' in navigator)) return; 
    try { 
        const regs = await navigator.serviceWorker.getRegistrations(); 
        if (regs.length > 0) { 
            console.warn(`⚠️ 清除 ${regs.length} 个僵尸SW`); 
            await Promise.all(regs.map(r => r.unregister())); 
        } 
        if ('caches' in window) { 
            const keys = await caches.keys(); 
            for (const k of keys) { 
                if (k.includes('sw') || k.includes('workbox') || k.includes('precache')) await caches.delete(k); 
            } 
        } 
    } catch (e) { console.error('清理失败:', e); } 
} 

// 移除加载遮罩 (解决界面挤压问题) 
function removeLoadingMask() { 
    const mask = document.getElementById('app-loading-mask'); 
    if (mask) { 
        mask.classList.add('loaded'); // 触发CSS淡出 
        setTimeout(() => mask.remove(), 600); 
    } 
} 

document.addEventListener('DOMContentLoaded', () => { 
    // 1. 立即清理僵尸进程 (解决2分钟卡顿) 
    exterminateServiceWorkers(); 
    
    // 2. 初始化播放器 
    const player = dom.audioPlayer; 
    if (player) { 
        player.removeAttribute('crossOrigin'); 
        player.preload = "none"; 
        player.setAttribute('playsinline', ''); 
        player.setAttribute('webkit-playsinline', ''); 
        
        player.addEventListener('canplaythrough', () => { player.preload = "auto"; }, { once: true }); 
    } 
    
    // 3. 移除加载遮罩 (解决FOUC布局错乱) 
    // 稍微延迟一点点，确保 CSS 媒体查询已生效 
    setTimeout(removeLoadingMask, 100); 
}); 

// 作为兜底，如果 load 事件触发（所有资源加载完），也尝试移除遮罩 
window.addEventListener('load', () => setTimeout(removeLoadingMask, 200));

// ==== Media Session integration (Safari/iOS Lock Screen) ====
(() => {
    const audio = dom.audioPlayer;
    if (!('mediaSession' in navigator) || !audio) return;

    // 刷新锁屏元数据
    function triggerMediaSessionMetadataRefresh() {
        if (typeof window.updateMediaMetadataForLockScreen === 'function' && state.currentSong) {
            window.updateMediaMetadataForLockScreen(state.currentSong);
        }
    }

    // 更新进度条
    function updatePositionState() {
        if (!audio || isNaN(audio.duration)) return;
        try {
            navigator.mediaSession.setPositionState({
                duration: Math.max(0, audio.duration),
                playbackRate: audio.playbackRate,
                position: Math.max(0, audio.currentTime)
            });
        } catch (e) {}
    }

    // 绑定控制中心按钮事件
    const actionHandlers = [
        ['play', async () => {
            state.isPlaying = true;
            updatePlayPauseButton();
            await audio.play();
        }],
        ['pause', () => {
            state.isPlaying = false;
            updatePlayPauseButton();
            audio.pause();
        }],
        ['previoustrack', () => window.playPrevious && window.playPrevious()],
        ['nexttrack', () => window.playNext && window.playNext()],
        ['seekto', (details) => {
            if (details.fastSeek && 'fastSeek' in audio) {
                audio.fastSeek(details.seekTime);
                return;
            }
            audio.currentTime = details.seekTime;
            updatePositionState();
        }]
    ];

    for (const [action, handler] of actionHandlers) {
        try {
            navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
            // 某些操作在部分设备不支持，忽略错误
        }
    }

    // === 关键：简单的事件监听 ===
    
    // 播放状态同步
    audio.addEventListener('play', () => {
        navigator.mediaSession.playbackState = 'playing';
        triggerMediaSessionMetadataRefresh();
    });

    audio.addEventListener('pause', () => {
        navigator.mediaSession.playbackState = 'paused';
    });

    // 自动播放下一首 (简化版)
    audio.addEventListener('ended', () => {
        // 如果正在加载或已经在切歌中，忽略
        if (state._isPlayingSong) return;
        
        console.log('🎵 歌曲结束，触发自动连播');
        if (typeof window.autoPlayNext === 'function') {
            window.autoPlayNext();
        }
    });

    // 进度同步
    let lastTimeUpdate = 0;
    audio.addEventListener('timeupdate', () => {
        const now = Date.now();
        // 限制频率，每秒同步一次即可
        if (now - lastTimeUpdate > 1000) {
            updatePositionState();
            lastTimeUpdate = now;
        }
    });
    
    // 元数据加载后同步时长
    audio.addEventListener('durationchange', updatePositionState);

})();

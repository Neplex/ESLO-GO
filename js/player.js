window.Player = (function () {
    const audio = $('#audio')[0];
    const $panel = $('#info-panel');
    const $playBtn = $('#play-btn');
    const $seekSlider = $('#seek-slider');

    let currentSounds = [];
    let currentIndex = 0;

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity || seconds < 0) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        return (h ? [h, m, s] : [m, s])
            .map(n => String(n).padStart(2, '0'))
            .join(':');
    }

    function updateProgress() {
        $seekSlider.val(Math.floor(audio.currentTime));
        $('#current-time').text(formatTime(audio.currentTime));

        const progress = (audio.duration > 0) ? (audio.currentTime / audio.duration) * 100 : 0;
        const isDark = document.documentElement.classList.contains('dark');
        const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--color-main').trim();
        const trackColor = isDark ? '#1f2937' : '#e5e7eb';

        $seekSlider.css('background', `linear-gradient(to right, ${mainColor} ${progress}%, ${trackColor} ${progress}%)`);
    }

    function updateIcon() {
        $playBtn.html(`<i data-lucide="${audio.paused ? 'play' : 'pause'}" fill="black" class="w-6 h-6"></i>`);
        lucide.createIcons();
    }

    function sync() {
        const sound = currentSounds[currentIndex];
        $('#info-title').empty();
        if (currentSounds.length > 1) {
            $('#info-title').append(`<span id="info-title-counter">${currentIndex + 1}/${currentSounds.length}</span>`);
        }
        $('#info-title').append(document.createTextNode(sound.properties.title));
        $('#info-desc').text(sound.properties.description);

        if (audio.src !== sound.properties.src) {
            audio.pause();
            audio.src = sound.properties.src;
            audio.load();
            audio.currentTime = 0;
        }

        updateIcon();
        updateProgress();
        $('#prev-btn').toggleClass('opacity-20 pointer-events-none', currentIndex === 0);
        $('#next-btn').toggleClass('opacity-20 pointer-events-none', currentIndex === currentSounds.length - 1);
    }

    function open(sounds) {
        currentSounds = sounds;
        currentIndex = 0;
        $panel.removeClass('translate-y-[200%] shadow-none').removeAttr('inert');
        sync();
    }

    function close() {
        $panel.addClass('translate-y-[200%]').attr('inert', '');
        audio.pause();
        updateIcon();
    }

    function togglePlay() {
        if (audio.paused) audio.play().catch(console.error);
        else audio.pause();
        updateIcon();
    }

    function next() {
        if (currentIndex < currentSounds.length - 1) {
            currentIndex++;
            sync();
        }
    }

    function prev() {
        if (currentIndex > 0) {
            currentIndex--;
            sync();
        }
    }

    // Global audio events
    audio.onloadedmetadata = () => {
        $('#total-duration').text(formatTime(audio.duration));
        $seekSlider.attr('max', Math.floor(audio.duration));
        updateProgress();
    };
    audio.ontimeupdate = updateProgress;
    audio.onended = () => {
        updateIcon();
        $(window).trigger('soundFinished', [currentSounds[currentIndex]]);
    };

    return {
        open, close, togglePlay, next, prev, get audio() {
            return audio;
        }
    };
})();

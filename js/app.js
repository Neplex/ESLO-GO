function showToast(message) {
    const $toast = $('#toast');
    $('#toast-message').text(message);
    $toast.removeClass('-translate-y-24 opacity-0').addClass('translate-y-0 opacity-100');
    setTimeout(() => $toast.addClass('-translate-y-24 opacity-0').removeClass('translate-y-0 opacity-100'), 3000);
}

function toggleView(viewId, show) {
    const $view = $(viewId);
    if (show) {
        $view.removeClass('translate-x-full');
        $view.removeAttr('inert');
    } else {
        // Restore hidden state based on element class structure
        $view.addClass('translate-x-full');
        $view.attr('inert', '');
    }
    updateNav(viewId, show);
}

function updateNav(viewId, show) {
    $('.nav-btn').removeClass('active');
    if (!show) {
        $('#nav-map').addClass('active');
    } else {
        if (viewId === '#trophies-view') $('#nav-trophies').addClass('active');
        if (viewId === '#settings-view') $('#nav-settings').addClass('active');
    }
}

function renderTrophies(data, userData) {
    const $list = $('#trophy-list').empty();
    data.forEach(item => {
        let isLocked = true;
        if (item.condition === 'nsl') {
            if (userData.sounds.length >= item.value) isLocked = false;
        } else if (item.condition === 'ntsl') {
            const sound = userData.sounds.find(s => s.nbEcoute >= item.value);
            if (sound) isLocked = false;
        }

        $list.append(`
                <div class="flex items-center space-x-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 ${isLocked ? 'opacity-30 grayscale' : 'shadow-lg'}">
                    <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src="${item.img}" class="object-cover w-full h-full" alt="${item.title}">
                    </div>
                    <div class="flex-grow min-w-0 text-left">
                        <h3 class="font-bold text-sm truncate text-zinc-900 dark:text-white">${item.title}</h3>
                        <p class="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">${isLocked ? 'Verrouillé' : 'Débloqué'}</p>
                        <p class="text-xs text-zinc-400 line-clamp-1">${item.desc}</p>
                    </div>
                    <div class="flex-shrink-0">
                        <i data-lucide="${isLocked ? 'lock' : 'check-circle-2'}" class="${isLocked ? 'text-zinc-400' : 'text-main'} w-6 h-6"></i>
                    </div>
                </div>`);
    });
    lucide.createIcons();
}

$(document).ready(function () {
    let trophyData;

    // --- Initial Load ---
    lucide.createIcons();
    MapManager.init();
    State.load();

    // --- Data Loading ---
    $.getJSON("data/trophy.json", (data) => {
        trophyData = data;
        renderTrophies(trophyData, State.data);
    }).fail(() => {
        console.error("Failed to load trophy data");
        showToast("Impossible de charger les trophées");
    });

    $.getJSON("data/data.json", function (data) {
        const grouped = {};
        data.forEach((e) => {
            const key = e.lat + "," + e.long;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({
                type: "Feature",
                properties: {
                    id: e.id,
                    title: e.title,
                    description: e.description,
                    src: e.src,
                },
                geometry: {
                    type: "Point",
                    coordinates: [e.long, e.lat],
                }
            });
        });

        MapManager.addPoints(grouped, 35, Player.open);
    }).fail(() => {
        console.error("Failed to load map data");
        showToast("Impossible de charger la carte");
    });

    // --- UI Listeners ---
    $('#nav-map').on('click', () => {
        toggleView('#trophies-view', false);
        toggleView('#settings-view', false);
    });

    $('#nav-trophies').on('click', () => {
        toggleView('#settings-view', false);
        toggleView('#trophies-view', true);
    });

    $('#nav-settings').on('click', () => {
        toggleView('#trophies-view', false);
        toggleView('#settings-view', true);
    });

    $('.view-close').on('click', function () {
        toggleView($(this).data('target'), false);
    });

    $('#theme-toggle').val(State.settings.theme).on('change', function () {
        State.setTheme($(this).val());
    });

    $('#reset-btn').on('click', () => {
        if (confirm("Réinitialiser toutes les données ?")) {
            State.reset();
            renderTrophies(trophyData, State.data);
            showToast("Progression réinitialisée");
        }
    });

    // --- Player Listeners ---
    $('#play-btn').on('click', Player.togglePlay);
    $('#player-close').on('click', Player.close);
    $('#prev-btn').on('click', Player.prev);
    $('#next-btn').on('click', Player.next);

    $('#seek-slider').on('input', function () {
        Player.audio.currentTime = $(this).val();
    });
    $('#volume-slider').on('input', function () {
        Player.audio.volume = $(this).val() / 100;
    });
    $('#speed-select').on('change', function () {
        Player.audio.playbackRate = parseFloat($(this).val());
    });

    // --- Progression Logic ---
    $(window).on('soundFinished', (e, sound) => {
        const entry = State.data.sounds.find(s => s.id === sound.properties.id);
        if (entry) entry.nbEcoute++;
        else State.data.sounds.push({id: sound.properties.id, nbEcoute: 1});
        State.save();
        renderTrophies(trophyData, State.data);
    });

    // Dev mode toggle section (Double click on "Paramètres" to show dev tools)
    let settingsClicks = 0;
    $('#settings-view header h2').on('click', () => {
        if (settingsClicks >= 5) {
            showToast("Mode développeur déjà activé");
            return;
        }
        settingsClicks++;
        if (settingsClicks >= 5) {
            $('#dev-section').removeClass('hidden');
            showToast("Mode développeur activé");
        }
    });
});

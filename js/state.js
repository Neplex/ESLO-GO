window.State = (function () {
    const STORAGE_KEY = "userData";
    const THEME_KEY = "appTheme";

    const state = {
        userData: {
            sounds: [],
            visited: []
        },
        settings: {
            theme: localStorage.getItem(THEME_KEY) || 'system',
            devMode: false
        }
    };

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === 'object') {
                state.userData = { ...state.userData, ...saved };
            }
        } catch {
            localStorage.removeItem("userData");
        } finally {
            applyTheme(state.settings.theme);
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.userData));
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
        state.userData = {sounds: [], visited: []};
        save();
    }

    function setTheme(theme) {
        state.settings.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }

    return {
        get data() {
            return state.userData;
        },
        get settings() {
            return state.settings;
        },
        load,
        save,
        reset,
        setTheme
    };
})();

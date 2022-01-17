class wallpaper {
    constructor(defaultBG) {
        /**
         * @param {string} defaultBG default background image
         */

        this.defaultBG = defaultBG;
        this.background = document.getElementById("background");
        this.settingsPreview = document.getElementById("bg_preview_settings");
        this.wallpaperOpen = document.getElementById("wallpaperSelector");
        this.wallpaperOpen.addEventListener("change", (event) => {
            this.changeWallpaper(event);
        });
        chrome.storage.local.get("background", (result) => {
            if (result.background) {
                this.background.style.backgroundImage = `url(${result.background})`;
            } else {
                this.background.style.backgroundImage = `url(${this.defaultBG})`;
            }
            this.refresh();
        });

        // forwarding the click event to the wallpaper selector
        this.wallpaperOpenBtn = document.getElementById("selectWallpaperBtn");
        this.wallpaperOpenBtn.addEventListener("click", () => {
            this.wallpaperOpen.click();
        });
    }

    refresh() {
        this.settingsPreview.src = this.getCurrentBackground();
    }

    changeWallpaper(event) {
        const reader = new FileReader();
        reader.addEventListener("load", (e) => {
            this.background.style.backgroundImage = `url(${e.target.result})`;
            chrome.storage.local.set({ background: reader.result });
            this.refresh();
        });
        reader.readAsDataURL(event.target.files[0]);
    }

    getCurrentBackground() {
        let backgroundUrl = this.background.style.backgroundImage;
        backgroundUrl = backgroundUrl.replace(/^url\(["']?/, "");
        backgroundUrl = backgroundUrl.replace(/["']?\)$/, "");
        return backgroundUrl;
    }
}

class tabs {
    constructor(tabArray) {
        /**
         * @param {array} tabArray array of tab objects
         */
        this.tabBox = document.getElementById("tabs");
        this.tabArray = tabArray;
        for (let i = 0; i < this.tabArray.length; i++) {
            this.tabArray[i].element.style.display = "none";
            let tab = this.createTabButton(
                this.tabArray[i].name,
                this.tabArray[i].element,
                this.tabArray[i].callback
            );
            let tabName = document.createElement("label");
            tabName.innerText = this.tabArray[i].name;
            tabName.classList.add("tab");
            tabName.htmlFor = tab.id;
            this.tabBox.appendChild(tab);
            this.tabBox.appendChild(tabName);
        }
        document.getElementsByClassName("tab_radio")[0].checked = true;
        this.tabArray[0].element.style.display = "block";
        if (this.tabArray[0].callback) {
            this.tabArray[0].callback();
        }
    }

    createTabButton(name, element, callback) {
        /**
         * @param {string} name name of the tab
         * @param {HTMLElement} element element to be shown
         * @param {function} callback callback function
         */
        const tab = document.createElement("input");
        tab.type = "radio";
        tab.name = "tab";
        tab.classList.add("tab_radio");
        tab.innerText = name;
        tab.id = `tab-${name}`;
        tab.addEventListener("change", (e) => {
            for (let i = 0; i < this.tabArray.length; i++) {
                this.tabArray[i].element.style.display = "none";
            }
            element.style.display = "block";
            if (callback) {
                callback();
            }
        });
        return tab;
    }
}

class settings {
    constructor() {
        this.default = {
            background: "../assets/black-dust.jpg",
        };
        this.settingsPanel = document.getElementById("settingsPanel");
        this.settingsOuterBox = document.getElementById("settingsOuterBox");
        this.settingsBtn = document.getElementById("settingsBtn"); //getting the settings element
        this.appName = document.getElementById("appName");
        this.settingsBtn.addEventListener("click", (event) => {
            this.openSettings();
        });
        this.settingsBtn.addEventListener("mouseover", (e) => {
            this.appName.innerText = "Settings";
            this.settingsBtn.onmouseout = () => {
                this.appName.innerHTML =
                    '<i class="material-icons" style="margin-left: 5px;">home</i>';
            };
        });
        this.settingsOuterBox.addEventListener("click", (event) => {
            if (event.target == this.settingsOuterBox) {
                this.closeSettings();
            }
        });

        this.wallpaper = new wallpaper(this.default.background);
        this.tabs = new tabs([
            {
                name: "background",
                callback: () => {
                    console.log("running the callback");
                    this.wallpaper.refresh();
                },
                element: document.getElementById("backgroundPage"),
            },
            {
                name: "themes",
                element: document.getElementById("themesPage"),
            },
            {
                name: "cursor",
                element: document.getElementById("cursorPage"),
            },
            {
                name: "about",
                element: document.getElementById("aboutPage"),
            },
        ]);
    }

    openSettings() {
        document
            .querySelector(":root")
            .style.setProperty("--filter", "blur(5px)");
        this.settingsOuterBox.style.visibility = "visible";
        this.settingsPanel.style.animation = "0.45s settingsAppear";
        setTimeout(() => {
            this.settingsPanel.style.animation = "none";
        }, 450);
    }
    closeSettings() {
        document.querySelector(":root").style.setProperty("--filter", "none");
        this.settingsOuterBox.style.visibility = "hidden";
    }
}

module.exports = {
    settings,
};

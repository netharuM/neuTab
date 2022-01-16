class settings {
    constructor() {
        this.default = {
            background: "../assets/black-dust.jpg",
        };
        this.background = document.getElementById("background");
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
        this.wallpaperOpen = document.getElementById("wallpaperSelector");
        this.wallpaperOpen.addEventListener("change", (event) =>
            this.wallpaperChange(event)
        );
        chrome.storage.local.get("background", (result) => {
            if (result.background) {
                this.background.style.backgroundImage = `url(${result.background})`;
            } else {
                this.background.style.backgroundImage = `url(${this.default.background})`;
            }
        });

        this.wallpaperOpenBtn = document.getElementById("selectWallpaperBtn");
        // forwarding the event to the file selector
        this.wallpaperOpenBtn.onclick = () => {
            this.wallpaperOpen.click();
        };
    }

    wallpaperChange(event) {
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
            this.background.style.backgroundImage = `url(${event.target.result})`;
            chrome.storage.local.set({ background: reader.result });
        });
        reader.readAsDataURL(event.target.files[0]);
    }

    openSettings() {
        document
            .querySelector(":root")
            .style.setProperty("--filter", "blur(5px)");
        this.settingsOuterBox.style.visibility = "visible";
    }
    closeSettings() {
        document.querySelector(":root").style.setProperty("--filter", "none");
        this.settingsOuterBox.style.visibility = "hidden";
    }
}

module.exports = {
    settings,
};

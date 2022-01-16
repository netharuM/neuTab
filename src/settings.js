class settings {
    constructor() {
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
            this.background.style.backgroundImage = `url(${result.background})`;
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
        this.settingsOuterBox.style.visibility = "visible";
    }
    closeSettings() {
        this.settingsOuterBox.style.visibility = "hidden";
    }
}

module.exports = {
    settings,
};

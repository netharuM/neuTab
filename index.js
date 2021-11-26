class Clock {
    /**
     *  handlings the clock
     * @param {*} elementId the count element id for the clock
     */
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.refresh();
        setInterval(() => this.refresh(), 1000);
    }

    refresh() {
        this.element.innerHTML = new Date().toLocaleTimeString();
    }
}

class shortcuts {
    /**
     *
     * to handle shortcuts
     * @param {*} homeIcon the element for the home icon
     *
     */
    constructor(
        homeIcon = '<i class="material-icons" style="margin-left: 5px;">home</i>'
    ) {
        this.homeIcon = homeIcon;
    }

    setTopSites() {
        /**
         * setting shortcuts as the top sites
         */
        chrome.topSites.get((data) => {
            for (var i = 0; i < 5; i++) {
                this.addShortCut(data[i].url, data[i].title);
            }
        });
    }

    addShortCut(link, name) {
        /**
         * adding shortcut to the shortcuts container
         * @param {string} link the link of the shortcut
         * @param {string} name the name of the shortcut
         */
        var shortcutContainer = document.getElementById("shortcutContainer");
        var shortcut = document.createElement("a");
        shortcut.className = "shortcutBtn";
        shortcut.addEventListener(
            "mouseover",
            (result) => {
                appName.innerHTML = link.split("/")[2];
                shortcut.onmouseout = () => {
                    appName.innerHTML = this.homeIcon;
                };
            },
            false
        );
        shortcut.href = link;
        shortcut.id = "shortcut-" + link.split("/")[2];
        shortcutContainer.appendChild(shortcut);
        var span = document.createElement("span");
        shortcut.appendChild(span);
        var icon = document.createElement("img");
        icon.src = this.getFaviconFromUrl(link);
        icon.alt = name;
        icon.width = "25";
        icon.height = "25";
        span.appendChild(icon);
        span.appendChild(document.createElement("br"));
    }

    getFaviconFromUrl(url) {
        /**
         * getting the favicon from the url
         * @param {string} url the url of the favicon
         * @returns {string} the favicon url
         */
        return "https://icons.duckduckgo.com/ip3/" + url.split("/")[2] + ".ico";
    }
}

class favourites {
    /**
     *
     * controlling the favourites container
     * @param {string} homeIcon the home icon for the AppName element
     */
    constructor(
        homeIcon = '<i class="material-icons" style="margin-left: 5px;">home</i>'
    ) {
        this.root = document.querySelector(":root");
        this.favourites = [];
        this.sync = true;
        this.homeIcon = homeIcon;
        this.addBtn = document.getElementById("addFavourite");
        this.addBtn.addEventListener(
            "mouseover",
            (result) => {
                appName.innerHTML = "Add new favourite";
                this.addBtn.onmouseout = () => {
                    appName.innerHTML = this.homeIcon;
                };
            },
            false
        );

        // adding listener to the chrome database
        this.syncWithChrome();

        // new favourite dialog (the dialog box that we use to get the link and name of the new favourite (still it pops up))
        this.newFav = document.getElementById("newFav");
        this.addBtn.addEventListener(
            "click",
            () => {
                console.log("adding a new favourite");
                this.newFav.show();
                this.root.style.setProperty("--filter", "blur(3px)");
                this.root.style.setProperty("--block-index", "1");
                appName.innerHTML = "Adding a new favourite";
                var name = this.newFav.querySelector("#name");
                var url = this.newFav.querySelector("#url");
                var close = this.newFav.querySelector("#close");
                close.addEventListener("click", () => {
                    this.newFav.close();
                    this.root.style.setProperty("--filter", "none");
                    this.root.style.setProperty("--block-index", "-2");
                    name.value = "";
                    url.value = "";
                });
                var create = this.newFav.querySelector("#create");
                create.addEventListener("click", () => {
                    this.setNewFavourite(name.value, url.value);
                    this.newFav.close();
                    this.root.style.setProperty("--filter", "none");
                    this.root.style.setProperty("--block-index", "-2");
                    name.value = "";
                    url.value = "";
                });
            },
            false
        );
    }

    syncWithChrome() {
        /**
         * syncing witht the chrome dataBase
         *
         */
        // getting the values from chrome to sync with the data base
        chrome.storage.sync.get(["favourites"], (result) => {
            if (result.favourites != undefined) {
                this.favourites = result.favourites;
                this.refresh();
            } else if (result.favourites == undefined) {
                console.log("setting up data Base");
                chrome.storage.sync.set({ favourites: [] });
            }
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                if (key == "favourites") {
                    console.log("favourites changed");
                    this.favourites = newValue;
                    this.refresh();
                }
            }
        });
    }

    setNewFavourite(name, link) {
        /**
         * @param {string} name the name of the favourite
         * @param {string} link the link of the favourite
         */
        this.favourites.push({ name: name, link: link });
        if (this.sync == true) {
            chrome.storage.sync.set({ favourites: this.favourites });
        }
        this.refresh();
    }

    refresh() {
        /**
         * refreshes the favourites
         */
        this.removeAllFavourites();
        for (var i = 0; i < this.favourites.length; i++) {
            this.addFavourite(this.favourites[i].name, this.favourites[i].link);
        }
    }

    removeAllFavourites(sync = false) {
        /**
         * removes all the favourites
         */

        let favBtns = document.getElementsByClassName("favouritesBtn");
        while (favBtns.length > 0) {
            favBtns[0].remove();
            favBtns = document.getElementsByClassName("favouritesBtn");
        }
        if (sync == true) {
            this.removeFavouritesFromDB();
        }
    }

    removeFavouritesFromDB() {
        /**
         * removes all the favourites from the data base
         */
        chrome.storage.sync.set({ favourites: [] });
    }

    addFavourite(name, link) {
        /**
         * @param {string} name the name of the favourite
         * @param {string} link the link of the favourite
         */
        var shortcutContainer = document.getElementById("favourites");
        var favourite = document.createElement("a");
        favourite.className = "favouritesBtn";
        favourite.addEventListener(
            "mouseover",
            (result) => {
                appName.innerHTML = name;
                favourite.onmouseout = () => {
                    appName.innerHTML = this.homeIcon;
                };
            },
            false
        );
        favourite.href = link;
        favourite.id = "fav-" + link.split("/")[2];
        shortcutContainer.appendChild(favourite);
        var span = document.createElement("span");
        favourite.appendChild(span);
        var icon = document.createElement("img");
        icon.src = this.getFaviconFromUrl(link);
        icon.alt = name;
        icon.width = "25";
        icon.height = "25";
        span.appendChild(icon);
        span.appendChild(document.createElement("br"));
    }

    getFaviconFromUrl(url) {
        /**
         * @param {string} url the url of the favourite
         * @returns {string} the url of the favicon
         */
        return "https://icons.duckduckgo.com/ip3/" + url.split("/")[2] + ".ico";
    }
}

class contextMenu {
    constructor(menuItems) {
        this.opened = false;
        this.elements = [];
        this.root = document.querySelector(":root");
        this.container = document.querySelector(".contextMenus");
        this.contextMenu = document.createElement("div");
        this.contextMenu.id = "context-menu-test";
        this.contextMenu.style.display = "none";
        this.contextMenu.className = "context-menu";
        this.menu = menuItems;
        if (this.menu != undefined) {
            this.menu.forEach((item) => {
                var button = item.element;
                button.id = item.id;
                button.addEventListener("mousedown", item.callBack, false);
                this.contextMenu.appendChild(button);
            });
        }
        this.container.appendChild(this.contextMenu);
        document.addEventListener(
            "contextmenu",
            (e) => {
                for (let i = 0; i < this.elements.length; i++) {
                    const element = this.elements[i];
                    if (e.path[0] == element) {
                        e.preventDefault();
                        this.showMenu(e);
                        break;
                    } else if (this.opened == true) {
                        this.hideMenu();
                    }
                }
            },
            false
        );
        document.addEventListener("mousedown", () => this.hideMenu(), false);
    }

    addToElement(element) {
        this.elements.push(element);
    }

    hideMenu() {
        this.opened = false;
        this.root.style.setProperty("--blocker-context-menu", "-2");
        this.contextMenu.style.display = "none";
    }

    showMenu(e) {
        if (this.contextMenu.style.display == "none") {
            this.opened = true;
            this.root.style.setProperty("--blocker-context-menu", "0");
            this.contextMenu.style.display = "block";
            this.contextMenu.style.left = e.pageX + "px";
            this.contextMenu.style.top = e.pageY + "px";
        } else {
            this.opened = false;
            this.contextMenu.style.display = "none";
            this.root.style.setProperty("--blocker-context-menu", "-2");
        }
    }
}

const clock = new Clock("countClock");
const shortcutContainer = new shortcuts();
const favouritesContainer = new favourites();
var removeButton = document.createElement("div");
removeButton.innerHTML = "remove";
var notrem = document.createElement("div");
notrem.innerHTML = "notremovetho";
const context = new contextMenu([
    {
        callBack: () => {
            alert("this is still in development");
        },
        element: removeButton,
        id: "remove",
    },
    {
        callBack: () => {
            alert("this is still in development not remove button this time");
        },
        element: notrem,
        id: "notremove",
    },
]);
context.addToElement(document.getElementById("favourites"));
context.addToElement(document.getElementById("shortcutContainer"));
shortcutContainer.setTopSites();

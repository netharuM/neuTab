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
     * @param {HTMLElement} homeIcon the element for the home icon
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
     * @param {callBack} onCreate call back to execute when the favourite is created
     * @param {string} homeIcon the home icon for the AppName element
     */
    constructor(
        onCreate,
        homeIcon = '<i class="material-icons" style="margin-left: 5px;">home</i>'
    ) {
        this.root = document.querySelector(":root");
        this.favourites = [];
        this.sync = true;
        this.homeIcon = homeIcon;
        this.onCreate = onCreate;
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
            var fav = this.addFavourite(
                this.favourites[i].name,
                this.favourites[i].link
            );
            this.favourites[i].element = fav;
        }
    }

    removeFavourite(element) {
        /**
         * removing a single favourite
         * @param {string} id the id of the favourite
         */
        this.favourites.forEach((favourite, index) => {
            if (favourite.element == element) {
                favourite.element.remove();
                this.favourites.splice(index, 1);

                if (this.sync == true) {
                    chrome.storage.sync.set({ favourites: this.favourites });
                }
            }
        });
    }

    removeAllFavourites(sync = false) {
        /**
         * removes all the favourites
         * @param {boolean} sync if true it will sync with the chrome data base
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
        if (this.onCreate != undefined) {
            this.onCreate(favourite);
        }
        return favourite;
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
    /**
     *  creating the context menu
     * give a array of objects with the menuItems
     *
     * @param {Array} menuItems the menu items that will be shown in the context menu (give a array and put the items inside the array)
     */
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
        this.lastClickedElement = undefined;
        if (this.menu != undefined) {
            this.menu.forEach((item) => {
                var button = item.element;
                button.id = item.id;
                button.addEventListener(
                    "mousedown",
                    (e) => {
                        item.callBack(this.lastClickedElement);
                    },
                    false
                );
                this.contextMenu.appendChild(button);
            });
        }
        this.container.appendChild(this.contextMenu);
        document.addEventListener(
            "contextmenu",
            (e) => {
                for (let i = 0; i < this.elements.length; i++) {
                    const element = this.elements[i];
                    if (e.path.includes(element)) {
                        e.preventDefault();
                        this.showMenu(e);
                        this.lastClickedElement = element;
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
        /**
         * when the element is added to the context menu , when it will right clicked the context menu will appear on that element
         * including the child elements
         * @param {HTMLElement} element the element that will be added to the context menu
         */
        this.elements.push(element);
    }

    hideMenu() {
        /**
         * hides the context menu
         */
        this.opened = false;
        this.root.style.setProperty("--blocker-context-menu", "-2");
        this.contextMenu.style.display = "none";
        this.lastClickedElement = undefined;
    }

    showMenu(e) {
        /**
         * making the context menu visible
         */
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

class customCursor {
    /**
     *  creating the custom cursor
     * @param {string} cursor the query selector of the element that will be the cursor
     * @param {string} lcursor the query selector of the element that moves in after the cursor moves the thing that follows the cursor
     */
    constructor(
        cursor = document.querySelector(".cursor"),
        lcursor = document.querySelector(".cursor-lazy")
    ) {
        this.cursor = cursor;
        this.lazyCursor = lcursor;

        window.addEventListener("mousemove", (e) => {
            this.show();
            this.editCursor(e);
        });

        window.addEventListener(
            "mousedown",
            (e) => {
                this.click(e);
            },
            false
        );
        window.addEventListener(
            "mouseup",
            (e) => {
                this.release(e);
            },
            false
        );
        window.addEventListener(
            "mouseout",
            (e) => {
                this.hide();
            },
            false
        );
    }

    editCursor(event) {
        /**
         * updating the cursor position
         * @param {MouseEvent} event the mouse event
         */
        this.cursor.style.left = event.pageX + "px";
        this.cursor.style.top = event.pageY + "px";
        this.lazyCursor.style.left = event.pageX + "px";
        this.lazyCursor.style.top = event.pageY + "px";
    }

    click(event) {
        /**
         * this will execute when you click in the window somewhere
         * also this will help make the cursor little smaller so it looks nice
         * and it gives a animation that looks like you clicked somewhere
         */
        this.lazyCursor.style.width = "30px";
        this.lazyCursor.style.height = "30px";
    }

    release(event) {
        /**
         * realeasing the mouse cursor
         * changing the mouse cursor back to the default state after clicked
         */
        this.lazyCursor.style.width = "45px";
        this.lazyCursor.style.height = "45px";
    }

    hide() {
        /**
         * hiding the cursor
         */
        this.cursor.style.display = "none";
        this.lazyCursor.style.display = "none";
    }

    show() {
        /**
         * making the cursor visible
         */
        this.cursor.style.display = "block";
        this.lazyCursor.style.display = "block";
    }
}
var removeButton = document.createElement("div");
removeButton.innerHTML = "remove";
var notrem = document.createElement("div");
notrem.innerHTML = "notremovetho";
const context = new contextMenu([
    {
        callBack: (e) => {
            favouritesContainer.removeFavourite(e);
        },
        element: removeButton,
        id: "remove",
    },
    {
        callBack: (e) => {
            console.log(e);
            alert("this is still in development not remove button this time");
        },
        element: notrem,
        id: "notremove",
    },
]);

cursor = new customCursor();
const clock = new Clock("countClock");
const shortcutContainer = new shortcuts();
const favouritesContainer = new favourites((e) => {
    context.addToElement(e);
});
shortcutContainer.setTopSites();

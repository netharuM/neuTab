import "material-design-icons/iconfont/material-icons.css";

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
        /**
         * refresh the clock
         */
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
        this.minimum = 5;
        this.homeIcon = homeIcon;
        this.onCreation = undefined;
        this.count = 0;
    }

    setTopSites(length = this.minimum) {
        /**
         * setting shortcuts as the top sites
         */
        chrome.topSites.get((data) => {
            if (length < this.minimum) {
                length = this.minimum;
            }

            // # removes the duplicated sites with different paths
            // ex: https://www.example.com/ and https://www.example.com/param?a=1
            // we just wanna see a one single google.com in our shortcuts
            // converting url path names to origins
            //ex : http://localhost:8000/some/path/to/file.html -> http://localhost:8000
            for (var i = 0; i < data.length; i++) {
                data[i].url = new URL(data[i].url).origin;
            }
            // removing the duplicated origins
            data = data.filter(function (value, index, array) {
                return array.indexOf(value) === index;
            });

            this.removeAllShortcuts();
            for (var i = 0; i < length; i++) {
                this.addShortCut(data[i].url, data[i].title);
            }
            this.count = length;
        });
    }

    refresh() {
        this.removeAllShortcuts();
        this.setTopSites(this.count);
    }

    changeCount(count) {
        if (this.count !== count) {
            this.count = count;
            this.refresh();
        }
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
        shortcut.name = name;
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
        if (this.onCreation) {
            this.onCreation(shortcut);
        }
    }

    removeAllShortcuts() {
        /**
         * removing all shortcuts
         */
        console.log("removing all shortcuts");
        var shortcutContainer = document.getElementById("shortcutContainer");
        while (shortcutContainer.firstChild) {
            shortcutContainer.removeChild(shortcutContainer.firstChild);
        }
    }

    getFaviconFromUrl(url) {
        /**
         * getting the favicon from the url
         * @param {string} url the url of the favicon
         * @returns {string} the favicon url
         */
        return "chrome://favicon/size/128@1x/" + url;
    }
}

class contextMenu {
    /**
     *  creating the context menu
     * give a array of objects with the menuItems
     *
     * @param {Array} menuItems the menu items that will be shown in the context menu (give a array and put the items inside the array)
     */
    constructor(name, menuItems) {
        this.opened = false;
        this.elements = [];
        this.root = document.querySelector(":root");
        this.container = document.querySelector(".contextMenus");
        this.contextMenu = document.createElement("div");
        this.contextMenu.id = `context-menu-${name}`;
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

function createMenuItem(icon, text) {
    /**
     * creating a menu item
     * @param {string} icon the icon of the menu item
     * @param {string} text the text of the menu item
     * @returns {HTMLElement} the menu item
     */
    var menuItem = document.createElement("div");
    menuItem.style.display = "flex";
    menuItem.style.alignItems = "center";
    menuItem.style.gap = "4px";
    menuItem.innerHTML = `<i class="material-icons">${icon}</i> ${text}`;
    return menuItem;
}

const FavContext = new contextMenu("favourites", [
    {
        callBack: (e) => {
            window.open(e.href, "_blank");
        },
        element: createMenuItem("open_in_new", "Open in a new tab"),
        id: "open",
    },
    {
        callBack: (e) => {
            console.log(e);
            alert("this is still in development not remove button this time");
        },
        element: createMenuItem("code", "development"),
        id: "development",
    },
    {
        callBack: (e) => {
            favouritesContainer.removeFavourite(e);
        },
        element: createMenuItem("delete", "Remove"),
        id: "remove",
    },
]);
const shorcutContext = new contextMenu("shorctuts", [
    {
        callBack: (e) => {
            window.open(e.href, "_blank");
        },
        element: createMenuItem("open_in_new", "Open in a new tab"),
        id: "open",
    },
    {
        callBack: (e) => {
            let name = e.href.split("/")[2];
            let link = e.href;
            favouritesContainer.addFavourite(name, link);
        },
        element: createMenuItem("favorite", "Add to favourites"),
    },
    {
        callBack: (e) => {
            console.log(e);
            alert("dev");
        },
        element: createMenuItem("code", "development"),
        id: "development",
    },
]);

const cursor = new customCursor(); // cursor thing
const clock = new Clock("countClock"); // clock that ticks
const shortcutContainer = new shortcuts(); // shortcuts (most visited sites)
const { favourites } = require("./favourites"); // favourites
const { settings } = require("./settings"); // settings
const settingsHandler = new settings(); // settings handler
shortcutContainer.onCreation = (element) => {
    shorcutContext.addToElement(element);
};
const favouritesContainer = new favourites(
    (favourite) => {
        // when element is created
        FavContext.addToElement(favourite);
    },
    () => {
        // when favourites are chanaged
        shortcutContainer.changeCount(
            favouritesContainer.favourites.length + 1
        );
    }
);
favouritesContainer.getFavouriteCount((count) => {
    shortcutContainer.setTopSites(count + 1);
});

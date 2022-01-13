class animationHandler {
    constructor(animation = "BtnCreation") {
        this.animations = [];
        this.animation = animation;
    }
    convertTime(miliseconds) {
        return (miliseconds % 60000) / 1000;
    }
    animate() {
        if (this.animations.length > 0) {
            while (this.animation.length > 0) {
                var animation = this.animations[0];
                animation.element.style.animation = `${
                    this.animation
                } ${this.convertTime(animation.time)}s`;
                setTimeout(() => {
                    animation.element.style.animation = "";
                }, animation.time);
                this.animations.shift();
                if (this.animations.length == 0) {
                    break;
                }
            }
        }
    }

    addAnimation(element, time) {
        this.animations.push({ element: element, time: time });
        this.animate();
    }
}

class dragAndDropHandler {
    constructor(
        onDrop,
        containerQuery = ".favourites",
        btnQuery = ".favouritesBtn",
        favouritesQuery = "a:not(.dragIndicator),button:not(.dragIndicator)"
    ) {
        this.container = document.querySelector(containerQuery);
        this.btnQuery = btnQuery;
        this.favouritesQuery = favouritesQuery;
        this.dragData = {
            from: null,
            to: null,
            calculate: null,
        };
        this.onDrop = onDrop;
    }

    createIndicator(elementOwn) {
        var indicator = document.createElement("div");
        indicator.className = "dragIndicator";
        indicator.addEventListener("dragover", (e) => {
            e.preventDefault();
            indicator.classList.add("dragover");
        });
        indicator.addEventListener("dragleave", (e) => {
            indicator.classList.remove("dragover");
        });
        indicator.addEventListener("drop", (e) => {
            var obj = {
                element: indicator,
                event: e,
                elementOwn: elementOwn,
            };
            this.dragData.to = obj;
            this.dragData.from.element.classList.remove("dragging");
            this.calculateDrop();
            this.onDrop(this.dragData);
        });
        return indicator;
    }

    calculateDrop() {
        var favBtns = this.container.querySelectorAll(this.favouritesQuery);
        var indicators = this.container.querySelectorAll(".dragIndicator");
        favBtns = Array.from(favBtns);
        indicators = Array.from(indicators);

        this.dragData.calculate = {
            from: favBtns.indexOf(this.dragData.from.element),
            to: indicators.indexOf(this.dragData.to.element),
            effectedTo: favBtns.indexOf(this.dragData.to.elementOwn),
        };
    }

    addIndicators() {
        var childs = this.container.children;
        childs = Array.from(childs);
        childs.forEach((element, index) => {
            if (element.isEqualNode(this.dragData.from.element)) {
                if (index > -1) {
                    childs.splice(index, 1);
                }
            }
        });
        childs.forEach((element) => {
            var indicator = this.createIndicator(element);
            this.container.insertBefore(indicator, element);
        });
    }

    removeIndicators() {
        var indicators = document.querySelectorAll(".dragIndicator");
        indicators = Array.from(indicators);

        while (indicators.length > 0) {
            indicators[0].remove();
            indicators.shift();
        }
    }

    dragStart(event, element) {
        element.classList.add("dragging");
        var notDragging = this.container.querySelectorAll("a:not(.dragging)");
        notDragging = Array.from(notDragging);
        notDragging.forEach((element) => {
            element.style.pointerEvents = "none";
        });
        var obj;
        {
            // element.classList.remove("dragging");
            obj = {
                element: element,
                event: event,
            };
        }
        this.dragData.from = obj;
        this.addIndicators();
    }
    dragEnd(event, element) {
        element.classList.remove("dragging");
        var notDragging = this.container.querySelectorAll("a:not(.dragging)");
        notDragging = Array.from(notDragging);
        notDragging.forEach((element) => {
            element.style.pointerEvents = "auto";
        });
        this.removeIndicators();
    }

    addToElement(element) {
        element.draggable = true;
        element.addEventListener("dragstart", (e) => {
            this.dragStart(e, element);
        });
        element.addEventListener("dragend", (e) => {
            this.dragEnd(e, element);
        });
    }
}

class favourites {
    /**
     *
     * controlling the favourites container
     * @param {callBack} onCreate call back to execute when the favourite is created
     * @param {callBack} onRefresh call back to execute when the favourites are refreshed
     * @param {string} homeIcon the home icon for the AppName element
     */
    constructor(
        onCreate = undefined,
        onRefresh = undefined,
        homeIcon = '<i class="material-icons" style="margin-left: 5px;">home</i>'
    ) {
        this.root = document.querySelector(":root"); //storing the root element

        this.favourites = []; //storing the favourites
        this.favBtns = [];
        this.sync = true; // for chrome data base synx

        this.onCreate = onCreate;

        this.homeIcon = homeIcon;
        this.addBtn = document.getElementById("addFavourite"); //add favourite button
        this.appName = document.getElementById("appName"); //the app name on the status bar
        this.newFav = document.getElementById("newFav"); //the input dialog box for the new favourite
        this.favContainer = document.getElementById("favourites"); //the container for the favourites

        this.animations = new animationHandler("BtnCreation");
        this.dragAndDrop = new dragAndDropHandler((dragData) =>
            this.move(dragData)
        );

        this.addBtn.addEventListener("mouseover", () => {
            this.appName.innerHTML = "Add new Favourite";
            this.addBtn.onmouseout = () => {
                this.appName.innerHTML = this.homeIcon;
            };
        });
        this.addBtn.addEventListener("click", () => {
            this.addNewFavourite();
        });

        if (this.sync) {
            this.syncWithChrome();
        }
    }

    move(dragData) {
        var name = dragData.from.element.title;
        var url = dragData.from.element.href;
        var newFav = this.createFavourite(name, url);
        this.dragAndDrop.addToElement(newFav);
        this.animations.addAnimation(newFav, 250);
        dragData.from.element.remove();
        dragData.to.element.parentNode.insertBefore(
            newFav,
            dragData.to.element.nextSibling
        );

        if (dragData.calculate.to > this.favourites.length) {
            var k = dragData.calculate.to - this.favourites.length + 1;
            while (k--) {
                this.favourites.push(undefined);
            }
        }
        this.favourites.splice(
            dragData.calculate.to,
            0,
            this.favourites.splice(dragData.calculate.from, 1)[0]
        );

        chrome.storage.sync.set({ favourites: this.favourites });
    }

    syncWithChrome() {
        chrome.storage.sync.get(["favourites"], (result) => {
            if (result.favourites != undefined) {
                this.favourites = result.favourites;
                this.refresh();
            } else if (result.favourites == undefined) {
                chrome.storage.sync.set({ favourites: this.favourites });
            }
        });
        chrome.storage.onChanged.addListener((changes, namespace) => {
            for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                if (key == "favourites") {
                    this.favourites = newValue;
                    this.refresh();
                }
            }
        });
    }

    refresh() {
        this.favourites.forEach((element) => {
            var fav = this.createFavourite(element.name, element.link);
            if (!this.isExist(fav)) {
                this.addFavourite(element.name, element.link);
            }
        });

        this.favBtns.forEach((element) => {
            if (this.isRemoved(element)) {
                element.remove();
                this.favBtns.pop(element);
            }
        });
    }

    isExist(favorite) {
        for (let fav = 0; fav < this.favBtns.length; fav++) {
            const element = this.favBtns[fav];
            if (element.href == favorite.href) {
                return true;
            }
        }
        return false;
    }

    isRemoved(element) {
        var elements = [];
        for (let fav = 0; fav < this.favourites.length; fav++) {
            elements.push(this.favourites[fav].link);
        }
        var elementLink = element.href;
        if (elementLink[elementLink.length - 1] == "/") {
            elementLink = elementLink.substring(0, elementLink.length - 1);
        }

        elements.forEach((element, index) => {
            if (element[element.length - 1] == "/") {
                elements[index] = element.substring(0, element.length - 1);
            }
        });
        return !elements.includes(elementLink);
    }

    addFavourite(name, url, sync = this.sync) {
        if (name == undefined || url == undefined || name == "" || url == "") {
            throw new Error("name and url are required");
        }
        var favourite = this.createFavourite(name, url);
        this.dragAndDrop.addToElement(favourite); // adding the drag and drop functionality
        this.favBtns.push(favourite);
        this.favContainer.insertBefore(favourite, this.addBtn);
        this.animations.addAnimation(favourite, 450);
        var data = {
            elementId: favourite.id,
            name: name,
            link: url,
        };
        function checkExistent(favs, dataObj) {
            for (let index = 0; index < favs.length; index++) {
                const favourite = favs[index];
                if (
                    favourite.name == dataObj.name &&
                    favourite.link == dataObj.link
                ) {
                    return true;
                }
            }
            return false;
        }
        if (sync && !checkExistent(this.favourites, data)) {
            this.favourites.push(data);
            chrome.storage.sync.set({ favourites: this.favourites });
        }
        return favourite;
    }

    createFavourite(name, url) {
        if (name == undefined || url == undefined || name == "" || url == "") {
            throw new Error("name and url are required");
        }
        var favourite = document.createElement("a");
        favourite.className = "favouritesBtn";
        favourite.title = name;
        favourite.addEventListener("mouseover", () => {
            this.appName.innerHTML = name;
            favourite.onmouseout = () => {
                this.appName.innerHTML = this.homeIcon;
            };
        });
        favourite.setAttribute("href", url);
        favourite.id = "fav-" + url.split("/")[2];
        var span = document.createElement("span");
        favourite.appendChild(span);
        var icon = document.createElement("img");
        icon.src = this.favicon(url);
        icon.width = "25";
        icon.height = "25";
        span.appendChild(icon);
        span.appendChild(document.createElement("br"));
        if (this.onCreate != undefined) {
            this.onCreate(favourite);
        }
        return favourite;
    }

    favicon(url) {
        /**
         * @param {string} url - the url of the website
         * @returns {string} - url to the favicon
         */
        return "chrome://favicon/size/128@1x/" + url;
    }

    addNewFavourite() {
        this.newFav.show();
        this.root.style.setProperty("--filter", "blur(3px)");
        this.root.style.setProperty("--block-index", "1");
        this.appName.innerHTML = "Adding a new favourite";

        var name = this.newFav.querySelector("#name");
        var url = this.newFav.querySelector("#url");
        var close = this.newFav.querySelector("#close");
        var create = this.newFav.querySelector("#create");

        var closeFunction = () => {
            this.newFav.close();
            this.root.style.setProperty("--filter", "none");
            this.root.style.setProperty("--block-index", "-2");
            clearEventListeners();
        };
        var createFunction = () => {
            this.addFavourite(name.value, url.value);
            this.newFav.close();
            this.root.style.setProperty("--filter", "none");
            this.root.style.setProperty("--block-index", "-2");
            name.value = "";
            url.value = "";
            clearEventListeners();
        };

        var clearEventListeners = () => {
            close.removeEventListener("click", closeFunction);
            create.removeEventListener("click", createFunction);
        };
        close.addEventListener("click", closeFunction);
        create.addEventListener("click", createFunction);
    }

    removeFavourite(fav) {
        this.favourites.forEach((favourite, index) => {
            if (favourite.elementId == fav.id) {
                this.favourites.splice(index, 1);

                fav.remove();

                if (this.sync == true) {
                    chrome.storage.sync.set({ favourites: this.favourites });
                } else {
                    this.refresh();
                }
            }
        });
    }
}

module.exports = {
    favourites,
};

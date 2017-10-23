firebase.initializeApp({
    apiKey: "AIzaSyDBatbo2HFNFFqPJc2AqfM0nBC5GaAFnfw",
    authDomain: "outweb-997a6.firebaseapp.com",
    databaseURL: "https://outweb-997a6.firebaseio.com",
    projectId: "outweb-997a6",
    storageBucket: "outweb-997a6.appspot.com",
    messagingSenderId: "70974067345"
});

const categories = {
    books_and_reference: "Books & Reference",
    business: "Business",
    developer_tools: "Developer Tools",
    education: "Education",
    entertainment: "Entertainment",
    finance: "Finance",
    food_and_drink: "Food & Drink",
    games: "Games",
    government_and_politics: "Government & Politics",
    health_and_fitness: "Health & Fitness",
    kids_and_family: "Kids & Family",
    lifestyle: "Lifestyle",
    music_and_audio: "Music & Audio",
    news_and_magazines: "News & Magazines",
    photo_and_video: "Photo & Video",
    productivity: "Productivity",
    shopping: "Shopping",
    social_networking: "Social Networking",
    sports: "Sports",
    travel_and_navigation: "Travel & Navigation",
    utilities_and_tools: "Utilities & Tools"
};

const storage = {
    get: function (key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    set: function (key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    }
};

let creator, cacheKey, cacheValue;
var content = document.getElementById("content");
const database = firebase.database();
const messaging = firebase.messaging();
const auth = firebase.auth();

function resizeImage(url, height, width) {
    url = url || "";
    return "https://images.weserv.nl/?url=" + url.replace("https://", "").replace("http://", "") + "&h=" + height + "&w=" + width + "&t=squaredown";
}

function sweepElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
}

function scrollElement(element, position, horizontal) {
    const step = (position - (horizontal ? element.scrollLeft : element.scrollTop)) / 8;
    let frame = 0;
    let fresh_scroll = (horizontal ? element.scrollLeft : element.scrollTop);

    if (horizontal) {
        const interval = setInterval(function () {
            fresh_scroll += step;
            element.scrollLeft = fresh_scroll;
            frame++;
            if (frame === 8) clearInterval(interval);
        }, 16);
    } else {
        const interval = setInterval(function () {
            fresh_scroll += step;
            element.scrollTop = fresh_scroll;
            frame++;
            if (frame === 8) clearInterval(interval);
        }, 16);
    }
}

let snackbarTimeout;

function showSnackbar(message, hover) {
    document.getElementById("snackbar").innerText = message;
    if (hover) {
        document.getElementById("snackbar").classList.add("hover");
    } else {
        document.getElementById("snackbar").classList.remove("hover");
    }
    document.getElementById("snackbar").classList.add("active");
    clearTimeout(snackbarTimeout);
    snackbarTimeout = setTimeout(function () {
        document.getElementById("snackbar").classList.remove("active");
    }, 1600);
}

document.getElementById("search_input").onfocus = function () {
    scrollElement(content, document.getElementById("search").offsetTop);
};

document.getElementById("search_clear").onclick = function () {
    document.getElementById("search_input").value = "";
    document.getElementById("search_input").oninput();
    document.getElementById("search_input").focus();
};

document.getElementById("search_input").oninput = function () {
    document.getElementById("search_clear").style.display = (document.getElementById("search_input").value.length > 0) ? "block" : "none";
    document.getElementById("search").className = "";
}

document.getElementById("search_input").onkeydown = function (event) {
    if (event.which !== 13 && event.keyCode !== 13) return;
    if (document.getElementById("search_input").value.length === 0) return;
    document.getElementById("search").className = "progress";

    fetch("https://us-central1-outweb-997a6.cloudfunctions.net/search?query=" + document.getElementById("search_input").value)
        .then(function (response) {
            return response.json();
        }).then(function (response) {
            if (Object.keys(response).length === 0) {
                document.getElementById("search").className = "message";
                document.getElementById("search_message").innerText = "No results.";
                return;
            }

            document.getElementById("search").className = "output";
            const parent = document.getElementById("search_output");
            sweepElement(parent);

            Object.keys(response).forEach(function (key) {
                const value = response[key];

                const item = document.createElement("div");
                item.classList.add("media_item", "ripple");
                item.onclick = function () {
                    cacheKey = key;
                    cacheValue = value;
                    window.history.pushState({}, "", "/" + key);
                    window.onpopstate();
                };

                const icon = document.createElement("img");
                icon.className = "media_item_icon";
                icon.onerror = function () {
                    icon.onerror = null;
                    icon.src = "/failure_icon.png";
                }
                icon.src = resizeImage(value.icon, 144, 144);
                item.appendChild(icon);

                creator = document.createElement("div");
                creator.className = "media_item_name";
                creator.innerText = value.name;
                item.appendChild(creator);

                creator = document.createElement("div");
                creator.className = "media_item_rating";
                creator.innerHTML = (value.rating || 0).toFixed(1);
                item.appendChild(creator);

                const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                star.setAttributeNS(null, "viewBox", "0 0 24 24");
                star.classList.add("media_item_star");
                creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
                creator.setAttributeNS(null, "d", "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z");
                star.appendChild(creator);
                item.appendChild(star);

                parent.insertBefore(item, parent.firstChild);
            });
        }).catch(function (error) {
            document.getElementById("search").className = "message";
            document.getElementById("search_message").innerText = "No internet connection.";
        });
};

database.ref("websites").orderByChild("featured").equalTo(true).once("value").then(function (snapshot) {
    const parent = document.getElementById("featured");
    snapshot = snapshot.val();
    const keys = Object.keys(snapshot);
    const done = [];

    while (done.length < Math.min(5, keys.length)) {
        const random = Math.floor(Math.random() * keys.length);
        if (!done.includes(random)) {
            done.push(random);
            const key = keys[random];
            const value = snapshot[key];

            const item = document.createElement("div");
            item.classList.add("featured", "ripple");

            item.onclick = function () {
                cacheKey = key;
                cacheValue = value;
                window.history.pushState({}, "", "/" + key);
                window.onpopstate();
            };

            const image = document.createElement("img");
            image.className = "featured_image";
            image.onerror = function () {
                image.onerror = null;
                image.src = "/failure_banner.png";
            }
            image.src = resizeImage(value.image, 288, 576);
            item.appendChild(image);

            const icon = document.createElement("img");
            icon.className = "featured_icon";
            icon.onerror = function () {
                icon.onerror = null;
                icon.src = "/failure_icon.png";
            }
            icon.src = resizeImage(value.icon, 144, 144);
            item.appendChild(icon);

            creator = document.createElement("div");
            creator.className = "featured_name";
            creator.innerText = value.name || "";
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "featured_headline";
            creator.innerText = value.headline || "";
            item.appendChild(creator);

            parent.appendChild(item);
        }
    }
});

function retrieveBundle(title, referenceInit, referenceScroll) {
    const media = document.createElement("div");
    media.classList = "media";
    content.appendChild(media);

    creator = document.createElement("div");
    creator.classList = "media_title";
    creator.innerText = title;
    media.appendChild(creator);

    const bundle = document.createElement("div");
    bundle.classList = "media_bundle";
    media.appendChild(bundle);

    const left = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    left.setAttributeNS(null, "viewBox", "0 0 24 24");
    left.classList.add("media_left");
    left.onclick = () => scrollElement(bundle, bundle.scrollLeft - 96, true);
    creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
    creator.setAttributeNS(null, "d", "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z");
    left.appendChild(creator);
    media.appendChild(left);

    const right = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    right.setAttributeNS(null, "viewBox", "0 0 24 24");
    right.classList.add("media_right");
    right.onclick = () => scrollElement(bundle, bundle.scrollLeft + 96, true);
    creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
    creator.setAttributeNS(null, "d", "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z");
    right.appendChild(creator);
    media.appendChild(right);

    const render = function (snapshot) {
        sweepElement(bundle);
        if (!snapshot.val()) content.removeChild(media);
        snapshot.forEach(function (snapshot) {
            const key = snapshot.key;
            const value = snapshot.val();

            const item = document.createElement("div");
            item.classList.add("media_item", "ripple");
            item.onclick = function () {
                cacheKey = key;
                cacheValue = value;
                window.history.pushState({}, "", "/" + key);
                window.onpopstate();
            };

            const icon = document.createElement("img");
            icon.className = "media_item_icon";
            icon.onerror = function () {
                icon.onerror = null;
                icon.src = "/failure_icon.png";
            }
            icon.src = resizeImage(value.icon, 144, 144);
            item.appendChild(icon);

            creator = document.createElement("div");
            creator.className = "media_item_name";
            creator.innerText = value.name;
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "media_item_rating";
            creator.innerHTML = (value.rating || 0).toFixed(1);
            item.appendChild(creator);

            const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
            star.classList.add("media_item_star");
            star.setAttributeNS(null, "viewBox", "0 0 24 24");
            creator.setAttributeNS(null, "d", "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z");
            star.appendChild(creator);
            item.appendChild(star);

            bundle.insertBefore(item, bundle.firstChild);
        });
    };

    referenceInit.once("value").then(render);

    let scrolled = false;
    bundle.onscroll = function () {
        if (scrolled) return;
        scrolled = true;
        referenceScroll.once("value").then(render);
    };
}

retrieveBundle("Recently added", database.ref("websites").limitToLast(7), database.ref("websites").limitToLast(20));

Object.keys(categories).forEach(function (key) {
    const referenceInit = database.ref("websites").orderByChild("category").equalTo(key).limitToLast(7);
    const referenceScroll = database.ref("websites").orderByChild("category").equalTo(key);
    retrieveBundle(categories[key], referenceInit, referenceScroll);
});

creator = document.createElement("button");
creator.id = "twitter";
creator.className = "ripple";
creator.innerText = "Follow Outweb on Twitter";
creator.onclick = () => window.open("https://twitter.com/outwebdotio");
content.appendChild(creator);

function expand(key, value) {
    if (!key || !value) {
        window.history.back();
        showSnackbar("Application not found.");
        return;
    }

    const parent = document.getElementById("expand_content");
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    parent.appendChild(document.importNode(document.querySelector("#expand_template").content, true));

    document.getElementById("expand").onclick = function (event) {
        if (event.target !== document.getElementById("expand")) return;
        document.getElementById("expand").onclick = null;
        window.history.back();
    };

    document.getElementById("expand_icon").onerror = function () {
        document.getElementById("expand_icon").onerror = null;
        document.getElementById("expand_icon").src = "/failure_icon.png";
    }

    document.getElementById("expand_icon").src = resizeImage(value.icon, 144, 144);
    document.getElementById("expand_name").innerText = value.name;
    document.getElementById("expand_category").innerText = categories[value.category];
    document.getElementById("expand_description").innerText = value.description || "Description not available.";
    document.getElementById("expand_url").innerText = value.url;

    document.getElementById("expand_down").onclick = function () {
        scrollElement(document.getElementById("expand"), document.getElementById("expand_spacing").clientHeight);
    };

    document.getElementById("expand_google").onclick = function () {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function () {
            expand(key, value);
        });
    };

    document.getElementById("expand_launch").onclick = function () {
        try {
            ga("send", "event", "Application", "launch", value.url);
        } catch (e) {}

        window.open(value.url);
    };

    document.getElementById("expand_share").onclick = function () {
        if (navigator.share !== undefined) {
            navigator.share({
                title: "Take a look at \"" + value.name + "\"",
                url: window.location.href
            });
            return;
        }

        try {
            const copy = document.createElement("input");
            copy.value = window.location.href;
            document.body.appendChild(copy);
            copy.select();
            document.execCommand("copy");
            document.body.removeChild(copy);
            showSnackbar("Link copied to clipboard.", true);
        } catch (e) {
            prompt("Copy this link: ", window.location.href);
        }
    };

    database.ref("arithmetic").child(key).once("value").then(function (snapshot) {
        snapshot = snapshot.val() || {};

        const r1 = snapshot.r1 || 0;
        const r2 = snapshot.r2 || 0;
        const r3 = snapshot.r3 || 0;
        const r4 = snapshot.r4 || 0;
        const r5 = snapshot.r5 || 0;

        const max = Math.max(r1, r2, r3, r4, r5);
        const sum = r1 + r2 + r3 + r4 + r5;
        const average = (sum > 0 ? (r1 * 1 + r2 * 2 + r3 * 3 + r4 * 4 + r5 * 5) / sum : 0).toFixed(1);

        document.getElementById("expand_rating_score").innerText = average;
        document.getElementById("expand_rating_cover").style.width = 65 - 13 * average + "px";
        document.getElementById("expand_rating_users").innerText = "By " + sum + " user" + (sum !== 1 ? "s" : "");
        document.getElementById("expand_rating_5").style.width = (r5 / max * 100) + "%";
        document.getElementById("expand_rating_4").style.width = (r4 / max * 100) + "%";
        document.getElementById("expand_rating_3").style.width = (r3 / max * 100) + "%";
        document.getElementById("expand_rating_2").style.width = (r2 / max * 100) + "%";
        document.getElementById("expand_rating_1").style.width = (r1 / max * 100) + "%";
    });

    let status = 0;

    document.getElementById("expand").onscroll = function () {
        if ((status !== 0 && document.getElementById("expand").scrollTop < parent.clientHeight - 320) || status === 2) return;
        status = (status === 1) ? 2 : 1;

        database.ref("feedback").child(key).limitToLast(status === 2 ? 100 : 3).orderByChild("timestamp").once("value").then(function (snapshot) {
            const parent = document.getElementById("expand_review");
            sweepElement(parent);
            let svg, path;

            snapshot.forEach(function (data) {
                data = data.val();

                const item = document.createElement("div");
                item.className = "expand_review_item";
                parent.insertBefore(item, parent.firstChild);

                const image = document.createElement("img");
                image.onerror = function () {
                    image.onerror = null;
                    image.src = "/failure_profile.png";
                };
                image.className = "expand_review_image";
                image.src = resizeImage(data.image, 144, 144);
                item.appendChild(image);

                creator = document.createElement("div");
                creator.className = "expand_review_title";
                creator.innerHTML = data.name || "Anonymous";
                item.appendChild(creator);

                const rating = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
                rating.classList.add("expand_review_rating");
                rating.setAttributeNS(null, "viewBox", "0 0 130 30");
                creator.setAttributeNS(null, "d", "M14.4 4L18 11l8 1.2-5.7 5.7 1.3 8-7.2-3.7L7.2 26l1.4-8-5.8-5.6 8-1.2zm26 0L44 11l8 1.2-5.8 5.7 1.4 8-7.2-3.7-7.2 3.8 1.3-8-5.8-5.6 8-1.2zM66 4l3.5 7.2 8 1.2-5.8 5.7 1.4 8-7-3.7-7.3 3.8 1.3-8-5.8-5.6 8-1.2zm25.4 0L95 11l8 1.2-5.8 5.7 1.4 8-7.2-3.7L84 26l1.5-8-5.8-5.6 8-1.2zM116 4l3.7 7.2 8 1.2L122 18l1.3 8-7.2-3.7-7 3.8 1.3-8-6-5.6 8.2-1.2z");
                rating.appendChild(creator);
                item.appendChild(rating);

                creator = document.createElement("div");
                creator.className = "expand_review_cover";
                creator.style.left = 13 * (data.rating || 0) + 64 + "px";
                creator.style.width = 13 * (5 - (data.rating || 0)) + "px";
                item.appendChild(creator);

                if (data.comment) {
                    creator = document.createElement("div");
                    creator.className = "expand_review_comment";
                    creator.innerText = data.comment;
                    item.appendChild(creator);
                }
            });

            if (!snapshot.val()) {
                creator = document.createElement("div");
                creator.className = "expand_review_empty";
                creator.innerText = "No feedback yet.";
                parent.appendChild(creator);
            }
        });
    }

    setTimeout(function () {
        document.getElementById("expand").onscroll();
    }, 320);

    if (!auth.currentUser) return;

    document.getElementById("expand_account_image").onerror = function () {
        document.getElementById("expand_account_image").onerror = null;
        document.getElementById("expand_account_image").src = "/failure_profile.png";
    };
    document.getElementById("expand_account_image").src = resizeImage(auth.currentUser.photoURL, 160, 160);
    document.getElementById("expand_account_name").innerText = auth.currentUser.displayName || "Anonymous";
    document.getElementById("expand_auth").style.display = "none";
    document.getElementById("expand_account").style.display = "block";
    document.getElementById("expand_account_button").innerText = "Write comment";

    database.ref("users").child(auth.currentUser.uid).child("feedback").child(key).once("value").then(function (snapshot) {
        snapshot = snapshot.val() || {};
        let current = snapshot.rating || 0;

        document.getElementById("expand_account_cover").style.width = (185 - current * 37) + "px";
        document.getElementById("expand_account_comment").value = snapshot.comment || "";

        document.getElementById("expand_account_rating").onclick = function (event) {
            const number = Math.max(1, Math.min(5, Math.ceil(event.offsetX / 37)));
            current = (number === current) ? 0 : number;
            document.getElementById("expand_account_cover").style.width = (185 - current * 37) + "px";

            database.ref("users").child(auth.currentUser.uid).child("feedback").child(key).update({
                image: auth.currentUser.photoURL,
                name: auth.currentUser.displayName,
                rating: current || null,
                timestamp: Date.now()
            });
        };

        let comment = false;

        document.getElementById("expand_account_button").onclick = function () {
            const value = document.getElementById("expand_account_comment").value.trim().replace(/\s\s+/g, " ");
            comment = !comment;
            if (comment) {
                document.getElementById("expand_account_button").innerText = "Send comment";
                document.getElementById("expand_account_rating").style.display = "none";
                document.getElementById("expand_account_cover").style.display = "none";
                document.getElementById("expand_account_comment").style.display = "block";
                document.getElementById("expand_account_comment").focus();
            } else {
                document.getElementById("expand_account_button").innerText = "Write comment";
                document.getElementById("expand_account_rating").style.display = "block";
                document.getElementById("expand_account_cover").style.display = "block";
                document.getElementById("expand_account_comment").style.display = "none";

                database.ref("users").child(auth.currentUser.uid).child("feedback").child(key).update({
                    image: auth.currentUser.photoURL,
                    name: auth.currentUser.displayName,
                    comment: value || null,
                    timestamp: Date.now()
                });
            }
        };
    });
}

function submit() {
    const parent = document.getElementById("submit");
    sweepElement(parent);
    parent.appendChild(document.importNode(document.querySelector("#submit_template").content, true));

    document.getElementById("blocker").onclick = function (event) {
        document.getElementById("blocker").onclick = null;
        window.history.back();
    };

    const submit_input = document.getElementById("submit_input");
    const submit_output = document.getElementById("submit_output");
    const submit_category = document.getElementById("submit_category");
    const submit_websites = document.getElementById("submit_websites");

    submit_input.oninput = function () {
        const manifest = submit_input.value;
        submit_input.className = submit_category.className = "";
        if (manifest.slice(0, 8) !== "https://" || manifest.slice(-5) !== ".json") return;
        submit_input.className = "pending";

        fetch("https://cors-anywhere.herokuapp.com/" + manifest)
            .then(function (response) {
                return response.json();
            })
            .then(function (response) {
                submit_input.className = "success";
                if (!response) {
                    submit_category.className = "";
                    return;
                }

                sweepElement(submit_category);
                submit_category.className = "active";

                Object.keys(categories).forEach(function (category) {
                    const creator = document.createElement("div");
                    creator.classList.add("ripple");
                    creator.innerText = categories[category];
                    creator.onclick = function (event) {
                        submit_input.value = "";
                        submit_input.oninput();

                        database.ref("submit").push({
                            manifest: manifest || null,
                            category: category || null
                        });

                        showSnackbar("Thank you for adding/updating your manifest.");
                    };
                    submit_category.appendChild(creator);
                });
            }).catch(function (error) {
                console.log(error);
                submit_input.className = "failure";
                submit_category.className = "";
            });
    };

    submit_input.oninput();

    database.ref("submit").orderByChild("status").equalTo("pending").off();
    database.ref("submit").orderByChild("status").equalTo("pending").on("value", function (snapshot) {
        sweepElement(submit_websites);

        snapshot.forEach(function (snapshot) {
            const key = snapshot.key;
            snapshot = snapshot.val();
            const item = document.createElement("div");
            item.className = "submit_website_item";
            submit_websites.appendChild(item);

            creator = document.createElement("img");
            creator.className = "submit_website_icon";
            creator.src = resizeImage(snapshot.icon, 144, 144);
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "submit_website_name";
            creator.innerText = snapshot.name;
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "submit_website_category";
            creator.innerText = categories[snapshot.category];
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "submit_website_description";
            creator.innerText = snapshot.description ||  "Description not available.";
            item.appendChild(creator);

            creator = document.createElement("div");
            creator.className = "submit_website_url";
            creator.innerText = snapshot.url;
            item.appendChild(creator);

            const action = document.createElement("div");
            action.className = "submit_website_action";
            item.appendChild(action);

            creator = document.createElement("button");
            creator.className = "ripple";
            creator.innerText = "Website";
            action.appendChild(creator);

            creator.onclick = function () {
                window.open(snapshot.url);
            };

            creator = document.createElement("button");
            creator.className = "ripple";
            creator.innerText = "Manifest";
            action.appendChild(creator);

            creator.onclick = function () {
                window.open(snapshot.manifest);
            };

            creator = document.createElement("button");
            creator.className = "ripple";
            creator.innerText = "Accept";
            action.appendChild(creator);

            creator.onclick = function () {
                database.ref("submit").child(key).child("status").set("accept");
                showSnackbar("Accept \"" + snapshot.name + "\"");
            };

            creator = document.createElement("button");
            creator.className = "ripple";
            creator.innerText = "Notification";
            action.appendChild(creator);

            creator.onclick = function () {
                database.ref("submit").child(key).child("status").set("notification");
                showSnackbar("Notification \"" + snapshot.name + "\"");
            };

            creator = document.createElement("button");
            creator.className = "ripple";
            creator.innerText = "Delete";
            action.appendChild(creator);

            creator.onclick = function () {
                database.ref("submit").child(key).child("status").set("delete");
                showSnackbar("Delete \"" + snapshot.name + "\"");
            };
        });

        if (!snapshot.val()) {
            creator = document.createElement("div");
            creator.className = "submit_empty";
            submit_websites.appendChild(creator);
        }

        submit_websites.style.display = "block";
    });
}

function account() {
    const parent = document.getElementById("account");
    sweepElement(parent);
    parent.appendChild(document.importNode(document.querySelector("#account_template").content, true));

    document.getElementById("blocker").onclick = function (event) {
        document.getElementById("blocker").onclick = null;
        window.history.back();
    };

    const account_review = document.getElementById("account_review");

    account_review.onscroll = function () {
        document.getElementById("account_image").className = (account_review.scrollTop > 0) ? "active" : "";
        document.getElementById("account_name").className = (account_review.scrollTop > 0) ? "active" : "";
        document.getElementById("account_email").className = (account_review.scrollTop > 0) ? "active" : "";
    };

    document.getElementById("account_google").onclick = function () {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function (result) {
            account();
        });
    };

    if (!auth.currentUser) return;

    document.getElementById("account_auth").style.display = "none";
    document.getElementById("account_progress").style.display = "block";
    document.getElementById("account_image").onerror = function () {
        document.getElementById("account_image").onerror = null;
        document.getElementById("account_image").src = "/failure_profile.png";
    };
    document.getElementById("account_image").src = resizeImage(auth.currentUser.photoURL, 160, 160);
    document.getElementById("account_name").innerText = auth.currentUser.displayName || "Anonymous";
    document.getElementById("account_email").innerText = auth.currentUser.email || "Unknown email";

    database.ref("users").child(auth.currentUser.uid).child("feedback").orderByChild("timestamp").once("value").then(function (snapshot) {
        document.getElementById("account_progress").style.display = "none";
        const account_charge = document.createElement("button");
        account_charge.id = "account_charge";
        account_charge.className = "ripple";
        account_charge.innerText = "Show more reviews";
        account_review.appendChild(account_charge);

        const keys = [];
        snapshot.forEach(function (item) {
            keys.push(item.key);
        });
        keys.reverse();
        snapshot = snapshot.val();

        let charge = 0;

        account_charge.onclick = function () {
            account_charge.style.visibility = "hidden";
            charge += 8;

            for (let counter = charge - 8; counter < Math.min(charge, keys.length); counter++) {
                const key = keys[counter];
                database.ref("websites").child(key).once("value").then(function (website) {
                    const feedback = snapshot[key];
                    website = website.val();

                    const item = document.createElement("div");
                    item.classList.add("account_review_item", "ripple");
                    item.onclick = function () {
                        cacheKey = key;
                        cacheValue = website;
                        window.history.pushState({}, "", "/" + key);
                        window.onpopstate();
                    };
                    account_review.insertBefore(item, account_review.lastChild);

                    const image = document.createElement("img");
                    image.className = "account_review_image";
                    image.onerror = function () {
                        image.onerror = null;
                        image.src = "/failure_icon.png";
                    }
                    image.src = resizeImage(website.icon, 144, 144);
                    item.appendChild(image);

                    creator = document.createElement("div");
                    creator.className = "account_review_title";
                    creator.innerText = website.name;
                    item.appendChild(creator);

                    const rating = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    creator = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    rating.classList.add("account_review_rating");
                    rating.setAttributeNS(null, "viewBox", "0 0 130 30");
                    creator.setAttributeNS(null, "d", "M14.4 4L18 11l8 1.2-5.7 5.7 1.3 8-7.2-3.7L7.2 26l1.4-8-5.8-5.6 8-1.2zm26 0L44 11l8 1.2-5.8 5.7 1.4 8-7.2-3.7-7.2 3.8 1.3-8-5.8-5.6 8-1.2zM66 4l3.5 7.2 8 1.2-5.8 5.7 1.4 8-7-3.7-7.3 3.8 1.3-8-5.8-5.6 8-1.2zm25.4 0L95 11l8 1.2-5.8 5.7 1.4 8-7.2-3.7L84 26l1.5-8-5.8-5.6 8-1.2zM116 4l3.7 7.2 8 1.2L122 18l1.3 8-7.2-3.7-7 3.8 1.3-8-6-5.6 8.2-1.2z");
                    rating.appendChild(creator);
                    item.appendChild(rating);

                    creator = document.createElement("div");
                    creator.className = "account_review_cover";
                    creator.style.left = 13 * (feedback.rating || 0) + 64 + "px";
                    creator.style.width = 13 * (5 - (feedback.rating || 0)) + "px";
                    item.appendChild(creator);

                    if (feedback.rating > 0 && feedback.comment) {
                        creator = document.createElement("div");
                        creator.className = "account_review_public";
                        creator.innerText = "Public";
                        item.appendChild(creator);
                    }

                    if (feedback.comment) {
                        creator = document.createElement("div");
                        creator.className = "account_review_comment";
                        creator.innerText = feedback.comment;
                        item.appendChild(creator);
                    }
                });
            }

            if (keys.length === 0) {
                creator = document.createElement("div");
                creator.id = "account_intro";
                creator.innerHTML = "<b>Now you can start giving feedback!</b><br>Only reviews with a rating and a comment are publicly visible. Public reviews will be shown with your name and your profile image.";
                account_review.appendChild(creator);
            }

            if (keys.length > charge) account_charge.style.visibility = "visible";
        };

        account_charge.onclick();
    });
}

let notifications = (storage.get("notifications") === "true") ? true : false;
const notify = document.getElementById("navigation_notify");
const notify_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
const notify_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
notify_svg.setAttributeNS(null, "viewBox", "0 0 24 24");
notify_path.setAttributeNS(null, "d", "M16,17V10.5C16,8 14,6 11.5,6C9,6 7,8 7,10.5V17H16M18,16L20,18V19H3V18L5,16V10.5C5,7.43 7.13,4.86 10,4.18V3.5A1.5,1.5 0 0,1 11.5,2A1.5,1.5 0 0,1 13,3.5V4.18C15.86,4.86 18,7.43 18,10.5V16M11.5,22A2,2 0 0,1 9.5,20H13.5A2,2 0 0,1 11.5,22M19.97,10C19.82,7.35 18.46,5 16.42,3.58L17.85,2.15C20.24,3.97 21.82,6.79 21.97,10H19.97M6.58,3.58C4.54,5 3.18,7.35 3,10H1C1.18,6.79 2.76,3.97 5.15,2.15L6.58,3.58Z");
notify_svg.appendChild(notify_path);
notify.appendChild(notify_svg);
notify_svg.style.display = notifications ? "block" : "none";

notify.onclick = function () {
    notify.disabled = true;
    notifications = !notifications;
    notify_svg.style.display = notifications ? "block" : "none";

    messaging.requestPermission()
        .then(function () {
            return messaging.getToken();
        })
        .then(function (token) {
            notify.disabled = false;
            storage.set("notifications", notifications);
            database.ref("notifications").child(token).set(notifications);
        })
        .catch(function (error) {
            console.error(error);
            notify.disabled = false;
            notifications = false;
            storage.set("notifications", "false");
            notify_svg.style.display = "none";

            let message;
            if (error.code === "messaging/permission-default") return;
            if (error.code === "messaging/permission-blocked") message = "Permission blocked. Open your browser settings and unblock this website.";
            if (error.code === "messaging/unsupported-browser") message = "Your browser doesn't support push notifications yet.";
            showSnackbar(message || "Something went wrong. Please try again later.");
        });
};

document.getElementById("navigation_apps").onclick = function () {
    if (window.location.pathname === "/") return;
    window.history.back();
};

document.getElementById("navigation_account").onclick = function () {
    if (window.location.pathname === "/account") return;
    if (window.location.pathname === "/") window.history.pushState({}, "", "/account");
    else window.history.replaceState({}, "", "/account");
    window.onpopstate();
};

document.getElementById("navigation_submit").onclick = function () {
    if (window.location.pathname === "/submit") return;
    if (window.location.pathname === "/") window.history.pushState({}, "", "/submit");
    else window.history.replaceState({}, "", "/submit");
    window.onpopstate();
};

window.onpopstate = function () {
    const pathname = window.location.pathname.substring(1);

    if (pathname === "account") {
        account();
        document.getElementById("navigation").className = "account";
        document.getElementById("account").className = document.getElementById("blocker").className = "active";
        document.getElementById("submit").className = document.getElementById("expand").className = "";
    }

    if (pathname === "") {
        document.getElementById("navigation").className = "apps";
        document.getElementById("blocker").className = document.getElementById("expand").className = "";
        document.getElementById("account").className = document.getElementById("submit").className = "";
    }

    if (pathname === "submit") {
        submit();
        document.getElementById("navigation").className = "submit";
        document.getElementById("submit").className = document.getElementById("blocker").className = "active";
        document.getElementById("account").className = document.getElementById("expand").className = "";
    }

    if (Number.isInteger(parseInt(pathname))) {
        document.getElementById("blocker").className = "";
        document.getElementById("account").className = "";
        document.getElementById("submit").className = "";
        if (cacheKey == pathname) {
            expand(cacheKey, cacheValue);
            document.getElementById("expand").scrollTop = 0;
            document.getElementById("expand").className = "active";
        } else {
            database.ref("websites").child(pathname).once("value").then(function (snapshot) {
                expand(snapshot.key, snapshot.val());
                document.getElementById("expand").scrollTop = 0;
                document.getElementById("expand").className = "active";
            });
        }
    }
}

const pathname = window.location.pathname;
if (pathname !== "/") {
    setTimeout(function () {
        window.history.replaceState({}, "", "/");
        window.history.pushState({}, "", pathname);
        window.onpopstate();
    }, 800);
} else {
    window.onpopstate();
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/worker.js").then(function (worker) {
        messaging.useServiceWorker(worker);
        messaging.getToken().then(function (token) {
            database.ref("notifications").child(token).set(storage.get("notifications") === "true" ? true : false);
        }).catch(function () {
            storage.set("notifications", "false");
        });

        messaging.onTokenRefresh(function () {
            messaging.getToken().then(function (token) {
                database.ref("notifications").child(token).set(storage.get("notifications") === "true" ? true : false);
            }).catch(function () {
                storage.set("notifications", "false");
            });
        });
    });
}

(function (i, s, o, g, r, a, m) {
    i["GoogleAnalyticsObject"] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o), m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");

ga("create", "UA-89690004-1", "auto");
ga("set", "anonymizeIp", true);
ga("send", "pageview");
ga("send", "event", "Version", "render", "v5.0");
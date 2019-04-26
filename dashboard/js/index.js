function ginit() { }

const backend_url = "https://asia-northeast1-url-redirect-bb.cloudfunctions.net/redirect-node";

var app = new Vue({
    el: '#app',
    data: {
        islogin: false,
        username: "",
        InputUrl: "",
        CustomKey: "",
        FlashStatus: "",
        FlashData: {},
        FormProccessing: false,
        entries: null
    },
    methods: {
        create() {
            this.FlashStatus = "";
            this.FormProccessing = true;
            let GoogleAuth = gapi.auth2.getAuthInstance();
            let id_token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            let data = {
                token: id_token,
                op: "create",
                url: this.InputUrl,
            };
            if (this.CustomKey !== "") data.key = this.CustomKey;
            $.get({
                url: backend_url,
                data: data,
            }).done(data => {
                this.InputUrl = "";
                this.CustomKey = "";
                this.FlashStatus = "success";
                this.FlashData = data;
                app.query();
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
            }).always(() => {
                this.FormProccessing = false;
            });
        },
        query() {
            let GoogleAuth = gapi.auth2.getAuthInstance();
            let id_token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            let data = {
                token: id_token,
                op: "query"
            };
            $.get({
                url: backend_url,
                data: data,
            }).done(data => {
                this.entries = data.data;
                console.log(data);
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
                this.entries = []
            });
        },
        logout() {
            let GoogleAuth = gapi.auth2.getAuthInstance();
            GoogleAuth.signOut();
            this.islogin = false;
            this.FlashStatus = "";
            this.entries = []
        },
        format_date(s) {
            return new Date(s / 1000).toLocaleDateString("en-US", { month: 'short', year: 'numeric', day: '2-digit' });
        },
        remove_http(s) {
            return s.replace(/^https?:\/\//i, "");
        },
        delete_confirm(e) {
            let target = e.currentTarget;
            let key = target.dataset.key;
            tippy(target, {
                interactive: true,
                appendTo: "parent",
                trigger: "manual",
                placement: "bottom",
                arrow: true,
                theme: "light-border",
                distance: 5,
                duration: [300, 50],
                onHidden: (e) => {
                    e.destroy();
                },
                content: document.querySelector(`.entry[data-key="${key}"] .delete-confirm-template`).innerHTML
            });
            target._tippy.show();
            $(`.tippy-tooltip .confirm-tip-btn[data-key="${key}"]`).one('click', (e) => {
                let key = e.currentTarget.dataset.key;
                document.querySelector(`.entry-delete-btn[data-key="${key}"]`)._tippy.hide();
                app.delete_entry(key);
            });
            $(`.entry[data-key="${key}"]`).one("mouseleave", (e) => {
                document.querySelector(`.entry-delete-btn[data-key="${e.currentTarget.dataset.key}"]`)._tippy.hide();
            });
        },
        delete_entry(key) {
            let GoogleAuth = gapi.auth2.getAuthInstance();
            let id_token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            let data = {
                token: id_token,
                op: "delete",
                key: key
            };
            $.get({
                url: backend_url,
                data: data,
            }).done(() => {
                let mask = $(".entry[data-key=\"" + key + "\"] > .entry-deleted-mask");
                mask.addClass("show");
                setTimeout(() => {
                    mask.removeClass("show");
                    this.entries.splice(this.entries.findIndex((el) => {
                        return el.key === key;
                    }), 1);
                }, 1000);
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
            });
        }
    }
});

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    app.islogin = true;
    app.username = profile.getName();
    app.query();
}


var clipboard = new ClipboardJS('.clip-btn');

clipboard.on('success', function (e) {
    tippy(e.trigger, {
        content: "Copied!",
        trigger: "manual",
        placement: "right",
        duration: [150, 200]
    });
    e.trigger._tippy.show();
    setTimeout(() => {
        e.trigger._tippy.hide();
    }, 700);
    e.clearSelection();
});

window.addEventListener('scroll', () => tippy.hideAll({ duration: 0 }));
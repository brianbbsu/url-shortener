function ginit(){}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('Name: ' + profile.getName());
    console.log('Email: ' + profile.getEmail());
    app.islogin = true;
    app.username = profile.getName();
    app.query();
}

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
        create(){
            this.FlashStatus = "";
            this.FormProccessing = true;
            let GoogleAuth = gapi.auth2.getAuthInstance();
            let id_token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
            let data = {
                token: id_token,
                op: "create",
                url: this.InputUrl,
            };
            if(this.CustomKey !== "")data.key = this.CustomKey;
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
        query(){
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
        logout(){
            let GoogleAuth = gapi.auth2.getAuthInstance();
            GoogleAuth.signOut();
            this.islogin = false;
            this.FlashStatus = "";
            this.entries = []
        }, 
        format_date(s){
            return new Date(s/1000).toLocaleDateString("en-US", {month: 'short', year: 'numeric', day: '2-digit'});
        },
        remove_http(s){
            return s.replace(/^https?:\/\//i, "");
        },
        delete_entry(e){
            console.log(e.currentTarget.dataset);
            let key = e.currentTarget.dataset.key;
            let index = e.currentTarget.dataset.index;
            if(confirm("Delete entry with key '" + e.currentTarget.dataset.key + "'?"))
            {
                let GoogleAuth = gapi.auth2.getAuthInstance();
                let id_token = GoogleAuth.currentUser.get().getAuthResponse().id_token;
                let data = {
                    token: id_token,
                    op: "delete",
                    key: e.currentTarget.dataset.key
                };
                $.get({
                    url: backend_url,
                    data: data,
                }).done(() => {
                    let mask = $(".entry-deleted-mask[data-key=\"" + key + "\"]");
                    mask.addClass("show");
                    setTimeout(() => {
                        mask.removeClass("show");
                        this.entries.splice(index, 1);
                    }, 1500);
                }).fail(jqXHR => {
                    this.FlashData = jqXHR.responseText;
                    this.FlashStatus = "failed";
                });
                
            }
        }
    }
});

var clipboard = new ClipboardJS('.clip-btn');

clipboard.on('success', function(e) {
    tippy(e.trigger, {content: "Copied!", trigger: "manual", placement: "right"});
    e.trigger._tippy.show();
    setTimeout(() => {
        e.trigger._tippy.hide();
    }, 1000);
    e.clearSelection();
});

window.addEventListener('scroll', () => tippy.hideAllPoppers())
function ginit(){}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('Name: ' + profile.getName());
    console.log('Email: ' + profile.getEmail());
    app.islogin = true;
    app.username = profile.getName();
    app.query();
}

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
        entries: []
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
                url: "https://asia-northeast1-url-redirect-bb.cloudfunctions.net/redirect-node",
                data: data,
            }).done(data => {
                this.InputUrl = "";
                this.CustomKey = "";
                this.FlashStatus = "success";
                this.FlashData = data;
                console.log(data);
                app.query();
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
                console.log("Error: " + jqXHR.responseText);
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
                url: "https://asia-northeast1-url-redirect-bb.cloudfunctions.net/redirect-node",
                data: data,
            }).done(data => {
                this.entries = data.data;
                console.log(data);
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
                this.entries = []
                console.log("Error: " + jqXHR.responseText);
            })
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
        }
    }
});

new ClipboardJS('.clip-btn');
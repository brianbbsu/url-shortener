function ginit(){
}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('Name: ' + profile.getName());
    console.log('Email: ' + profile.getEmail());
    app.islogin = true;
}

function fsubmit(event){
    console.log(event);
    event.preventDefault();
    return false;
}

var app = new Vue({
    el: '#app',
    data: {
        message: "Hello, bb.",
        islogin: false,
        InputUrl: "",
        CustomKey: "",
        FlashStatus: "",
        FlashData: {
        },
        FormProccessing: false
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
            }).fail(jqXHR => {
                this.FlashData = jqXHR.responseText;
                this.FlashStatus = "failed";
                console.log("Error: " + jqXHR.responseText);
            }).always(() => {
                this.FormProccessing = false;  
            });
        }
    }
});

new ClipboardJS('.clip-btn');

/*
function gonload(){
    GoogleAuth = gapi.auth2.getAuthInstance();
    GoogleAuth.isSignedIn.listen(st => {app.islogin = st});
}*/
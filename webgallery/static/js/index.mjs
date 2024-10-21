import {
    addImage,
    deleteComment,
    deleteImage,
    addComment,
    getImage,
    getComments,
    getUsers,
    signin,
    signup,
    getUsername,
    signout
} from "./api.mjs";


let select = 0;
let page = 1;
let usr = 1;

let currentImage = null
let currentGallery = "";

function nothing() {}


function renderImage() {
    if (currentImage) {
        document.getElementById("image").setAttribute("src", `/api/account/${currentGallery}/image/${currentImage.id}/`);
        document.getElementById("image-title").innerHTML = currentImage.title;
        document.getElementById("image-author").innerHTML = currentImage.author;
    } else {
        document.getElementById("image").setAttribute("src", "/media/no_image.png");
        document.getElementById("image-title").innerHTML = "No images in gallery";
        document.getElementById("image-author").innerHTML = "Add an image with the form below";
    }
}

function renderComments(comments) {
    let comment = document.getElementById("comments");
    comment.innerHTML = "";
    if (currentImage) {
        for (let i = comments.length - 1; i >= 0; i--) {
            let c = comments[i];
            let element = document.createElement("div");
            element.innerHTML = `<div class="comment_user">&gt;${c.author}</div>
            <div class = "comment_body">
                <div class="comment_content">${c.content}</div>
                <div class="comment_delete">X</div>
            </div> <br>`
            element.className = "comment";
            element.getElementsByClassName("comment_delete")[0].addEventListener("click", function (e) {
                deleteComment(currentImage.id, currentGallery, c._id, nothing);
                updateComments(function () {
                    renderComments([]);
                });
            });
            comment.prepend(element);
        }
    }


}

function updateComments(fail) {
    if (currentImage) {
        getComments(currentImage.id, currentGallery, page, function (res) {
            renderComments(res);
            document.getElementById("page").innerHTML = page.toString();
        }, fail);
    } else {
        page = 1;
        renderComments([]);
        document.getElementById("page").innerHTML = page.toString();
    }
}

function updateUsers(users) {
    //Switch galleries
    for (let i = 0; i < users.length; i++) {
        const a = document.getElementById("sel" + i.toString());
        a.setAttribute("value", users[i].username);
    }
}

function renderAll() {
    renderImage();
    updateComments(function () {
        renderComments([]);
    });
}



function switchGallery(gallery) {
    currentGallery = gallery;
    page = 1;
    select = 0;
    getImage(select, gallery, function(res){
        currentImage = res;
        renderAll();
    }, function(){
        currentImage = null;
        renderAll();
    })
}

function signedOut() {
    document.getElementById("sign-out").className = "invisible"
    document.getElementById("account").className = ""
    document.getElementById("app").className = "gone"
    currentGallery = ""
}

function signedIn(res) {
    document.getElementById("sign-out").className = ""
    document.getElementById("account").className = "gone"
    document.getElementById("app").className = ""
    switchGallery(res.username);
    getImage(select, currentGallery, function (res) {
            currentImage = res;
            renderAll();
        },
        function (res) {});
    getUsers(usr, updateUsers, nothing);
}

//Image selection
document.getElementById("btn-left").addEventListener("click", function () {
    select--;
    getImage(select, currentGallery, function (res) {
            currentImage = res;
            renderAll();
        },
        function (err) {
            select++;
        })
});
document.getElementById("btn-right").addEventListener("click", function () {
    select++;
    getImage(select, currentGallery, function (res) {
            currentImage = res;
            renderAll();
        },
        function (err) {
            select--;
        })
});
//Comment selection
document.getElementById("page-left").addEventListener("click", function () {

    page--;
    updateComments(function () {
        page++;
        document.getElementById("page").innerHTML = page.toString();
    });
});

document.getElementById("page-right").addEventListener("click", function () {
    page++;
    updateComments(function () {
        page--;
        document.getElementById("page").innerHTML = page.toString();
    });
});

//User selection
document.getElementById("account-next").addEventListener("click", function () {

    usr++;
    getUsers(usr, updateUsers, function () {
        usr--;
    });
});

document.getElementById("account-prev").addEventListener("click", function () {
    usr--;
    getUsers(usr, updateUsers, function () {
        usr++;
    });
});




function renderNext() {
    getImage(select, currentGallery, function (res) {
            currentImage = res;
            renderAll();
        },
        function (err) {
            if (select > 0) {
                select--;
                renderNext();
            } else {
                currentImage = null
                renderAll();

            }
        });
}
//Delete image
document.getElementById("image-delete").addEventListener("click", function (e) {
    deleteImage(currentImage.id, currentGallery, function () {
        renderNext();
    });
});
//Add image
document.getElementById("add_image_form").addEventListener("submit", function (e) {
    e.preventDefault();
    const fd = new FormData(document.getElementById("add_image_form"));
    document.getElementById("add_image_form").reset();
    addImage(fd, function (res) {
        if (currentImage == null) {
            currentImage = res;
            currentGallery = getUsername();
            renderAll();
        }
    });
});
//Post comment
document.getElementById("post_message_form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (currentImage) {
        let content = document.getElementById("comment_content").value;
        let imageId = currentImage.id;
        addComment(imageId, currentGallery, content);
        updateComments(function () {
            renderComments([]);
        })

        document.getElementById("post_message_form").reset();
    }
});
//Submit account
document.getElementById("sign-up-btn").addEventListener("click", function (e) {

    e.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    if (username != "" && password != "") {
        signup(username, password, signedIn, nothing);
        document.getElementById("account_form").reset();
    }

});
document.getElementById("sign-in-btn").addEventListener("click", function (e) {
    e.preventDefault();
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    if (username != "" && password != "") {
        signin(username, password, signedIn, nothing);
        document.getElementById("account_form").reset();
    }

});


//Sign out
document.getElementById("sign-out").addEventListener("click", function (e) {
    signout(signedOut, nothing)
});

//Switch galleries
for (let i = 0; i < 6; i++) {
    const a = document.getElementById("sel" + i.toString())
    a.addEventListener("click", function (e) {
        const v = a.getAttribute("value");
        if (v != "") {
            switchGallery(v);
        }
    });
}

select = 0;
page = 1;
window.addEventListener("load", function (e) {
    if (getUsername()) {
        signedIn({
            username: getUsername()
        });
    }

});
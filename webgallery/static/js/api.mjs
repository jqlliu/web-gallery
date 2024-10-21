/*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) _id 
        - (String) title
        - (String) author
        - (Date) date

    comment objects must have the following attributes
        - (String) _id
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date

****************************** */

export function getUsername() {
    return document.cookie.replace(
        /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
        "$1",
    );
}

function handleResponse(res) {
    if (res.status != 200) {
        return res.text().then(text => {
            const message = `${text} (${res.status})`;
            if (res.status != 404) {
                document.getElementById("error-message").innerHTML = message;
            }
            throw new Error(message);
        });
    }
    document.getElementById("error-message").innerHTML = "";
    return res.json();
}


// add an image to the gallery
export function signup(username, password, success, failure) {
    fetch(`/api/signup/`, {
            method: "POST",
            body: JSON.stringify( {
                username: username,
                password: password
            }),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

// add an image to the gallery
export function signin(username, password, success, failure) {
    fetch(`/api/signin/`, {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password
            }),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

export function signout(success, failure) {
    fetch(`/api/account/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}
// add an image to the gallery
export function addImage(fd, success, failure) {
    fetch(`/api/account/${getUsername()}/image`, {
            method: "POST",
            body: fd,
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

// add an image to the gallery
export function getImage(select, gallery, success, failure) {
    if(gallery){
    fetch(`/api/account/${gallery}/image/${select}/content/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
    }
}

// delete an image from the gallery given its imageId
export function deleteImage(imageId, gallery, callback, failure) {

    fetch(`/api/account/${gallery}/image/${imageId}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(callback).
        catch(failure);
}

// add an image to the gallery
export function getComments(imageId, gallery, page, success, failure) {
    fetch(`/api/account/${gallery}/image/${imageId}/comments/${page}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

// add a comment to an image
export function addComment(imageId, gallery, content, success, failure) {
    fetch(`/api/account/${gallery}/image/${imageId}/comments/`, {
            method: "POST",
            body: JSON.stringify({
                content: content
            }),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

// delete a comment to an image
export function deleteComment(imageId, gallery, commentId, success, failure) {
    fetch(`/api/account/${gallery}/image/${imageId}/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

export function getUsers(page, success, failure) {
    fetch(`/api/account/${page}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(handleResponse)
        .then(success)
        .catch(failure);
}

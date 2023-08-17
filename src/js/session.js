
var getSessionStorage = () => {
    const res = {}
    for (var i in sessionStorage) {
        if (sessionStorage.hasOwnProperty(i)) {
            try {
                res[i] = JSON.parse(sessionStorage.getItem(i));
            } catch (error) {
            }
        }
    }
    return res;
}

getSessionStorage()
var myLocationDiv = document.getElementById("myLocation")
var y = document.getElementById("ETA_dataBox");

let options = {
    enableHighAccuracy: true
}

let nearETA = "";

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, options);
    } else {
        myLocationDiv.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    nearETA = "";
    // myLocationDiv.innerHTML = "Latitude: " + position.coords.latitude +
    //     "<br>Longitude: " + position.coords.longitude;

    calDistance(position.coords.latitude, position.coords.longitude);
}

let stopArray = [];

function calDistance(selfLat, selfLong) {
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop')
        .then(response => response.json())
        .then(data => {
            stopArray = [];
            data.data.map((item) => {
                if (getDistanceFromLatLonInKm(item.lat, item.long, selfLat, selfLong) < 0.5) {
                    stopArray.push(
                        {
                            nameInTc: item.name_tc,
                            nameInEn: item.name_en,
                            nameInSc: item.name_sc,
                            stopID: item.stop,
                            stopDistance: (getDistanceFromLatLonInKm(item.lat, item.long, selfLat, selfLong) * 1000).toFixed(1)
                        }
                    );
                    stopArray.sort((a, b) => {
                        return a.stopDistance - b.stopDistance;
                    });
                };
                sessionStorage.setItem("stopArray", JSON.stringify(stopArray));
            });
        });


    let loadData = setInterval(() => {
        let stopArraySessionStorage = JSON.parse(sessionStorage.getItem("stopArray"));
        if (JSON.parse(sessionStorage.getItem("stopArray")).length == 0) {
            y.innerHTML = `
                        <div class="noBusNear">
                            附近冇巴士站呀
                        </div>
            `;
        }
        if (stopArraySessionStorage != null) {
            stopArraySessionStorage.map((stopItem) => {
                etaByStop(stopItem);
            });
            clearInterval(loadData);
        }
    }, 100);
}

function etaByStop(stopItem) {
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopItem.stopID}`)
        .then(response => response.json())
        .then(data => {

            let test = data.data;
            let result = test.reduce(function (r, a) {
                r[a.route] = r[a.route] || [];
                r[a.route].push(a);
                return r;
            }, Object.create(null));

            sessionStorage.setItem(`${stopItem.stopID}`, JSON.stringify(result));

            let getItemTest = JSON.parse(sessionStorage.getItem(`${stopItem.stopID}`));
            Object.keys(getItemTest).map(key => {
                let eta = getItemTest[key][0].eta;
                let etaInHumanLook = moment(getItemTest[key][0].eta).format("HH:mm");
                let etaInMins = moment.duration(moment(getItemTest[key][0].eta).diff(moment())).minutes();
                let route = getItemTest[key][0].route;
                let dest_tc = getItemTest[key][0].dest_tc;

                if (eta) {
                    // nearETA += `${route} 往 ${dest_tc} 距離${stopItem.stopDistance}米<br />${stopItem.nameInTc}<br />${etaInMins < 0 ? "架車可能已經走咗啦，等下一班啦" : `將會係喺 ${etaInHumanLook} 有車<br />即仲有 ${etaInMins} 分鐘有車`}<br /><hr>`;
                    nearETA += `<div class="etaData">
                                    <div class="etaRoute">
                                        ${route}
                                    </div>
                                    <div class="etaStopInfo">
                                        <div>
                                            往 <span class="etaDest">${dest_tc}</span>
                                        </div>
                                        <div>
                                            ${stopItem.nameInTc}
                                        </div>
                                        <div>
                                            距離 ${stopItem.stopDistance} 米
                                        </div>
                                    </div>
                                    <div class="etaTime">
                                        ${etaInMins < 0 ? "架車可能已經走咗啦" : `${etaInHumanLook}<br />${etaInMins} 分鐘`}
                                    </div>
                                </div>
                                <hr />
                                `;
                }
            });

            y.innerHTML = nearETA;

            // data.data.map((item) => {
            //     let etaInMins = moment.duration(moment(item.eta).diff(moment())).minutes()
            //     if (item.eta) {
            //         console.log("This is data.data", data.data.filter(item => item.route == "15A"))
            //         console.log(item);
            //         realETAbyBusRoute(item.dir, item.seq, item.route, item.service_type, item.dest_tc, stopItem.nameInTc, stopItem.stopDistance, stopItem.stopID);
            //         y.innerHTML += `${item.seq} ${item.service_type} ${item.route} ${item.dest_tc} ${stopItem.nameInTc} ${stopItem.stopDistance}米<br /> ${item.eta} 仲有 ${etaInMins} 分鐘<br />${stopItem.stopID}<br /><br />`;
            //         nearETA += `${result[item.route][0].eta}<br />${item.seq} ${item.service_type} ${item.route} ${item.dest_tc} ${stopItem.nameInTc} ${stopItem.stopDistance}米<br /> ${item.eta} 仲有 ${etaInMins} 分鐘<br />${stopItem.stopID}<br /><br />`;
            //     }
            // });

            // findBusRouteByStopId(stopItem.stopID);
        });
}

// function findBusRouteByStopId(stopID) {
//     fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop`)
//         .then(res => res.json())
//         .then(data => {
//             data.data.filter(item => item.stop == stopID).map((item2) => {
//                 // console.log(result);
//             });
//         })
// }

// function realETAbyBusRoute(dir, seq, route, serviceType, destInTC, stopNameInTcm, stopDistance, stopID) {
//     fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route}/${serviceType}`)
//         .then(res => res.json())
//         .then(data => {
//             // console.log(data.data);
//             // console.log(data.data.filter(item => item.seq == seq));
//             data.data.map((item) => {
//                 // y.innerHTML += `${item.eta} ${stopNameInTcm} ${destInTC}`
//             });
//         });
// }

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            myLocationDiv.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            myLocationDiv.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            myLocationDiv.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            myLocationDiv.innerHTML = "An unknown error occurred."
            break;
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

///////////////////////////////////////////////////////////////////////
let homeButton = document.getElementById("bottomNav_HomePage");
let searchButton = document.getElementById("bottomNav_SearchRoute");

let ETA_dataBox = document.getElementById("ETA_dataBox");
let ETA_searchBox = document.getElementById("ETA_searchBox");

searchButton.addEventListener("click", () => {
    ETA_dataBox.style.display = "none";
    ETA_searchBox.style.display = "unset";
})

homeButton.addEventListener("click", () => {
    ETA_searchBox.style.display = "none";
    ETA_dataBox.style.display = "unset";
})
///////////////////////////////////////////////////////////////////////

function getAllBusRoute() {
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/`)
        .then(response => response.json())
        .then(data => {
            data.data.map((item) => {
                // console.log(item.route, item.bound, item.service_type);
                console.log(item.route.slice(1, 2));
            });
        });
} getAllBusRoute();

let typeRoute = document.getElementById("typedRoute");

document.querySelector('[data-key="0"]').setAttribute("onclick", false);
document.querySelector('[data-key="0"]').setAttribute("class", "disableButton");
document.querySelector('[data-key="C"]').setAttribute("onclick", false);
document.querySelector('[data-key="C"]').setAttribute("class", "disableButton");
document.querySelector('[data-key="B"]').setAttribute("onclick", false);
document.querySelector('[data-key="B"]').setAttribute("class", "disableButton");

function typedRoute(number) {
    if (number == "B") {
        typeRoute.innerHTML = typeRoute.innerHTML.slice(0, -1);
    } else if (number == "C") {
        typeRoute.innerHTML = "";
    } else {
        typeRoute.innerHTML += number;
    }

    if (typeRoute.innerHTML != "") {
        document.querySelector('[data-key="B"]').setAttribute("onclick", "typedRoute('B')");
        document.querySelector('[data-key="B"]').setAttribute("class", "ableButton");
        document.querySelector('[data-key="C"]').setAttribute("onclick", "typedRoute('C')");
        document.querySelector('[data-key="C"]').setAttribute("class", "ableButton");
        document.querySelector('[data-key="0"]').setAttribute("onclick", "typedRoute('0')");
        document.querySelector('[data-key="0"]').setAttribute("class", "ableButton");
    } else {
        document.querySelector('[data-key="B"]').setAttribute("onclick", false);
        document.querySelector('[data-key="B"]').setAttribute("class", "disableButton");
        document.querySelector('[data-key="C"]').setAttribute("onclick", false);
        document.querySelector('[data-key="C"]').setAttribute("class", "disableButton");
        document.querySelector('[data-key="0"]').setAttribute("onclick", false);
        document.querySelector('[data-key="0"]').setAttribute("class", "disableButton");

    }
}
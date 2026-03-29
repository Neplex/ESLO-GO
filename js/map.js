window.MapManager = (function () {
    let map, userMark, userAccuracyCircle;
    let markers;

    function init() {
        map = L.map('map', {
            zoomControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            maxZoom: 20,
        }).addTo(map);

        markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            disableClusteringAtZoom: 17,
            iconCreateFunction: (c) => L.divIcon({
                html: `<div class="bg-main text-black font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white/20 shadow-lg">${c.getChildCount()}</div>`,
                className: 'custom-cluster'
            })
        });
        map.addLayer(markers);

        map.on('locationfound', onLocationFound);
        map.locate({
            watch: true,
            setView: true,
            maxZoom: 18,
        });
    }

    function onLocationFound(e) {
        const radius = Math.max(e.accuracy);
        if (userMark) {
            userMark.setLatLng(e.latlng);
            userAccuracyCircle.setLatLng(e.latlng).setRadius(radius);
        } else {
            userMark = L.circleMarker(e.latlng, {
                radius: 10,
                fillColor: "#b3a57f",
                color: "#fff",
                weight: 3,
                opacity: 1,
                fillOpacity: 1,
            }).addTo(map);
            userAccuracyCircle = L.circle(e.latlng, {
                radius: radius,
                color: '#b3a57f',
                fillOpacity: 0.1,
                weight: 1,
            }).addTo(map);
            map.setView(e.latlng, 18);
        }
    }

    function addPoints(groupedData, activationDistance, onMarkerClick) {
        Object.keys(groupedData).forEach(key => {
            const data = groupedData[key];
            const latlng = key.split(',').map(parseFloat);
            const marker = L.circleMarker(latlng, {
                radius: 7,
                fillColor: "#9ca3af",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
            });

            marker.on('click', (e) => {
                if ($('#dev-mode-toggle').is(':checked')) {
                    onMarkerClick(data);
                    return;
                }
                if (!userAccuracyCircle) {
                    showToast("Position indisponible.");
                    return;
                }
                const dist = map.distance(e.latlng, userAccuracyCircle.getLatLng()) - userAccuracyCircle.getRadius();
                if (dist <= activationDistance) {
                    onMarkerClick(data);
                } else {
                    showToast("Trop loin !");
                }
            });
            markers.addLayer(marker);
        });
    }

    return {init, addPoints};
})();

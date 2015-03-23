L.Control.DistanceMeasure = L.Control.extend({
    options: {
        position: "topleft"
    },
    onAdd: function(c) {
        var b = "leaflet-control-zoom leaflet-bar leaflet-control",
            a = L.DomUtil.create("div", b);
        this._createButton("", "Измерить расстояние", "leaflet-control-measure leaflet-bar-part leaflet-bar-part-top-and-bottom", a, this._startMeasuring, this);
        return a
    },
    _createButton: function(c, g, e, a, d, b) {
        var f = L.DomUtil.create("a", e, a);
        f.innerHTML = c;
        f.href = "#";
        f.title = g;
        L.DomEvent.on(f, "click", L.DomEvent.stopPropagation).on(f, "click", L.DomEvent.preventDefault).on(f, "click", d, b).on(f, "dblclick", L.DomEvent.stopPropagation);
        return f
    },
    _toggleMeasure: function() {
        this._measuring = !this._measuring;
        if (this._measuring) {
            L.DomUtil.addClass(this._container, "leaflet-control-measure-on");
            this._startMeasuring()
        } else {
            L.DomUtil.removeClass(this._container, "leaflet-control-measure-on");
            this._stopMeasuring()
        }
    },
    _startMeasuring: function() {
        this._measuring = true;
        L.DomUtil.addClass(this._container, "leaflet-control-measure-on");
        this._oldCursor = this._map._container.style.cursor;
        this._map._container.style.cursor = "crosshair";
        this._doubleClickZoom = this._map.doubleClickZoom.enabled();
        this._map.doubleClickZoom.disable();
        L.DomEvent.on(this._map, "mousemove", this._mouseMove, this).on(this._map, "click", this._mouseClick, this).on(this._map, "dblclick", this._finishPath, this).on(document, "keydown", this._onKeyDown, this);
        if (!this._layerPaint) {
            this._layerPaint = L.layerGroup().addTo(this._map)
        }
        if (!this._points) {
            this._points = []
        }
    },
    _stopMeasuring: function() {
        this._measuring = false;
        L.DomUtil.removeClass(this._container, "leaflet-control-measure-on");
        this._map._container.style.cursor = this._oldCursor;
        L.DomEvent.off(document, "keydown", this._onKeyDown, this).off(this._map, "mousemove", this._mouseMove, this).off(this._map, "click", this._mouseClick, this).off(this._map, "dblclick", this._mouseClick, this);
        if (this._doubleClickZoom) {
            this._map.doubleClickZoom.enable()
        }
        if (this._layerPaint) {
            this._layerPaint.clearLayers()
        }
        this._measuring = false;
        this._restartPath()
    },
    _mouseMove: function(a) {
        if (!a.latlng || !this._lastPoint) {
            return
        }
        if (!this._layerPaintPathTemp) {
            this._layerPaintPathTemp = L.polyline([this._lastPoint, a.latlng], {
                color: "blue",
                weight: 2,
                clickable: false,
                dashArray: "6,3"
            }).addTo(this._layerPaint)
        } else {
            this._layerPaintPathTemp.spliceLatLngs(0, 2, this._lastPoint, a.latlng)
        }
        if (this._tooltip) {
            if (!this._distance) {
                this._distance = 0
            }
            this._updateTooltipPosition(a.latlng);
            var b = a.latlng.distanceTo(this._lastPoint);
            this._updateTooltipDistance(this._distance + b, b)
        }
    },
    _mouseClick: function(a) {
        if (!a.latlng) {
            return
        }
        if (this._lastPoint && this._tooltip) {
            if (!this._distance) {
                this._distance = 0
            }
            this._updateTooltipPosition(a.latlng);
            var b = a.latlng.distanceTo(this._lastPoint);
            this._updateTooltipDistance(this._distance + b, b);
            this._distance += b
        }
        this._createTooltip(a.latlng);
        if (this._lastPoint && !this._layerPaintPath) {
            this._layerPaintPath = L.polyline([this._lastPoint], {
                color: "red",
                weight: 4,
                clickable: false
            }).addTo(this._layerPaint)
        }
        if (this._layerPaintPath) {
            this._layerPaintPath.addLatLng(a.latlng)
        }
        if (this._lastCircle) {
            this._layerPaint.removeLayer(this._lastCircle)
        }
        this._lastCircle = new L.CircleMarker(a.latlng, {
            color: "blue",
            opacity: 1,
            weight: 4,
            fill: true,
            fillOpacity: 1,
            radius: 2,
            clickable: this._lastCircle ? true : false
        }).addTo(this._layerPaint);
        this._lastCircle.on("click", function() {
            this._finishPath()
        }, this);
        this._lastPoint = a.latlng
    },
    _finishPath: function() {
        if (this._lastCircle) {
		var a = L.icon({
			iconUrl : 'images/close.png',
			iconAnchor : [ 0, 24 ]
		});
            this._closeButton = new L.Marker(this._lastCircle.getLatLng(), {
                icon: a
            }).addTo(this._layerPaint);
            this._closeButton.on("click", function() {
                this._stopMeasuring()
            }, this)
        }
        if (this._lastCircle) {
            this._layerPaint.removeLayer(this._lastCircle)
        }
        if (this._tooltip) {
            this._layerPaint.removeLayer(this._tooltip)
        }
        if (this._layerPaint && this._layerPaintPathTemp) {
            this._layerPaint.removeLayer(this._layerPaintPathTemp)
        }
        this._map._container.style.cursor = this._oldCursor;
        L.DomUtil.removeClass(this._container, "leaflet-control-measure-on");
        L.DomEvent.off(document, "keydown", this._onKeyDown, this).off(this._map, "mousemove", this._mouseMove, this).off(this._map, "click", this._mouseClick, this).off(this._map, "dblclick", this._mouseClick, this);
        if (this._doubleClickZoom) {
            this._map.doubleClickZoom.enable()
        }
        this._restartPath()
    },
    _restartPath: function() {
        this._distance = 0;
        this._tooltip = undefined;
        this._lastCircle = undefined;
        this._lastPoint = undefined;
        this._layerPaintPath = undefined;
        this._layerPaintPathTemp = undefined;
        this._closeButton = undefined
    },
    _createTooltip: function(a) {
        var b = L.divIcon({
            className: "leaflet-area-measure-tooltip",
            iconAnchor: [-5, -5]
        });
        this._tooltip = L.marker(a, {
            icon: b,
            clickable: false
        }).addTo(this._layerPaint)
    },
    _updateTooltipPosition: function(a) {
        this._tooltip.setLatLng(a)
    },
    _updateTooltipDistance: function(b, e) {
        var d = "";
        var c;
        var a;
        if (b / 1000 >= 1) {
            c = this._round(b);
            d = '' + c + " km"
        } else {
            c = Math.round(b);
            d = '' + c + " m"
        }
        if (e / 1000 >= 1) {
            a = this._round(e);
            if (a > 0 && c != a) {
                d += '(+' + a + " km)"
            }
        } else {
            a = Math.round(e);
            if (a > 0 && c != a) {
                d += '(+' + a + " m)"
            }
        }
        this._tooltip._icon.innerHTML = d
    },
    _round: function(a) {
        return Math.round((a / 1000) * 100) / 100
    },
    _onKeyDown: function(a) {
        if (a.keyCode == 27) {
            if (!this._lastPoint) {
                this._toggleMeasure()
            } else {
                this._finishPath()
            }
        }
    }
});

L.Map.mergeOptions({
    distanceMeasureControl: false
});
L.Map.addInitHook(function() {
    if (this.options.distanceMeasureControl) {
        this.distanceMeasureControl = new L.Control.DistanceMeasure();
        this.addControl(this.distanceMeasureControl)
    }
});
L.control.distanceMeasure = function(a) {
    return new L.Control.DistanceMeasure(a)
};

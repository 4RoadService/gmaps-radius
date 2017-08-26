(function() {
  $(function() {
    var circleDrawHandler, circleMoveHandler, clearMarkers, clickHandler, controlDown, earthRadii, map, markers, pointDrawHandler, polygonDestructionHandler, searchBox, searchInput, updateURL;
    markers = [];
    map = new google.maps.Map($('#map')[0], {
      zoom: 10,
      center: new google.maps.LatLng(45.5036922, -73.5791619),
      mapType: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      mapTypeControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      }
    });
    earthRadii = {
      mi: 3963.1676,
      km: 6378.1,
      ft: 20925524.9,
      mt: 6378100,
      "in": 251106299,
      yd: 6975174.98,
      fa: 3487587.49,
      na: 3443.89849,
      ch: 317053.408,
      rd: 1268213.63,
      fr: 31705.3408
    };
    controlDown = false;
    window.onkeydown = function(e) {
      controlDown = e.keyIdentifier === 'Control' || e.code === 'MetaLeft' || e.code === 'MetaRight' || e.ctrlKey === true;
      return true;
    };
    window.onkeyup = function(e) {
      controlDown = false;
      return true;
    };
    polygonDestructionHandler = function() {
      return this.setMap(null);
    };
    clearMarkers = function() {
      var i, len, m;
      for (i = 0, len = markers.length; i < len; i++) {
        m = markers[i];
        m.setMap(null);
      }
      return markers = [];
    };
    pointDrawHandler = function(e) {
      var point;
      point = new google.maps.Marker({
        position: e.latLng
      });
      point.setMap(map);
      google.maps.event.addListener(point, 'rightclick', polygonDestructionHandler);
      return google.maps.event.addListener(point, 'click', clickHandler);
    };
    circleDrawHandler = function(e) {
      var circle, radius, select, unitKey;
      select = $('#unitSelector');
      unitKey = $('option', select).eq(select[0].selectedIndex).val();
      radius = parseFloat(document.getElementById('radiusInput').value);
      radius = (radius / earthRadii[unitKey]) * earthRadii['mt'];
      circle = new google.maps.Circle({
        center: e.latLng,
        clickable: true,
        draggable: true,
        geodesic: true,
        editable: true,
        fillColor: '#004de8',
        fillOpacity: 0.27,
        map: map,
        radius: radius,
        strokeColor: '#004de8',
        strokeOpacity: 0.62,
        strokeWeight: 1
      });
      circle.infoWindow = new google.maps.InfoWindow({
        disableAutoPan: true
      });
      circle.infoWindow.isOpen = false;
      circleMoveHandler.call(circle);
      google.maps.event.addListener(circle, 'rightclick', polygonDestructionHandler);
      google.maps.event.addListener(circle, 'bounds_changed', circleMoveHandler);
      google.maps.event.addListener(circle, 'click', function(e) {
        if (this.infoWindow.isOpen) {
          this.infoWindow.close();
          return this.infoWindow.isOpen = false;
        } else {
          this.infoWindow.open(map);
          return this.infoWindow.isOpen = true;
        }
      });
      return google.maps.event.addListener(circle.infoWindow, 'closeclick', function(e) {
        return this.isOpen = false;
      });
    };
    circleMoveHandler = function(e) {
      var content;
      content = "<pre>Radius (km): " + this.getRadius() / 1000 + "\n";
      content += "Center     : " + this.getCenter().lat() + ", " + this.getCenter().lng() + "</pre>";
      this.infoWindow.setContent(content);
      return this.infoWindow.setPosition(this.getCenter());
    };
    clickHandler = function(e) {
      if (controlDown) {
        return pointDrawHandler(e);
      } else {
        return circleDrawHandler(e);
      }
    };
    google.maps.event.addListener(map, 'click', clickHandler);
    searchInput = document.getElementById('searchInput');
    $(searchInput.form).on({
      submit: function() {
        return false;
      }
    });
    searchBox = new google.maps.places.SearchBox(searchInput);
    google.maps.event.addListener(searchBox, 'places_changed', function() {

      /* When a place is selected, center on it */
      var location;
      clearMarkers();
      location = searchBox.getPlaces()[0];
      if (location != null) {
        if (location.geometry.viewport != null) {
          map.fitBounds(location.geometry.viewport);
          map.panToBounds(location.geometry.viewport);
        } else {
          map.setCenter(location.geometry.location);
        }
        markers.push(new google.maps.Marker({
          position: location.geometry.location,
          map: map,
          title: location.name,
          clickable: false
        }));
      }
    });
    updateURL = function() {
      var center, params, ref, u;
      center = map.getCenter();
      params = {
        lat: _.round(center.lat(), 6).toString(),
        lng: _.round(center.lng(), 6).toString(),
        z: map.getZoom().toString(),
        u: $('#unitSelector').val(),
        r: $('#radiusInput').val()
      };
      if (!params.r) {
        delete params['r'];
      }
      u = new URI();
      u.setQuery(params);
      return (ref = window.history) != null ? typeof ref.replaceState === "function" ? ref.replaceState(null, null, u.toString()) : void 0 : void 0;
    };
    google.maps.event.addListener(map, 'bounds_changed', _.debounce(updateURL, 200));
    google.maps.event.addListener(map, 'zoom_changed', updateURL);
    $('#unitSelector, #radiusInput').on('change', updateURL);
    document.querySelector('#options').addEventListener('submit', function(e) {
      e.preventDefault();
      return false;
    });
    return $(window).on('hashchange', function(e) {
      var center, center_, newCenter, query, z;
      query = (new URI()).query(true);
      center_ = map.getCenter();
      center = [center_.lat(), center_.lng()];
      newCenter = [center[0], center[1]];
      if (query.lat != null) {
        newCenter[0] = parseFloat(query.lat);
      }
      if (query.lng != null) {
        newCenter[1] = parseFloat(query.lng);
      }
      if ($.grep(newCenter, isNaN).length === 0) {
        map.setCenter({
          lat: newCenter[0],
          lng: newCenter[1]
        });
      }
      if (query.z != null) {
        z = parseInt(query.z, 10);
        if (!isNaN(z)) {
          map.setZoom(z);
        }
      }
      if (query.r != null) {
        $('#radiusInput').val(query.r);
      }
      if (query.u != null) {
        return $('#unitSelector').val(query.u);
      }
    }).triggerHandler('hashchange');
  });

}).call(this);

//# sourceMappingURL=gmaps-radius.js.map
